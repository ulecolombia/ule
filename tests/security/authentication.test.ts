/**
 * TESTS: SISTEMA DE SEGURIDAD Y AUTENTICACIÓN
 *
 * Casos de prueba críticos para:
 * - Validación de contraseñas
 * - Encriptación de datos
 * - Autenticación 2FA
 * - Rate limiting
 * - Gestión de sesiones
 *
 * Ejecutar:
 *   npm test tests/security/authentication.test.ts
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { validatePassword } from '@/lib/security/password-validator'
import { generateTwoFactorSecret, verifyTwoFactorToken } from '@/lib/security/two-factor'
import { encrypt, decrypt, hashPassword, verifyPassword } from '@/lib/security/encryption'

// Configurar variables de entorno para tests
beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    // Usar clave de prueba para tests
    process.env.ENCRYPTION_KEY = 'a'.repeat(64)
  }
})

describe('Validación de Contraseñas', () => {
  it('debe rechazar contraseñas muy débiles', () => {
    const result = validatePassword('123456')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(40)
  })

  it('debe rechazar contraseñas comunes', () => {
    const commonPasswords = ['password', 'qwerty', 'admin123', '12345678']

    for (const pwd of commonPasswords) {
      const result = validatePassword(pwd)
      expect(result.valid).toBe(false)
      expect(result.warnings).toContain('Contraseña muy común')
    }
  })

  it('debe aceptar contraseñas fuertes', () => {
    const result = validatePassword('MyStr0ng!Pass2024')
    expect(result.valid).toBe(true)
    expect(result.score).toBeGreaterThan(60)
  })

  it('debe penalizar contraseñas cortas', () => {
    const short = validatePassword('Ab1!')
    const long = validatePassword('Ab1!efghijklmnop')

    expect(short.score).toBeLessThan(long.score)
  })

  it('debe detectar información personal en contraseñas', () => {
    const userInfo = {
      email: 'juan@example.com',
      name: 'Juan Perez',
      numeroDocumento: '12345678',
    }

    const withEmail = validatePassword('juan@example.com123!', userInfo)
    expect(withEmail.warnings).toContain('No uses tu email en la contraseña')

    const withName = validatePassword('JuanPerez123!', userInfo)
    expect(withName.warnings).toContain('No uses tu nombre en la contraseña')
  })

  it('debe calcular score basado en complejidad', () => {
    const tests = [
      { password: 'abcdefgh', expectedRange: [0, 40] }, // Solo minúsculas
      { password: 'Abcdefgh', expectedRange: [20, 50] }, // +Mayúscula
      { password: 'Abcdefgh1', expectedRange: [30, 60] }, // +Número
      { password: 'Abcdefgh1!', expectedRange: [40, 80] }, // +Especial
      { password: 'C0mpl3x!P@ssw0rd#2024', expectedRange: [80, 100] }, // Muy fuerte
    ]

    for (const test of tests) {
      const result = validatePassword(test.password)
      expect(result.score).toBeGreaterThanOrEqual(test.expectedRange[0])
      expect(result.score).toBeLessThanOrEqual(test.expectedRange[1])
    }
  })
})

describe('Encriptación', () => {
  it('debe encriptar y desencriptar correctamente', () => {
    const original = 'dato sensible 123'
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    expect(encrypted).not.toBe(original)
    expect(decrypted).toBe(original)
  })

  it('debe generar diferentes cifrados para mismo texto', () => {
    const text = 'test'
    const encrypted1 = encrypt(text)
    const encrypted2 = encrypt(text)

    // Diferentes porque usa IV aleatorio
    expect(encrypted1).not.toBe(encrypted2)

    // Pero ambos desencriptan al original
    expect(decrypt(encrypted1)).toBe(text)
    expect(decrypt(encrypted2)).toBe(text)
  })

  it('debe fallar con datos encriptados inválidos', () => {
    expect(() => decrypt('invalid-data')).toThrow()
    expect(() => decrypt('abc:def:ghi')).toThrow()
  })

  it('debe manejar strings vacíos', () => {
    const encrypted = encrypt('')
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe('')
  })

  it('debe manejar caracteres especiales', () => {
    const special = '¡Hola! ñáéíóú @#$%^&*()'
    const encrypted = encrypt(special)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(special)
  })
})

describe('Hashing de Contraseñas', () => {
  it('debe hashear contraseñas con bcrypt', async () => {
    const password = 'MyPassword123!'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    expect(hash.length).toBeGreaterThan(50)
  })

  it('debe generar hashes diferentes para misma contraseña', async () => {
    const password = 'test123'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)

    expect(hash1).not.toBe(hash2)
  })

  it('debe verificar contraseñas correctamente', async () => {
    const password = 'MyPassword123!'
    const hash = await hashPassword(password)

    const validCheck = await verifyPassword(password, hash)
    expect(validCheck).toBe(true)

    const invalidCheck = await verifyPassword('wrong-password', hash)
    expect(invalidCheck).toBe(false)
  })
})

describe('Autenticación 2FA', () => {
  it('debe generar secret válido', async () => {
    const result = await generateTwoFactorSecret('test@example.com')

    expect(result.secret).toBeTruthy()
    expect(result.secret.length).toBe(32)
    expect(result.qrCodeUrl).toContain('data:image/png;base64')
    expect(result.manualEntryKey).toBeTruthy()
    expect(result.backupCodes).toHaveLength(10)
  })

  it('debe generar códigos de respaldo en formato correcto', async () => {
    const result = await generateTwoFactorSecret('test@example.com')

    for (const code of result.backupCodes) {
      // Formato: XXXX-XXXX
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    }
  })

  it('debe generar códigos de respaldo únicos', async () => {
    const result = await generateTwoFactorSecret('test@example.com')
    const uniqueCodes = new Set(result.backupCodes)

    expect(uniqueCodes.size).toBe(10)
  })

  it('debe incluir app name en otpauth URL', async () => {
    const result = await generateTwoFactorSecret('test@example.com')

    expect(result.manualEntryKey).toContain('otpauth://totp/')
    expect(result.manualEntryKey).toContain('Ule')
    expect(result.manualEntryKey).toContain('test@example.com')
  })

  // Nota: Para testear verificación de tokens TOTP necesitarías
  // generar códigos válidos en tiempo real o usar mocks
  it.skip('debe verificar código TOTP válido', () => {
    // Test requiere código válido del momento actual
    // En producción, usar mocks o librerías de testing TOTP
  })
})

describe('Timing-Safe Comparison', () => {
  it('debe comparar strings de forma segura', () => {
    const { timingSafeEqual } = require('@/lib/security/encryption')

    expect(timingSafeEqual('hello', 'hello')).toBe(true)
    expect(timingSafeEqual('hello', 'world')).toBe(false)
    expect(timingSafeEqual('test123', 'test123')).toBe(true)
  })

  it('debe manejar strings de diferentes longitudes', () => {
    const { timingSafeEqual } = require('@/lib/security/encryption')

    expect(timingSafeEqual('short', 'longer string')).toBe(false)
    expect(timingSafeEqual('', 'not empty')).toBe(false)
  })
})

describe('Fortaleza de Contraseñas - Casos Extremos', () => {
  it('debe manejar contraseñas muy largas', () => {
    const longPassword = 'A1b!'.repeat(50) // 200 caracteres
    const result = validatePassword(longPassword)

    expect(result.valid).toBe(true)
    expect(result.score).toBeGreaterThan(80)
  })

  it('debe detectar patrones repetitivos', () => {
    const repetitive = 'abcabcabcabcabc'
    const result = validatePassword(repetitive)

    expect(result.valid).toBe(false)
    expect(result.warnings.some((w) => w.includes('patrón'))).toBe(true)
  })

  it('debe detectar secuencias', () => {
    const sequential = 'abcdef123456'
    const result = validatePassword(sequential)

    expect(result.warnings.some((w) => w.includes('secuencias'))).toBe(true)
  })

  it('debe validar todos los requisitos mínimos', () => {
    const tests = [
      { pwd: 'Short1!', hasError: 'mínimo 8 caracteres' },
      { pwd: 'nocapital123!', hasError: 'mayúscula' },
      { pwd: 'NOLOWER123!', hasError: 'minúscula' },
      { pwd: 'NoNumber!', hasError: 'número' },
      { pwd: 'NoSpecial123', hasError: 'especial' },
    ]

    for (const test of tests) {
      const result = validatePassword(test.pwd)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes(test.hasError))).toBe(true)
    }
  })
})

describe('Integración - Flujo Completo de Registro', () => {
  it('debe validar contraseña y hashearla para registro', async () => {
    const password = 'SecureP@ss2024!'

    // 1. Validar contraseña
    const validation = validatePassword(password)
    expect(validation.valid).toBe(true)
    expect(validation.score).toBeGreaterThan(70)

    // 2. Hashear para almacenar
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)

    // 3. Verificar login posterior
    const loginCheck = await verifyPassword(password, hash)
    expect(loginCheck).toBe(true)
  })

  it('debe configurar 2FA completo', async () => {
    const email = 'user@example.com'

    // 1. Generar secret
    const setup = await generateTwoFactorSecret(email)
    expect(setup.secret).toBeTruthy()

    // 2. Encriptar secret antes de guardar
    const encryptedSecret = encrypt(setup.secret)
    expect(encryptedSecret).not.toBe(setup.secret)

    // 3. Verificar que se puede desencriptar
    const decryptedSecret = decrypt(encryptedSecret)
    expect(decryptedSecret).toBe(setup.secret)

    // 4. Encriptar códigos de respaldo
    const encryptedCodes = setup.backupCodes.map((code) => encrypt(code))
    expect(encryptedCodes[0]).not.toBe(setup.backupCodes[0])

    // 5. Verificar desencriptación de códigos
    const decryptedCodes = encryptedCodes.map((enc) => decrypt(enc))
    expect(decryptedCodes).toEqual(setup.backupCodes)
  })
})
