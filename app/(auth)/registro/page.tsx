/**
 * ULE - PÁGINA DE REGISTRO MODERNA
 * Sistema de registro profesional con OAuth y validación avanzada
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { Divider } from '@/components/auth/Divider'
import { PasswordInput } from '@/components/auth/PasswordInput'
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
        })
        return
      }

      toast.success('¡Cuenta creada!', {
        description: 'Iniciando sesión...',
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
        router.refresh()
      } else {
        // Si el auto-login falla, redirigir al login manual
        toast.info('Por favor inicia sesión', {
          description: 'Tu cuenta fue creada exitosamente',
        })
        router.push('/login')
      }
    } catch (error) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 md:p-8">
      <div className="w-full max-w-[420px]">
        {/* Logo y Branding */}
        <div className="text-center mb-8">
          {/* Logo - Círculo turquesa con "U" */}
          <div className="mx-auto w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
            <span className="text-white font-bold text-2xl">U</span>
          </div>

          {/* Nombre de la marca */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ule</h1>

          {/* Tagline */}
          <p className="text-gray-500 text-sm">Simplifica tu vida</p>
        </div>

        {/* Título de la Sección */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Crear cuenta
          </h2>
          <p className="text-gray-600 text-sm">
            Únete a Ule y gestiona tus aportes fácilmente
          </p>
        </div>

        {/* Botones de Autenticación Social */}
        <SocialLoginButtons callbackUrl="/onboarding" />

        {/* Separador */}
        <Divider />

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo de Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              autoComplete="name"
              {...register('name')}
              className={`
                w-full px-4 py-3 border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                transition-all
                ${errors.name ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register('email')}
              className={`
                w-full px-4 py-3 border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                transition-all
                ${errors.email ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <PasswordInput
              id="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fortaleza:</span>
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
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
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
                {requirements.map((req, index) => {
                  const meetsRequirement = req.test(password)
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className={`text-base ${meetsRequirement ? 'text-green-600' : 'text-gray-400'}`}>
                        {meetsRequirement ? '✓' : '○'}
                      </span>
                      <span className={meetsRequirement ? 'text-green-700' : 'text-gray-600'}>
                        {req.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Campo de Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Términos y Condiciones */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              Acepto los{' '}
              <Link href="/terminos" className="text-teal-600 hover:text-teal-700 font-medium">
                términos y condiciones
              </Link>
              {' '}y la{' '}
              <Link href="/privacidad" className="text-teal-600 hover:text-teal-700 font-medium">
                política de privacidad
              </Link>
            </label>
          </div>

          {/* Botón Principal de Registro */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 text-white py-3 rounded-xl font-semibold hover:bg-teal-600 active:bg-teal-700 transition-all duration-200 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Crear cuenta</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Link de Login */}
        <p className="text-center mt-6 text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
