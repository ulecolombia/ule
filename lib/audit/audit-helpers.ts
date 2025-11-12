/**
 * HELPERS DE AUDITORÍA POR MÓDULO
 * Funciones especializadas para registrar eventos específicos de cada módulo del sistema
 */

import { registrarAuditoria } from './audit-service'

// ============================================================================
// PILA - Seguridad Social
// ============================================================================

export async function auditarLiquidacionPILA(
  userId: string,
  aporteId: string,
  detalles: {
    periodo: string
    ingresoBase: number
    total: number
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'PILA_LIQUIDADA',
    recurso: `aporte:${aporteId}`,
    detalles,
    ip,
    categoria: 'SEGURIDAD_SOCIAL',
  })
}

export async function auditarPagoPILA(
  userId: string,
  aporteId: string,
  detalles: {
    periodo: string
    monto: number
    metodoPago: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'PILA_PAGADA',
    recurso: `aporte:${aporteId}`,
    detalles,
    ip,
    categoria: 'DATOS_FINANCIEROS',
    nivelRiesgo: 'MEDIO',
  })
}

export async function auditarDescargaComprobantePILA(
  userId: string,
  aporteId: string,
  detalles: {
    periodo: string
    tipo: 'pdf' | 'planilla'
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'COMPROBANTE_DESCARGADO',
    recurso: `aporte:${aporteId}`,
    detalles,
    ip,
    categoria: 'SEGURIDAD_SOCIAL',
  })
}

// ============================================================================
// FACTURACIÓN
// ============================================================================

export async function auditarCreacionFactura(
  userId: string,
  facturaId: string,
  detalles: {
    numeroFactura: string
    clienteNombre: string
    total: number
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'FACTURA_CREADA',
    recurso: `factura:${facturaId}`,
    detalles,
    ip,
    categoria: 'FACTURACION',
  })
}

export async function auditarEmisionFactura(
  userId: string,
  facturaId: string,
  detalles: {
    numeroFactura: string
    cufe: string
    total: number
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'FACTURA_EMITIDA',
    recurso: `factura:${facturaId}`,
    detalles,
    ip,
    categoria: 'FACTURACION',
    nivelRiesgo: 'MEDIO',
  })
}

export async function auditarAnulacionFactura(
  userId: string,
  facturaId: string,
  detalles: {
    numeroFactura: string
    motivo: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'FACTURA_ANULADA',
    recurso: `factura:${facturaId}`,
    detalles,
    ip,
    categoria: 'FACTURACION',
    nivelRiesgo: 'ALTO',
  })
}

export async function auditarDescargaFactura(
  userId: string,
  facturaId: string,
  detalles: {
    numeroFactura: string
    formato: 'pdf' | 'xml'
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'FACTURA_DESCARGADA',
    recurso: `factura:${facturaId}`,
    detalles,
    ip,
    categoria: 'FACTURACION',
  })
}

export async function auditarEnvioEmailFactura(
  userId: string,
  facturaId: string,
  detalles: {
    numeroFactura: string
    destinatario: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'FACTURA_ENVIADA_EMAIL',
    recurso: `factura:${facturaId}`,
    detalles,
    ip,
    categoria: 'FACTURACION',
  })
}

// ============================================================================
// CLIENTES
// ============================================================================

export async function auditarGestionCliente(
  userId: string,
  accion: 'CLIENTE_CREADO' | 'CLIENTE_ACTUALIZADO' | 'CLIENTE_ELIMINADO',
  clienteId: string,
  detallesAntes: any,
  detallesDespues: any,
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion,
    recurso: `cliente:${clienteId}`,
    detallesAntes,
    detallesDespues,
    ip,
    categoria: 'DATOS_PERSONALES',
    nivelRiesgo: accion === 'CLIENTE_ELIMINADO' ? 'MEDIO' : 'BAJO',
  })
}

// ============================================================================
// INTELIGENCIA ARTIFICIAL
// ============================================================================

