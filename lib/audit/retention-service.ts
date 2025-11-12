import { db } from '@/lib/db'
import { CategoriaAuditoria } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'

/**
 * Servicio de retención y limpieza de logs
 */

// Políticas de retención por defecto (en días)
const POLITICAS_DEFAULT: Record<CategoriaAuditoria, number> = {
  AUTENTICACION: 365, // 1 año
  AUTORIZACION: 365,
  DATOS_PERSONALES: 1825, // 5 años (req. legal Colombia)
  DATOS_FINANCIEROS: 1825, // 5 años (req. fiscal)
  FACTURACION: 1825, // 5 años (req. DIAN)
  SEGURIDAD_SOCIAL: 1825, // 5 años
  INTELIGENCIA_ARTIFICIAL: 365,
  ARCHIVOS: 365,
  ADMINISTRACION: 1825, // 5 años (auditoría)
  SEGURIDAD: 1825, // 5 años (investigaciones)
  SISTEMA: 365,
  GENERAL: 365,
}

/**
 * Inicializar políticas de retención
 */
export async function inicializarPoliticasRetencion() {
  secureLogger.info('Inicializando políticas de retención')

  try {
    for (const [categoria, dias] of Object.entries(POLITICAS_DEFAULT)) {
      await db.politicaRetencion.upsert({
        where: { categoria: categoria as CategoriaAuditoria },
        create: {
          categoria: categoria as CategoriaAuditoria,
          diasRetencion: dias,
          descripcion: getDescripcionCategoria(categoria as CategoriaAuditoria),
          requisitoLegal: getRequisitoLegal(categoria as CategoriaAuditoria),
        },
        update: {
          // Solo actualizar si no existe
        },
      })
    }

    secureLogger.info('Políticas de retención inicializadas correctamente')
  } catch (error) {
    secureLogger.error('Error inicializando políticas', error)
    throw error
  }
}

/**
 * Limpiar logs antiguos según políticas de retención
 * ✅ CRÍTICO #5 RESUELTO: Batch deletes paralelos con delay
 */
export async function limpiarLogsAntiguos() {
  secureLogger.info('Iniciando limpieza de logs antiguos')

  try {
    // Obtener políticas activas
    const politicas = await db.politicaRetencion.findMany({
      where: { activa: true },
    })

    // ✅ Procesamiento paralelo de todas las categorías
    const resultados = await Promise.all(
      politicas.map(async (politica) => {
        const fechaLimite = new Date()
        fechaLimite.setDate(fechaLimite.getDate() - politica.diasRetencion)

        let deletedTotal = 0
        let hasMore = true
        const BATCH_SIZE = 1000

        // ✅ Batch delete de 1000 registros a la vez
        while (hasMore) {
          const deleted = await db.logAuditoria.deleteMany({
            where: {
              categoria: politica.categoria,
              timestamp: { lt: fechaLimite },
            },
            take: BATCH_SIZE,
          })

          deletedTotal += deleted.count
          hasMore = deleted.count === BATCH_SIZE

          // ✅ Delay de 100ms entre batches para no saturar DB
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        if (deletedTotal > 0) {
          secureLogger.info(
            `Categoría ${politica.categoria}: ${deletedTotal} logs eliminados (> ${politica.diasRetencion} días)`
          )
        }

        return { categoria: politica.categoria, eliminados: deletedTotal }
      })
    )

    const totalEliminados = resultados.reduce((sum, r) => sum + r.eliminados, 0)

    secureLogger.info(`Limpieza completada. Total eliminados: ${totalEliminados}`)

    return { totalEliminados, detalles: resultados }
  } catch (error) {
    secureLogger.error('Error en limpieza de logs', error)
    throw error
  }
}

/**
 * Archivar logs antiguos (mover a tabla de archivo)
 * Alternativa a eliminar: mantener logs en tabla separada
 */
export async function archivarLogsAntiguos() {
  // TODO: Implementar si se requiere mantener logs indefinidamente
  // en una tabla de archivo separada (LogAuditoriaArchivo)
}

/**
 * Obtener estadísticas de retención
 */
export async function obtenerEstadisticasRetencion() {
  const politicas = await db.politicaRetencion.findMany({
    where: { activa: true },
  })

  const estadisticas = []

  for (const politica of politicas) {
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - politica.diasRetencion)

    const [total, aEliminar] = await Promise.all([
      db.logAuditoria.count({
        where: { categoria: politica.categoria },
      }),
      db.logAuditoria.count({
        where: {
          categoria: politica.categoria,
          timestamp: { lt: fechaLimite },
        },
      }),
    ])

    estadisticas.push({
      categoria: politica.categoria,
      diasRetencion: politica.diasRetencion,
      totalLogs: total,
      logsAEliminar: aEliminar,
      porcentajeAEliminar: total > 0 ? ((aEliminar / total) * 100).toFixed(2) : 0,
    })
  }

  return estadisticas
}

function getDescripcionCategoria(categoria: CategoriaAuditoria): string {
  const descripciones: Record<CategoriaAuditoria, string> = {
    AUTENTICACION: 'Eventos de login, logout y autenticación',
    AUTORIZACION: 'Control de acceso y permisos',
    DATOS_PERSONALES: 'Tratamiento de datos personales (Ley 1581)',
    DATOS_FINANCIEROS: 'Operaciones financieras y pagos',
    FACTURACION: 'Emisión y gestión de facturas electrónicas',
    SEGURIDAD_SOCIAL: 'Liquidación y pago de PILA',
    INTELIGENCIA_ARTIFICIAL: 'Consultas y conversaciones con IA',
    ARCHIVOS: 'Subida, descarga y eliminación de archivos',
    ADMINISTRACION: 'Acciones administrativas del sistema',
    SEGURIDAD: 'Eventos de seguridad y alertas',
    SISTEMA: 'Eventos del sistema y mantenimiento',
    GENERAL: 'Otros eventos no categorizados',
  }
  return descripciones[categoria]
}

function getRequisitoLegal(categoria: CategoriaAuditoria): string | undefined {
  const requisitos: Partial<Record<CategoriaAuditoria, string>> = {
    DATOS_PERSONALES: 'Ley 1581 de 2012 - Protección de Datos',
    DATOS_FINANCIEROS: 'Estatuto Tributario - Art. 632',
    FACTURACION: 'Resolución DIAN 000042 de 2020',
    SEGURIDAD_SOCIAL: 'Ley 100 de 1993',
    ADMINISTRACION: 'ISO 27001 - Gestión de Seguridad de la Información',
    SEGURIDAD: 'Ley 1273 de 2009 - Delitos Informáticos',
  }
  return requisitos[categoria]
}
