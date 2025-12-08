/**
 * QUERY CACHE SERVICE
 *
 * Cache especializado para queries de base de datos
 * Reduce carga en DB para consultas frecuentes
 */

import { LRUCache } from './memoize'

/**
 * Cache global para queries de usuario
 * Almacena resultados de queries frecuentes por userId
 */
class QueryCacheService {
  private userAportesCache: LRUCache<string, any>
  private userConfigCache: LRUCache<string, any>
  private eventosCache: LRUCache<string, any>

  constructor() {
    // Cache de aportes: 500 usuarios, 5 minutos TTL
    this.userAportesCache = new LRUCache(500, 5 * 60 * 1000)

    // Cache de configuración: 1000 usuarios, 15 minutos TTL
    this.userConfigCache = new LRUCache(1000, 15 * 60 * 1000)

    // Cache de eventos: 500 usuarios, 10 minutos TTL
    this.eventosCache = new LRUCache(500, 10 * 60 * 1000)
  }

  // ============================================
  // APORTES PILA
  // ============================================

  /**
   * Obtiene aportes del usuario desde cache
   */
  getUserAportes(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): any | undefined {
    const key = `${userId}:${page}:${limit}`
    return this.userAportesCache.get(key)
  }

  /**
   * Guarda aportes del usuario en cache
   */
  setUserAportes(userId: string, page: number, limit: number, data: any): void {
    const key = `${userId}:${page}:${limit}`
    this.userAportesCache.set(key, data)
  }

  /**
   * Invalida cache de aportes de un usuario
   */
  invalidateUserAportes(_userId: string): void {
    // Limpiar todas las variaciones de paginación
    // Nota: En una implementación real, podríamos usar un patrón más sofisticado
    this.userAportesCache.clear()
  }

  // ============================================
  // CONFIGURACIÓN PILA
  // ============================================

  /**
   * Obtiene configuración PILA del usuario desde cache
   */
  getUserConfig(userId: string): any | undefined {
    return this.userConfigCache.get(userId)
  }

  /**
   * Guarda configuración PILA del usuario en cache
   */
  setUserConfig(userId: string, config: any): void {
    this.userConfigCache.set(userId, config)
  }

  /**
   * Invalida cache de configuración de un usuario
   */
  invalidateUserConfig(_userId: string): void {
    this.userConfigCache.clear()
  }

  // ============================================
  // EVENTOS DE CALENDARIO
  // ============================================

  /**
   * Obtiene eventos del calendario desde cache
   */
  getUserEventos(userId: string, year?: number): any | undefined {
    const key = year ? `${userId}:${year}` : userId
    return this.eventosCache.get(key)
  }

  /**
   * Guarda eventos del calendario en cache
   */
  setUserEventos(userId: string, eventos: any, year?: number): void {
    const key = year ? `${userId}:${year}` : userId
    this.eventosCache.set(key, eventos)
  }

  /**
   * Invalida cache de eventos de un usuario
   */
  invalidateUserEventos(_userId: string): void {
    this.eventosCache.clear()
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Limpia todos los caches
   */
  clearAll(): void {
    this.userAportesCache.clear()
    this.userConfigCache.clear()
    this.eventosCache.clear()
  }

  /**
   * Limpia entradas expiradas de todos los caches
   */
  cleanup(): void {
    this.userAportesCache.cleanup()
    this.userConfigCache.cleanup()
    this.eventosCache.cleanup()
  }

  /**
   * Obtiene estadísticas de todos los caches
   */
  getStats() {
    return {
      aportes: this.userAportesCache.getStats(),
      config: this.userConfigCache.getStats(),
      eventos: this.eventosCache.getStats(),
    }
  }
}

// Singleton instance
export const queryCache = new QueryCacheService()

// Auto-cleanup cada 5 minutos
if (typeof window === 'undefined') {
  // Solo en servidor
  setInterval(
    () => {
      queryCache.cleanup()
    },
    5 * 60 * 1000
  )
}
