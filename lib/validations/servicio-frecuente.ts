/**
 * VALIDACIÓN ZOD - SERVICIOS FRECUENTES
 * Schema de validación para servicios que factura el usuario
 */

import { z } from 'zod'

export const servicioFrecuenteSchema = z
  .object({
    descripcion: z
      .string()
      .min(5, 'La descripción debe tener al menos 5 caracteres')
      .max(300, 'Máximo 300 caracteres'),

    valorUnitario: z
      .number()
      .positive('El valor debe ser mayor a 0')
      .max(999999999, 'Valor máximo excedido'),

    unidad: z.enum(['UND', 'HORA', 'DIA', 'MES', 'SERVICIO'], {
      required_error: 'Selecciona una unidad de medida',
    }),

    aplicaIVA: z.boolean().default(false),

    porcentajeIVA: z.number().min(0).max(19).default(0),

    categoria: z.string().max(100).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Si aplica IVA, el porcentaje debe ser mayor a 0
      if (data.aplicaIVA && data.porcentajeIVA === 0) {
        return false
      }
      return true
    },
    {
      message: 'Si aplica IVA, debes especificar el porcentaje',
      path: ['porcentajeIVA'],
    }
  )

// Input type (what the form uses)
export type ServicioFrecuenteInput = z.input<typeof servicioFrecuenteSchema>
// Output type (what we get after validation)
export type ServicioFrecuenteData = z.output<typeof servicioFrecuenteSchema>
