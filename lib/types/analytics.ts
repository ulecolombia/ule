/**
 * TIPOS PARA ANALYTICS Y AYUDA
 * Interfaces TypeScript para sistema de analytics
 */

// ==========================================
// BÚSQUEDA DE AYUDA
// ==========================================

export interface ArticuloAyuda {
  titulo: string
  descripcion: string
  url: string
  categoria: string
  keywords?: string[]
}

export interface ResultadoBusqueda extends ArticuloAyuda {
  // Puede extenderse con score, etc.
}

export interface RespuestaBusqueda {
  resultados: ResultadoBusqueda[]
  total?: number
  mensaje?: string
}

// ==========================================
// ANALYTICS - EVENTOS
// ==========================================

export type CategoriaEvento =
  | 'ONBOARDING'
  | 'PILA'
  | 'FACTURACION'
  | 'ASESORIA'
  | 'EXPORTACION'
  | 'NAVEGACION'
  | 'SISTEMA'
  | 'CALCULADORAS'

// Whitelist de keys permitidas en metadata
export type MetadataAllowedKey =
  | 'page'
  | 'pathname'
  | 'monto'
  | 'cantidad'
  | 'entidad'
  | 'tipo'
  | 'categoria'
  | 'duracion'
  | 'resultado'
  | 'formato'
  | 'periodo'
  | 'nivel'
  | 'calculadora'
  | 'tourKey'
  | 'accion'
  | 'origen'
  | 'destino'

export type SafeMetadata = Partial<
  Record<MetadataAllowedKey, string | number | boolean>
>

export interface EventoAnalytics {
  userId?: string
  evento: string
  categoria: CategoriaEvento
  metadata?: SafeMetadata
  sessionId?: string
  userAgent?: string
  ip?: string
}

export interface ErrorAnalytics {
  userId?: string
  mensaje: string
  stack?: string
  tipo?: string
  severidad?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  url?: string
  componente?: string
  accion?: string
  sessionId?: string
  metadata?: SafeMetadata
  userAgent?: string
  dispositivo?: 'mobile' | 'tablet' | 'desktop'
  navegador?: string
}

// ==========================================
// ANALYTICS - MÉTRICAS
// ==========================================

export interface MetricasDiarias {
  fecha: Date
  usuariosActivos: number
  nuevosUsuarios: number
  registrosCompletados: number
  onboardingCompletado: number
  pilaLiquidaciones: number
  facturasEmitidas: number
  consultasIA: number
  exportacionesRealizadas: number
  erroresReportados: number
  ticketsAyuda: number
}

export interface Estadisticas {
  usuariosActivos: number
  nuevosUsuarios: number
  registrosCompletados: number
  onboardingCompletado: number
  pilaLiquidaciones: number
  facturasEmitidas: number
  consultasIA: number
  exportacionesRealizadas: number
  erroresReportados: number
  ticketsAyuda: number
  navegadorPopular: string
  dispositivoPopular: string
  retencion7Dias: number
}

export interface MetricasRespuesta {
  estadisticas: Estadisticas
  metricasDiarias: MetricasDiarias[]
  fechaInicio: string
  fechaFin: string
}

// ==========================================
// RATE LIMITING
// ==========================================

export interface RateLimitConfig {
  max: number // Máximo de requests
  window: number // Ventana de tiempo en ms
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export interface RateLimitStore {
  count: number
  resetTime: number
}
