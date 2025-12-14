/**
 * ULE - LAYOUT DE AUTENTICACIÓN
 * Layout para páginas públicas de autenticación
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Layout para páginas de autenticación
 * Redirige al dashboard solo si ya completó el perfil
 * Permite acceso si perfil incompleto (para cerrar sesión/cambiar cuenta)
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Solo redirigir si está autenticado Y tiene perfil completo
  // Permitir acceso si perfil incompleto (para cerrar sesión/cambiar cuenta)
  if (session?.user?.perfilCompleto === true) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
