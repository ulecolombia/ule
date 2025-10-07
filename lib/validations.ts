/**
 * ULE - ESQUEMAS DE VALIDACIÓN
 * Esquemas Zod para validación de formularios y datos
 */

import { z } from 'zod'

/**
 * Validación de email
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'El email es requerido')

/**
 * Validación de contraseña
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

/**
 * Validación de nombre
 */
export const nameSchema = z
  .string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede exceder 100 caracteres')

/**
 * Validación de número de identificación
 */
export const idNumberSchema = z
  .string()
  .min(6, 'El número de identificación debe tener al menos 6 caracteres')
  .max(15, 'El número de identificación no puede exceder 15 caracteres')
  .regex(/^[0-9]+$/, 'Solo se permiten números')

/**
 * Validación de teléfono colombiano
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+57)?[0-9]{10}$/, 'Número de teléfono inválido (debe tener 10 dígitos)')

/**
 * Schema de usuario completo
 */
export const userSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

/**
 * Schema de login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
