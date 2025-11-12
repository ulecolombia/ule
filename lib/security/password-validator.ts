/**
 * VALIDADOR DE CONTRASEÑAS Y POLÍTICAS DE SEGURIDAD
 *
 * Implementa validaciones de contraseñas según estándares OWASP y NIST
 * Protege contra contraseñas débiles y comprometidas
 *
 * Referencias:
 * - OWASP Authentication Cheat Sheet
 * - NIST SP 800-63B Digital Identity Guidelines
 */

import { z } from 'zod'

/**
 * Longitudes y requerimientos de contraseña
 */
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128 // NIST recomienda permitir hasta 128 caracteres
const PASSWORD_RECOMMENDED_LENGTH = 12

/**
 * Lista de contraseñas comunes que deben ser rechazadas
 * En producción, esto debería ser una base de datos de contraseñas comprometidas
 * (ej: HaveIBeenPwned API)
 */
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '123456789',
  '12345678',
  'qwerty',
  'abc123',
  '111111',
  'password1',
  'admin',
  'admin123',
  'root',
  'root123',
  'user',
  'user123',
  'test',
  'test123',
  'pass',
  'pass123',
  '1234567890',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'football',
  'qwerty123',
  'jesus',
  'colombia',
  'colombia123',
  'bogota',
  'medellin',
]

/**
 * Resultado de validación de contraseña
 */
export interface PasswordValidationResult {
  valid: boolean
  score: number // 0-100
  strength: 'muy_debil' | 'debil' | 'media' | 'fuerte' | 'muy_fuerte'
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Schema de validación básica con Zod
 * Para uso en formularios y APIs
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
  })
  .max(PASSWORD_MAX_LENGTH, {
    message: `La contraseña no puede tener más de ${PASSWORD_MAX_LENGTH} caracteres`,
  })

/**
 * Schema para confirmación de contraseña
 */
export const passwordConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * Valida una contraseña con análisis completo de fortaleza
 *
 * @param password - Contraseña a validar
 * @param userInfo - Información del usuario (opcional) para evitar datos personales en contraseña
 * @returns Resultado completo de validación
 *
 * @example
 * ```ts
 * const result = validatePassword('MyStr0ng!Pass', {
 *   email: 'user@example.com',
 *   name: 'John Doe'
 * })
 *
 * if (!result.valid) {
 *   console.error(result.errors)
 * }
 * ```
 */
