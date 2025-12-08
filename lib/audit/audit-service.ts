/**
 * SERVICIO CENTRAL DE AUDITORÍA
 * Sistema completo de registro y trazabilidad para cumplimiento legal
 *
 * Cumple con:
 * - Ley 1581 de 2012 (Colombia): Registro de acceso a datos personales
 * - Decreto 1377 de 2013: Logs de tratamiento de datos
 * - Ley 1273 de 2009: Evidencia forense para delitos informáticos
 *
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Queue con límite de concurrencia (previene memory leaks)
 * - Cache de geolocalización con rate limiting
 * - Sanitización con límite de profundidad (previene stack overflow)
 * - structuredClone en lugar de JSON.parse/stringify
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
  AccionAuditoria,
  CategoriaAuditoria,
  NivelRiesgo,
} from '@prisma/client'
import { UAParser } from 'ua-parser-js'
import PQueue from 'p-queue'
import { ALERT_THRESHOLDS, getTimeWindow } from '@/lib/config/audit-thresholds'

// ✅ MEDIO #17: Utilidad para obtener hora en timezone de Colombia
const COLOMBIA_TZ = 'America/Bogota'

function getColombiaNow(): Date {
  // Convertir UTC a Colombia (UTC-5)
  const now = new Date()
  const colombiaTimeString = now.toLocaleString('en-US', {
    timeZone: COLOMBIA_TZ,
  })
  return new Date(colombiaTimeString)
}

function getColombiaHour(): number {
  const now = new Date()
  return parseInt(
    now.toLocaleString('en-US', {
      timeZone: COLOMBIA_TZ,
      hour: 'numeric',
      hour12: false,
    })
  )
}

// ✅ CRÍTICO #2 RESUELTO: Queue con límite de concurrencia
const alertQueue = new PQueue({ concurrency: 5 })

// ✅ CRÍTICO #8 RESUELTO: Cache de geolocalización
const geoCache = new Map<string, any>()
const GEO_CACHE_TTL = 86400000 // 24 horas
const GEO_RATE_LIMIT = 900 // 900 requests por día
let geoRequestCount = 0
let geoRateLimitReset = Date.now() + 86400000

/**
 * Parámetros para registrar un evento de auditoría
 */
export interface AuditLogParams {
  userId?: string
  accion: AccionAuditoria
  recurso?: string
  exitoso?: boolean
  codigoError?: string
  mensajeError?: string
  detalles?: any
  detallesAntes?: any
  detallesDespues?: any
  ip?: string
  userAgent?: string
  metodoHttp?: string
  ruta?: string
  duracionMs?: number
  sessionId?: string
  requestId?: string
  categoria?: CategoriaAuditoria
  nivelRiesgo?: NivelRiesgo
  tags?: string[]
}

/**
 * Registrar evento de auditoría
 * @returns Log de auditoría creado (o undefined si falla)
 */
