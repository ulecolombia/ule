import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

/**
 * Sanitizador de inputs para prevenir XSS e inyecciones
 *
 * Cumplimiento:
 * - OWASP: A03:2021 - Injection
 * - OWASP: A05:2021 - Security Misconfiguration
 */

/**
 * Sanitizar HTML - Remover tags peligrosos
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitizar texto plano - Escapar caracteres especiales
 */
export function sanitizeText(input: string): string {
  return validator.escape(input)
}

/**
 * Sanitizar email
 */
export function sanitizeEmail(email: string): string {
  const normalized = validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: false,
  })

  return normalized || email.toLowerCase().trim()
}

/**
 * Sanitizar número de documento (solo números)
 */
export function sanitizeDocumento(documento: string): string {
  return documento.replace(/\D/g, '')
}

/**
 * Sanitizar teléfono (solo números y +)
 */
export function sanitizeTelefono(telefono: string): string {
  return telefono.replace(/[^\d+]/g, '')
}

/**
 * Sanitizar URL
 */
export function sanitizeURL(url: string): string | null {
  if (!validator.isURL(url, { require_protocol: true })) {
    return null
  }

  // Solo permitir HTTP y HTTPS
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return null
  }

  return url
}

/**
 * Sanitizar nombre de archivo
 */
export function sanitizeFilename(filename: string): string {
  // Remover caracteres peligrosos
  let safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Limitar longitud
  if (safe.length > 255) {
    const ext = safe.split('.').pop()
    safe = safe.substring(0, 250) + '.' + ext
  }

  return safe
}

/**
 * Validar y sanitizar JSON
 */
export function sanitizeJSON(input: string): any | null {
  try {
    const parsed = JSON.parse(input)

    // Sanitizar strings dentro del JSON recursivamente
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeText(obj)
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject)
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value)
        }
        return sanitized
      }

      return obj
    }

    return sanitizeObject(parsed)
  } catch (error) {
    return null
  }
}

/**
 * Validar que un string no contenga SQL injection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\*|;|\/\*|\*\/)/g,
    /('|"|\`)/g,
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Validar que un string no contenga XSS
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Middleware de sanitización para formularios
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, 'text' | 'html' | 'email' | 'documento' | 'telefono' | 'url'>
): T {
  const sanitized: any = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = value
      continue
    }

    const type = schema[key as keyof T]

    switch (type) {
      case 'text':
        sanitized[key] = sanitizeText(String(value))
        break
      case 'html':
        sanitized[key] = sanitizeHTML(String(value))
        break
      case 'email':
        sanitized[key] = sanitizeEmail(String(value))
        break
      case 'documento':
        sanitized[key] = sanitizeDocumento(String(value))
        break
      case 'telefono':
        sanitized[key] = sanitizeTelefono(String(value))
        break
      case 'url':
        sanitized[key] = sanitizeURL(String(value))
        break
      default:
        sanitized[key] = value
    }
  }

  return sanitized as T
}
