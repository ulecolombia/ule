import crypto from 'crypto'

/**
 * Sistema de encriptación a nivel de campo para Prisma
 * Encripta campos sensibles antes de guardar en DB
 *
 * Cumplimiento:
 * - Ley 1581 de 2012 (Colombia): Protección datos personales
 * - OWASP: A02:2021 - Cryptographic Failures
 */

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
const IV_LENGTH = 16
const ENCRYPTED_PREFIX = 'enc:'

/**
 * Encriptar un campo
 */
export function encryptField(plaintext: string | null): string | null {
  if (!plaintext) return null

  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Formato: enc:iv:authTag:ciphertext
    return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Error encriptando campo:', error)
    throw new Error('Error al encriptar datos sensibles')
  }
}

/**
 * Desencriptar un campo
 */
export function decryptField(ciphertext: string | null): string | null {
  if (!ciphertext) return null

  // Si no está encriptado, retornar como está (migración)
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    return ciphertext
  }

  try {
    // Remover prefijo
    const withoutPrefix = ciphertext.slice(ENCRYPTED_PREFIX.length)
    const parts = withoutPrefix.split(':')

    if (parts.length !== 3) {
      throw new Error('Formato de dato encriptado inválido')
    }

    const ivHex = parts[0]
    const authTagHex = parts[1]
    const encrypted = parts[2]

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Formato de dato encriptado inválido')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    decipher.setAuthTag(authTag)

    const decryptedBuffer = decipher.update(encrypted, 'hex')
    const finalBuffer = decipher.final()
    const decrypted = Buffer.concat([decryptedBuffer, finalBuffer]).toString('utf8')

    return decrypted
  } catch (error) {
    console.error('Error desencriptando campo:', error)
    throw new Error('Error al desencriptar datos sensibles')
  }
}

/**
 * Middleware de Prisma para auto-encriptar/desencriptar
 */
export function createEncryptionMiddleware(sensitiveFields: string[]) {
  return async (params: any, next: any) => {
    // Encriptar antes de CREATE o UPDATE
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data) {
        for (const field of sensitiveFields) {
          if (params.args.data[field] !== undefined && params.args.data[field] !== null) {
            params.args.data[field] = encryptField(params.args.data[field])
          }
        }
      }
    }

    const result = await next(params)

    // Desencriptar después de leer
    if (result && typeof result === 'object') {
      const decrypt = (obj: any) => {
        if (!obj) return obj

        for (const field of sensitiveFields) {
          if (obj[field]) {
            obj[field] = decryptField(obj[field])
          }
        }

        return obj
      }

      if (Array.isArray(result)) {
        result.forEach(decrypt)
      } else {
        decrypt(result)
      }
    }

    return result
  }
}

/**
 * Hash de un solo sentido (para búsquedas)
 * NO reversible, útil para indexar datos sensibles
 */
export function hashField(plaintext: string): string {
  return crypto
    .createHash('sha256')
    .update(plaintext)
    .digest('hex')
}

/**
 * Máscara de datos sensibles para mostrar en UI
 * Ejemplo: "1234567890" -> "****7890"
 */
export function maskField(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) return value

  const masked = '*'.repeat(value.length - visibleChars)
  const visible = value.slice(-visibleChars)

  return masked + visible
}

/**
 * Validar que la clave de encriptación esté configurada
 */
export function validateEncryptionKey(): void {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY no está configurada en variables de entorno')
  }

  const key = process.env.ENCRYPTION_KEY

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)')
  }

  // Verificar que es hexadecimal válido
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY debe contener solo caracteres hexadecimales')
  }
}
