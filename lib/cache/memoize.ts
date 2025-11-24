/**
 * SERVICIO DE MEMOIZACIÓN Y CACHE
 *
 * Implementa cache LRU (Least Recently Used) para optimizar
 * cálculos repetidos y mejorar performance
 */

/**
 * Estructura de entrada del cache LRU
 */
interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
}

/**
 * Cache LRU (Least Recently Used) genérico
 */
export class LRUCache<K, V> {
  private cache: Map<string, CacheEntry<V>>
  private maxSize: number
  private ttl: number // Time to live en milisegundos

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    // Default: 100 entradas, 5 minutos TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * Genera clave de cache a partir de argumentos
   */
  private generateKey(key: K): string {
    if (typeof key === 'object') {
      return JSON.stringify(key)
    }
    return String(key)
  }

  /**
   * Verifica si una entrada ha expirado
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() - entry.timestamp > this.ttl
  }

  /**
   * Obtiene valor del cache
   */
  get(key: K): V | undefined {
    const cacheKey = this.generateKey(key)
    const entry = this.cache.get(cacheKey)

    if (!entry) {
      return undefined
    }

    // Verificar expiración
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey)
      return undefined
    }

    // Actualizar hits y timestamp (LRU)
    entry.hits++
    entry.timestamp = Date.now()

    return entry.value
  }

  /**
   * Almacena valor en cache
   */
  set(key: K, value: V): void {
    const cacheKey = this.generateKey(key)

    // Si el cache está lleno, eliminar la entrada menos usada
    if (this.cache.size >= this.maxSize && !this.cache.has(cacheKey)) {
      this.evictLRU()
    }

    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  /**
   * Elimina la entrada menos recientemente usada
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity
    let lowestHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Priorizar por hits, luego por timestamp
      if (
        entry.hits < lowestHits ||
        (entry.hits === lowestHits && entry.timestamp < oldestTimestamp)
      ) {
        oldestKey = key
        oldestTimestamp = entry.timestamp
        lowestHits = entry.hits
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Limpia el cache completamente
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    let totalHits = 0
    let expiredCount = 0

    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      if (this.isExpired(entry)) {
        expiredCount++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      expiredCount,
      hitRate: totalHits > 0 ? totalHits / this.cache.size : 0,
    }
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * Decorador de memoización para funciones
 */
export function memoize<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  options: {
    maxSize?: number
    ttl?: number
    keyGenerator?: (...args: Args) => string
  } = {}
): (...args: Args) => Result {
  const cache = new LRUCache<string, Result>(
    options.maxSize || 100,
    options.ttl || 5 * 60 * 1000
  )

  const keyGenerator =
    options.keyGenerator || ((...args: Args) => JSON.stringify(args))

  return function memoized(...args: Args): Result {
    const key = keyGenerator(...args)
    const cached = cache.get(key)

    if (cached !== undefined) {
      return cached
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}

/**
 * Decorador de memoización async para funciones asíncronas
 */
export function memoizeAsync<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    maxSize?: number
    ttl?: number
    keyGenerator?: (...args: Args) => string
  } = {}
): (...args: Args) => Promise<Result> {
  const cache = new LRUCache<string, Result>(
    options.maxSize || 100,
    options.ttl || 5 * 60 * 1000
  )

  const keyGenerator =
    options.keyGenerator || ((...args: Args) => JSON.stringify(args))

  return async function memoized(...args: Args): Promise<Result> {
    const key = keyGenerator(...args)
    const cached = cache.get(key)

    if (cached !== undefined) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result)
    return result
  }
}
