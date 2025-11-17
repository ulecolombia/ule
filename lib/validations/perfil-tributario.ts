/**
 * VALIDACIÓN ZOD - PERFIL TRIBUTARIO
 * Schema de validación para información tributaria del usuario
 */

import { z } from 'zod'

export const perfilTributarioSchema = z.object({
  regimenTributario: z.enum(
    ['SIMPLE', 'ORDINARIO', 'ESPECIAL', 'NO_DECLARANTE'],
    {
      required_error: 'Debes seleccionar tu régimen tributario',
      invalid_type_error: 'Régimen tributario inválido',
    }
  ),

  responsableIVA: z.boolean({
    required_error: 'Debes indicar si eres responsable de IVA',
  }),

  razonSocial: z
    .string()
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(200, 'La razón social no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),

  emailFacturacion: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
})

export type PerfilTributarioData = z.infer<typeof perfilTributarioSchema>
