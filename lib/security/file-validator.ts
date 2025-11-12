import crypto from 'crypto'

/**
 * Validador de archivos subidos
 *
 * Protege contra:
 * - Archivos maliciosos
 * - Ataques de file upload
 * - Archivos de tipo incorrecto
 * - Archivos demasiado grandes
 */

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  spreadsheets: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
} as const

// Tamaños máximos (en bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5 MB
  document: 10 * 1024 * 1024, // 10 MB
  spreadsheet: 10 * 1024 * 1024, // 10 MB
} as const

/**
 * Validar tipo de archivo
 */
export function validateFileType(
  file: File,
  category: keyof typeof ALLOWED_MIME_TYPES
): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_MIME_TYPES[category]

  if (!(allowedTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validar tamaño de archivo
 */
export function validateFileSize(
  file: File,
  category: 'image' | 'document' | 'spreadsheet'
): { valid: boolean; error?: string } {
  const maxSize = MAX_FILE_SIZES[category]

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Archivo demasiado grande. Tamaño máximo: ${maxSizeMB} MB`,
    }
  }

  return { valid: true }
}

/**
 * Calcular hash SHA-256 de un archivo (lado cliente)
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Calcular hash SHA-256 de un buffer (lado servidor)
 */
export function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Verificar integridad de archivo con hash
 */
export async function verifyFileIntegrity(
  file: File,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await calculateFileHash(file)
  return actualHash === expectedHash
}

/**
 * Detectar malware básico en nombre de archivo
 */
export function detectMaliciousFilename(filename: string): boolean {
  const maliciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.aspx$/i,
    /\.sh$/i,
    /\.bash$/i,
  ]

  return maliciousPatterns.some((pattern) => pattern.test(filename))
}

/**
 * Validación completa de archivo
 */
export async function validateFile(
  file: File,
  options: {
    category: keyof typeof ALLOWED_MIME_TYPES
    fileType: 'image' | 'document' | 'spreadsheet'
    calculateHash?: boolean
  }
): Promise<{
  valid: boolean
  error?: string
  hash?: string
}> {
  // Validar nombre
  if (detectMaliciousFilename(file.name)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido por seguridad',
    }
  }

  // Validar tipo MIME
  const typeValidation = validateFileType(file, options.category)
  if (!typeValidation.valid) {
    return typeValidation
  }

  // Validar tamaño
  const sizeValidation = validateFileSize(file, options.fileType)
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  // Calcular hash si se solicita
  let hash: string | undefined
  if (options.calculateHash) {
    hash = await calculateFileHash(file)
  }

  return {
    valid: true,
    hash,
  }
}

/**
 * Generar nombre de archivo seguro
 */
export function generateSecureFilename(originalFilename: string): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || ''
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')

  return `${timestamp}-${random}.${ext}`
}
