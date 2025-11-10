/**
 * ULE - UTILIDADES DE CONTRASEÑAS
 * Funciones para hasheo y validación de contraseñas
 */

import bcrypt from 'bcryptjs'

/**
 * Número de salt rounds para bcrypt
 * Mayor número = más seguro pero más lento
 */
const SALT_ROUNDS = 12

/**
 * Hashea una contraseña usando bcrypt
 *
 * @param password - Contraseña en texto plano
 * @returns Promise con hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compara una contraseña con su hash
 *
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado en BD
 * @returns Promise<boolean> - true si coinciden
 */
export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Valida fuerza de contraseña
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 *
 * @param password - Contraseña a validar
 * @returns objeto con validez y mensaje
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  message: string
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una mayúscula',
    }
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una minúscula',
    }
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos un número',
    }
  }

  return { isValid: true, message: 'Contraseña válida' }
}

/**
 * Requisitos de contraseña
 */
export function getPasswordRequirements() {
  return [
    { text: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
    { text: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
    { text: 'Una letra minúscula', test: (p: string) => /[a-z]/.test(p) },
    { text: 'Un número', test: (p: string) => /[0-9]/.test(p) },
  ]
}

/**
 * Calcula fortaleza de contraseña (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0

  let strength = 0

  // Longitud
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 10
  if (password.length >= 16) strength += 10

  // Complejidad
  if (/[a-z]/.test(password)) strength += 15
  if (/[A-Z]/.test(password)) strength += 15
  if (/[0-9]/.test(password)) strength += 15
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10

  return Math.min(strength, 100)
}

/**
 * Nivel de fortaleza basado en porcentaje
 */
export function getPasswordStrengthLevel(strength: number): string {
  if (strength < 40) return 'Débil'
  if (strength < 70) return 'Media'
  return 'Fuerte'
}

/**
 * Color para indicador de fortaleza
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength < 40) return 'red'
  if (strength < 70) return 'yellow'
  return 'green'
}

/**
 * Verifica si una contraseña es común/débil
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '12345678', 'qwerty', '123456789', 'password1',
    'abc123', 'Password1', '12345', '1234567890', 'senha123'
  ]
  return commonPasswords.includes(password.toLowerCase())
}

/**
 * Verifica si la contraseña es similar a la info del usuario
 */
export function isSimilarToUserInfo(password: string, userInfo: { name?: string; email?: string }): boolean {
  const lowerPassword = password.toLowerCase()
  if (userInfo.name && lowerPassword.includes(userInfo.name.toLowerCase())) return true
  if (userInfo.email) {
    const emailParts = userInfo.email.split('@')
    if (emailParts[0]) {
      const emailUser = emailParts[0].toLowerCase()
      if (lowerPassword.includes(emailUser)) return true
    }
  }
  return false
}
