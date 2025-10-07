/**
 * ULE - LAYOUT DE AUTENTICACIÓN
 * Layout para páginas públicas de autenticación
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Layout para páginas de autenticación
 * Redirige al dashboard si ya está autenticado
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Si ya está autenticado, redirigir al dashboard
  if (session) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
