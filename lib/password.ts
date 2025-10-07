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
