/**
 * RATE LIMITING
 * Simple in-memory rate limiter
 * En producción, usar Redis o Upstash
 */

import { NextRequest } from 'next/server'
import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStore,
} from '@/lib/types/analytics'

// Simple in-memory store
// NOTA: En producción con múltiples instancias, usar Redis
const store = new Map<string, RateLimitStore>()

/**
 * Rate limiter simple basado en IP
 * Retorna success: false si se excede el límite
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = { max: 100, window: 60000 }
): Promise<RateLimitResult> {
  // Identificar cliente por IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const key = `rate-limit:${ip}`
  const now = Date.now()

  let rateLimitData = store.get(key)

  // Si no existe o expiró, crear nuevo
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + config.window,
    }
    store.set(key, rateLimitData)
  }

  // Incrementar contador
  rateLimitData.count++

  // Verificar límite
  const remaining = Math.max(0, config.max - rateLimitData.count)
  const success = rateLimitData.count <= config.max

  return {
    success,
    remaining,
    reset: rateLimitData.resetTime,
  }
}

/**
 * Limpiar store periódicamente para evitar memory leaks
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key)
      }
    }
  }, 60000) // Cada minuto
}
