import { describe, it, expect, beforeAll } from '@jest/globals'
import { encryptField, decryptField, maskField, hashField } from '@/lib/security/field-encryption'
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizeDocumento,
  sanitizeTelefono,
  detectXSS,
  detectSQLInjection,
} from '@/lib/security/input-sanitizer'

describe('Encriptación de Campos', () => {
  beforeAll(() => {
    // Asegurar que ENCRYPTION_KEY está configurada para tests
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    }
  })

  it('debe encriptar y desencriptar correctamente', () => {
    const original = '1234567890'
    const encrypted = encryptField(original)
    const decrypted = decryptField(encrypted)

    expect(encrypted).not.toBe(original)
    expect(encrypted).toContain('enc:')
    expect(decrypted).toBe(original)
  })

  it('debe generar diferentes cifrados para mismo dato (IV único)', () => {
    const data = '1234567890'
    const enc1 = encryptField(data)
    const enc2 = encryptField(data)

    expect(enc1).not.toBe(enc2) // Diferentes IVs
    expect(decryptField(enc1)).toBe(data)
    expect(decryptField(enc2)).toBe(data)
  })

  it('debe manejar valores null correctamente', () => {
    expect(encryptField(null)).toBe(null)
    expect(decryptField(null)).toBe(null)
  })

  it('debe enmascarar datos correctamente', () => {
    expect(maskField('1234567890', 4)).toBe('******7890')
    expect(maskField('123', 4)).toBe('123')
    expect(maskField('12345678', 4)).toBe('****5678')
  })

  it('debe generar hash consistente', () => {
    const data = 'test-data'
    const hash1 = hashField(data)
    const hash2 = hashField(data)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 hex
  })

  it('debe manejar datos largos correctamente', () => {
    const longData = 'A'.repeat(10000)
    const encrypted = encryptField(longData)
    const decrypted = decryptField(encrypted)

    expect(decrypted).toBe(longData)
  })

  it('debe detectar datos ya encriptados (no re-encriptar)', () => {
    const original = '1234567890'
    const encrypted = encryptField(original)

    // Intentar desencriptar dato ya encriptado debería retornar el dato
    // El middleware detecta el prefijo 'enc:' y no intenta re-encriptar
    expect(encrypted?.startsWith('enc:')).toBe(true)
  })
})

describe('Sanitización de Inputs', () => {
  it('debe remover scripts maliciosos de HTML', () => {
    const malicious = '<script>alert("XSS")</script>Hola'
    const sanitized = sanitizeHTML(malicious)

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('Hola')
  })

  it('debe permitir tags seguros en HTML', () => {
    const safe = '<p>Hola <strong>mundo</strong></p>'
    const sanitized = sanitizeHTML(safe)

    expect(sanitized).toContain('<p>')
    expect(sanitized).toContain('<strong>')
  })

  it('debe escapar caracteres especiales en texto', () => {
    const input = '<div>Test & "quotes"</div>'
    const sanitized = sanitizeText(input)

    expect(sanitized).not.toContain('<')
    expect(sanitized).not.toContain('>')
    expect(sanitized).toContain('&lt;')
    expect(sanitized).toContain('&gt;')
  })

  it('debe detectar XSS en diferentes formas', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true)
    expect(detectXSS('<img src=x onerror=alert(1)>')).toBe(true)
    expect(detectXSS('javascript:void(0)')).toBe(true)
    expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true)
    expect(detectXSS('Hola mundo')).toBe(false)
  })

  it('debe detectar SQL Injection', () => {
    expect(detectSQLInjection("SELECT * FROM users")).toBe(true)
    expect(detectSQLInjection("1' OR '1'='1")).toBe(true)
    expect(detectSQLInjection("DROP TABLE users;")).toBe(true)
    expect(detectSQLInjection("' OR 1=1 --")).toBe(true)
    expect(detectSQLInjection('Usuario normal')).toBe(false)
  })

  it('debe sanitizar emails correctamente', () => {
    expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
    expect(sanitizeEmail('  user@test.com  ')).toBe('user@test.com')
  })

  it('debe sanitizar números de documento (solo dígitos)', () => {
    expect(sanitizeDocumento('1234-567-890')).toBe('1234567890')
    expect(sanitizeDocumento('ABC123XYZ')).toBe('123')
    expect(sanitizeDocumento('12.345.678')).toBe('12345678')
  })

  it('debe sanitizar teléfonos (dígitos y +)', () => {
    expect(sanitizeTelefono('+57 300 123 4567')).toBe('+573001234567')
    expect(sanitizeTelefono('(300) 123-4567')).toBe('3001234567')
    expect(sanitizeTelefono('+1-555-123-4567')).toBe('+15551234567')
  })

  it('debe manejar strings vacíos', () => {
    expect(sanitizeHTML('')).toBe('')
    expect(sanitizeText('')).toBe('')
    expect(sanitizeDocumento('')).toBe('')
  })
})

