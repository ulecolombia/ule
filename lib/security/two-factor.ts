/**
 * SISTEMA DE AUTENTICACIÓN DE DOS FACTORES (2FA)
 *
 * Implementa TOTP (Time-based One-Time Password) según RFC 6238
 * Compatible con apps como Google Authenticator, Microsoft Authenticator, Authy
 *
 * Cumplimiento OWASP: A07:2021 - Identification and Authentication Failures
 * Mejora la seguridad de cuentas con factor adicional de autenticación
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { encrypt, decrypt } from './encryption'
import { logger } from '@/lib/logger'

/**
 * Configuración de 2FA
 */
const TOTP_CONFIG = {
  name: 'ULE', // Nombre de la app que aparecerá en el authenticator
  issuer: 'ULE - Sistema de Gestión', // Emisor del token
  window: 2, // Ventana de tiempo para validación (±1 step = ±30 segundos)
  step: 30, // Período de tiempo para cada código (30 segundos)
  digits: 6, // Longitud del código (6 dígitos)
  algorithm: 'sha1', // Algoritmo de hash
} as const

const BACKUP_CODE_LENGTH = 8 // Longitud de cada código de respaldo
const BACKUP_CODE_COUNT = 10 // Cantidad de códigos de respaldo

/**
 * Resultado de generación de 2FA
 */
export interface TwoFactorSetup {
  secret: string // Secret encriptado (para guardar en BD)
  qrCodeUrl: string // URL del QR code para escanear
  manualEntryKey: string // Clave manual (si no puede escanear QR)
  backupCodes: string[] // Códigos de respaldo encriptados
}

/**
 * Genera un nuevo secret de 2FA para un usuario
 *
 * @param userEmail - Email del usuario
 * @returns Setup completo de 2FA (secret, QR, backup codes)
 *
 * @example
 * ```ts
 * const setup = await generateTwoFactorSecret('user@example.com')
 *
 * // Guardar en BD:
 * await prisma.user.update({
 *   where: { email: 'user@example.com' },
 *   data: {
 *     twoFactorSecret: setup.secret,
 *     twoFactorBackupCodes: setup.backupCodes,
 *   }
 * })
 *
 * // Mostrar QR al usuario:
 * <img src={setup.qrCodeUrl} alt="QR Code" />
 * ```
 */
export async function generateTwoFactorSecret(
  userEmail: string
): Promise<TwoFactorSetup> {
  try {
    // 1. Generar secret aleatorio
    const secret = speakeasy.generateSecret({
      name: `${TOTP_CONFIG.name} (${userEmail})`,
      issuer: TOTP_CONFIG.issuer,
      length: 32, // Longitud del secret (base32)
    })

    if (!secret.base32) {
      throw new Error('Error al generar secret de 2FA')
    }

    // 2. Generar QR code
    const otpauthUrl = secret.otpauth_url
    if (!otpauthUrl) {
      throw new Error('Error al generar URL de OTPAuth')
    }

    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

    // 3. Generar códigos de respaldo
    const backupCodes = generateBackupCodes()

    // 4. Encriptar secret y backup codes
    const encryptedSecret = encrypt(secret.base32)
    const encryptedBackupCodes = backupCodes.map((code) => encrypt(code))

    return {
      secret: encryptedSecret,
      qrCodeUrl,
      manualEntryKey: secret.base32, // Sin encriptar para mostrar al usuario una sola vez
      backupCodes: encryptedBackupCodes,
    }
  } catch (error) {
    logger.error('Error al generar secret de 2FA', error as Error, {
      context: 'two-factor.generateTwoFactorSecret',
      userEmail,
    })
    throw new Error('Error al configurar autenticación de dos factores')
  }
}

/**
 * Verifica un código TOTP ingresado por el usuario
 *
 * @param encryptedSecret - Secret encriptado almacenado en BD
 * @param token - Código de 6 dígitos ingresado por el usuario
 * @returns true si el código es válido
 *
 * @example
 * ```ts
 * const user = await prisma.user.findUnique({ where: { id: userId } })
 * const isValid = verifyTwoFactorToken(user.twoFactorSecret, inputToken)
 *
 * if (!isValid) {
 *   throw new Error('Código 2FA inválido')
 * }
 * ```
 */
