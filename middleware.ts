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
export default auth(async (req) => {
  const session = req.auth
  const path = req.nextUrl.pathname

  // Permitir acceso a rutas de auth sin autenticación
  if (path.startsWith('/login') || path.startsWith('/registro')) {
    // Si ya está autenticado, redirigir al dashboard con mensaje
    if (session) {
      const redirectUrl = new URL('/dashboard', req.url)
      redirectUrl.searchParams.set('message', 'already-authenticated')
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  // Permitir acceso a onboarding siempre que esté autenticado
  if (path.startsWith('/onboarding')) {
    // Solo verificar autenticación, no perfil completo
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // Verificar autenticación para rutas protegidas
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verificar perfil completo solo para rutas que realmente lo requieren
  // Facturación hace su propia validación de campos tributarios específicos
  const rutasCriticas = ['/pila', '/archivo']
  const esRutaCritica = rutasCriticas.some((ruta) => path.startsWith(ruta))

  if (esRutaCritica && session.user?.perfilCompleto === false) {
    const redirectUrl = new URL('/dashboard', req.url)
    redirectUrl.searchParams.set('message', 'incomplete-profile')
    return NextResponse.redirect(redirectUrl)
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
    '/dashboard/:path*',
    '/pila/:path*',
    '/facturacion/:path*',
    '/asesoria/:path*',
    '/archivo/:path*',
    '/perfil/:path*',
    '/login',
    '/registro',
    '/onboarding/:path*',
  ],
}
