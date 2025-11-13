/**
 * ULE - VALIDACIONES DE FACTURA
 * Schemas de Zod para validación de facturas electrónicas
 */

import { z } from 'zod'

/**
 * Schema para un ítem individual de la factura
 */
export const itemFacturaSchema = z.object({
  descripcion: z
    .string()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim(),
  cantidad: z
    .number()
    .min(1, 'La cantidad debe ser al menos 1')
    .max(999999, 'La cantidad es demasiado grande'),
  valorUnitario: z
    .union([z.string(), z.number()])
    .transform((val) => {
      // Si es string, remover puntos y convertir a número
      if (typeof val === 'string') {
        const cleaned = val.replace(/\./g, '')
        return parseFloat(cleaned) || 0
      }
      return val
    })
    .pipe(
      z
        .number()
        .min(0.01, 'El valor unitario debe ser mayor a 0')
        .max(999999999.99, 'El valor unitario es demasiado grande')
    ),
  iva: z
    .number()
    .min(0, 'El IVA no puede ser negativo')
    .max(100, 'El IVA no puede ser mayor a 100%')
    .default(19),
})

/**
 * Schema para crear una nueva factura (borrador o emitida)
 */
export const crearFacturaSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  fecha: z.date({
    required_error: 'La fecha de emisión es requerida',
    invalid_type_error: 'Fecha inválida',
  }),
  metodoPago: z.enum(
    [
      'EFECTIVO',
      'TRANSFERENCIA',
      'CHEQUE',
      'TARJETA_CREDITO',
      'TARJETA_DEBITO',
    ],
    {
      required_error: 'Debe seleccionar un método de pago',
      invalid_type_error: 'Método de pago inválido',
    }
  ),
  items: z
    .array(itemFacturaSchema)
    .min(1, 'La factura debe tener al menos un ítem')
    .max(100, 'La factura no puede tener más de 100 ítems'),
  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  terminos: z
    .string()
    .max(300, 'Los términos no pueden exceder 300 caracteres')
    .optional()
    .or(z.literal('')),
  estado: z.enum(['BORRADOR', 'EMITIDA']).default('BORRADOR'),
})

/**
 * Schema más relajado para guardar borrador
 * Solo requiere que haya al menos un campo lleno
 */
export const guardarBorradorSchema = z.object({
  clienteId: z.string().optional(),
  fecha: z.date().optional(),
  metodoPago: z
    .enum([
      'EFECTIVO',
      'TRANSFERENCIA',
      'CHEQUE',
      'TARJETA_CREDITO',
      'TARJETA_DEBITO',
    ])
    .optional(),
  items: z.array(itemFacturaSchema).min(0).optional(),
  notas: z.string().max(500).optional().or(z.literal('')),
  terminos: z.string().max(300).optional().or(z.literal('')),
  estado: z.literal('BORRADOR'),
})

/**
 * Type exports
 */
export type ItemFacturaInput = z.infer<typeof itemFacturaSchema>
export type CrearFacturaInput = z.infer<typeof crearFacturaSchema>
export type GuardarBorradorInput = z.infer<typeof guardarBorradorSchema>

/**
 * Opciones de método de pago
 */
export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
] as const

/**
 * Opciones de IVA
 */
export const OPCIONES_IVA = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 19, label: '19%' },
] as const
