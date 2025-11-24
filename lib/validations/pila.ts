/**
 * VALIDACIONES ZOD PARA CALCULADORA PILA
 *
 * Schemas de validación para endpoints API y formularios
 * Proporciona validación robusta a nivel de runtime
 */

import { z } from 'zod'
import { IBC_MINIMO, IBC_MAXIMO } from '@/lib/calculadora-pila'

// ============================================
// SCHEMAS BÁSICOS
// ============================================

/**
 * Schema para validar ingreso mensual
 */
export const ingresoMensualSchema = z
  .number({
    required_error: 'El ingreso mensual es requerido',
    invalid_type_error: 'El ingreso mensual debe ser un número',
  })
  .positive('El ingreso mensual debe ser mayor a cero')
  .finite('El ingreso mensual debe ser un número finito')
  .refine((val) => !isNaN(val), 'El ingreso mensual no es un número válido')

/**
 * Schema para validar IBC (Ingreso Base de Cotización)
 */
export const ibcSchema = z
  .number({
    required_error: 'El IBC es requerido',
    invalid_type_error: 'El IBC debe ser un número',
  })
  .positive('El IBC debe ser mayor a cero')
  .finite('El IBC debe ser un número finito')
  .min(
    IBC_MINIMO,
    `El IBC no puede ser menor al mínimo legal ($${IBC_MINIMO.toLocaleString('es-CO')})`
  )
  .max(
    IBC_MAXIMO,
    `El IBC no puede ser mayor al máximo legal ($${IBC_MAXIMO.toLocaleString('es-CO')})`
  )

/**
 * Schema para validar nivel de riesgo ARL
 */
export const nivelRiesgoARLSchema = z.enum(['I', 'II', 'III', 'IV', 'V'], {
  required_error: 'El nivel de riesgo ARL es requerido',
  invalid_type_error: 'El nivel de riesgo ARL debe ser I, II, III, IV o V',
})

// ============================================
// SCHEMAS DE CÁLCULO
// ============================================

/**
 * Schema para calcular IBC
 */
export const calcularIBCSchema = z.object({
  ingresoMensual: ingresoMensualSchema,
})

/**
 * Schema para calcular aporte de salud
 */
export const calcularSaludSchema = z.object({
  ibc: ibcSchema,
})

/**
 * Schema para calcular aporte de pensión
 */
export const calcularPensionSchema = z.object({
  ibc: ibcSchema,
})

/**
 * Schema para calcular aporte de ARL
 */
export const calcularARLSchema = z.object({
  ibc: ibcSchema,
  nivelRiesgo: nivelRiesgoARLSchema,
})

/**
 * Schema para calcular todos los aportes
 */
export const calcularAportesSchema = z.object({
  ingresoMensual: ingresoMensualSchema,
  nivelRiesgo: nivelRiesgoARLSchema.default('I'),
})

// ============================================
// SCHEMAS DE PERIODO
// ============================================

/**
 * Schema para validar mes
 */
export const mesSchema = z
  .number()
  .int('El mes debe ser un número entero')
  .min(1, 'El mes debe estar entre 1 y 12')
  .max(12, 'El mes debe estar entre 1 y 12')

/**
 * Schema para validar año
 */
export const anioSchema = z
  .number()
  .int('El año debe ser un número entero')
  .min(2020, 'El año debe ser 2020 o posterior')
  .max(2100, 'El año no puede ser mayor a 2100')

/**
 * Schema para calcular fecha límite de pago
 */
export const calcularFechaLimiteSchema = z.object({
  mes: mesSchema,
  anio: anioSchema,
})

// ============================================
// SCHEMAS PARA HISTORIAL
// ============================================

/**
 * Schema para guardar cálculo en historial
 */
export const guardarCalculoSchema = z.object({
  ingresoMensual: ingresoMensualSchema,
  nivelRiesgo: nivelRiesgoARLSchema,
  ibc: ibcSchema,
  salud: z.number().nonnegative(),
  pension: z.number().nonnegative(),
  arl: z.number().nonnegative(),
  total: z.number().positive(),
  mes: mesSchema.optional(),
  anio: anioSchema.optional(),
})

// ============================================
// TIPOS INFERIDOS
// ============================================

export type IngresoMensualInput = z.infer<typeof ingresoMensualSchema>
export type IBCInput = z.infer<typeof ibcSchema>
export type NivelRiesgoARLInput = z.infer<typeof nivelRiesgoARLSchema>
export type CalcularIBCInput = z.infer<typeof calcularIBCSchema>
export type CalcularSaludInput = z.infer<typeof calcularSaludSchema>
export type CalcularPensionInput = z.infer<typeof calcularPensionSchema>
export type CalcularARLInput = z.infer<typeof calcularARLSchema>
export type CalcularAportesInput = z.infer<typeof calcularAportesSchema>
export type CalcularFechaLimiteInput = z.infer<typeof calcularFechaLimiteSchema>
export type GuardarCalculoInput = z.infer<typeof guardarCalculoSchema>
