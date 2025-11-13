/**
 * ULE - PÁGINA PRINCIPAL
 * Redirecciona automáticamente a login o dashboard
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  // Si el usuario está autenticado, redirigir a dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  // Si no está autenticado, redirigir a login
  redirect('/login')
}
