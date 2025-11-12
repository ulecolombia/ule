/**
 * ULE - MIDDLEWARE DE SEGURIDAD
 *
 * Cumplimiento:
 * - OWASP: A05:2021 - Security Misconfiguration
 * - OWASP: A07:2021 - Identification and Authentication Failures
 */

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Orígenes permitidos para CORS
 */
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
].filter(Boolean)

/**
 * Rutas públicas (no requieren autenticación)
 */
const PUBLIC_ROUTES = [
  '/login',
  '/registro',
  '/recuperar-password',
  '/api/auth',
  '/api/health',
  '/',
  '/favicon.ico',
  '/_next',
  '/images',
  '/fonts',
  '/sw.js',
  '/manifest.json',
]

/**
 * Validar origen CORS
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true // Same-origin requests

  // En desarrollo, permitir localhost
  if (process.env.NODE_ENV === 'development') {
    return (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    )
  }

  return ALLOWED_ORIGINS.some((allowed) => allowed && origin.startsWith(allowed))
}

/**
 * Manejar preflight requests (OPTIONS)
 */
function handlePreflight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null

  const origin = request.headers.get('origin')

  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  const response = new NextResponse(null, { status: 204 })

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
  )
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * Agregar headers CORS a respuesta
 */
function addCORSHeaders(response: NextResponse, origin: string | null): void {
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
}

/**
 * Agregar headers de seguridad
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")
}

/**
 * Verificar si la ruta es pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  )
}

export default auth(async (req) => {
  const session = req.auth
  const path = req.nextUrl.pathname
  const origin = req.headers.get('origin')

  // 1. Manejar preflight requests
  const preflightResponse = handlePreflight(req as NextRequest)
  if (preflightResponse) return preflightResponse

  // 2. Validar origen CORS
  if (origin && !isAllowedOrigin(origin)) {
    return new NextResponse(
      JSON.stringify({
        error: 'CORS policy violation',
        code: 'FORBIDDEN_ORIGIN',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // 3. Verificar autenticación para rutas protegidas
  if (!isPublicRoute(path) && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)

    const response = NextResponse.redirect(loginUrl)
    addCORSHeaders(response, origin)
    addSecurityHeaders(response)
    return response
  }

  // 4. Proteger rutas de admin
  if (path.startsWith('/admin')) {
    if (!session || session.user?.role !== 'ADMIN') {
      const response = NextResponse.redirect(new URL('/dashboard', req.url))
      addCORSHeaders(response, origin)
      addSecurityHeaders(response)
      return response
    }
  }

  // 5. Crear respuesta exitosa
  const response = NextResponse.next()

  // 6. Agregar headers CORS y seguridad
  addCORSHeaders(response, origin)
  addSecurityHeaders(response)

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