export function validatePassword(
  password: string,
  userInfo?: {
    email?: string
    name?: string
    numeroDocumento?: string
  }
): PasswordValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 1. Validar longitud mínima (obligatorio)
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
    return {
      valid: false,
      score: 0,
      strength: 'muy_debil',
      errors,
      warnings,
      suggestions: ['Usa una contraseña más larga'],
    }
  }

  // 2. Validar longitud máxima
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`La contraseña no puede tener más de ${PASSWORD_MAX_LENGTH} caracteres`)
    return {
      valid: false,
      score: 0,
      strength: 'muy_debil',
      errors,
      warnings,
      suggestions: [],
    }
  }

  // 3. Calcular score por longitud (0-30 puntos)
  if (password.length >= PASSWORD_RECOMMENDED_LENGTH) {
    score += 30
  } else {
    score += Math.floor((password.length / PASSWORD_RECOMMENDED_LENGTH) * 30)
    suggestions.push(`Usa al menos ${PASSWORD_RECOMMENDED_LENGTH} caracteres para mayor seguridad`)
  }

  // 4. Verificar mayúsculas (0-20 puntos)
  const hasUpperCase = /[A-Z]/.test(password)
  if (hasUpperCase) {
    score += 20
  } else {
    warnings.push('La contraseña no contiene mayúsculas')
    suggestions.push('Incluye al menos una letra mayúscula')
  }

  // 5. Verificar minúsculas (0-20 puntos)
  const hasLowerCase = /[a-z]/.test(password)
  if (hasLowerCase) {
    score += 20
  } else {
    warnings.push('La contraseña no contiene minúsculas')
    suggestions.push('Incluye al menos una letra minúscula')
  }

  // 6. Verificar números (0-15 puntos)
  const hasNumbers = /\d/.test(password)
  if (hasNumbers) {
    score += 15
  } else {
    warnings.push('La contraseña no contiene números')
    suggestions.push('Incluye al menos un número')
  }

  // 7. Verificar caracteres especiales (0-15 puntos)
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  if (hasSpecialChars) {
    score += 15
  } else {
    warnings.push('La contraseña no contiene caracteres especiales')
    suggestions.push('Incluye al menos un carácter especial (!@#$%^&*)')
  }

  // 8. Penalizar patrones comunes
  if (/(.)\1{2,}/.test(password)) {
    // Caracteres repetidos (ej: "aaa", "111")
    score -= 10
    warnings.push('La contraseña contiene caracteres repetidos')
  }

  if (/^[0-9]+$/.test(password)) {
    // Solo números
    score -= 20
    errors.push('La contraseña no puede ser solo números')
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    // Solo letras
    score -= 10
    warnings.push('La contraseña es solo letras, incluye números o símbolos')
  }

  if (/^(abc|123|qwe|zxc)/i.test(password)) {
    // Secuencias del teclado
    score -= 15
    warnings.push('La contraseña contiene secuencias de teclado comunes')
  }

  if (/^(0123|1234|2345|3456|4567|5678|6789)/.test(password)) {
    // Secuencias numéricas
    score -= 15
    warnings.push('La contraseña contiene secuencias numéricas')
  }

  // 9. Verificar contra lista de contraseñas comunes
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Esta contraseña es demasiado común y fácil de adivinar')
    score = 0
  }

  // 10. Verificar que no contenga información personal
  if (userInfo) {
    const lowerPassword = password.toLowerCase()

    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@')[0]
      if (lowerPassword.includes(emailParts)) {
        errors.push('La contraseña no debe contener tu email')
        score -= 20
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(' ')
      for (const part of nameParts) {
        if (part.length >= 3 && lowerPassword.includes(part)) {
          errors.push('La contraseña no debe contener tu nombre')
          score -= 20
          break
        }
      }
    }

    if (userInfo.numeroDocumento) {
      if (lowerPassword.includes(userInfo.numeroDocumento)) {
        errors.push('La contraseña no debe contener tu número de documento')
        score -= 20
      }
    }
  }

  // 11. Calcular fortaleza final
  score = Math.max(0, Math.min(100, score))

  let strength: PasswordValidationResult['strength']
  if (score >= 80) {
    strength = 'muy_fuerte'
  } else if (score >= 60) {
    strength = 'fuerte'
  } else if (score >= 40) {
    strength = 'media'
  } else if (score >= 20) {
    strength = 'debil'
  } else {
    strength = 'muy_debil'
  }

  // 12. Determinar validez
  const valid = errors.length === 0 && score >= 40

  if (!valid && errors.length === 0) {
    errors.push('La contraseña es demasiado débil')
  }

  return {
    valid,
    score,
    strength,
    errors,
    warnings,
    suggestions,
  }
}

/**
 * Valida que una contraseña sea diferente de la anterior
 * (Útil al cambiar contraseña)
 *
 * @param newPassword - Nueva contraseña
 * @param oldPasswordHash - Hash de la contraseña anterior
 * @returns true si son diferentes
 */
export async function isPasswordDifferent(
  newPassword: string,
  oldPasswordHash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs')

  try {
    const isSame = await bcrypt.compare(newPassword, oldPasswordHash)
    return !isSame
  } catch {
    return true // En caso de error, asumir que son diferentes
  }
}

/**
 * Verifica si una contraseña ha sido comprometida en brechas de datos
 * usando el API de Have I Been Pwned (k-Anonymity)
 *
 * @param password - Contraseña a verificar
 * @returns true si la contraseña ha sido comprometida
 *
 * @example
 * ```ts
 * const compromised = await isPasswordCompromised('password123')
 * if (compromised) {
 *   throw new Error('Esta contraseña ha sido comprometida en brechas de datos')
 * }
 * ```
 *
 * Nota: Usa k-anonymity - solo envía los primeros 5 caracteres del hash SHA-1
 */
