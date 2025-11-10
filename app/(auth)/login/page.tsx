/**
 * ULE - PÁGINA DE LOGIN
 * Sistema de autenticación con diseño Ule
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

export default function LoginPage() {
  const router = useRouter()
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

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Error al iniciar sesión', {
          description: 'Email o contraseña incorrectos',
          className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        })
      } else {
        toast.success('¡Bienvenido!', {
          description: 'Iniciando sesión...',
          className: 'bg-success-light dark:bg-success-dark text-success-text-light dark:text-success-text-dark',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado',
        className: 'bg-red-100 text-red-800',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-lg bg-card-light dark:bg-card-dark p-8 shadow-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo size="lg" className="mx-auto mb-2" />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-text-light dark:text-text-dark">
              ¡Hola!
            </h1>
            <p className="text-subtext-light dark:text-subtext-dark">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-text-light dark:text-text-dark"
              >
                <span className="material-symbols-outlined mr-2 inline-block align-middle text-base">
                  email
                </span>
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-text-light dark:text-text-dark"
              >
                <span className="material-symbols-outlined mr-2 inline-block align-middle text-base">
                  lock
                </span>
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              icon={isLoading ? Loader2 : ArrowRight}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-subtext-light dark:text-subtext-dark">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="font-semibold text-primary hover:underline">
                Crear cuenta nueva
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
