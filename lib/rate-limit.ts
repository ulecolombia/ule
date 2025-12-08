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
 * Configuraciones de rate limit por tipo de operación
 */
export const RATE_LIMITS = {
  PILA: { max: 10, window: 60000 }, // 10 req/min para PILA
  AUTH: { max: 5, window: 60000 }, // 5 req/min para auth
  API: { max: 100, window: 60000 }, // 100 req/min para API general
  NOTIFICACIONES: { max: 30, window: 60000 }, // 30 req/min para notificaciones
  REGISTER: { max: 3, window: 3600000 }, // 3 registros/hora por IP
}

/**
 * Extrae la IP del cliente desde los headers de la request
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limiter simple basado en IP
 * Retorna success: false si se excede el límite
 */
export async function rateLimit(
  reqOrKey: NextRequest | string,
  config: RateLimitConfig = { max: 100, window: 60000 }
): Promise<RateLimitResult> {
  // Determinar la key según el tipo de parámetro
  let key: string

  if (typeof reqOrKey === 'string') {
    // Si es un string, usarlo directamente como key
    key = reqOrKey
  } else {
    // Si es NextRequest, extraer IP
    const ip =
      reqOrKey.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      reqOrKey.headers.get('x-real-ip') ||
      'unknown'
    key = `rate-limit:${ip}`
  }

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
    const entries = Array.from(store.entries())
    for (const [key, value] of entries) {
      if (now > value.resetTime) {
        store.delete(key)
      }
    }
  }, 60000) // Cada minuto
}