export async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    const crypto = await import('crypto')

    // 1. Calcular SHA-1 hash de la contraseña
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()

    // 2. Tomar los primeros 5 caracteres (k-anonymity)
    const prefix = hash.substring(0, 5)
    const suffix = hash.substring(5)

    // 3. Consultar API de Have I Been Pwned
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ULE-App',
      },
    })

    if (!response.ok) {
      // Si el API falla, no bloqueamos al usuario (fail open)
      return false
    }

    const text = await response.text()

    // 4. Buscar el sufijo en la respuesta
    const lines = text.split('\n')
    for (const line of lines) {
      const [hashSuffix] = line.split(':')
      if (hashSuffix === suffix) {
        return true // Contraseña comprometida
      }
    }

    return false // Contraseña no encontrada en brechas
  } catch {
    // En caso de error (red, etc), no bloqueamos (fail open)
    return false
  }
}

/**
 * Genera una contraseña segura aleatoria
 *
 * @param length - Longitud de la contraseña (default: 16)
 * @returns Contraseña aleatoria segura
 *
 * @example
 * ```ts
 * const tempPassword = generateSecurePassword(12)
 * // Enviar por email para reset de contraseña
 * ```
 */
export function generateSecurePassword(length: number = 16): string {
  const crypto = require('crypto')

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = uppercase + lowercase + numbers + special

  let password = ''

  // Garantizar al menos un carácter de cada tipo
  password += uppercase[crypto.randomInt(0, uppercase.length)]
  password += lowercase[crypto.randomInt(0, lowercase.length)]
  password += numbers[crypto.randomInt(0, numbers.length)]
  password += special[crypto.randomInt(0, special.length)]

  // Rellenar el resto con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)]
  }

  // Mezclar caracteres para que no siempre sigan el mismo patrón
  return password
    .split('')
    .sort(() => crypto.randomInt(-1, 2))
    .join('')
}

/**
 * Verifica si el usuario debe cambiar su contraseña
 * (Por política de rotación o compromiso detectado)
 *
 * @param passwordChangedAt - Fecha del último cambio de contraseña
 * @param maxDaysWithoutChange - Días máximos sin cambiar (default: 90)
 * @returns true si debe cambiar la contraseña
 */
export function shouldChangePassword(
  passwordChangedAt: Date | null,
  maxDaysWithoutChange: number = 90
): boolean {
  if (!passwordChangedAt) {
    return true // Si nunca ha cambiado la contraseña, debe hacerlo
  }

  const now = new Date()
  const daysSinceChange = Math.floor(
    (now.getTime() - passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceChange > maxDaysWithoutChange
}

/**
 * Genera un mensaje de feedback visual para el usuario
 * basado en el score de la contraseña
 *
 * @param result - Resultado de validación
 * @returns Mensaje y color para UI
 */
export function getPasswordFeedback(result: PasswordValidationResult): {
  message: string
  color: 'red' | 'orange' | 'yellow' | 'green' | 'emerald'
  percentage: number
} {
  const messages: Record<typeof result.strength, string> = {
    muy_debil: 'Muy débil - No usar',
    debil: 'Débil - Mejora tu contraseña',
    media: 'Media - Puedes mejorarla',
    fuerte: 'Fuerte - Buena contraseña',
    muy_fuerte: 'Muy fuerte - Excelente',
  }

  const colors: Record<typeof result.strength, typeof messages> = {
    muy_debil: 'red',
    debil: 'orange',
    media: 'yellow',
    fuerte: 'green',
    muy_fuerte: 'emerald',
  }

  return {
    message: messages[result.strength],
    color: colors[result.strength] as 'red' | 'orange' | 'yellow' | 'green' | 'emerald',
    percentage: result.score,
  }
}