export function verifyTwoFactorToken(
  encryptedSecret: string,
  token: string
): boolean {
  try {
    // 1. Desencriptar secret
    const secret = decrypt(encryptedSecret)

    // 2. Validar formato del token (6 dígitos)
    if (!/^\d{6}$/.test(token)) {
      return false
    }

    // 3. Verificar token con speakeasy
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: TOTP_CONFIG.window, // Permite ±60 segundos de tolerancia
      step: TOTP_CONFIG.step,
    })

    return verified
  } catch (error) {
    logger.error('Error al verificar token 2FA', error as Error, {
      context: 'two-factor.verifyTwoFactorToken',
    })
    return false
  }
}

/**
 * Verifica un código de respaldo (backup code)
 *
 * @param encryptedBackupCodes - Array de backup codes encriptados de BD
 * @param inputCode - Código ingresado por el usuario
 * @returns Objeto con resultado y lista actualizada de códigos
 *
 * @example
 * ```ts
 * const user = await prisma.user.findUnique({ where: { id: userId } })
 * const result = verifyBackupCode(
 *   user.twoFactorBackupCodes as string[],
 *   inputCode
 * )
 *
 * if (result.valid) {
 *   // Actualizar códigos en BD (remover el usado)
 *   await prisma.user.update({
 *     where: { id: userId },
 *     data: { twoFactorBackupCodes: result.remainingCodes }
 *   })
 * }
 * ```
 */
export function verifyBackupCode(
  encryptedBackupCodes: string[],
  inputCode: string
): {
  valid: boolean
  remainingCodes: string[]
  usedCode?: string
} {
  try {
    // 1. Desencriptar todos los códigos
    const decryptedCodes = encryptedBackupCodes.map((code) => decrypt(code))

    // 2. Buscar el código ingresado
    const codeIndex = decryptedCodes.findIndex(
      (code) => code.toLowerCase() === inputCode.toLowerCase()
    )

    if (codeIndex === -1) {
      return {
        valid: false,
        remainingCodes: encryptedBackupCodes,
      }
    }

    // 3. Remover el código usado
    const remainingEncryptedCodes = encryptedBackupCodes.filter(
      (_, index) => index !== codeIndex
    )

    return {
      valid: true,
      remainingCodes: remainingEncryptedCodes,
      usedCode: decryptedCodes[codeIndex],
    }
  } catch (error) {
    logger.error('Error al verificar backup code', error as Error, {
      context: 'two-factor.verifyBackupCode',
    })
    return {
      valid: false,
      remainingCodes: encryptedBackupCodes,
    }
  }
}

/**
 * Genera códigos de respaldo aleatorios
 *
 * @returns Array de códigos de respaldo (sin encriptar)
 *
 * Formato: XXXX-XXXX (8 caracteres alfanuméricos, separados por guion)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  const crypto = require('crypto')

  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin letras/números confusos (I, O, 0, 1, l)

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    let code = ''

    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      const randomIndex = crypto.randomInt(0, charset.length)
      code += charset[randomIndex]

      // Agregar guion en la mitad
      if (j === 3) {
        code += '-'
      }
    }

    codes.push(code)
  }

  return codes
}

/**
 * Regenera códigos de respaldo (cuando se agotan o se comprometen)
 *
 * @returns Array de nuevos códigos encriptados
 *
 * @example
 * ```ts
 * const newBackupCodes = regenerateBackupCodes()
 *
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: { twoFactorBackupCodes: newBackupCodes }
 * })
 * ```
 */
export function regenerateBackupCodes(): string[] {
  const plainCodes = generateBackupCodes()
  return plainCodes.map((code) => encrypt(code))
}

/**
 * Desencripta códigos de respaldo para mostrarlos al usuario
 * (Solo cuando se generan por primera vez o se regeneran)
 *
 * @param encryptedCodes - Códigos encriptados
 * @returns Códigos en texto plano
 */
