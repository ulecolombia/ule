/**
 * ULE - PÁGINA PRINCIPAL
 * Redirecciona automáticamente según estado del usuario
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  // Si el usuario está autenticado
  if (session?.user) {
    // Si perfil completo → dashboard
    if (session.user.perfilCompleto === true) {
      redirect('/dashboard')
    }
    // Si perfil incompleto → onboarding
    redirect('/onboarding')
  }

  // Si no está autenticado → login
  redirect('/login')
}
