/**
 * ULE - VALIDACIÓN DE CLIENTES
 * Schemas de validación con Zod para clientes de facturación
 */

import { z } from 'zod'

/**
 * Schema base de cliente
 * Campos comunes para todos los tipos de documento
 */
const clienteBaseSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres')
    .trim(),

  tipoDocumento: z.enum(['CC', 'CE', 'NIT', 'PASAPORTE', 'TI', 'RC', 'DIE'], {
    required_error: 'Selecciona un tipo de documento',
    invalid_type_error: 'Tipo de documento inválido',
  }),

  numeroDocumento: z
    .string()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[0-9A-Za-z-]+$/, 'Solo números, letras y guiones')
    .trim(),

  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  telefono: z
    .string()
    .regex(/^[0-9]{10}$/, 'Debe tener exactamente 10 dígitos')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  direccion: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  ciudad: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  departamento: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

/**
 * Schema extendido para empresas (NIT)
 * Incluye campos fiscales adicionales
 */
const clienteEmpresaSchema = clienteBaseSchema.extend({
  razonSocial: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  nombreComercial: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  regimenTributario: z
    .enum(['SIMPLE', 'ORDINARIO', 'ESPECIAL', 'NO_DECLARANTE'])
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),

  responsabilidadFiscal: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

/**
 * Crea el schema apropiado según el tipo de documento
 * @param tipoDocumento - Tipo de documento del cliente
 * @returns Schema de validación correspondiente
 */
export const createClienteSchema = (tipoDocumento?: string) => {
  return tipoDocumento === 'NIT' ? clienteEmpresaSchema : clienteBaseSchema
}

/**
 * Schema para validación de documento único
 */
export const validarDocumentoSchema = z.object({
  numeroDocumento: z.string().min(1, 'El documento es requerido'),
  excludeId: z.string().optional(),
})

/**
 * Tipos TypeScript inferidos de los schemas
 */
export type ClienteFormData = z.infer<typeof clienteEmpresaSchema>
export type ValidarDocumentoData = z.infer<typeof validarDocumentoSchema>

/**
 * Valida formato de NIT colombiano
 * @param nit - Número de NIT a validar
 * @returns true si el formato es válido
 */
export const validarFormatoNIT = (nit: string): boolean => {
  // Formato: 9 dígitos + guión + dígito verificador
  // Ejemplo: 900123456-7
  const nitRegex = /^\d{9}-\d{1}$/
  return nitRegex.test(nit)
}

/**
 * Calcula el dígito de verificación de un NIT colombiano
 * @param nit - Número de NIT sin dígito verificador
 * @returns Dígito de verificación calculado
 */
export const calcularDigitoVerificacionNIT = (nit: string): number => {
  const nitSinDV = nit.replace(/\D/g, '').slice(0, 9)

  if (nitSinDV.length !== 9) {
    throw new Error('El NIT debe tener 9 dígitos')
  }

  const pesos = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3]
  const offset = pesos.length - nitSinDV.length

  let suma = 0
  for (let i = 0; i < nitSinDV.length; i++) {
    suma += parseInt(nitSinDV[i]!) * pesos[i + offset]!
  }

  const residuo = suma % 11

  if (residuo === 0 || residuo === 1) {
    return residuo
  }

  return 11 - residuo
}

/**
 * Valida que el dígito verificador del NIT sea correcto
 * @param nitCompleto - NIT completo con dígito verificador
 * @returns true si el dígito verificador es correcto
 */
export const validarDigitoVerificacionNIT = (nitCompleto: string): boolean => {
  const partes = nitCompleto.split('-')

  if (partes.length !== 2) {
    return false
  }

  const nit = partes[0]!
  const dvIngresado = parseInt(partes[1]!)

  try {
    const dvCalculado = calcularDigitoVerificacionNIT(nit)
    return dvIngresado === dvCalculado
  } catch {
    return false
  }
}

/**
 * Limpia un número de documento
 * Elimina puntos, espacios y guiones (excepto el guión del NIT)
 * @param documento - Documento a limpiar
 * @param tipoDocumento - Tipo de documento
 * @returns Documento limpio
 */
export const limpiarNumeroDocumento = (
  documento: string,
  tipoDocumento: string
): string => {
  if (tipoDocumento === 'NIT') {
    // Para NIT, mantener el guión del dígito verificador
    return documento.replace(/[.\s]/g, '')
  }

  // Para otros documentos, eliminar todo excepto números y letras
  return documento.replace(/[^0-9A-Za-z]/g, '')
}
