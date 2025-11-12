/**
 * COMPONENTE: FORMULARIO DE LOGIN CON SOPORTE PARA 2FA
 *
 * Características:
 * - Validación de formulario con react-hook-form + zod
 * - Manejo de rate limiting
 * - Flujo de 2FA si está habilitado
 * - Feedback de errores y intentos restantes
 * - Diseño responsivo
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<LoginForm | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/secure-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          twoFactorCode: requiresTwoFactor ? twoFactorCode : undefined,
        }),
      })

      const result = await response.json()

      if (response.status === 429) {
        setError(
          `Demasiados intentos. Intenta de nuevo en ${result.retryAfter} segundos`
        )
        return
      }

      if (!response.ok) {
        if (result.remainingAttempts !== undefined) {
          setError(
            `${result.error}. Intentos restantes: ${result.remainingAttempts}`
          )
        } else {
          setError(result.error || 'Error al iniciar sesión')
        }
        return
      }

      // Si requiere 2FA
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setCredentials(data)
        return
      }

      // Login exitoso - guardar token y redirigir
      if (result.token) {
        localStorage.setItem('session_token', result.token)
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Intenta de nuevo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!credentials) return

    await onSubmit(credentials)
  }

  if (requiresTwoFactor) {
    return (
      <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Autenticación de Dos Factores</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ingresa el código de 6 dígitos de tu app autenticadora
          </p>
        </div>

        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="twoFactorCode">Código 2FA</Label>
          <Input
            id="twoFactorCode"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={twoFactorCode}
            onChange={(e) =>
              setTwoFactorCode(e.target.value.replace(/\D/g, ''))
            }
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Ingresa los 6 dígitos de tu app de autenticación
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || twoFactorCode.length !== 6}
        >
          {isLoading ? 'Verificando...' : 'Verificar Código'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setRequiresTwoFactor(false)
            setTwoFactorCode('')
            setCredentials(null)
          }}
        >
          Volver
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ingresa a tu cuenta de ULE
        </p>
      </div>

      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          Recordarme
        </label>

        <Link
          href="/forgot-password"
          className="text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        ¿No tienes cuenta?{' '}
        <Link
          href="/registro"
          className="text-primary hover:underline font-semibold"
        >
          Regístrate aquí
        </Link>
      </p>
    </form>
  )
}
