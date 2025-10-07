/**
 * ULE - CONFIGURACIÓN DE NEXTAUTH
 * Configuración central de autenticación con NextAuth v5
 */

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { comparePasswords } from '@/lib/password'
import { loginSchema } from '@/lib/auth-validations'
import type { User } from '@prisma/client'

/**
 * Configuración de NextAuth v5 para Ule
 *
 * Estrategia: JWT (stateless) para mejor rendimiento
 * Providers: Credentials (email/password)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // JWT para mejor escalabilidad
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login', // Redirigir errores al login
    verifyRequest: '/login', // Para verificación de email (futuro)
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        // Validar credenciales con Zod
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          throw new Error('Credenciales inválidas')
        }

        const { email, password } = validatedFields.data

        // Buscar usuario en BD
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user || !user.password) {
          throw new Error('Usuario no encontrado')
        }

        // Verificar contraseña
        const isPasswordValid = await comparePasswords(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta')
        }

        // Retornar usuario sin password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Callback JWT: Agregar campos custom al token
     */
    async jwt({ token, user, trigger, session }) {
      // En el primer login, agregar datos del usuario al token
      if (user) {
        token.id = user.id
        token.role = (user as User).role
      }

      // Actualizar token si hay cambios en la sesión
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },

    /**
     * Callback Session: Agregar campos custom a la sesión
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as User['role']
      }

      return session
    },

    /**
     * Callback Redirect: Personalizar redirecciones
     */
    async redirect({ url, baseUrl }) {
      // Redirigir al dashboard después del login
      if (url === baseUrl) {
        return `${baseUrl}/dashboard`
      }
      // Permitir callback URLs del mismo origen
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Manejar URLs relativas
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Fallback al baseUrl
      return baseUrl
    },
  },
  events: {
    /**
     * Evento: Usuario inició sesión
     */
    async signIn({ user }) {
      console.log(`[Ule Auth] Usuario ${user.email} inició sesión`)
      // Aquí puedes agregar lógica de auditoría, analytics, etc.
    },

    /**
     * Evento: Usuario cerró sesión
     */
    async signOut() {
      console.log(`[Ule Auth] Usuario cerró sesión`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
