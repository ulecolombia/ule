/**
 * ULE - PÁGINA DE LOGIN MODERNA
 * Sistema de autenticación profesional con OAuth y credenciales
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { Divider } from '@/components/auth/Divider'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
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
        })
      } else {
        toast.success('¡Bienvenido de vuelta!', {
          description: 'Redirigiendo...',
        })
        router.push(callbackUrl)
        router.refresh()
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
        <div className="mb-8 flex flex-col items-center">
          {/* Logo oficial de Ule */}
          <Logo size="lg" />

          {/* Tagline */}
          <p className="mt-4 text-sm text-gray-500">Simplifica tu vida</p>
        </div>

        {/* Título de la Sección */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Iniciar sesión
          </h2>
          <p className="text-sm text-gray-600">Accede a tu cuenta de Ule</p>
        </div>

        {/* Botones de Autenticación Social */}
        <SocialLoginButtons callbackUrl={callbackUrl} />

        {/* Separador */}
        <Divider />

        {/* Formulario de Email y Contraseña */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo de Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              {...register('email')}
              className={`
                w-full rounded-xl border px-4 py-3
                transition-all focus:border-transparent focus:outline-none focus:ring-2
                focus:ring-teal-500
                ${errors.email ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <PasswordInput
              id="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Recordarme y Olvidé mi contraseña */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>

            <Link
              href="/recuperar-password"
              className="text-sm text-gray-600 transition-colors hover:text-teal-600"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón Principal de Iniciar Sesión */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full rounded-xl bg-teal-500 py-3 font-semibold text-white shadow-lg shadow-teal-500/20 transition-all duration-200 hover:bg-teal-600 active:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Iniciar sesión</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Link de Registro */}
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link
            href="/registro"
            className="font-semibold text-teal-600 transition-colors hover:text-teal-700"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
