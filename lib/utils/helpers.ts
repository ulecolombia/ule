/**
 * ULE - HELPERS Y UTILIDADES
 * Funciones auxiliares generales para el sistema
 */

/**
 * Simula delay asíncrono (para mock)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Genera número aleatorio en rango
 */
export const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Formatea fecha a string DD/MM/YYYY
 */
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formatea moneda colombiana
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Genera ID único simple (alternativa a UUID)
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida NIT colombiano (básico)
 */
export const isValidNIT = (nit: string): boolean => {
  // Remover guiones y espacios
  const cleanNIT = nit.replace(/[-\s]/g, '')
  // Validar que sea numérico con posible dígito de verificación
  return /^\d{9,10}$/.test(cleanNIT)
}

/**
 * Capitaliza primera letra de cada palabra
 */
export const capitalize = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Trunca texto con elipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
