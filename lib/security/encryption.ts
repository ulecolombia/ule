/**
 * SISTEMA DE ENCRIPTACIÓN DE DATOS SENSIBLES
 *
 * Implementa encriptación AES-256-GCM para proteger datos sensibles en BD
 * Cumplimiento: Ley 1581 de 2012 (Colombia) - Protección de Datos Personales
 *
 * IMPORTANTE: La clave de encriptación debe estar en variable de entorno
 * ENCRYPTION_KEY (32 bytes en formato hex)
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'

// Algoritmo de encriptación: AES-256-GCM (AEAD)
const ALGORITHM = 'aes-256-gcm' as const
const IV_LENGTH = 16 // bytes para el initialization vector
const AUTH_TAG_LENGTH = 16 // bytes para el authentication tag
const SALT_LENGTH = 32 // bytes para el salt

/**
 * Obtiene la clave de encriptación desde variables de entorno
 * @throws Error si la clave no está configurada o es inválida
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY no está configurada. Genera una con: openssl rand -hex 32'
    )
  }

  // Validar formato
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)'
    )
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encripta datos sensibles usando AES-256-GCM
 *
 * @param plaintext - Texto a encriptar
 * @returns String en formato: iv:authTag:encrypted (todo en hex)
 *
 * @example
 * ```ts
 * const secret = "JBSWY3DPEHPK3PXP" // 2FA secret
 * const encrypted = encrypt(secret)
 * // Guarda 'encrypted' en la base de datos
 * ```
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey()

    // Generar IV aleatorio (nonce)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encriptar
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Obtener authentication tag (GCM mode)
    const authTag = cipher.getAuthTag()

    // Formato: iv:authTag:encrypted (todo en hex, separado por :)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    logger.error('Error al encriptar datos', error as Error, {
      context: 'encryption.encrypt',
    })
    throw new Error('Error al encriptar datos sensibles')
  }
}

/**
 * Desencripta datos previamente encriptados con encrypt()
 *
 * @param encryptedData - String en formato iv:authTag:encrypted
 * @returns Texto plano desencriptado
 *
 * @example
 * ```ts
 * const encrypted = user.twoFactorSecret // de la BD
 * const secret = decrypt(encrypted)
 * // Usa 'secret' para validar el token 2FA
 * ```
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()

    // Separar componentes
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Formato de datos encriptados inválido')
    }

    const [ivHex, authTagHex, encrypted] = parts

    // Convertir de hex a Buffer
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Validar longitudes
    if (iv.length !== IV_LENGTH) {
      throw new Error('IV inválido')
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Auth tag inválido')
    }

    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Desencriptar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    logger.error('Error al desencriptar datos', error as Error, {
      context: 'encryption.decrypt',
    })
    throw new Error('Error al desencriptar datos sensibles')
  }
}

/**
 * Encripta un array de backup codes para 2FA
 *
 * @param codes - Array de códigos de respaldo (strings)
 * @returns Array de códigos encriptados
 *
 * @example
 * ```ts
 * const backupCodes = generateBackupCodes() // ["12345678", "87654321", ...]
 * const encrypted = encryptBackupCodes(backupCodes)
 * // Guarda en BD: user.twoFactorBackupCodes = encrypted
 * ```
 */
export function encryptBackupCodes(codes: string[]): string[] {
  return codes.map((code) => encrypt(code))
}

/**
 * Desencripta un array de backup codes de 2FA
 *
 * @param encryptedCodes - Array de códigos encriptados
 * @returns Array de códigos de respaldo en texto plano
 *
 * @example
 * ```ts
 * const encrypted = user.twoFactorBackupCodes // de la BD (JSON array)
 * const codes = decryptBackupCodes(encrypted as string[])
 * // Verifica si el código ingresado está en 'codes'
 * ```
 */
export function decryptBackupCodes(encryptedCodes: string[]): string[] {
  return encryptedCodes.map((code) => decrypt(code))
}

/**
 * Hash de contraseña usando bcrypt (para almacenamiento)
 *
 * Nota: Bcrypt ya incluye salt automáticamente y es resistente a timing attacks
 *
 * @param password - Contraseña en texto plano
 * @returns Hash bcrypt (60 caracteres)
 *
 * @example
 * ```ts
 * const passwordHash = await hashPassword(user.password)
 * // Guarda en BD: user.passwordHash = passwordHash
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  const SALT_ROUNDS = 12 // Factor de costo (más alto = más seguro pero más lento)

  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    logger.error('Error al hashear contraseña', error as Error, {
      context: 'encryption.hashPassword',
    })
    throw new Error('Error al procesar contraseña')
  }
}

/**
 * Verifica una contraseña contra su hash bcrypt
 *
 * @param password - Contraseña en texto plano a verificar
 * @param hash - Hash bcrypt almacenado en BD
 * @returns true si la contraseña coincide
 *
 * @example
 * ```ts
 * const isValid = await verifyPassword(inputPassword, user.passwordHash)
 * if (!isValid) {
 *   throw new Error('Contraseña incorrecta')
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs')

  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    logger.error('Error al verificar contraseña', error as Error, {
      context: 'encryption.verifyPassword',
    })
    return false // Fallo seguro: retorna false en caso de error
  }
}

/**
 * Genera un token seguro aleatorio (para reset de contraseña, etc.)
 *
 * @param length - Longitud del token en bytes (default: 32)
 * @returns Token aleatorio en formato hex
 *
 * @example
 * ```ts
 * const resetToken = generateSecureToken()
 * // Guarda en BD: user.passwordResetToken = resetToken
 * // Envía al usuario: https://app.com/reset?token={resetToken}
 * ```
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Genera un hash de un valor (para comparaciones seguras)
 * Usa SHA-256
 *
 * @param value - Valor a hashear
 * @returns Hash en formato hex
 *
 * @example
 * ```ts
 * const tokenHash = hashValue(token)
 * // Guarda el hash en BD en lugar del token real
 * ```
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Compara dos strings de forma segura (resistente a timing attacks)
 *
 * @param a - Primer string
 * @param b - Segundo string
 * @returns true si son iguales
 *
 * @example
 * ```ts
 * if (timingSafeEqual(inputToken, storedToken)) {
 *   // Token válido
 * }
 * ```
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')

    // Si las longitudes son diferentes, crypto.timingSafeEqual lanza error
    if (bufA.length !== bufB.length) {
      return false
    }

    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Valida el formato de la clave de encriptación
 * (Útil para validación en startup)
 *
 * @returns true si la clave está bien configurada
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}