export async function registrarAuditoria(params: AuditLogParams) {
  try {
    // Obtener información del usuario si existe
    let userEmail: string | undefined
    let userName: string | undefined

    if (params.userId) {
      const user = await db.user.findUnique({
        where: { id: params.userId },
        select: { email: true, nombre: true, name: true },
      })
      userEmail = user?.email
      userName = user?.nombre || user?.name
    }

    // Parsear user agent
    let dispositivo: string | undefined
    let navegador: string | undefined
    let sistemaOperativo: string | undefined

    if (params.userAgent) {
      const parser = new UAParser(params.userAgent)
      const ua = parser.getResult()

      dispositivo = ua.device.type || 'desktop'
      navegador = ua.browser.name
      sistemaOperativo = ua.os.name
    }

    // Obtener geolocalización de IP (opcional, con timeout)
    let ipGeo: any | undefined
    if (params.ip && params.ip !== 'unknown' && !params.ip.startsWith('127.')) {
      ipGeo = await obtenerGeolocalizacion(params.ip)
    }

    // Determinar categoría automáticamente si no se proporciona
    const categoria = params.categoria || determinarCategoria(params.accion)

    // Determinar nivel de riesgo automáticamente si no se proporciona
    const nivelRiesgo =
      params.nivelRiesgo || determinarNivelRiesgo(params.accion, params.exitoso)

    // Sanitizar detalles (eliminar datos sensibles accidentales)
    const detallesSanitizados = sanitizarDetalles(params.detalles)
    const detallesAntesSanitizados = sanitizarDetalles(params.detallesAntes)
    const detallesDespuesSanitizados = sanitizarDetalles(params.detallesDespues)

    // Crear log de auditoría
    const log = await db.logAuditoria.create({
      data: {
        userId: params.userId,
        userEmail,
        userName,
        accion: params.accion,
        recurso: params.recurso,
        exitoso: params.exitoso ?? true,
        codigoError: params.codigoError,
        mensajeError: params.mensajeError,
        detalles: detallesSanitizados,
        detallesAntes: detallesAntesSanitizados,
        detallesDespues: detallesDespuesSanitizados,
        ip: params.ip || 'unknown',
        ipGeo,
        userAgent: params.userAgent || 'unknown',
        dispositivo,
        navegador,
        sistemaOperativo,
        metodoHttp: params.metodoHttp,
        ruta: params.ruta,
        duracionMs: params.duracionMs,
        sessionId: params.sessionId,
        requestId: params.requestId,
        categoria,
        nivelRiesgo,
        tags: params.tags,
      },
    })

    // ✅ CRÍTICO #2 RESUELTO: Usar queue con límite de concurrencia
    alertQueue
      .add(() => analizarYGenerarAlerta(log))
      .catch((error) => {
        console.error('Error analizando alerta:', error)
      })

    return log
  } catch (error) {
    console.error('Error registrando auditoría:', error)
    // No lanzar error para no interrumpir la operación principal
    return undefined
  }
}

/**
 * Obtener geolocalización de IP usando ipapi.co (gratuito)
 * ✅ CRÍTICO #8 RESUELTO: Cache + rate limiting local
 */
async function obtenerGeolocalizacion(ip: string): Promise<any | null> {
  try {
    // 1. Reset rate limit si pasó 24h
    if (Date.now() > geoRateLimitReset) {
      geoRequestCount = 0
      geoRateLimitReset = Date.now() + 86400000
    }

    // 2. Check cache
    if (geoCache.has(ip)) {
      const cached = geoCache.get(ip)
      // Verificar si no ha expirado
      if (Date.now() - cached.timestamp < GEO_CACHE_TTL) {
        return cached.data
      }
      geoCache.delete(ip)
    }

    // 3. Check rate limit
    if (geoRequestCount >= GEO_RATE_LIMIT) {
      console.warn('Rate limit de geolocalización alcanzado para hoy')
      return null
    }

    // 4. Fetch con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    geoRequestCount++

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()

    const result = {
      country: data.country_name,
      city: data.city,
      lat: data.latitude,
      lon: data.longitude,
    }

    // 5. Cache result
    geoCache.set(ip, {
      data: result,
      timestamp: Date.now(),
    })

    // Cleanup cache después de TTL
    setTimeout(() => geoCache.delete(ip), GEO_CACHE_TTL)

    return result
  } catch (error) {
    // Timeout o error de red - no es crítico
    return null
  }
}

/**
 * Determinar categoría automáticamente basado en la acción
 */
