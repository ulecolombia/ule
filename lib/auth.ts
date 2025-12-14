/**
 * ULE - CONFIGURACIÓN DE NEXTAUTH
 * Configuración central de autenticación con NextAuth v5
 */

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import { loginSchema } from '@/lib/validations/auth'
import { validateNextAuthSecret } from '@/lib/env-validation'
import type { User } from '@prisma/client'

// Validar NEXTAUTH_SECRET al importar este módulo
validateNextAuthSecret()

/**
 * Configuración de NextAuth v5 para Ule
 *
 * Estrategia: JWT (stateless) para mejor rendimiento
 * Providers: Credentials (email/password)
 *
 * IMPORTANTE: Edge Runtime y bcryptjs
 * =====================================
 * No usamos PrismaAdapter porque el middleware corre en Edge Runtime
 * donde Prisma no puede ejecutarse. En su lugar, usamos JWT puro.
 *
 * WARNINGS DE BUILD sobre bcryptjs:
 * Los warnings sobre bcryptjs y crypto en Edge Runtime son esperados y NO afectan
 * la funcionalidad porque:
 * 1. bcryptjs solo se usa en API Routes (Node.js runtime)
 * 2. Usamos lazy imports (dynamic import) para db y password utilities
 * 3. El middleware solo valida JWT tokens (no requiere bcryptjs)
 * 4. La aplicación funciona correctamente en producción
 *
 * Estos warnings son cosméticos y pueden ignorarse de forma segura.
 * Para eliminarlos en el futuro, considerar migrar a @node-rs/bcrypt.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // NO usar adapter - causa problemas con Edge Runtime en middleware
  // adapter: PrismaAdapter(db),
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
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),

    // Credentials (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        // Importar db y password utilities solo cuando se necesitan (no en Edge Runtime)
        const { db } = await import('@/lib/db')
        const { comparePasswords } = await import('@/lib/password')

        // Validar credenciales con Zod
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          throw new Error('Credenciales inválidas')
        }

        const { email, password } = validatedFields.data

        console.log(`[Ule Auth] Intentando login con email: "${email}"`)

        // Buscar usuario en BD
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        })

        console.log(`[Ule Auth] Usuario encontrado:`, user ? 'Sí' : 'No')

        if (!user || !user.password) {
          throw new Error('Usuario no encontrado')
        }

        // Verificar contraseña
        const isPasswordValid = await comparePasswords(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta')
        }

        // ✅ ALTO #10: Incluir permisos de admin para evitar queries repetidas
        // Retornar usuario sin password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          perfilCompleto: user.perfilCompleto,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Callback signIn: Crear/actualizar usuario OAuth ANTES del JWT callback
     * Esto asegura que el usuario exista en la BD cuando JWT intente obtener perfilCompleto
     */
    async signIn({ user, account }) {
      // Solo procesar OAuth (Google/Apple)
      if (account?.provider && account.provider !== 'credentials') {
        const { db } = await import('@/lib/db')

        try {
          // Verificar si el usuario ya existe
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser && user.email) {
            // Crear nuevo usuario desde OAuth
            const email = user.email
            const defaultName = email.split('@')[0] || 'Usuario'
            const userName: string = user.name || defaultName

            await db.user.create({
              data: {
                email: email,
                name: userName,
                image: user.image ?? null,
                role: 'USER',
                perfilCompleto: false,
                emailVerified: new Date(),
              },
            })
            console.log(
              `[Ule Auth] Nuevo usuario OAuth creado desde ${account.provider}`
            )
          } else if (existingUser && user.email) {
            // Actualizar información del usuario existente
            await db.user.update({
              where: { email: user.email },
              data: {
                name: user.name ?? existingUser.name,
                image: user.image ?? existingUser.image,
                emailVerified: new Date(),
              },
            })
            console.log(
              `[Ule Auth] Usuario OAuth actualizado desde ${account.provider}`
            )
          }
        } catch (error) {
          console.error(
            '[Ule Auth] Error al crear/actualizar usuario OAuth:',
            error
          )
          return false // Denegar login si hay error
        }
      }

      return true // Permitir login
    },

    /**
     * Callback JWT: Agregar campos custom al token
     * ✅ ALTO #10: Cachear permisos de admin para evitar queries en cada request
     * ✅ FIX: Para usuarios OAuth, obtener perfilCompleto desde la BD
     */
    async jwt({ token, user, trigger, session, account }) {
      // En el primer login, agregar datos del usuario al token
      if (user) {
        token.id = user.id
        token.role = (user as User).role
        token.isAdmin = (user as User).isAdmin || false
        token.isSuperAdmin = (user as User).isSuperAdmin || false

        // Para usuarios OAuth, perfilCompleto no viene en el objeto user
        // Necesitamos obtenerlo de la BD
        if (account?.provider && account.provider !== 'credentials') {
          // OAuth user - fetch from database
          const { db } = await import('@/lib/db')
          const dbUser = await db.user.findUnique({
            where: { email: user.email! },
            select: {
              perfilCompleto: true,
              role: true,
              isAdmin: true,
              isSuperAdmin: true,
            },
          })

          if (dbUser) {
            token.perfilCompleto = dbUser.perfilCompleto
            token.role = dbUser.role
            token.isAdmin = dbUser.isAdmin || false
            token.isSuperAdmin = dbUser.isSuperAdmin || false
          } else {
            // Usuario nuevo OAuth - perfilCompleto será false
            token.perfilCompleto = false
          }
        } else {
          // Credentials user - ya viene con perfilCompleto
          token.perfilCompleto = (user as User).perfilCompleto
        }
      }

      // Actualizar token si hay cambios en la sesión
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
        token.perfilCompleto = session.perfilCompleto
        if (session.isAdmin !== undefined) token.isAdmin = session.isAdmin
        if (session.isSuperAdmin !== undefined)
          token.isSuperAdmin = session.isSuperAdmin
      }

      return token
    },

    /**
     * Callback Session: Agregar campos custom a la sesión
     * ✅ ALTO #10: Incluir permisos de admin desde JWT (sin query a DB)
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as User['role']
        session.user.perfilCompleto = token.perfilCompleto as boolean
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
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
     * Evento: Usuario inició sesión (solo logging)
     */
    async signIn({ user }) {
      console.log(`[Ule Auth] Usuario ${user.email} inició sesión`)
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
