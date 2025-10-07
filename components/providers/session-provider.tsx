'use client'

/**
 * ULE - SESSION PROVIDER
 * Provider de sesión para componentes cliente
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

/**
 * Provider de sesión para componentes client
 * Wrapper de NextAuth SessionProvider
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
