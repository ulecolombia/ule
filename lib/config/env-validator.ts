/**
 * ULE - VALIDADOR DE VARIABLES DE ENTORNO
 *
 * Valida todas las variables de entorno requeridas al inicio de la aplicación
 * Garantiza que la app no inicie con configuración incorrecta
 *
 * Cumplimiento:
 * - OWASP: A05:2021 - Security Misconfiguration
 */

import { z } from 'zod'

/**
 * Schema de validación para variables de entorno
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // URLs
  NEXTAUTH_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),

  // NextAuth
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET debe tener al menos 32 caracteres'),

  // Encriptación de campos
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY debe tener exactamente 64 caracteres (32 bytes en hex)'),

  // Anthropic API (IA)
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY inválida'),

  // Rate Limiting (Upstash Redis) - Opcional
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  // OAuth Providers - Opcional
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Sentry - Opcional
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Email - Opcional (para futuro)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Stripe - Opcional (para futuro)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

/**
 * Tipo inferido del schema de variables de entorno
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validar variables de entorno
 *
 * @throws Error si faltan variables requeridas o son inválidas
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env)

    // Validaciones adicionales personalizadas
    validateCustomRules(env)

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.')
        return `  - ${path}: ${err.message}`
      })

      console.error('\n❌ ERROR DE CONFIGURACIÓN DE VARIABLES DE ENTORNO:\n')
      console.error(errorMessages.join('\n'))
      console.error('\nRevisa el archivo .env y .env.example\n')

      throw new Error('Variables de entorno inválidas o faltantes')
    }

    throw error
  }
}

/**
 * Validaciones personalizadas adicionales
 */
function validateCustomRules(env: Env): void {
  // En producción, URLs deben usar HTTPS
  if (env.NODE_ENV === 'production') {
    if (env.NEXTAUTH_URL && !env.NEXTAUTH_URL.startsWith('https://')) {
      throw new Error('NEXTAUTH_URL debe usar HTTPS en producción')
    }

    if (env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_URL.startsWith('https://')) {
      throw new Error('UPSTASH_REDIS_REST_URL debe usar HTTPS en producción')
    }
  }

  // Si se configura Upstash, ambas variables deben estar presentes
  if (
    (env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_TOKEN) ||
    (!env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN deben configurarse juntas'
    )
  }

  // Si se configura Google OAuth, ambas variables deben estar presentes
  if (
    (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) ||
    (!env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  ) {
    throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben configurarse juntas')
  }

  // Si se configura GitHub OAuth, ambas variables deben estar presentes
  if (
    (env.GITHUB_CLIENT_ID && !env.GITHUB_CLIENT_SECRET) ||
    (!env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
  ) {
    throw new Error('GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET deben configurarse juntas')
  }

  // Si se configura SMTP, todas las variables deben estar presentes
  if (
    env.SMTP_HOST ||
    env.SMTP_PORT ||
    env.SMTP_USER ||
    env.SMTP_PASSWORD ||
    env.SMTP_FROM
  ) {
    if (
      !env.SMTP_HOST ||
      !env.SMTP_PORT ||
      !env.SMTP_USER ||
      !env.SMTP_PASSWORD ||
      !env.SMTP_FROM
    ) {
      throw new Error(
        'Si se configura SMTP, todas las variables (HOST, PORT, USER, PASSWORD, FROM) son requeridas'
      )
    }
  }

  // Si se configura Stripe, todas las claves deben estar presentes
  if (
    env.STRIPE_SECRET_KEY ||
    env.STRIPE_PUBLISHABLE_KEY ||
    env.STRIPE_WEBHOOK_SECRET
  ) {
    if (
      !env.STRIPE_SECRET_KEY ||
      !env.STRIPE_PUBLISHABLE_KEY ||
      !env.STRIPE_WEBHOOK_SECRET
    ) {
      throw new Error(
        'Si se configura Stripe, todas las claves (SECRET_KEY, PUBLISHABLE_KEY, WEBHOOK_SECRET) son requeridas'
      )
    }
  }
}

/**
 * Obtener variables de entorno validadas (cached)
 *
 * Esto evita validar en cada acceso
 */
let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}

/**
 * Verificar si una variable de entorno está configurada
 */
export function hasEnvVar(key: keyof Env): boolean {
  const env = getEnv()
  return !!env[key]
}

/**
 * Mostrar estado de configuración (para debugging)
 */
export function printEnvStatus(): void {
  const env = getEnv()

  console.log('\n✅ CONFIGURACIÓN DE VARIABLES DE ENTORNO:\n')
  console.log(`  NODE_ENV: ${env.NODE_ENV}`)
  console.log(`  Database: ${env.DATABASE_URL ? '✓ Configurada' : '✗ Faltante'}`)
  console.log(
    `  NextAuth Secret: ${env.NEXTAUTH_SECRET ? '✓ Configurada' : '✗ Faltante'}`
  )
  console.log(
    `  Encryption Key: ${env.ENCRYPTION_KEY ? '✓ Configurada' : '✗ Faltante'}`
  )
  console.log(
    `  Anthropic API: ${env.ANTHROPIC_API_KEY ? '✓ Configurada' : '✗ Faltante'}`
  )
  console.log(
    `  Upstash Redis: ${env.UPSTASH_REDIS_REST_URL ? '✓ Configurada' : '⚠ Opcional (mock mode)'}`
  )
  console.log(
    `  Google OAuth: ${env.GOOGLE_CLIENT_ID ? '✓ Configurada' : '⚠ Opcional'}`
  )
  console.log(
    `  GitHub OAuth: ${env.GITHUB_CLIENT_ID ? '✓ Configurada' : '⚠ Opcional'}`
  )
  console.log(`  Sentry: ${env.NEXT_PUBLIC_SENTRY_DSN ? '✓ Configurada' : '⚠ Opcional'}`)
  console.log(`  SMTP: ${env.SMTP_HOST ? '✓ Configurada' : '⚠ Opcional'}`)
  console.log(`  Stripe: ${env.STRIPE_SECRET_KEY ? '✓ Configurada' : '⚠ Opcional'}`)
  console.log('')
}

/**
 * Validar al inicio de la aplicación (solo en servidor)
 */
if (typeof window === 'undefined') {
  // Solo validar en el servidor, no en el cliente
  try {
    validateEnv()

    if (process.env.NODE_ENV === 'development') {
      printEnvStatus()
    }
  } catch (error) {
    // En desarrollo, mostrar el error pero continuar
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Advertencia: Algunas variables de entorno faltan o son inválidas')
      console.warn('La aplicación puede no funcionar correctamente\n')
    } else {
      // En producción, detener la aplicación
      process.exit(1)
    }
  }
}
