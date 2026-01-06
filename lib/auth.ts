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
          autorizacionPILACompleta: user.autorizacionPILACompleta,
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
      console.log(
        `[Ule Auth signIn] Provider: ${account?.provider}, Email: ${user.email}`
      )

      // Solo procesar OAuth (Google/Apple)
      if (account?.provider && account.provider !== 'credentials') {
        // Validar que tenemos email
        if (!user.email) {
          console.error('[Ule Auth] OAuth user sin email - denegando acceso')
          return false
        }

        try {
          const { db } = await import('@/lib/db')
          const email = user.email.toLowerCase().trim()

          // Extraer nombre y apellido del nombre completo de OAuth
          const nombreCompleto = user.name || email.split('@')[0] || 'Usuario'
          const partes = nombreCompleto.trim().split(/\s+/)
          const primerNombre = partes[0] || nombreCompleto
          const segundoNombre = partes.length > 2 ? partes[1] : null
          const primerApellido = partes.length > 2 ? partes[2] : partes[1] || ''
          const segundoApellido =
            partes.length > 3 ? partes.slice(3).join(' ') : ''

          // Usar upsert para crear o actualizar en una sola operación
          await db.user.upsert({
            where: { email },
            update: {
              name: nombreCompleto,
              image: user.image || undefined,
              emailVerified: new Date(),
            },
            create: {
              email: email,
              name: nombreCompleto,
              primerNombre: primerNombre,
              segundoNombre: segundoNombre,
              primerApellido: primerApellido,
              segundoApellido: segundoApellido,
              image: user.image ?? null,
              role: 'USER',
              perfilCompleto: false,
              emailVerified: new Date(),
            },
          })

          console.log(`[Ule Auth] Usuario OAuth procesado: ${email}`)
        } catch (error) {
          // Log el error pero NO denegar el login
          // El usuario podrá entrar, solo que sin datos de BD
          console.error('[Ule Auth] Error en BD (continuando):', error)
        }
      }

      return true // Siempre permitir login OAuth
    },

    /**
     * Callback JWT: Agregar campos custom al token
     * Para OAuth: obtener datos del usuario desde la BD (incluyendo el ID correcto)
     */
    async jwt({ token, user, trigger, session, account }) {
      // Primer login - configurar token
      if (user && user.email) {
        console.log(`[Ule Auth jwt] Configurando token para: ${user.email}`)

        // Para OAuth, necesitamos obtener el ID y datos de nuestra BD
        if (account?.provider && account.provider !== 'credentials') {
          try {
            const { db } = await import('@/lib/db')
            const dbUser = await db.user.findUnique({
              where: { email: user.email.toLowerCase().trim() },
              select: {
                id: true,
                perfilCompleto: true,
                autorizacionPILACompleta: true,
                role: true,
                isAdmin: true,
                isSuperAdmin: true,
              },
            })

            if (dbUser) {
              // Usar el ID de nuestra BD, no el de OAuth
              token.id = dbUser.id
              token.perfilCompleto = dbUser.perfilCompleto
              token.autorizacionPILACompleta = dbUser.autorizacionPILACompleta
              token.role = dbUser.role
              token.isAdmin = dbUser.isAdmin || false
              token.isSuperAdmin = dbUser.isSuperAdmin || false
              console.log(
                `[Ule Auth jwt] OAuth user - perfilCompleto: ${dbUser.perfilCompleto}`
              )
            } else {
              // Usuario no encontrado en BD (raro, pero manejamos)
              token.id = user.id
              token.perfilCompleto = false
              token.autorizacionPILACompleta = false
              token.role = 'USER'
              token.isAdmin = false
              token.isSuperAdmin = false
              console.log('[Ule Auth jwt] OAuth user no encontrado en BD')
            }
          } catch (error) {
            console.error('[Ule Auth jwt] Error obteniendo usuario:', error)
            // Defaults seguros
            token.id = user.id
            token.perfilCompleto = false
            token.autorizacionPILACompleta = false
            token.role = 'USER'
            token.isAdmin = false
            token.isSuperAdmin = false
          }
        } else {
          // Credentials user - datos vienen del authorize()
          token.id = user.id
          token.perfilCompleto = (user as User).perfilCompleto
          token.autorizacionPILACompleta = (
            user as User
          ).autorizacionPILACompleta
          token.role = (user as User).role
          token.isAdmin = (user as User).isAdmin || false
          token.isSuperAdmin = (user as User).isSuperAdmin || false
        }
      }

      // Actualizar token si hay cambios en la sesión
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
        token.perfilCompleto = session.perfilCompleto
        if (session.autorizacionPILACompleta !== undefined)
          token.autorizacionPILACompleta = session.autorizacionPILACompleta
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
        session.user.autorizacionPILACompleta =
          token.autorizacionPILACompleta as boolean
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
