/**
 * ULE - MIDDLEWARE DE AUTENTICACIÓN
 * Protección de rutas con NextAuth v5
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticación para Ule
 * Protege rutas que requieren autenticación
 */
export default auth((req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Permitir acceso a rutas de auth sin autenticación
  if (path.startsWith('/login') || path.startsWith('/registro')) {
    // Si ya está autenticado, redirigir al dashboard
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Verificar autenticación para rutas protegidas
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verificar roles para rutas administrativas
  if (path.startsWith('/admin') && session.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

/**
 * Configuración de rutas que usa el middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}
