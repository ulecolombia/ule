/**
 * SECURE STORAGE UTILITY
 * Encriptación de datos sensibles en localStorage usando Web Crypto API
 *
 * SEGURIDAD:
 * - Usa AES-GCM (Galois/Counter Mode) - estándar de encriptación
 * - Genera IV (Initialization Vector) único por cada encriptación
 * - Clave derivada de un secreto base usando PBKDF2
 *
 * NOTA: Para máxima seguridad en producción, usar variables de entorno
 */

// Secreto base - EN PRODUCCIÓN DEBE ESTAR EN .env.local
const BASE_SECRET =
  process.env.NEXT_PUBLIC_STORAGE_SECRET ||
  'ULE-2025-DEFAULT-SECRET-CHANGE-IN-PRODUCTION'

/**
 * Deriva una clave criptográfica desde un secreto usando PBKDF2
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Convierte ArrayBuffer a string Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convierte string Base64 a ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Encripta datos y los guarda en localStorage
 *
 * @param key - Clave del localStorage
 * @param data - Datos a encriptar (cualquier objeto JSON-serializable)
 * @returns Promise<boolean> - true si se guardó exitosamente
 *
 * @example
 * await setSecureItem('user-draft', { edad: 35, ingreso: 5000000 })
 */
export async function setSecureItem(key: string, data: any): Promise<boolean> {
  try {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') return false

    // Convertir datos a JSON
    const plaintext = JSON.stringify(data)
    const encoder = new TextEncoder()
    const plaintextBytes = encoder.encode(plaintext)

    // Generar salt único
    const salt = crypto.getRandomValues(new Uint8Array(16))

    // Derivar clave
    const key_crypto = await deriveKey(BASE_SECRET, salt)

    // Generar IV único
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encriptar
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key_crypto,
      plaintextBytes
    )

    // Combinar: salt (16 bytes) + iv (12 bytes) + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    )
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    // Guardar en localStorage como Base64
    const encrypted = arrayBufferToBase64(combined.buffer)
    localStorage.setItem(`secure:${key}`, encrypted)

    return true
  } catch (error) {
    console.error('Error al encriptar datos:', error)
    return false
  }
}

/**
 * Desencripta y obtiene datos desde localStorage
 *
 * @param key - Clave del localStorage
 * @returns Promise<T | null> - Datos desencriptados o null si falla
 *
 * @example
 * const draft = await getSecureItem<UserDraft>('user-draft')
 * if (draft) {
 *   console.log(draft.edad)
 * }
 */
export async function getSecureItem<T = any>(key: string): Promise<T | null> {
  try {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') return null

    // Obtener dato encriptado
    const encrypted = localStorage.getItem(`secure:${key}`)
    if (!encrypted) return null

    // Convertir de Base64 a ArrayBuffer
    const combined = new Uint8Array(base64ToArrayBuffer(encrypted))

    // Extraer salt, iv y ciphertext
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const ciphertext = combined.slice(28)

    // Derivar clave
    const key_crypto = await deriveKey(BASE_SECRET, salt)

    // Desencriptar
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key_crypto,
      ciphertext
    )

    // Convertir de ArrayBuffer a string
    const decoder = new TextDecoder()
    const plaintext = decoder.decode(decrypted)

    // Parsear JSON
    return JSON.parse(plaintext) as T
  } catch (error) {
    console.error('Error al desencriptar datos:', error)
    return null
  }
}

/**
 * Elimina un item del localStorage seguro
 */
export function removeSecureItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`secure:${key}`)
}

/**
 * Verifica si existe un item en localStorage seguro
 */
export function hasSecureItem(key: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`secure:${key}`) !== null
}

/**
 * Migración: Convierte localStorage sin encriptar a encriptado
 *
 * @param oldKey - Clave antigua sin encriptar
 * @param newKey - Nueva clave encriptada (opcional, usa oldKey si no se provee)
 *
 * @example
 * await migrateToSecureStorage('simulador-pensional-draft')
 */
export async function migrateToSecureStorage(
  oldKey: string,
  newKey?: string
): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false

    const oldData = localStorage.getItem(oldKey)
    if (!oldData) return false

    // Parsear datos antiguos
    const data = JSON.parse(oldData)

    // Guardar encriptados
    const success = await setSecureItem(newKey || oldKey, data)

    // Si la migración fue exitosa, eliminar dato antiguo
    if (success) {
      localStorage.removeItem(oldKey)
      console.log(
        `✅ Migración exitosa: ${oldKey} → secure:${newKey || oldKey}`
      )
    }

    return success
  } catch (error) {
    console.error('Error en migración:', error)
    return false
  }
}

/**
 * DEBUGGING: Mostrar estadísticas de items encriptados
 */
export function getSecureStorageStats(): {
  total: number
  keys: string[]
  totalSize: number
} {
  if (typeof window === 'undefined') {
    return { total: 0, keys: [], totalSize: 0 }
  }

  const keys: string[] = []
  let totalSize = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('secure:')) {
      keys.push(key)
      const value = localStorage.getItem(key)
      totalSize += (value?.length || 0) * 2 // *2 porque cada char es ~2 bytes en UTF-16
    }
  }

  return {
    total: keys.length,
    keys: keys.map((k) => k.replace('secure:', '')),
    totalSize,
  }
}
