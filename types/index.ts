/**
 * ULE - DEFINICIONES DE TIPOS
 * Tipos TypeScript globales para la aplicación
 */

export type { }

// Tipo para estados de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Tipo para respuestas de API
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Tipo para paginación
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  totalPages: number
}
