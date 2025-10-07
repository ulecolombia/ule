'use client'

/**
 * ULE - FORMULARIO DE REGISTRO
 * Formulario de creación de cuenta con validaciones
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormField } from './form-field'
import { PasswordInput } from './password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { registerSchema, type RegisterInput } from '@/lib/auth-validations'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

/**
 * Formulario de registro de usuarios
 * Estilo N26 con validaciones robustas
 */
export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Error al crear la cuenta')
        return
      }

      // Redirigir al login con mensaje de éxito
      router.push('/login?registered=true')
    } catch (error) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      console.error('[Ule Auth] Error en registro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert
          variant="error"
          className="animate-in fade-in-50 slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormField
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        error={errors.name?.message}
        required
        disabled={isLoading}
        {...register('name')}
      />

      <FormField
        label="Email"
        type="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        required
        disabled={isLoading}
        {...register('email')}
      />

      <PasswordInput
        label="Contraseña"
        placeholder="••••••••"
        error={errors.password?.message}
        required
        disabled={isLoading}
        showStrengthIndicator
        value={password}
        {...register('password')}
      />

      <PasswordInput
        label="Confirmar contraseña"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        required
        disabled={isLoading}
        {...register('confirmPassword')}
      />

      {/* Requisitos de contraseña */}
      <div className="space-y-2 rounded-lg bg-light-50 p-4">
        <p className="text-sm font-medium text-dark">
          La contraseña debe contener:
        </p>
        <ul className="space-y-1 text-sm text-dark-100">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Mínimo 8 caracteres
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Al menos una mayúscula
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Al menos una minúscula
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Al menos un número
          </li>
        </ul>
      </div>

      {/* Términos y condiciones */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-light-100 text-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="text-sm text-dark-100">
          Acepto los{' '}
          <Link
            href="/terminos"
            className="font-medium text-primary hover:text-primary-dark"
          >
            términos y condiciones
          </Link>{' '}
          y la{' '}
          <Link
            href="/privacidad"
            className="font-medium text-primary hover:text-primary-dark"
          >
            política de privacidad
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        className="h-12 w-full"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta'
        )}
      </Button>

      <p className="text-center text-sm text-dark-100">
        ¿Ya tienes una cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