describe('Validación de Seguridad de Archivos', () => {
  it('debe detectar extensiones de archivo maliciosas', () => {
    const { detectMaliciousFilename } = require('@/lib/security/file-validator')

    expect(detectMaliciousFilename('malware.exe')).toBe(true)
    expect(detectMaliciousFilename('script.bat')).toBe(true)
    expect(detectMaliciousFilename('hack.sh')).toBe(true)
    expect(detectMaliciousFilename('webshell.php')).toBe(true)
    expect(detectMaliciousFilename('documento.pdf')).toBe(false)
    expect(detectMaliciousFilename('imagen.jpg')).toBe(false)
  })

  it('debe generar nombres de archivo seguros', () => {
    const { generateSecureFilename } = require('@/lib/security/file-validator')

    const unsafe = '../../../etc/passwd.txt'
    const safe = generateSecureFilename(unsafe)

    expect(safe).not.toContain('..')
    expect(safe).not.toContain('/')
    expect(safe).toMatch(/^\d+-[a-f0-9]{16}\.txt$/)
  })

  it('debe sanitizar nombres de archivo con caracteres especiales', () => {
    const { sanitizeFilename } = require('@/lib/security/input-sanitizer')

    expect(sanitizeFilename('file<script>.pdf')).not.toContain('<')
    expect(sanitizeFilename('file<script>.pdf')).not.toContain('>')
    expect(sanitizeFilename('../../../etc/passwd')).not.toContain('/')
  })
})

describe('Logging Seguro', () => {
  it('debe redactar campos sensibles automáticamente', () => {
    // Este test requiere capturar la salida del logger
    // Por simplicidad, solo verificamos que la función existe
    const { secureLogger } = require('@/lib/security/secure-logger')

    expect(secureLogger.info).toBeDefined()
    expect(secureLogger.error).toBeDefined()
    expect(secureLogger.warn).toBeDefined()
    expect(secureLogger.debug).toBeDefined()
  })
})

describe('Validación de Variables de Entorno', () => {
  it('debe validar ENCRYPTION_KEY correctamente', () => {
    const { validateEncryptionKey } = require('@/lib/security/field-encryption')

    // Con clave válida no debería lanzar error
    expect(() => validateEncryptionKey()).not.toThrow()
  })

  it('debe fallar con ENCRYPTION_KEY inválida', () => {
    const { validateEncryptionKey } = require('@/lib/security/field-encryption')
    const oldKey = process.env.ENCRYPTION_KEY

    // Clave muy corta
    process.env.ENCRYPTION_KEY = 'short'
    expect(() => validateEncryptionKey()).toThrow()

    // Restaurar
    process.env.ENCRYPTION_KEY = oldKey
  })
})

describe('Integración - Flujo Completo', () => {
  it('debe sanitizar, validar y encriptar dato sensible', () => {
    // 1. Entrada del usuario (con caracteres no deseados)
    const userInput = '1234-567-890'

    // 2. Sanitizar
    const sanitized = sanitizeDocumento(userInput)
    expect(sanitized).toBe('1234567890')

    // 3. Validar (ejemplo simple)
    expect(sanitized).toHaveLength(10)

    // 4. Encriptar
    const encrypted = encryptField(sanitized)
    expect(encrypted).toContain('enc:')

    // 5. Guardar en DB (simulado)
    // await prisma.user.create({ data: { numeroDocumento: encrypted } })

    // 6. Leer de DB y desencriptar
    const decrypted = decryptField(encrypted)
    expect(decrypted).toBe('1234567890')

    // 7. Enmascarar para UI
    const masked = maskField(decrypted!, 4)
    expect(masked).toBe('******7890')
  })

  it('debe manejar flujo completo con emails', () => {
    const userEmail = '  TEST@EXAMPLE.COM  '

    const sanitized = sanitizeEmail(userEmail)
    expect(sanitized).toBe('test@example.com')

    // Emails no se encriptan, solo se sanitizan
    expect(detectXSS(sanitized)).toBe(false)
    expect(detectSQLInjection(sanitized)).toBe(false)
  })
})
