/**
 * PÁGINA: RESET DE CONTRASEÑA (COMPLETAR)
 *
 * Características:
 * - Verificación de token al cargar
 * - Formulario de nueva contraseña con confirmación
 * - Validación con react-hook-form + zod
 * - Indicador de fortaleza de contraseña
 * - Redirección automática al login tras éxito
 * - Manejo de tokens inválidos/expirados
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  useEffect(() => {
    verificarToken()
  }, [params.token])

  const verificarToken = async () => {
    try {
      const response = await fetch(`/api/auth/password-reset/verify/${params.token}`)
      const data = await response.json()

      setIsValid(data.valid)

      if (!data.valid) {
        setError(data.message || 'Token inválido o expirado')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al verificar token')
    } finally {
      setIsVerifying(false)
    }
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Error al resetear contraseña')
        return
      }

      setSuccess(true)

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Intenta de nuevo')
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando token...</p>
        </Card>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Token Inválido</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full"
          >
            Solicitar nuevo link
          </Button>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">¡Contraseña Actualizada!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tu contraseña ha sido actualizada exitosamente.
            Serás redirigido al inicio de sesión...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Nueva Contraseña</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ingresa tu nueva contraseña segura
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Indicador de fortaleza */}
          {password && (
            <PasswordStrengthIndicator password={password} />
          )}

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