export async function auditarConsultaIA(
  userId: string,
  conversacionId: string,
  detalles: {
    pregunta: string // Resumida/sanitizada
    categoria?: string
    tokensUsados?: number
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'CONSULTA_IA',
    recurso: `conversacion:${conversacionId}`,
    detalles,
    ip,
    categoria: 'INTELIGENCIA_ARTIFICIAL',
  })
}

export async function auditarConversacionIA(
  userId: string,
  conversacionId: string,
  accion: 'CONVERSACION_CREADA' | 'CONVERSACION_ELIMINADA',
  detalles: any,
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion,
    recurso: `conversacion:${conversacionId}`,
    detalles,
    ip,
    categoria: 'INTELIGENCIA_ARTIFICIAL',
  })
}

// ============================================================================
// PRIVACIDAD Y DATOS
// ============================================================================

export async function auditarExportacionDatos(
  userId: string,
  solicitudId: string,
  detalles: {
    tamanoBytes: number
    formato: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'DATOS_EXPORTADOS',
    recurso: `exportacion:${solicitudId}`,
    detalles,
    ip,
    categoria: 'DATOS_PERSONALES',
    nivelRiesgo: 'ALTO',
    tags: ['gdpr', 'ley-1581', 'portabilidad'],
  })
}

export async function auditarSolicitudEliminacion(
  userId: string,
  solicitudId: string,
  detalles: {
    motivo?: string
    fechaEliminacion: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'SOLICITUD_ELIMINACION',
    recurso: `solicitud:${solicitudId}`,
    detalles,
    ip,
    categoria: 'DATOS_PERSONALES',
    nivelRiesgo: 'CRITICO',
    tags: ['derecho-olvido', 'ley-1581'],
  })
}

export async function auditarEliminacionCuenta(
  userId: string,
  detalles: {
    email: string
    fechaSolicitud: string
  }
) {
  await registrarAuditoria({
    userId,
    accion: 'CUENTA_ELIMINADA',
    detalles,
    categoria: 'DATOS_PERSONALES',
    nivelRiesgo: 'CRITICO',
    tags: ['derecho-olvido', 'eliminacion'],
  })
}

export async function auditarConsentimiento(
  userId: string,
  accion: 'CONSENTIMIENTO_OTORGADO' | 'CONSENTIMIENTO_REVOCADO',
  detalles: {
    tipoDato: string
    version: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion,
    detalles,
    ip,
    categoria: 'DATOS_PERSONALES',
    nivelRiesgo: 'MEDIO',
    tags: ['consentimiento', 'ley-1581'],
  })
}

// ============================================================================
// ARCHIVOS
// ============================================================================

export async function auditarOperacionArchivo(
  userId: string,
  accion: 'ARCHIVO_SUBIDO' | 'ARCHIVO_DESCARGADO' | 'ARCHIVO_ELIMINADO',
  detalles: {
    nombreArchivo: string
    tipo: string
    tamanoBytes?: number
    ruta?: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion,
    detalles,
    ip,
    categoria: 'ARCHIVOS',
    nivelRiesgo: accion === 'ARCHIVO_ELIMINADO' ? 'MEDIO' : 'BAJO',
  })
}

// ============================================================================
// ADMINISTRACIÓN
// ============================================================================

export async function auditarAccionAdmin(
  adminId: string,
  accion: 'USUARIO_BLOQUEADO' | 'USUARIO_DESBLOQUEADO' | 'ROL_ASIGNADO',
  targetUserId: string,
  detalles: any,
  ip: string
) {
  await registrarAuditoria({
    userId: adminId,
    accion,
    recurso: `user:${targetUserId}`,
    detalles,
    ip,
    categoria: 'ADMINISTRACION',
    nivelRiesgo: 'ALTO',
    tags: ['admin-action'],
  })
}

