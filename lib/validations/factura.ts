/**
 * ULE - VALIDACIONES DE FACTURA
 * Schemas de Zod para validación de facturas electrónicas
 */

import { z } from 'zod'

/**
 * Schema para un ítem individual de la factura
 */
export const itemFacturaSchema = z.object({
  descripcion: z.string().optional().or(z.literal('')),
  cantidad: z.number().optional().default(1),
  unidad: z
    .enum(['UND', 'HORA', 'DIA', 'MES', 'SERVICIO'])
    .optional()
    .default('UND'),
  valorUnitario: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      // Si es string, remover puntos y convertir a número
      if (typeof val === 'string') {
        const cleaned = val.replace(/\./g, '')
        return parseFloat(cleaned) || 0
      }
      if (typeof val === 'number') {
        return val
      }
      return 0
    }),
  aplicaIVA: z.boolean().optional().default(false),
  porcentajeIVA: z.number().optional().default(0),
  // Mantener campo iva para retrocompatibilidad
  iva: z.number().optional().default(19),
})

/**
 * Schema para datos del emisor de la factura
 */
export const emisorFacturaSchema = z.object({
  razonSocial: z
    .string()
    .min(3, 'Razón social requerida')
    .max(200, 'Razón social demasiado larga')
    .trim(),
  documento: z
    .string()
    .min(5, 'Documento requerido')
    .max(20, 'Documento inválido')
    .trim(),
  direccion: z
    .string()
    .min(5, 'Dirección requerida')
    .max(200, 'Dirección demasiado larga')
    .trim(),
  ciudad: z
    .string()
    .min(2, 'Ciudad requerida')
    .max(100, 'Ciudad demasiado larga')
    .trim(),
  telefono: z
    .string()
    .regex(/^[0-9]{10}$/, 'Teléfono debe tener 10 dígitos')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email demasiado largo')
    .trim(),
})

/**
 * Schema para datos del cliente de la factura
 */
export const clienteFacturaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Nombre requerido')
    .max(200, 'Nombre demasiado largo')
    .trim(),
  documento: z
    .string()
    .min(5, 'Documento requerido')
    .max(20, 'Documento inválido')
    .trim(),
  direccion: z
    .string()
    .min(5, 'Dirección requerida')
    .max(200, 'Dirección demasiado larga')
    .trim(),
  ciudad: z
    .string()
    .min(2, 'Ciudad requerida')
    .max(100, 'Ciudad demasiado larga')
    .trim(),
  telefono: z
    .string()
    .regex(/^[0-9]{10}$/, 'Teléfono debe tener 10 dígitos')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email demasiado largo')
    .trim(),
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
export type EmisorFacturaInput = z.infer<typeof emisorFacturaSchema>
export type ClienteFacturaInput = z.infer<typeof clienteFacturaSchema>
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
