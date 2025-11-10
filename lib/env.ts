/**
 * ULE - VALIDACIÓN DE VARIABLES DE ENTORNO
 * Valida y tipea las variables de entorno usando Zod
 */

import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Ule'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Valida y exporta las variables de entorno
 * Lanza un error si alguna variable requerida no está presente o es inválida
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ')
      throw new Error(
        `❌ Error en variables de entorno de Ule:\n${missingVars}\n\nRevisa tu archivo .env`
      )
    }
    throw error
  }
}

// Exportar variables validadas
// En desarrollo, permitir que funcione sin todas las variables
export const env = process.env.NODE_ENV === 'development'
  ? (process.env as unknown as Env)
  : validateEnv()

/**
 * Valida que NEXTAUTH_SECRET esté configurado
 */
export function validateNextAuthSecret(): void {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      '❌ NEXTAUTH_SECRET no está configurado.\nGenera uno con: openssl rand -base64 32'
    )
  }

  if (process.env.NEXTAUTH_SECRET.length < 32) {
    console.warn('⚠️ NEXTAUTH_SECRET es muy corto. Se recomienda al menos 32 caracteres.')
  }
}