function determinarCategoria(accion: AccionAuditoria): CategoriaAuditoria {
  const mapeo: Partial<Record<AccionAuditoria, CategoriaAuditoria>> = {
    LOGIN: 'AUTENTICACION',
    LOGOUT: 'AUTENTICACION',
    LOGIN_FALLIDO: 'AUTENTICACION',
    PASSWORD_CAMBIADO: 'AUTENTICACION',
    PASSWORD_RESET_SOLICITADO: 'AUTENTICACION',
    PASSWORD_RESET_COMPLETADO: 'AUTENTICACION',
    TWO_FACTOR_HABILITADO: 'AUTENTICACION',
    TWO_FACTOR_DESHABILITADO: 'AUTENTICACION',
    SESION_REVOCADA: 'AUTENTICACION',

    INTENTO_ACCESO_NO_AUTORIZADO: 'AUTORIZACION',
    ACCESO_RECURSO_DENEGADO: 'AUTORIZACION',

    PILA_LIQUIDADA: 'SEGURIDAD_SOCIAL',
    PILA_PAGADA: 'SEGURIDAD_SOCIAL',
    COMPROBANTE_DESCARGADO: 'SEGURIDAD_SOCIAL',
    CONFIGURACION_PILA_ACTUALIZADA: 'SEGURIDAD_SOCIAL',

    FACTURA_CREADA: 'FACTURACION',
    FACTURA_EMITIDA: 'FACTURACION',
    FACTURA_ANULADA: 'FACTURACION',
    FACTURA_DESCARGADA: 'FACTURACION',
    FACTURA_ENVIADA_EMAIL: 'FACTURACION',
    CLIENTE_CREADO: 'FACTURACION',
    CLIENTE_ACTUALIZADO: 'FACTURACION',
    CLIENTE_ELIMINADO: 'FACTURACION',

    CONSULTA_IA: 'INTELIGENCIA_ARTIFICIAL',
    CONVERSACION_CREADA: 'INTELIGENCIA_ARTIFICIAL',
    CONVERSACION_ELIMINADA: 'INTELIGENCIA_ARTIFICIAL',

    DATOS_EXPORTADOS: 'DATOS_PERSONALES',
    SOLICITUD_ELIMINACION: 'DATOS_PERSONALES',
    CUENTA_ELIMINADA: 'DATOS_PERSONALES',
    CONSENTIMIENTO_OTORGADO: 'DATOS_PERSONALES',
    CONSENTIMIENTO_REVOCADO: 'DATOS_PERSONALES',
    PERFIL_ACTUALIZADO: 'DATOS_PERSONALES',
    EMAIL_CAMBIADO: 'DATOS_PERSONALES',
    TELEFONO_CAMBIADO: 'DATOS_PERSONALES',
    DOCUMENTO_CAMBIADO: 'DATOS_PERSONALES',

    ARCHIVO_SUBIDO: 'ARCHIVOS',
    ARCHIVO_DESCARGADO: 'ARCHIVOS',
    ARCHIVO_ELIMINADO: 'ARCHIVOS',

    USUARIO_BLOQUEADO: 'ADMINISTRACION',
    USUARIO_DESBLOQUEADO: 'ADMINISTRACION',
    ROL_ASIGNADO: 'ADMINISTRACION',
    CONFIGURACION_SISTEMA_CAMBIADA: 'ADMINISTRACION',
    LOG_REVISADO: 'ADMINISTRACION',
    ALERTA_GESTIONADA: 'ADMINISTRACION',

    ACTIVIDAD_SOSPECHOSA_DETECTADA: 'SEGURIDAD',
    IP_BLOQUEADA: 'SEGURIDAD',

    ERROR_SISTEMA: 'SISTEMA',
    BACKUP_REALIZADO: 'SISTEMA',
    MIGRACION_EJECUTADA: 'SISTEMA',
  }

  return mapeo[accion] || 'GENERAL'
}

/**
 * Determinar nivel de riesgo automáticamente
 */
function determinarNivelRiesgo(
  accion: AccionAuditoria,
  exitoso?: boolean
): NivelRiesgo {
  // Acciones críticas
  const accionesCriticas: AccionAuditoria[] = [
    'CUENTA_ELIMINADA',
    'ACTIVIDAD_SOSPECHOSA_DETECTADA',
    'IP_BLOQUEADA',
  ]

  // Acciones de alto riesgo
  const accionesAltoRiesgo: AccionAuditoria[] = [
    'PASSWORD_CAMBIADO',
    'EMAIL_CAMBIADO',
    'DATOS_EXPORTADOS',
    'SOLICITUD_ELIMINACION',
    'USUARIO_BLOQUEADO',
    'ROL_ASIGNADO',
    'INTENTO_ACCESO_NO_AUTORIZADO',
    'CONFIGURACION_SISTEMA_CAMBIADA',
  ]

  // Acciones de riesgo medio
  const accionesRiesgoMedio: AccionAuditoria[] = [
    'LOGIN_FALLIDO',
    'SESION_REVOCADA',
    'DOCUMENTO_CAMBIADO',
    'FACTURA_ANULADA',
    'CLIENTE_ELIMINADO',
    'ACCESO_RECURSO_DENEGADO',
    'TWO_FACTOR_DESHABILITADO',
  ]

  if (accionesCriticas.includes(accion)) return 'CRITICO'
  if (accionesAltoRiesgo.includes(accion)) return 'ALTO'
  if (accionesRiesgoMedio.includes(accion)) return 'MEDIO'
  if (exitoso === false) return 'MEDIO' // Fallos son riesgo medio por defecto

  return 'BAJO'
}

