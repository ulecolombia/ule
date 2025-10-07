'use client'

/**
 * ULE - HOOK DE AUTENTICACIÓN
 * Hook personalizado para manejar autenticación
 */

import { useSession } from 'next-auth/react'

/**
 * Hook personalizado para manejar autenticación
 * Simplifica el uso de NextAuth en componentes
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    role: session?.user?.role,
    isAdmin: session?.user?.role === 'ADMIN',
    isEmployee: session?.user?.role === 'EMPLOYEE',
  }
}