export async function auditarRevisionLog(adminId: string, logId: string, ip: string) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'LOG_REVISADO',
    recurso: `log:${logId}`,
    ip,
    categoria: 'ADMINISTRACION',
  })
}

export async function auditarGestionAlerta(
  adminId: string,
  alertaId: string,
  detalles: {
    estadoAnterior: string
    estadoNuevo: string
    notas?: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'ALERTA_GESTIONADA',
    recurso: `alerta:${alertaId}`,
    detalles,
    ip,
    categoria: 'SEGURIDAD',
    nivelRiesgo: 'MEDIO',
  })
}

export async function auditarConfiguracionSistema(
  adminId: string,
  detalles: {
    configuracion: string
    valorAnterior: any
    valorNuevo: any
  },
  ip: string
) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'CONFIGURACION_SISTEMA_CAMBIADA',
    detalles,
    ip,
    categoria: 'ADMINISTRACION',
    nivelRiesgo: 'ALTO',
    tags: ['config'],
  })
}

// ============================================================================
// SEGURIDAD
// ============================================================================

export async function auditarAccesoDenegado(
  userId: string | undefined,
  detalles: {
    recurso: string
    razon: string
  },
  ip: string,
  userAgent: string
) {
  await registrarAuditoria({
    userId,
    accion: 'ACCESO_RECURSO_DENEGADO',
    exitoso: false,
    detalles,
    ip,
    userAgent,
    categoria: 'SEGURIDAD',
    nivelRiesgo: 'MEDIO',
  })
}

export async function auditarIntentoAccesoNoAutorizado(
  userId: string | undefined,
  detalles: {
    recurso: string
    razon: string
  },
  ip: string,
  userAgent: string
) {
  await registrarAuditoria({
    userId,
    accion: 'INTENTO_ACCESO_NO_AUTORIZADO',
    exitoso: false,
    detalles,
    ip,
    userAgent,
    categoria: 'SEGURIDAD',
    nivelRiesgo: 'ALTO',
    tags: ['acceso-no-autorizado'],
  })
}

export async function auditarActividadSospechosa(
  userId: string | undefined,
  detalles: {
    tipo: string
    descripcion: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId,
    accion: 'ACTIVIDAD_SOSPECHOSA_DETECTADA',
    detalles,
    ip,
    categoria: 'SEGURIDAD',
    nivelRiesgo: 'CRITICO',
    tags: ['sospechoso', 'alerta'],
  })
}

export async function auditarBloqueoIP(
  adminId: string | undefined,
  detalles: {
    ip: string
    razon: string
    duracion?: string
  },
  ip: string
) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'IP_BLOQUEADA',
    detalles,
    ip,
    categoria: 'SEGURIDAD',
    nivelRiesgo: 'ALTO',
    tags: ['bloqueo', 'ip'],
  })
}

// ============================================================================
// SISTEMA
// ============================================================================

export async function auditarErrorSistema(
  detalles: {
    error: string
    stack?: string
    contexto?: any
  }
) {
  await registrarAuditoria({
    accion: 'ERROR_SISTEMA',
    exitoso: false,
    detalles,
    categoria: 'SISTEMA',
    nivelRiesgo: 'MEDIO',
  })
}

export async function auditarBackup(
  adminId: string | undefined,
  detalles: {
    tipo: 'manual' | 'automatico'
    tamanoBytes?: number
    duracionMs?: number
  }
) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'BACKUP_REALIZADO',
    detalles,
    categoria: 'SISTEMA',
    tags: ['backup'],
  })
}

export async function auditarMigracion(
  adminId: string | undefined,
  detalles: {
    nombre: string
    exitosa: boolean
    duracionMs?: number
  }
) {
  await registrarAuditoria({
    userId: adminId,
    accion: 'MIGRACION_EJECUTADA',
    exitoso: detalles.exitosa,
    detalles,
    categoria: 'SISTEMA',
    nivelRiesgo: 'ALTO',
    tags: ['migracion', 'database'],
  })
}