/**
 * Sanitizar detalles para evitar exponer datos sensibles
 * ✅ CRÍTICO #3 RESUELTO: Límite de profundidad (previene stack overflow)
 * ✅ CRÍTICO #7 RESUELTO: structuredClone en lugar de JSON.parse/stringify
 */
function sanitizarDetalles(detalles: any): any {
  if (!detalles) return undefined

  const camposSensibles = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'twoFactorSecret',
    'twoFactorBackupCodes',
  ]

  const MAX_DEPTH = 10

  const sanitizar = (obj: any, depth = 0): any => {
    // Límite de profundidad para prevenir stack overflow
    if (depth > MAX_DEPTH) {
      return '[MAX_DEPTH_EXCEEDED]'
    }

    if (typeof obj !== 'object' || obj === null) return obj

    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizar(item, depth + 1))
    }

    const resultado: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (
        camposSensibles.some((campo) =>
          key.toLowerCase().includes(campo.toLowerCase())
        )
      ) {
        resultado[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        resultado[key] = sanitizar(value, depth + 1)
      } else {
        resultado[key] = value
      }
    }
    return resultado
  }

  try {
    // Usar structuredClone si está disponible (Node 17+), más eficiente
    const cloned =
      typeof structuredClone !== 'undefined'
        ? structuredClone(detalles)
        : JSON.parse(JSON.stringify(detalles))

    return sanitizar(cloned)
  } catch {
    // Si falla el clone, sanitizar directamente (modifica in-place)
    return sanitizar(detalles)
  }
}

/**
 * Analizar log y generar alerta si es necesario
 * ✅ ALTO #13 RESUELTO: Usa umbrales configurables
 * ✅ ALTO #9 RESUELTO: Optimiza N+1 queries con select
 */
