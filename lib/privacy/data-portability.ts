/**
 * ULE - DATA PORTABILITY SERVICE
 * Servicio de portabilidad de datos según Ley 1581 de 2012
 *
 * Art. 8: "El Titular tiene derecho a... solicitar copia de sus datos"
 *
 * Funciones:
 * - Exportar todos los datos del usuario en formato JSON
 * - Gestionar solicitudes de exportación
 * - Generar archivos seguros con expiración
 */

import { db } from '@/lib/db'
import { EstadoSolicitudPortabilidad, AccionPrivacidad } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { decryptField } from '@/lib/security/field-encryption'

interface ExportacionDatos {
  perfil: any
  aportes: any[]
  facturas: any[]
  clientes: any[]
  documentos: any[]
  conversaciones: any[]
  recordatorios: any[]
  consentimientos: any[]
  exportaciones: any[]
  metadata: {
    fechaExportacion: string
    version: string
    usuario: string
  }
}

/**
 * Exporta todos los datos personales de un usuario
 * Retorna objeto completo con toda la información
 */
export async function exportarDatosUsuario(
  userId: string
): Promise<ExportacionDatos> {
  try {
    secureLogger.info('Iniciando exportación de datos', { userId })

    // 1. DATOS DE PERFIL
    const usuario = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        tipoDocumento: true,
        numeroDocumento: true, // Viene encriptado
        telefono: true, // Viene encriptado
        direccion: true,
        ciudad: true,
        departamento: true,
        tipoContrato: true,
        profesion: true,
        actividadEconomica: true,
        ingresoMensualPromedio: true,
        numeroContratos: true,
        entidadSalud: true,
        fechaAfiliacionSalud: true,
        entidadPension: true,
        fechaAfiliacionPension: true,
        arl: true,
        nivelRiesgoARL: true,
        fechaAfiliacionARL: true,
        estadoCivil: true,
        personasACargo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!usuario) {
      throw new Error('Usuario no encontrado')
    }

    // Desencriptar campos sensibles para la exportación
    const perfilDesencriptado = {
      ...usuario,
      numeroDocumento: usuario.numeroDocumento
        ? decryptField(usuario.numeroDocumento)
        : null,
      telefono: usuario.telefono ? decryptField(usuario.telefono) : null,
    }

    // 2. APORTES A LA PILA
    const aportes = await db.aporte.findMany({
      where: { userId },
      select: {
        id: true,
        mes: true,
        anio: true,
        ibc: true,
        salud: true,
        pension: true,
        arl: true,
        total: true,
        estado: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 3. FACTURAS
    const facturas = await db.factura.findMany({
      where: { userId },
      select: {
        id: true,
        numeroFactura: true,
        fecha: true,
        clienteId: true,
        subtotal: true,
        totalIva: true,
        total: true,
        estado: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. CLIENTES
    const clientes = await db.cliente.findMany({
      where: { userId },
      select: {
        id: true,
        nombre: true,
        tipoDocumento: true,
        numeroDocumento: true,
        email: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Desencriptar datos de clientes
    const clientesDesencriptados = clientes.map((cliente) => ({
      ...cliente,
      numeroDocumento: cliente.numeroDocumento
        ? decryptField(cliente.numeroDocumento)
        : null,
      telefono: cliente.telefono ? decryptField(cliente.telefono) : null,
    }))

    // 5. DOCUMENTOS
    const documentos = await db.documento.findMany({
      where: { userId },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        tipoMIME: true,
        tamanoBytes: true,
        rutaArchivo: true,
        mes: true,
        anio: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 6. CONVERSACIONES IA
    const conversaciones = await db.conversacion.findMany({
      where: { userId },
      select: {
        id: true,
        titulo: true,
        createdAt: true,
        mensajes: {
          select: {
            id: true,
            rol: true,
            contenido: true,
            timestamp: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 7. RECORDATORIOS
    const recordatorios = await db.recordatorio.findMany({
      where: { userId },
      select: {
        id: true,
        titulo: true,
        mensaje: true,
        tipo: true,
        fechaEnvio: true,
        enviado: true,
        createdAt: true,
      },
      orderBy: { fechaEnvio: 'desc' },
    })

    // 8. CONSENTIMIENTOS
    const consentimientos = await db.consentimientoDatos.findMany({
      where: { userId },
      select: {
        id: true,
        tipo: true,
        otorgado: true,
        version: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 9. EXPORTACIONES PREVIAS
    const exportacionesPrevias = await db.exportacion.findMany({
      where: { userId },
      select: {
        id: true,
        tipo: true,
        formato: true,
        nombreArchivo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Últimas 10 exportaciones
    })

    // 10. CONSTRUIR OBJETO DE EXPORTACIÓN
    const exportacion: ExportacionDatos = {
      perfil: perfilDesencriptado,
      aportes,
      facturas,
      clientes: clientesDesencriptados,
      documentos,
      conversaciones,
      recordatorios,
      consentimientos,
      exportaciones: exportacionesPrevias,
      metadata: {
        fechaExportacion: new Date().toISOString(),
        version: '1.0',
        usuario: usuario.email,
      },
    }

    secureLogger.audit('Datos exportados exitosamente', {
      userId,
      registros: {
        aportes: aportes.length,
        facturas: facturas.length,
        clientes: clientes.length,
        documentos: documentos.length,
        conversaciones: conversaciones.length,
      },
    })

    return exportacion
  } catch (error) {
    secureLogger.error('Error exportando datos de usuario', error, { userId })
    throw new Error('Error al exportar datos')
  }
}

/**
 * Crea una solicitud de exportación de datos
 * Procesa en segundo plano para datasets grandes
 */
export async function solicitarExportacion(
  userId: string,
  ipAddress?: string
): Promise<string> {
  try {
    // 1. Crear solicitud
    const solicitud = await db.solicitudPortabilidad.create({
      data: {
        userId,
        estado: EstadoSolicitudPortabilidad.PENDIENTE,
        ipSolicitud: ipAddress,
      },
    })

    // 2. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.SOLICITUD_EXPORTACION,
        descripcion: 'Solicitud de exportación de datos personales',
        ipAddress,
      },
    })

    secureLogger.audit('Solicitud de exportación creada', {
      userId,
      solicitudId: solicitud.id,
    })

    // 3. Procesar exportación inmediatamente (en producción, usar cola)
    await procesarExportacion(solicitud.id, userId)

    return solicitud.id
  } catch (error) {
    secureLogger.error('Error creando solicitud de exportación', error, {
      userId,
    })
    throw new Error('Error al solicitar exportación')
  }
}

/**
 * Procesa una solicitud de exportación
 * Genera archivo JSON y lo guarda de forma segura
 */
async function procesarExportacion(
  solicitudId: string,
  userId: string
): Promise<void> {
  try {
    // 1. Actualizar estado a PROCESANDO
    await db.solicitudPortabilidad.update({
      where: { id: solicitudId },
      data: { estado: EstadoSolicitudPortabilidad.PROCESANDO },
    })

    // 2. Exportar datos
    const datos = await exportarDatosUsuario(userId)

    // 3. Generar archivo JSON
    const nombreArchivo = `datos-usuario-${userId}-${Date.now()}.json`
    const directorioExportaciones = join(
      process.cwd(),
      'public',
      'exportaciones',
      userId
    )

    // Crear directorio si no existe
    await mkdir(directorioExportaciones, { recursive: true })

    const rutaArchivo = join(directorioExportaciones, nombreArchivo)

    // Guardar archivo con formato legible
    await writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8')

    const tamanoBytes = Buffer.byteLength(JSON.stringify(datos))

    // 4. Calcular fecha de expiración (7 días)
    const fechaExpiracion = new Date()
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7)

    // 5. Actualizar solicitud con archivo generado
    await db.solicitudPortabilidad.update({
      where: { id: solicitudId },
      data: {
        estado: EstadoSolicitudPortabilidad.COMPLETADA,
        archivoUrl: `/exportaciones/${userId}/${nombreArchivo}`,
        archivoExpira: fechaExpiracion,
        tamanoBytes,
      },
    })

    // 6. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.EXPORTACION_COMPLETADA,
        descripcion: `Exportación completada: ${nombreArchivo}`,
        metadata: {
          solicitudId,
          tamanoBytes,
          expira: fechaExpiracion.toISOString(),
        },
      },
    })

    secureLogger.audit('Exportación procesada exitosamente', {
      userId,
      solicitudId,
      tamanoBytes,
      expira: fechaExpiracion,
    })
  } catch (error) {
    // En caso de error, marcar solicitud como ERROR
    await db.solicitudPortabilidad.update({
      where: { id: solicitudId },
      data: { estado: EstadoSolicitudPortabilidad.ERROR },
    })

    secureLogger.error('Error procesando exportación', error, {
      solicitudId,
      userId,
    })

    throw error
  }
}

/**
 * Obtiene el estado de una solicitud de exportación
 */
export async function obtenerEstadoExportacion(solicitudId: string) {
  try {
    const solicitud = await db.solicitudPortabilidad.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        estado: true,
        archivoUrl: true,
        archivoExpira: true,
        tamanoBytes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!solicitud) {
      throw new Error('Solicitud no encontrada')
    }

    // Verificar si el archivo expiró
    if (solicitud.archivoExpira && new Date() > solicitud.archivoExpira) {
      return {
        ...solicitud,
        estado: 'EXPIRADO',
        archivoUrl: null,
      }
    }

    return solicitud
  } catch (error) {
    secureLogger.error('Error obteniendo estado de exportación', error, {
      solicitudId,
    })
    throw new Error('Error al obtener estado')
  }
}

/**
 * Lista todas las exportaciones de un usuario
 */
export async function listarExportaciones(userId: string) {
  try {
    const exportaciones = await db.solicitudPortabilidad.findMany({
      where: { userId },
      select: {
        id: true,
        estado: true,
        archivoUrl: true,
        archivoExpira: true,
        tamanoBytes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return exportaciones
  } catch (error) {
    secureLogger.error('Error listando exportaciones', error, { userId })
    throw new Error('Error al listar exportaciones')
  }
}
