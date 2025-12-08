/**
 * ULE - GENERADOR DE CUFE
 * Código Único de Factura Electrónica según normativa DIAN
 */

export interface CUFEData {
  numeroFactura: string
  fecha: Date
  nit: string
  tipoDocumento: string
  total: number
  baseImponible: number
  impuesto: number
  totalConImpuestos: number
}

/**
 * Genera hash simple para mock de CUFE
 * NOTA: Esta es una implementación simplificada para mock/educativo
 * En producción, el CUFE real lo genera el proveedor tecnológico (Siigo/Facture/Carvajal)
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convertir a hexadecimal positivo y hacer padding
  const hex = Math.abs(hash).toString(16).toUpperCase()
  return hex.padStart(16, '0')
}

/**
 * Genera CUFE según algoritmo de la DIAN
 * Formato simplificado para mock
 *
 * NOTA: En producción, el CUFE lo genera el proveedor (Siigo/Facture/Carvajal)
 * Este es solo un mock educativo que simula el algoritmo
 *
 * El CUFE real de la DIAN se genera con:
 * - Número de factura
 * - Fecha y hora de emisión
 * - Valor total
 * - Código de impuestos
 * - Valor de impuestos
 * - Valor total con impuestos
 * - NIT del emisor
 * - Tipo y número de documento del adquiriente
 * - ClTec (Clave técnica asignada por DIAN)
 * - Ambiente (1=producción, 2=pruebas)
 *
 * Todo esto se hashea con SHA-384 y se convierte a hexadecimal
 */
export function generateCUFE(data: CUFEData): string {
  // Validar fecha
  if (!data.fecha) {
    throw new Error('Fecha es requerida para generar CUFE')
  }

  // Formatear fecha: YYYYMMDD
  const fechaFormateada = data.fecha
    .toISOString()
    .split('T')[0]!
    .replace(/-/g, '')

  // Formatear hora: HHMMSS
  const horaFormateada = data.fecha
    .toISOString()
    .split('T')[1]!
    .split('.')[0]!
    .replace(/:/g, '')

  // Construir cadena base según especificación DIAN
  // En mock, usamos un formato simplificado pero realista
  const cadenaBase = [
    data.numeroFactura.padStart(10, '0'), // Número de factura (10 dígitos)
    fechaFormateada, // Fecha YYYYMMDD
    horaFormateada, // Hora HHMMSS
    data.total.toFixed(2), // Valor total
    '01', // Código de impuesto (IVA = 01)
    data.impuesto.toFixed(2), // Valor del IVA
    data.totalConImpuestos.toFixed(2), // Total con IVA
    data.nit, // NIT del emisor
    data.tipoDocumento, // Tipo de documento (31=NIT, 13=CC)
    'CLIENTE', // Documento del adquiriente (simplificado)
    'CLAVETECH123456', // Clave técnica DIAN (mock)
    '2', // Ambiente (2=pruebas, 1=producción)
  ].join('')

  // Generar hash mock (SHA-384 tiene 96 caracteres hexadecimales)
  // Generamos 6 segmentos de 16 caracteres para simular un CUFE real
  const hash1 = simpleHash(cadenaBase)
  const hash2 = simpleHash(cadenaBase + data.numeroFactura)
  const hash3 = simpleHash(cadenaBase + data.fecha.toISOString())
  const hash4 = simpleHash(cadenaBase + data.total.toString())
  const hash5 = simpleHash(cadenaBase + data.nit)
  const hash6 = simpleHash(cadenaBase + Date.now().toString())

  // CUFE es el hash en mayúsculas (96 caracteres hexadecimales)
  return (hash1 + hash2 + hash3 + hash4 + hash5 + hash6).toUpperCase()
}

/**
 * Valida formato de CUFE
 * Un CUFE válido es un hash SHA-384 en hexadecimal (96 caracteres)
 */
export function validateCUFE(cufe: string): boolean {
  // CUFE debe ser exactamente 96 caracteres hexadecimales en mayúsculas
  return /^[A-F0-9]{96}$/.test(cufe)
}

/**
 * Extrae información básica del CUFE (mock)
 * NOTA: En un CUFE real, esta información no es directamente extraíble
 * ya que el CUFE es un hash irreversible
 */
export function parseCUFE(cufe: string): {
  valid: boolean
  length: number
  algorithm: string
} {
  return {
    valid: validateCUFE(cufe),
    length: cufe.length,
    algorithm: 'SHA-384',
  }
}

/**
 * Genera CUDE (Código Único de Documento Electrónico)
 * Similar al CUFE pero para documentos soporte (compras)
 */
export function generateCUDE(data: CUFEData): string {
  // Validar fecha
  if (!data.fecha) {
    throw new Error('Fecha es requerida para generar CUDE')
  }

  // El CUDE se genera de forma similar al CUFE
  // pero con un prefijo diferente en la cadena base
  const fechaFormateada = data.fecha
    .toISOString()
    .split('T')[0]!
    .replace(/-/g, '')

  const cadenaBase = [
    'DS', // Prefijo para Documento Soporte
    data.numeroFactura.padStart(10, '0'),
    fechaFormateada,
    data.totalConImpuestos.toFixed(2),
    data.nit,
    'CLAVECUDE123456', // Clave técnica DIAN para CUDE (mock)
  ].join('')

  // Generar hash mock (SHA-384 tiene 96 caracteres hexadecimales)
  const hash1 = simpleHash(cadenaBase)
  const hash2 = simpleHash(cadenaBase + data.numeroFactura)
  const hash3 = simpleHash(cadenaBase + data.fecha.toISOString())
  const hash4 = simpleHash(cadenaBase + data.totalConImpuestos.toString())
  const hash5 = simpleHash(cadenaBase + data.nit)
  const hash6 = simpleHash(cadenaBase + 'CUDE' + Date.now().toString())

  return (hash1 + hash2 + hash3 + hash4 + hash5 + hash6).toUpperCase()
}