async function analizarYGenerarAlerta(log: any) {
  try {
    const thresholds = ALERT_THRESHOLDS

    // 1. Múltiples intentos de login fallidos
    if (log.accion === 'LOGIN_FALLIDO' && log.userEmail) {
      const intentosRecientes = await db.logAuditoria.count({
        where: {
          userEmail: log.userEmail,
          accion: 'LOGIN_FALLIDO',
          timestamp: {
            gte: new Date(
              Date.now() -
                getTimeWindow(thresholds.LOGIN_FAILURES.windowMinutes)
            ),
          },
        },
      })

      if (intentosRecientes >= thresholds.LOGIN_FAILURES.count) {
        await crearAlerta({
          tipo: 'MULTIPLES_INTENTOS_FALLIDOS',
          severidad: thresholds.LOGIN_FAILURES.severidad,
          titulo: 'Múltiples intentos de login fallidos',
          descripcion: `${intentosRecientes} intentos fallidos en ${thresholds.LOGIN_FAILURES.windowMinutes} minutos para ${log.userEmail}`,
          userId: log.userId,
          userEmail: log.userEmail,
          ip: log.ip,
          logIds: [log.id],
          metadata: { intentos: intentosRecientes },
        })
      }
    }

    // 2. Acceso desde ubicación inusual
    if (log.accion === 'LOGIN' && log.ipGeo && log.userId) {
      // ✅ ALTO #9: Solo select ipGeo en lugar de todos los campos
      const ultimosLogins = await db.logAuditoria.findMany({
        where: {
          userId: log.userId,
          accion: 'LOGIN',
          exitoso: true,
          timestamp: {
            gte: new Date(
              Date.now() -
                thresholds.UNUSUAL_LOCATION.daysToCheck * 24 * 60 * 60 * 1000
            ),
          },
          ipGeo: { not: Prisma.DbNull },
        },
        select: {
          ipGeo: true,
        },
        take: thresholds.UNUSUAL_LOCATION.checkLastNLogins,
        orderBy: { timestamp: 'desc' },
      })

      if (ultimosLogins.length > 0) {
        const paisesAnteriores = ultimosLogins
          .filter((l: any) => l.ipGeo?.country)
          .map((l: any) => l.ipGeo.country)

        const ubicacionInusual = !paisesAnteriores.includes(log.ipGeo.country)

        if (ubicacionInusual) {
          await crearAlerta({
            tipo: 'ACCESO_UBICACION_INUSUAL',
            severidad: thresholds.UNUSUAL_LOCATION.severidad,
            titulo: 'Acceso desde ubicación inusual',
            descripcion: `Login desde ${log.ipGeo.city}, ${log.ipGeo.country}. Países anteriores: ${Array.from(new Set(paisesAnteriores)).join(', ')}`,
            userId: log.userId,
            userEmail: log.userEmail,
            ip: log.ip,
            ubicacion: `${log.ipGeo.city}, ${log.ipGeo.country}`,
            logIds: [log.id],
            metadata: {
              paisAnterior: paisesAnteriores[0],
              paisNuevo: log.ipGeo.country,
            },
          })
        }
      }
    }

    // 3. Múltiples cambios rápidos en perfil/seguridad
    if (
      [
        'PERFIL_ACTUALIZADO',
        'PASSWORD_CAMBIADO',
        'EMAIL_CAMBIADO',
        'TELEFONO_CAMBIADO',
      ].includes(log.accion) &&
      log.userId
    ) {
      const cambiosRecientes = await db.logAuditoria.count({
        where: {
          userId: log.userId,
          accion: {
            in: [
              'PERFIL_ACTUALIZADO',
              'PASSWORD_CAMBIADO',
              'EMAIL_CAMBIADO',
              'TELEFONO_CAMBIADO',
            ],
          },
          timestamp: {
            gte: new Date(
              Date.now() -
                getTimeWindow(thresholds.PROFILE_CHANGES.windowMinutes)
            ),
          },
        },
      })

      if (cambiosRecientes >= thresholds.PROFILE_CHANGES.count) {
        await crearAlerta({
          tipo: 'CAMBIOS_MULTIPLES_RAPIDOS',
          severidad: thresholds.PROFILE_CHANGES.severidad,
          titulo: 'Múltiples cambios en poco tiempo',
          descripcion: `${cambiosRecientes} cambios en perfil/seguridad en ${thresholds.PROFILE_CHANGES.windowMinutes} minutos`,
          userId: log.userId,
          userEmail: log.userEmail,
          ip: log.ip,
          logIds: [log.id],
          metadata: { cantidadCambios: cambiosRecientes },
        })
      }
    }

    // 4. Acceso en horario inusual
    // ✅ MEDIO #17: Usar timezone de Colombia explícitamente
    const hora = getColombiaHour()
    const colombiaNow = getColombiaNow()
    if (
      log.accion === 'LOGIN' &&
      log.userId &&
      hora >= thresholds.UNUSUAL_HOURS.startHour &&
      hora <= thresholds.UNUSUAL_HOURS.endHour
    ) {
      await crearAlerta({
        tipo: 'ACCESO_HORARIO_INUSUAL',
        severidad: thresholds.UNUSUAL_HOURS.severidad,
        titulo: 'Acceso en horario inusual',
        descripcion: `Login a las ${hora}:${colombiaNow.getMinutes().toString().padStart(2, '0')} hora Colombia (madrugada)`,
        userId: log.userId,
        userEmail: log.userEmail,
        ip: log.ip,
        logIds: [log.id],
        metadata: { hora },
      })
    }

    // 5. Descarga masiva de datos
    if (
      [
        'ARCHIVO_DESCARGADO',
        'FACTURA_DESCARGADA',
        'COMPROBANTE_DESCARGADO',
      ].includes(log.accion) &&
      log.userId
    ) {
      const descargasRecientes = await db.logAuditoria.count({
        where: {
          userId: log.userId,
          accion: {
            in: [
              'ARCHIVO_DESCARGADO',
              'FACTURA_DESCARGADA',
              'COMPROBANTE_DESCARGADO',
              'DATOS_EXPORTADOS',
            ],
          },
          timestamp: {
            gte: new Date(
              Date.now() - getTimeWindow(thresholds.DOWNLOADS.windowMinutes)
            ),
          },
        },
      })

      if (descargasRecientes >= thresholds.DOWNLOADS.count) {
        await crearAlerta({
          tipo: 'DESCARGA_MASIVA_DATOS',
          severidad: thresholds.DOWNLOADS.severidad,
          titulo: 'Descarga masiva de archivos',
          descripcion: `${descargasRecientes} descargas en ${thresholds.DOWNLOADS.windowMinutes} minutos`,
          userId: log.userId,
          userEmail: log.userEmail,
          ip: log.ip,
          logIds: [log.id],
          metadata: { cantidadDescargas: descargasRecientes },
        })
      }
    }
  } catch (error) {
    console.error('Error analizando alerta:', error)
  }
}

