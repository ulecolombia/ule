/**
 * ULE - EXTENSIÓN DE TIPOS DE NEXTAUTH
 * Tipos extendidos para incluir campos personalizados
 */

import { DefaultSession } from 'next-auth'
import { Role } from '@prisma/client'

/**
 * Extensión de tipos de NextAuth para incluir campos custom
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  interface User {
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
