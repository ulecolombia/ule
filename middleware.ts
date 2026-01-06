/**
 * ULE - MIDDLEWARE DE AUTENTICACIÓN
 * Protección de rutas con NextAuth v5
 *
 * Flujo de verificación:
 * 1. ¿Está autenticado? → Si no, redirigir a /login
 * 2. ¿Tiene perfil completo? → Si no, redirigir a /onboarding
 * 3. ¿Tiene autorización PILA? → Si no, redirigir a /autorizacion-pila
 * 4. Si todo OK → Permitir acceso
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
    // Si ya está autenticado Y tiene perfil completo Y autorización PILA, redirigir a dashboard
    if (
      session &&
      session.user?.perfilCompleto === true &&
      session.user?.autorizacionPILACompleta === true
    ) {
      const redirectUrl = new URL('/dashboard', req.url)
      redirectUrl.searchParams.set('message', 'already-authenticated')
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  // Permitir acceso a onboarding siempre que esté autenticado
  if (path.startsWith('/onboarding')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Si ya completó el perfil, redirigir a autorización PILA o dashboard
    if (session.user?.perfilCompleto === true) {
      // Si no tiene autorización PILA, redirigir a esa página
      if (session.user?.autorizacionPILACompleta !== true) {
        return NextResponse.redirect(new URL('/autorizacion-pila', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Permitir acceso a autorización PILA si tiene perfil completo pero no autorización
  if (path.startsWith('/autorizacion-pila')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Si no tiene perfil completo, primero debe completarlo
    if (session.user?.perfilCompleto !== true) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    // Si ya tiene autorización PILA, redirigir al dashboard
    if (session.user?.autorizacionPILACompleta === true) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Verificar autenticación para rutas protegidas
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // IMPORTANTE: Redirigir usuarios con perfil incompleto a onboarding
  // Excepto para rutas que permiten completar el perfil
  const rutasPermitidasSinPerfil = ['/perfil', '/api']
  const esRutaPermitida = rutasPermitidasSinPerfil.some((ruta) =>
    path.startsWith(ruta)
  )

  if (!esRutaPermitida && session.user?.perfilCompleto === false) {
    const redirectUrl = new URL('/onboarding', req.url)
    redirectUrl.searchParams.set('message', 'complete-profile')
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANTE: Redirigir usuarios sin autorización PILA
  // Excepto para rutas permitidas
  const rutasPermitidasSinAutorizacion = ['/perfil', '/api', '/legal']
  const esRutaPermitidaSinAuth = rutasPermitidasSinAutorizacion.some((ruta) =>
    path.startsWith(ruta)
  )

  if (
    !esRutaPermitidaSinAuth &&
    session.user?.perfilCompleto === true &&
    session.user?.autorizacionPILACompleta !== true
  ) {
    const redirectUrl = new URL('/autorizacion-pila', req.url)
    redirectUrl.searchParams.set('message', 'authorization-required')
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
    '/autorizacion-pila/:path*',
    '/cuenta-cobro/:path*',
    '/calendario/:path*',
    '/biblioteca/:path*',
    '/herramientas/:path*',
    '/ayuda/:path*',
  ],
}