/**
 * Crear alerta de seguridad
 */
async function crearAlerta(params: {
  tipo: any
  severidad: any
  titulo: string
  descripcion: string
  userId?: string
  userEmail?: string
  ip?: string
  ubicacion?: string
  logIds: string[]
  metadata?: any
}) {
  try {
    // Verificar si ya existe alerta similar reciente (evitar duplicados)
    const alertaExistente = await db.alertaSeguridad.findFirst({
      where: {
        tipo: params.tipo,
        userEmail: params.userEmail,
        estado: {
          in: ['PENDIENTE', 'EN_REVISION'],
        },
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Última hora
        },
      },
    })

    if (alertaExistente) {
      // ✅ ALTO #14 RESUELTO: Límite de logIds por alerta
      const newLogIds = [...alertaExistente.logIds, ...params.logIds].slice(
        -ALERT_THRESHOLDS.MAX_LOG_IDS_PER_ALERT
      )

      // Actualizar alerta existente agregando logs
      await db.alertaSeguridad.update({
        where: { id: alertaExistente.id },
        data: {
          logIds: newLogIds,
          descripcion: `${alertaExistente.descripcion}\n\n🔄 Nuevo evento: ${params.descripcion}`,
          updatedAt: new Date(),
        },
      })
      return alertaExistente
    }

    // Crear nueva alerta
    const alerta = await db.alertaSeguridad.create({
      data: {
        tipo: params.tipo,
        severidad: params.severidad,
        titulo: params.titulo,
        descripcion: params.descripcion,
        userId: params.userId,
        userEmail: params.userEmail,
        ip: params.ip,
        ubicacion: params.ubicacion,
        logIds: params.logIds,
        metadata: params.metadata || {},
      },
    })

    // Notificar si es severidad alta o crítica (fire and forget)
    if (params.severidad === 'ALTA' || params.severidad === 'CRITICA') {
      notificarAlerta(alerta).catch((error) => {
        console.error('Error notificando alerta:', error)
      })
    }

    return alerta
  } catch (error) {
    console.error('Error creando alerta:', error)
    return null
  }
}

/**
 * Notificar alerta a administradores
 * TODO: Implementar con sistema de emails cuando esté disponible
 */
async function notificarAlerta(alerta: any) {
  try {
    // Obtener admins
    const admins = await db.user.findMany({
      where: {
        OR: [{ isAdmin: true }, { isSuperAdmin: true }],
      },
      select: { id: true, email: true, nombre: true, name: true },
    })

    console.log(`🚨 [ALERTA] ${alerta.severidad}: ${alerta.titulo}`)
    console.log(`   Usuario: ${alerta.userEmail || 'Sistema'}`)
    console.log(`   Descripción: ${alerta.descripcion}`)
    console.log(`   Admins a notificar: ${admins.length}`)

    // TODO: Implementar envío de emails cuando el servicio esté disponible
    // await sendEmail({
    //   to: admins.map(a => a.email),
    //   subject: `🚨 Alerta de Seguridad: ${alerta.titulo}`,
    //   template: 'security-alert',
    //   data: { alerta }
    // })

    // Marcar como notificada
    await db.alertaSeguridad.update({
      where: { id: alerta.id },
      data: {
        notificado: true,
        fechaNotificacion: new Date(),
      },
    })
  } catch (error) {
    console.error('Error notificando alerta:', error)
  }
}
