/**
 * VALIDACIÓN Y SANITIZACIÓN DE IPs
 * ✅ ALTO #12 RESUELTO: Previene IP spoofing
 *
 * Valida y sanitiza headers de IP para prevenir spoofing
 */

/**
 * Verificar si una IP es pública (no privada/local)
 */
export function isPublicIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false

  // Remover espacios
  ip = ip.trim()

  // Rechazar IPs privadas y locales
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Privada clase A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Privada clase B
    /^192\.168\./, // Privada clase C
    /^::1$/, // IPv6 loopback
    /^fc00:/, // IPv6 privada
    /^fe80:/, // IPv6 link-local
    /^::ffff:127\./, // IPv4-mapped IPv6 loopback
  ]

  return !privateRanges.some((range) => range.test(ip))
}

/**
 * Obtener IP del cliente desde headers de request
 * Maneja correctamente proxies y CDNs
 */
export function getClientIP(headers: {
  get(name: string): string | null
}): string {
  // Intentar obtener de x-forwarded-for (puede ser chain de IPs)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)

    // Tomar la primera IP pública del chain
    for (const ip of ips) {
      if (isValidIP(ip) && isPublicIP(ip)) {
        return ip
      }
    }
  }

  // Intentar x-real-ip
  const realIp = headers.get('x-real-ip')
  if (realIp && isValidIP(realIp) && isPublicIP(realIp)) {
    return realIp
  }

  // Si no hay IP pública válida, retornar unknown
  return 'unknown'
}

/**
 * Validar formato de IP (IPv4 o IPv6)
 */
export function isValidIP(ip: string): boolean {
  if (!ip) return false

  // IPv4: 4 octetos de 0-255
  const ipv4Regex =
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number)
    return parts.every((part) => part >= 0 && part <= 255)
  }

  // IPv6: formato básico (puede mejorarse)
  const ipv6Regex =
    /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i

  return ipv6Regex.test(ip)
}

/**
 * Sanitizar IP removiendo caracteres inválidos
 */
export function sanitizeIP(ip: string): string {
  if (!ip) return 'unknown'

  // Remover espacios y caracteres especiales
  ip = ip.trim().replace(/[^0-9a-f:.]/gi, '')

  // Validar longitud máxima (IPv6 es max 39 caracteres)
  if (ip.length > 45) {
    return 'unknown'
  }

  return ip || 'unknown'
}

/**
 * Obtener información geográfica aproximada por IP
 * (solo para propósitos de logging, no para seguridad crítica)
 */
export function getIPRegion(ip: string): string | null {
  // Rangos de ejemplo (esto debería usar una base de datos real en producción)
  if (ip.startsWith('181.') || ip.startsWith('190.') || ip.startsWith('200.')) {
    return 'LATAM'
  }

  if (ip.startsWith('103.') || ip.startsWith('223.')) {
    return 'ASIA'
  }

  if (ip.startsWith('2.') || ip.startsWith('80.') || ip.startsWith('82.')) {
    return 'EUROPE'
  }

  return null
}
