'use client'

/**
 * ULE - FORMULARIO DE LOGIN
 * Formulario de inicio de sesión con validaciones
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormField } from './form-field'
import { PasswordInput } from './password-input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginSchema, type LoginInput } from '@/lib/auth-validations'
import { AlertCircle, Loader2 } from 'lucide-react'

/**
 * Formulario de inicio de sesión
 * Estilo N26 con validaciones robustas
 */
export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email o contraseña incorrectos')
        return
      }

      // Redirigir al dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      console.error('[Ule Auth] Error en login:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        {...register('password')}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-light-100 text-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-dark-100">Recordarme</span>
        </label>

        <Link
          href="/recuperar-contrasena"
          className="font-medium text-primary transition-colors hover:text-primary-dark"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button
        type="submit"
        className="h-12 w-full"
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </Button>

      <p className="text-center text-sm text-dark-100">
        ¿No tienes una cuenta?{' '}
        <Link
          href="/registro"
          className="font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Regístrate aquí
        </Link>
      </p>
    </form>
  )
}
