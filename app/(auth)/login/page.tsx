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
            Iniciar sesión
          </h2>
          <p className="text-gray-600 text-sm flex items-center justify-center gap-1">
            Accede a tu cuenta de
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-5 bg-teal-500 rounded text-white text-xs font-bold flex items-center justify-center">U</span>
              <span className="font-medium text-gray-900">Ule</span>
            </span>
          </p>
        </div>

        {/* Botones de Autenticación Social */}
        <SocialLoginButtons callbackUrl={callbackUrl} />

        {/* Separador */}
        <Divider />

        {/* Formulario de Email y Contraseña */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Recordarme y Olvidé mi contraseña */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">Recordarme</span>
            </label>

            <Link
              href="/recuperar-password"
              className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón Principal de Iniciar Sesión */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-500 text-white py-3 rounded-xl font-semibold hover:bg-teal-600 active:bg-teal-700 transition-all duration-200 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Iniciar sesión</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Link de Registro */}
        <p className="text-center mt-6 text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link href="/registro" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
