/**
 * ULE - RATE LIMITING
 * Simple rate limiting for API routes
 */

interface RateLimitOptions {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
}

const rateLimitMap = new Map<string, number[]>()

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Constantes de rate limiting
 */
export const RATE_LIMITS = {
  REGISTER: { limit: 5, interval: 60 * 1000 },
  LOGIN: { limit: 10, interval: 60 * 1000 },
  API: { limit: 100, interval: 60 * 1000 },
}

/**
 * Obtiene IP del cliente desde request
 */
export function getClientIp(request: Request): string {
  // Intentar obtener IP real del cliente
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  if (realIp) {
    return realIp
  }

  // Fallback a IP genérica
  return 'unknown'
}

/**
 * Wrapper async para verificar rate limit
 */
export async function rateLimit(
  token: string,
  config: { limit: number; interval: number }
): Promise<{ success: boolean }> {
  const limiter = createRateLimiter({
    ...config,
    uniqueTokenPerInterval: 500,
  })

  try {
    await limiter.check(config.limit, token)
    return { success: true }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false }
    }
    throw error
  }
}

/**
 * Crea un rate limiter con configuración personalizada
 */
function createRateLimiter(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const now = Date.now()
      const tokenKey = `${token}`

      const timestamps = rateLimitMap.get(tokenKey) || []
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < interval
      )

      if (validTimestamps.length >= limit) {
        throw new RateLimitError('Rate limit exceeded')
      }

      validTimestamps.push(now)
      rateLimitMap.set(tokenKey, validTimestamps)

      if (rateLimitMap.size > uniqueTokenPerInterval) {
        const oldestKey = rateLimitMap.keys().next().value
        if (oldestKey) {
          rateLimitMap.delete(oldestKey)
        }
      }
    },
  }
}
