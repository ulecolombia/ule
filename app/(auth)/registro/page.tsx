/**
 * ULE - PÁGINA DE REGISTRO
 * Sistema de registro con diseño Ule
 */

'use client'

import { useState, useEffect } from 'react'
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
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import {
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLevel,
  getPasswordRequirements,
} from '@/lib/password-security'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showRequirements, setShowRequirements] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')
  const requirements = getPasswordRequirements()

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
      setShowRequirements(true)
    } else {
      setShowRequirements(false)
    }
  }, [password])

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('Error al crear cuenta', {
          description: result.message || 'Ocurrió un error',
          className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        })
        return
      }

      toast.success('¡Cuenta creada!', {
        description: 'Iniciando sesión y redirigiendo al onboarding...',
        className: 'bg-success-light dark:bg-success-dark text-success-text-light dark:text-success-text-dark',
      })

      // Auto-login después de registro exitoso
      const loginResult = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (loginResult?.ok) {
        // Redirigir al onboarding
        router.push('/onboarding')
      } else {
        // Si el auto-login falla, redirigir al login manual
        toast.info('Por favor inicia sesión', {
          description: 'Tu cuenta fue creada exitosamente',
        })
        router.push('/login')
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
              Crear Cuenta
            </h1>
            <p className="text-subtext-light dark:text-subtext-dark">
              Únete a Ule hoy mismo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-text-light dark:text-text-dark"
              >
                <span className="material-symbols-outlined mr-2 inline-block align-middle text-base">
                  person
                </span>
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                autoComplete="name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

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
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-subtext-light dark:text-subtext-dark">
                      Fortaleza:
                    </span>
                    <span
                      className="font-medium"
                      style={{
                        color: getPasswordStrengthColor(passwordStrength),
                      }}
                    >
                      {getPasswordStrengthLevel(passwordStrength) === 'weak' && 'Débil'}
                      {getPasswordStrengthLevel(passwordStrength) === 'medium' && 'Media'}
                      {getPasswordStrengthLevel(passwordStrength) === 'strong' && 'Fuerte'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength),
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              {showRequirements && (
                <div className="mt-3 space-y-1.5">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span
                        className={`material-symbols-outlined text-base ${
                          req.test(password)
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {req.test(password) ? 'check_circle' : 'cancel'}
                      </span>
                      <span
                        className={
                          req.test(password)
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-subtext-light dark:text-subtext-dark'
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-text-light dark:text-text-dark"
              >
                <span className="material-symbols-outlined mr-2 inline-block align-middle text-base">
                  lock_reset
                </span>
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}

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
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-subtext-light dark:text-subtext-dark">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
