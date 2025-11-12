/**
 * ULE - UTILIDADES DE SEGURIDAD
 * Validadores y sanitizadores para prevenir vulnerabilidades
 * FIX: Path traversal, validación de archivos, validación de IDs
 */

import { join, normalize, sep } from 'path'
import { stat } from 'fs/promises'
import { FILE_CONSTRAINTS } from './format'

// ==============================================
// VALIDACIÓN DE PATHS (PREVENCIÓN PATH TRAVERSAL)
// ==============================================

/**
 * Valida y sanitiza una ruta de archivo para prevenir path traversal
 * FIX CRÍTICO: Previene acceso a archivos fuera de public/
 */
export function validateFilePath(
  relativePath: string,
  baseDir: string = 'public'
): {
  isValid: boolean
  safePath: string | null
  error?: string
} {
  try {
    // Remover cualquier intento de path traversal
    const cleaned = relativePath.replace(/^(\.\.[\/\\])+/, '')

    // Normalizar la ruta
    const normalized = normalize(cleaned)

    // Construir ruta completa
    const fullPath = join(process.cwd(), baseDir, normalized)
    const basePath = join(process.cwd(), baseDir)

    // Verificar que la ruta final está dentro del directorio base
    if (!fullPath.startsWith(basePath + sep) && fullPath !== basePath) {
      return {
        isValid: false,
        safePath: null,
        error: 'Invalid file path: outside allowed directory',
      }
    }

    return {
      isValid: true,
      safePath: fullPath,
    }
  } catch (error) {
    return {
      isValid: false,
      safePath: null,
      error: 'Invalid file path format',
    }
  }
}

// ==============================================
// VALIDACIÓN DE ARCHIVOS
// ==============================================

/**
 * Valida tamaño y tipo de archivo
 * FIX: Previene cargar archivos muy grandes en memoria
 */
export async function validateFile(filePath: string): Promise<{
  isValid: boolean
  error?: string
  size?: number
}> {
  try {
    const stats = await stat(filePath)

    // Verificar que es un archivo (no directorio)
    if (!stats.isFile()) {
      return {
        isValid: false,
        error: 'Path is not a file',
      }
    }

    // Verificar tamaño máximo
    if (stats.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB)`,
        size: stats.size,
      }
    }

    // Verificar extensión
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
    const allowedExts = FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.map((e) => e.toLowerCase())

    if (!allowedExts.includes(ext)) {
      return {
        isValid: false,
        error: `File type not allowed: ${ext}`,
        size: stats.size,
      }
    }

    return {
      isValid: true,
      size: stats.size,
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'File validation failed',
    }
  }
}

// ==============================================
// VALIDACIÓN DE IDs
// ==============================================

/**
 * Valida formato CUID (usado por Prisma)
 * FIX: Previene consultas innecesarias con IDs inválidos
 */
export function isValidCUID(id: string): boolean {
  // CUID format: c + 24 caracteres alfanuméricos en minúscula
  return /^c[a-z0-9]{24}$/.test(id)
}

/**
 * Valida formato UUID v4
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  )
}

// ==============================================
// RATE LIMITING HELPERS
// ==============================================

/**
 * Simple in-memory rate limiter (para desarrollo)
 * En producción usar Redis (Upstash) o similar
 */
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Limpiar entradas antiguas cada minuto
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Verifica si un identificador ha excedido el límite
   */
  check(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const timestamps = this.requests.get(identifier) || []

    // Filtrar requests dentro de la ventana de tiempo
    const recentTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    if (recentTimestamps.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
      }
    }

    // Agregar nuevo request
    recentTimestamps.push(now)
    this.requests.set(identifier, recentTimestamps)

    return {
      allowed: true,
      remaining: this.maxRequests - recentTimestamps.length,
    }
  }

  /**
   * Limpia entradas antiguas
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs
      )
      if (recent.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recent)
      }
    }
  }

  /**
   * Resetea contador para un identificador
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

// Instancia para envío de emails (10 por minuto por usuario)
export const emailRateLimiter = new SimpleRateLimiter(60000, 10)

// ==============================================
// TIMEOUT UTILITIES
// ==============================================

/**
 * Envuelve una promesa con timeout
 * FIX: Previene que operaciones se cuelguen indefinidamente
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

// ==============================================
// SANITIZACIÓN DE INPUT
// ==============================================

/**
 * Sanitiza texto removiendo caracteres potencialmente peligrosos
 * Mantiene caracteres españoles y puntuación básica
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Valida que un string no contenga código inyectable
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /eval\(/i,
    /expression\(/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(input))
}
