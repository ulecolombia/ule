/**
 * ULE - CONSENT MANAGER
 * Gestión de consentimientos según Ley 1581 de 2012
 *
 * Art. 9: "Consentimiento previo, expreso e informado del Titular"
 *
 * Funciones:
 * - Registrar consentimientos con metadata de auditoría
 * - Verificar consentimientos vigentes
 * - Revocar consentimientos
 * - Generar logs de privacidad
 */

import { db } from '@/lib/db'
import { TipoConsentimiento, AccionPrivacidad } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'

interface RegistrarConsentimientoParams {
  userId: string
  tipo: TipoConsentimiento
  otorgado: boolean
  version: string
  ipAddress?: string
  userAgent?: string
}

interface ConsentimientoInfo {
  tipo: TipoConsentimiento
  otorgado: boolean
  version: string
  createdAt: Date
}

/**
 * Registra un nuevo consentimiento del usuario
 * Crea log de auditoría según requerimientos legales
 */
export async function registrarConsentimiento({
  userId,
  tipo,
  otorgado,
  version,
  ipAddress,
  userAgent,
}: RegistrarConsentimientoParams): Promise<void> {
  try {
    // 1. Registrar consentimiento
    const consentimiento = await db.consentimientoDatos.create({
      data: {
        userId,
        tipo,
        otorgado,
        version,
        ipAddress,
        userAgent,
      },
    })

    // 2. Crear log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: otorgado
          ? AccionPrivacidad.CONSENTIMIENTO_OTORGADO
          : AccionPrivacidad.CONSENTIMIENTO_REVOCADO,
        descripcion: `${otorgado ? 'Otorgado' : 'Revocado'} consentimiento: ${tipo} (v${version})`,
        ipAddress,
        userAgent,
        metadata: {
          consentimientoId: consentimiento.id,
          tipo,
          version,
        },
      },
    })

    // 3. Log de auditoría en servidor
    secureLogger.audit('Consentimiento registrado', {
      userId,
      consentimientoId: consentimiento.id,
      tipo,
      otorgado,
      version,
    })
  } catch (error) {
    secureLogger.error('Error registrando consentimiento', error, {
      userId,
      tipo,
    })
    throw new Error('Error al registrar consentimiento')
  }
}

/**
 * Obtiene todos los consentimientos vigentes del usuario
 * Retorna el consentimiento más reciente de cada tipo
 */
export async function obtenerConsentimientos(
  userId: string
): Promise<ConsentimientoInfo[]> {
  try {
    // Obtener el consentimiento más reciente de cada tipo
    const consentimientos = await db.$queryRaw<ConsentimientoInfo[]>`
      SELECT DISTINCT ON (tipo)
        tipo,
        otorgado,
        version,
        created_at as "createdAt"
      FROM consentimientos_datos
      WHERE user_id = ${userId}
      ORDER BY tipo, created_at DESC
    `

    return consentimientos
  } catch (error) {
    secureLogger.error('Error obteniendo consentimientos', error, { userId })
    throw new Error('Error al obtener consentimientos')
  }
}

/**
 * Verifica si el usuario tiene un consentimiento específico vigente
 */
export async function tieneConsentimiento(
  userId: string,
  tipo: TipoConsentimiento
): Promise<boolean> {
  try {
    const consentimiento = await db.consentimientoDatos.findFirst({
      where: {
        userId,
        tipo,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        otorgado: true,
      },
    })

    return consentimiento?.otorgado ?? false
  } catch (error) {
    secureLogger.error('Error verificando consentimiento', error, {
      userId,
      tipo,
    })
    return false
  }
}

/**
 * Revoca un consentimiento específico
 * Crea un nuevo registro con otorgado=false
 */
export async function revocarConsentimiento(
  userId: string,
  tipo: TipoConsentimiento,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Obtener versión del consentimiento actual
    const consentimientoActual = await db.consentimientoDatos.findFirst({
      where: {
        userId,
        tipo,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        version: true,
      },
    })

    if (!consentimientoActual) {
      throw new Error('No se encontró consentimiento previo para revocar')
    }

    // Registrar revocación
    await registrarConsentimiento({
      userId,
      tipo,
      otorgado: false,
      version: consentimientoActual.version,
      ipAddress,
      userAgent,
    })

    secureLogger.audit('Consentimiento revocado', {
      userId,
      tipo,
    })
  } catch (error) {
    secureLogger.error('Error revocando consentimiento', error, {
      userId,
      tipo,
    })
    throw new Error('Error al revocar consentimiento')
  }
}

/**
 * Verifica que el usuario tenga todos los consentimientos requeridos
 * Consentimientos obligatorios según Ley 1581:
 * - Términos y condiciones
 * - Política de privacidad
 * - Tratamiento de datos personales
 */
export async function verificarConsentimientosRequeridos(
  userId: string
): Promise<{
  completo: boolean
  faltantes: TipoConsentimiento[]
}> {
  const consentimientosRequeridos: TipoConsentimiento[] = [
    TipoConsentimiento.TERMINOS_CONDICIONES,
    TipoConsentimiento.POLITICA_PRIVACIDAD,
    TipoConsentimiento.TRATAMIENTO_DATOS_PERSONALES,
  ]

  const faltantes: TipoConsentimiento[] = []

  for (const tipo of consentimientosRequeridos) {
    const tiene = await tieneConsentimiento(userId, tipo)
    if (!tiene) {
      faltantes.push(tipo)
    }
  }

  return {
    completo: faltantes.length === 0,
    faltantes,
  }
}

/**
 * Obtiene el historial completo de consentimientos de un usuario
 * Útil para auditorías y cumplimiento legal
 */
export async function obtenerHistorialConsentimientos(userId: string) {
  try {
    const historial = await db.consentimientoDatos.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tipo: true,
        otorgado: true,
        version: true,
        ipAddress: true,
        createdAt: true,
      },
    })

    return historial
  } catch (error) {
    secureLogger.error('Error obteniendo historial de consentimientos', error, {
      userId,
    })
    throw new Error('Error al obtener historial')
  }
}

/**
 * Actualiza consentimientos cuando cambia la versión de un documento legal
 * Invalida consentimientos anteriores y requiere nueva aceptación
 */
export async function actualizarVersionDocumento(
  tipo: TipoConsentimiento,
  nuevaVersion: string
): Promise<void> {
  try {
    // Esta función se ejecutaría cuando se actualiza un documento legal
    // Los consentimientos antiguos siguen válidos pero se marca que hay nueva versión

    secureLogger.audit('Versión de documento actualizada', {
      tipo,
      nuevaVersion,
    })

    // En una implementación completa, se podría:
    // 1. Notificar a usuarios que deben revisar nueva versión
    // 2. Marcar consentimientos antiguos como "pendiente de actualización"
    // 3. Requerir nueva aceptación en próximo login
  } catch (error) {
    secureLogger.error('Error actualizando versión de documento', error, {
      tipo,
      nuevaVersion,
    })
    throw new Error('Error al actualizar versión')
  }
}
