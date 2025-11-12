/**
 * PÁGINA: RECUPERACIÓN DE CONTRASEÑA (SOLICITUD)
 *
 * Características:
 * - Formulario para solicitar reset de contraseña
 * - Validación con react-hook-form + zod
 * - Rate limiting feedback
 * - Respuesta opaca (no revela si el email existe)
 * - UI de confirmación
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.status === 429) {
        setError(`Demasiadas solicitudes. Intenta de nuevo en ${result.retryAfter} segundos`)
        return
      }

      if (!response.ok) {
        setError(result.error || 'Error al solicitar recuperación')
        return
      }

      setSuccess(true)

    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión. Intenta de nuevo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        {!success ? (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Te enviaremos instrucciones para resetear tu contraseña
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Revisa tu email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Si existe una cuenta con ese email, recibirás instrucciones
              para resetear tu contraseña en los próximos minutos.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>¿No encuentras el email?</strong>
                <br />
                Revisa tu carpeta de spam o correo no deseado.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