export function decryptBackupCodesForDisplay(encryptedCodes: string[]): string[] {
  return encryptedCodes.map((code) => decrypt(code))
}

/**
 * Valida si un usuario tiene 2FA habilitado correctamente
 *
 * @param twoFactorEnabled - Flag de 2FA habilitado
 * @param twoFactorSecret - Secret encriptado (puede ser null)
 * @returns true si 2FA está correctamente configurado
 */
export function isTwoFactorEnabled(
  twoFactorEnabled: boolean,
  twoFactorSecret: string | null
): boolean {
  return twoFactorEnabled && twoFactorSecret !== null && twoFactorSecret !== ''
}

/**
 * Genera un código de recuperación de emergencia
 * (Para casos donde el usuario pierde acceso a su authenticator)
 *
 * @returns Código de recuperación único
 *
 * @example
 * ```ts
 * const recoveryCode = generateRecoveryCode()
 *
 * // Enviar por email seguro al usuario
 * await sendEmail({
 *   to: user.email,
 *   subject: 'Código de recuperación 2FA',
 *   body: `Tu código de recuperación es: ${recoveryCode}`
 * })
 *
 * // Guardar hash del código en BD
 * const hashedCode = hashValue(recoveryCode)
 * await prisma.user.update({
 *   where: { id: userId },
 *   data: { twoFactorRecoveryCode: hashedCode }
 * })
 * ```
 */
export function generateRecoveryCode(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(16).toString('hex').toUpperCase()
}

/**
 * Verifica la integridad del secret de 2FA
 * (Útil para debugging o validación)
 *
 * @param encryptedSecret - Secret encriptado
 * @returns true si el secret es válido
 */
export function validateTwoFactorSecret(encryptedSecret: string): boolean {
  try {
    const secret = decrypt(encryptedSecret)
    // Validar que sea base32 válido (A-Z, 2-7, length múltiplo de 8)
    return /^[A-Z2-7]+=*$/.test(secret) && secret.length >= 16
  } catch {
    return false
  }
}

/**
 * Obtiene el tiempo restante hasta que expire el código actual
 * (Útil para mostrar un temporizador en la UI)
 *
 * @returns Segundos restantes hasta el próximo código
 */
export function getTimeUntilNextCode(): number {
  const now = Math.floor(Date.now() / 1000)
  const step = TOTP_CONFIG.step
  const elapsed = now % step
  return step - elapsed
}

/**
 * Formatea un código de respaldo para display
 *
 * @param code - Código sin formato (ej: "ABCD1234")
 * @returns Código formateado (ej: "ABCD-1234")
 */
export function formatBackupCode(code: string): string {
  // Si ya tiene guion, retornar tal cual
  if (code.includes('-')) {
    return code
  }

  // Agregar guion en la mitad
  const mid = Math.floor(code.length / 2)
  return `${code.slice(0, mid)}-${code.slice(mid)}`
}

/**
 * Estadísticas de uso de 2FA (para analytics)
 */
export interface TwoFactorStats {
  backupCodesRemaining: number
  backupCodesUsed: number
  needsRegenerateBackupCodes: boolean
}

/**
 * Obtiene estadísticas de uso de 2FA de un usuario
 *
 * @param encryptedBackupCodes - Códigos de respaldo encriptados
 * @returns Estadísticas de uso
 */
export function getTwoFactorStats(
  encryptedBackupCodes: string[] | null
): TwoFactorStats {
  if (!encryptedBackupCodes || encryptedBackupCodes.length === 0) {
    return {
      backupCodesRemaining: 0,
      backupCodesUsed: BACKUP_CODE_COUNT,
      needsRegenerateBackupCodes: true,
    }
  }

  const remaining = encryptedBackupCodes.length
  const used = BACKUP_CODE_COUNT - remaining

  return {
    backupCodesRemaining: remaining,
    backupCodesUsed: used,
    needsRegenerateBackupCodes: remaining <= 2, // Sugerir regenerar si quedan 2 o menos
  }
}
