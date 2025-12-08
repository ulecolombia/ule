/**
 * Utilidades de formateo
 */

/**
 * Formatea un valor numérico como moneda colombiana (COP)
 */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

// Alias para compatibilidad
export const formatCurrency = formatearMoneda

/**
 * Formatea una fecha a formato colombiano
 */
export function formatearFecha(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Alias para compatibilidad
export const formatDate = formatearFecha

/**
 * Formatea una fecha con hora
 */
export function formatearFechaHora(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea solo la hora de una fecha
 */
export function formatTime(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea tipo de documento
 */
export function formatTipoDocumento(tipo: string | null | undefined): string {
  if (!tipo) return 'N/A'
  const tipos: Record<string, string> = {
    CC: 'Cédula de Ciudadanía',
    CE: 'Cédula de Extranjería',
    NIT: 'NIT',
    PASAPORTE: 'Pasaporte',
    TI: 'Tarjeta de Identidad',
  }
  return tipos[tipo] || tipo
}

/**
 * Formatea número de teléfono
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return 'N/A'
  return phone
}

/**
 * Formatea tipo de contrato
 */
export function formatTipoContrato(tipo: string | null | undefined): string {
  if (!tipo) return 'N/A'
  const tipos: Record<string, string> = {
    PRESTACION_SERVICIOS: 'Prestación de Servicios',
    INDEFINIDO: 'Término Indefinido',
    FIJO: 'Término Fijo',
    OBRA_LABOR: 'Obra o Labor',
  }
  return tipos[tipo] || tipo
}

/**
 * Formatea estado civil
 */
export function formatEstadoCivil(estado: string | null | undefined): string {
  if (!estado) return 'N/A'
  const estados: Record<string, string> = {
    SOLTERO: 'Soltero(a)',
    CASADO: 'Casado(a)',
    UNION_LIBRE: 'Unión Libre',
    DIVORCIADO: 'Divorciado(a)',
    VIUDO: 'Viudo(a)',
  }
  return estados[estado] || estado
}

/**
 * Formatea documento (tipo + número)
 */
export function formatDocument(
  tipoDocumento: string,
  numeroDocumento: string | null | undefined
): string {
  if (!numeroDocumento) return tipoDocumento
  return `${tipoDocumento}: ${numeroDocumento}`
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Parsea lista de emails separados por comas
 */
export function parseEmailList(emails: string): {
  valid: string[]
  invalid: string[]
} {
  const emailArray = emails
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0)

  const valid: string[] = []
  const invalid: string[] = []

  emailArray.forEach((email) => {
    if (isValidEmail(email)) {
      valid.push(email)
    } else {
      invalid.push(email)
    }
  })

  return { valid, invalid }
}

/**
 * Constraints para validación de emails
 */
export const EMAIL_CONSTRAINTS = {
  ASUNTO_MIN: 5,
  ASUNTO_MAX: 200,
  MENSAJE_MIN: 10,
  MENSAJE_MAX: 2000,
} as const

/**
 * Configuración de timeouts para operaciones
 */
export const TIMEOUT_CONFIG = {
  EMAIL_SEND: 30000, // 30 segundos para envío de email
  FILE_READ: 10000, // 10 segundos para lectura de archivo
  API_REQUEST: 15000, // 15 segundos para requests API
  DEFAULT: 10000, // Timeout por defecto
} as const

/**
 * Constraints para archivos
 */
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/xml',
    'text/xml',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.xml'],
} as const
