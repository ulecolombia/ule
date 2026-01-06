/**
 * ULE - VALIDACIONES PARA CUENTA DE COBRO
 * Schemas de validación con Zod para cuentas de cobro
 */

import { z } from 'zod'

// Schema para un item/concepto de la cuenta de cobro
export const itemCuentaCobroSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  valorUnitario: z.number().min(0, 'El valor debe ser mayor o igual a 0'),
  total: z.number().optional(), // Se calcula automáticamente
})

// Schema para crear una cuenta de cobro
export const crearCuentaCobroSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  fecha: z.coerce.date().optional(),
  fechaVencimiento: z.coerce.date().optional().nullable(),
  items: z
    .array(itemCuentaCobroSchema)
    .min(1, 'Debe agregar al menos un concepto'),
  notas: z.string().optional().nullable(),
  conceptoServicio: z.string().optional().nullable(),
  estado: z.enum(['BORRADOR', 'EMITIDA']).default('BORRADOR'),
})

// Schema para guardar borrador (más flexible)
export const guardarBorradorCuentaCobroSchema = z.object({
  clienteId: z.string().optional(),
  fecha: z.coerce.date().optional(),
  fechaVencimiento: z.coerce.date().optional().nullable(),
  items: z.array(itemCuentaCobroSchema).optional(),
  notas: z.string().optional().nullable(),
  conceptoServicio: z.string().optional().nullable(),
  estado: z.literal('BORRADOR').default('BORRADOR'),
})

// Schema para emitir cuenta de cobro
export const emitirCuentaCobroSchema = z.object({
  cuentaCobroId: z.string().min(1, 'ID de cuenta de cobro requerido'),
})

// Schema para anular cuenta de cobro
export const anularCuentaCobroSchema = z.object({
  cuentaCobroId: z.string().min(1, 'ID de cuenta de cobro requerido'),
  motivo: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
})

// Schema para enviar por email
export const enviarEmailCuentaCobroSchema = z.object({
  cuentaCobroId: z.string().min(1, 'ID de cuenta de cobro requerido'),
  destinatario: z.string().email('Email inválido'),
  cc: z.string().optional(),
  asunto: z.string().min(1, 'El asunto es requerido'),
  mensaje: z.string().optional(),
})

// Tipos exportados
export type ItemCuentaCobro = z.infer<typeof itemCuentaCobroSchema>
export type CrearCuentaCobroInput = z.infer<typeof crearCuentaCobroSchema>
export type GuardarBorradorCuentaCobroInput = z.infer<
  typeof guardarBorradorCuentaCobroSchema
>
export type EmitirCuentaCobroInput = z.infer<typeof emitirCuentaCobroSchema>
export type AnularCuentaCobroInput = z.infer<typeof anularCuentaCobroSchema>
export type EnviarEmailCuentaCobroInput = z.infer<
  typeof enviarEmailCuentaCobroSchema
>
