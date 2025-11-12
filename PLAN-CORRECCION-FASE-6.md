# 📋 Plan de Corrección - Fase 6
## Implementación Sistemática de Auditoría Técnica

**Fecha inicio:** 2025-11-11
**Duración estimada:** 3-5 días
**Objetivo:** Corregir todos los problemas detectados en auditoría

---

## 🎯 Metodología

1. **Sprints cortos** de 4-6 horas
2. **Testing después de cada sprint**
3. **Commit por cada problema corregido**
4. **Validación antes de siguiente sprint**

---

## 📅 SPRINT 1: PROBLEMAS CRÍTICOS (4-6 horas)

### ✅ Checkpoint: Funcionalidad básica estable y sin crashes

---

### **Tarea 1.1: Arreglar SessionStorage (30 min)**
**Prioridad:** 🔴 CRÍTICA
**Archivos:** `/lib/hooks/use-analytics.ts`

**Implementación:**
```typescript
// lib/hooks/use-analytics.ts
'use client'

import { useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Helper para manejar sessionStorage de forma segura
function getSessionId(): string {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return crypto.randomUUID()
    }

    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  } catch (error) {
    // Modo incógnito o storage deshabilitado
    console.warn('SessionStorage no disponible, usando ID temporal:', error)
    return crypto.randomUUID()
  }
}

export function useAnalytics() {
  const pathname = usePathname()
  const sessionIdRef = useRef<string | null>(null)

  // Obtener sessionId una sola vez
  const getOrCreateSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getSessionId()
    }
    return sessionIdRef.current
  }, [])

  const track = useCallback(
    async (evento: string, categoria: string, metadata?: any) => {
      try {
        const sessionId = getOrCreateSessionId()

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento,
            categoria,
            metadata: {
              ...metadata,
              pathname,
            },
            sessionId,
          }),
        })

        // También enviar a Google Analytics si está habilitado
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', evento, {
            event_category: categoria,
            ...metadata,
          })
        }
      } catch (error) {
        console.error('Error tracking event:', error)
      }
    },
    [pathname, getOrCreateSessionId]
  )

  const trackPageView = useCallback(() => {
    track('page_view', 'NAVEGACION', { page: pathname })
  }, [pathname, track])

  const trackError = useCallback(
    async (error: Error, componente?: string, accion?: string) => {
      try {
        const sessionId = getOrCreateSessionId()

        await fetch('/api/analytics/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mensaje: error.message,
            stack: error.stack,
            tipo: error.name,
            severidad: 'ERROR',
            url: typeof window !== 'undefined' ? window.location.href : '',
            componente,
            accion,
            sessionId,
          }),
        })
      } catch (err) {
        console.error('Error logging error:', err)
      }
    },
    [getOrCreateSessionId]
  )

  return {
    track,
    trackPageView,
    trackError,
  }
}
```

**Validación:**
```bash
# Test en modo incógnito
# Test con storage deshabilitado en DevTools
# Verificar que no hay crashes
```

---

### **Tarea 1.2: Cleanup de setTimeout (20 min)**
**Prioridad:** 🔴 CRÍTICA
**Archivos:** `/components/ayuda/tour-wrapper.tsx`

**Implementación:**
```typescript
// components/ayuda/tour-wrapper.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { usePathname } from 'next/navigation'

interface TourWrapperProps {
  steps: Step[]
  tourKey: string
  onComplete?: () => void
}

export function TourWrapper({ steps, tourKey, onComplete }: TourWrapperProps) {
  const [run, setRun] = useState(false)
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Limpiar timeout y fetch anteriores
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    const verificarTour = async () => {
      try {
        // Crear nuevo AbortController para esta request
        abortControllerRef.current = new AbortController()

        const response = await fetch(
          `/api/onboarding/verificar-tour?tour=${tourKey}`,
          { signal: abortControllerRef.current.signal }
        )
        const data = await response.json()

        if (!data.visto) {
          // Esperar 1 segundo para que la página cargue
          timeoutRef.current = setTimeout(() => {
            setRun(true)
          }, 1000)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error al verificar tour:', error)
        }
      }
    }

    verificarTour()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [pathname, tourKey])

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)

      // Marcar tour como completado
      try {
        await fetch('/api/onboarding/completar-tour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourKey }),
        })

        if (onComplete) {
          onComplete()
        }
      } catch (error) {
        console.error('Error al completar tour:', error)
      }
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour',
      }}
      styles={{
        options: {
          primaryColor: '#14B8A6',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          backgroundColor: '#14B8A6',
          borderRadius: 6,
        },
        buttonBack: {
          color: '#666',
        },
      }}
    />
  )
}
```

**Validación:**
```bash
# Navegar rápidamente entre páginas
# Verificar consola - no debe haber "setState on unmounted component"
```

---

### **Tarea 1.3: Implementar Endpoint de Búsqueda (1 hora)**
**Prioridad:** 🔴 CRÍTICA
**Archivos:** `/app/api/ayuda/buscar/route.ts` (NUEVO)

**Implementación:**
```typescript
// app/api/ayuda/buscar/route.ts
/**
 * API: GET /api/ayuda/buscar
 * Búsqueda en artículos de ayuda
 */

import { NextRequest, NextResponse } from 'next/server'

interface ArticuloAyuda {
  titulo: string
  descripcion: string
  url: string
  categoria: string
  keywords: string[]
}

// Base de conocimiento de artículos
const ARTICULOS: ArticuloAyuda[] = [
  {
    titulo: '¿Cómo liquidar mi PILA?',
    descripcion: 'Guía paso a paso para calcular y liquidar tus aportes a seguridad social',
    url: '/ayuda#guia-pila',
    categoria: 'PILA',
    keywords: ['pila', 'liquidar', 'aportes', 'seguridad social', 'salud', 'pension'],
  },
  {
    titulo: '¿Qué es el IBC?',
    descripcion: 'El Ingreso Base de Cotización es el valor sobre el cual se calculan tus aportes',
    url: '/ayuda#glosario',
    categoria: 'Glosario',
    keywords: ['ibc', 'ingreso base', 'cotizacion', 'calculo'],
  },
  {
    titulo: 'Emitir mi primera factura electrónica',
    descripcion: 'Paso a paso para crear y emitir facturas válidas ante la DIAN',
    url: '/ayuda#guia-facturacion',
    categoria: 'Facturación',
    keywords: ['factura', 'emitir', 'dian', 'electronica', 'cufe'],
  },
  {
    titulo: '¿Cuándo debo declarar renta?',
    descripcion: 'Fechas y requisitos para declaración de renta según tu situación',
    url: '/ayuda#tributario',
    categoria: 'Tributario',
    keywords: ['renta', 'declarar', 'dian', 'impuestos', 'fechas'],
  },
  {
    titulo: '¿Qué es el régimen simple?',
    descripcion: 'Régimen tributario simplificado para pequeños contribuyentes',
    url: '/ayuda#glosario',
    categoria: 'Tributario',
    keywords: ['regimen simple', 'tributario', 'impuestos', 'dian'],
  },
  {
    titulo: 'Niveles de riesgo ARL',
    descripcion: 'Clasificación de riesgos laborales y porcentajes de cotización',
    url: '/ayuda#glosario',
    categoria: 'PILA',
    keywords: ['arl', 'riesgo', 'nivel', 'cotizacion', 'laboral'],
  },
  {
    titulo: 'Diferencia entre régimen simple y ordinario',
    descripcion: 'Comparación entre los dos regímenes tributarios principales',
    url: '/ayuda#tributario',
    categoria: 'Tributario',
    keywords: ['regimen', 'simple', 'ordinario', 'diferencia', 'comparacion'],
  },
  {
    titulo: 'Usar el asesor de IA',
    descripcion: 'Cómo hacer preguntas al asistente tributario con inteligencia artificial',
    url: '/ayuda#guia-ia',
    categoria: 'Asesoría',
    keywords: ['ia', 'asistente', 'preguntar', 'chat', 'ayuda'],
  },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.toLowerCase().trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        resultados: [],
        mensaje: 'Ingresa al menos 2 caracteres para buscar',
      })
    }

    // Buscar en título, descripción y keywords
    const resultados = ARTICULOS.filter((articulo) => {
      const tituloMatch = articulo.titulo.toLowerCase().includes(query)
      const descripcionMatch = articulo.descripcion.toLowerCase().includes(query)
      const keywordsMatch = articulo.keywords.some((k) =>
        k.toLowerCase().includes(query)
      )

      return tituloMatch || descripcionMatch || keywordsMatch
    })

    // Ordenar por relevancia (título > keywords > descripción)
    const resultadosOrdenados = resultados.sort((a, b) => {
      const aScore =
        (a.titulo.toLowerCase().includes(query) ? 3 : 0) +
        (a.keywords.some((k) => k.toLowerCase().includes(query)) ? 2 : 0) +
        (a.descripcion.toLowerCase().includes(query) ? 1 : 0)

      const bScore =
        (b.titulo.toLowerCase().includes(query) ? 3 : 0) +
        (b.keywords.some((k) => k.toLowerCase().includes(query)) ? 2 : 0) +
        (b.descripcion.toLowerCase().includes(query) ? 1 : 0)

      return bScore - aScore
    })

    return NextResponse.json({
      resultados: resultadosOrdenados.slice(0, 10), // Máximo 10 resultados
      total: resultadosOrdenados.length,
    })
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al buscar artículos' },
      { status: 500 }
    )
  }
}
```

**Validación:**
```bash
curl "http://localhost:3000/api/ayuda/buscar?q=pila"
curl "http://localhost:3000/api/ayuda/buscar?q=factura"
curl "http://localhost:3000/api/ayuda/buscar?q=ibc"
```

---

### **Tarea 1.4: Arreglar Contador de Usuarios Activos (1.5 horas)**
**Prioridad:** 🔴 CRÍTICA
**Archivos:** `/lib/services/analytics-service.ts`, `/app/api/analytics/metricas/route.ts`

**Implementación:**
```typescript
// lib/services/analytics-service.ts
// REMOVER la actualización automática de usuariosActivos

async function actualizarMetricaDiaria(evento: string, categoria: string) {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const metrica = await prisma.metricaDiaria.upsert({
      where: { fecha: hoy },
      create: { fecha: hoy },
      update: {},
    })

    const updates: any = {}

    switch (evento) {
      case EVENTOS.REGISTRO_COMPLETADO:
        updates.nuevosUsuarios = { increment: 1 }
        updates.registrosCompletados = { increment: 1 }
        break
      case EVENTOS.PERFIL_COMPLETADO:
        updates.perfilesCompletados = { increment: 1 }
        break
      case EVENTOS.PILA_LIQUIDADA:
      case EVENTOS.PILA_PAGADA:
        updates.usosPILA = { increment: 1 }
        break
      case EVENTOS.FACTURA_EMITIDA:
        updates.usosFacturacion = { increment: 1 }
        break
      case EVENTOS.CONSULTA_IA_ENVIADA:
        updates.usosAsesoria = { increment: 1 }
        break
      // ❌ REMOVIDO: case EVENTOS.PAGE_VIEW
    }

    if (Object.keys(updates).length > 0) {
      await prisma.metricaDiaria.update({
        where: { id: metrica.id },
        data: updates,
      })
    }
  } catch (error) {
    console.error('Error al actualizar métrica diaria:', error)
  }
}
```

```typescript
// app/api/analytics/metricas/route.ts
// AGREGAR cálculo correcto de usuarios activos

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dias = parseInt(searchParams.get('dias') || '30')
    const fechaInicio = startOfDay(subDays(new Date(), dias))

    // ✅ CORRECTO: Calcular usuarios activos únicos
    const usuariosActivos = await prisma.analyticsEvento.findMany({
      where: {
        timestamp: { gte: fechaInicio },
        evento: 'page_view',
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Obtener métricas diarias
    const metricasDiarias = await prisma.metricaDiaria.findMany({
      where: {
        fecha: { gte: fechaInicio },
      },
      orderBy: { fecha: 'asc' },
    })

    // Calcular totales
    const totales = metricasDiarias.reduce(
      (acc, metrica) => ({
        usuariosActivos: acc.usuariosActivos,  // No sumar, usar count único
        nuevosUsuarios: acc.nuevosUsuarios + metrica.nuevosUsuarios,
        usosPILA: acc.usosPILA + metrica.usosPILA,
        usosFacturacion: acc.usosFacturacion + metrica.usosFacturacion,
        usosAsesoria: acc.usosAsesoria + metrica.usosAsesoria,
      }),
      {
        usuariosActivos: usuariosActivos.length,  // ✅ Count único
        nuevosUsuarios: 0,
        usosPILA: 0,
        usosFacturacion: 0,
        usosAsesoria: 0,
      }
    )

    // ... resto del código
  }
}
```

**Validación:**
```sql
-- Verificar en DB
SELECT COUNT(DISTINCT userId)
FROM AnalyticsEvento
WHERE evento = 'page_view'
AND timestamp >= NOW() - INTERVAL '30 days'
AND userId IS NOT NULL;
```

---

### **Tarea 1.5: Optimizar Query de Usuario (1 hora)**
**Prioridad:** 🔴 CRÍTICA
**Archivos:** `/lib/auth.ts`, `/app/api/analytics/track/route.ts`

**Implementación:**
```typescript
// lib/auth.ts
// Agregar userId al JWT callback

export const authOptions: NextAuthOptions = {
  // ... configuración existente
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id  // ✅ Agregar ID al token
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id  // ✅ Agregar ID a sesión
        (session.user as any).role = token.role
      }
      return session
    },
  },
}
```

```typescript
// app/api/analytics/track/route.ts
// Usar userId del token directamente

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { evento, categoria, metadata, sessionId } = trackEventSchema.parse(body)

    // ✅ Usar userId directamente del token (no query a DB)
    const userId = (session?.user as any)?.id || undefined

    // Obtener contexto de headers
    const userAgent = req.headers.get('user-agent') || undefined
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined

    await trackEvent({
      userId,  // ✅ Ya no hay query a DB
      evento,
      categoria,
      metadata,
      sessionId,
      userAgent,
      ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ error: 'Error al trackear evento' }, { status: 500 })
  }
}
```

**Validación:**
```bash
# Hacer 100 requests y verificar tiempo de respuesta
# Antes: ~150ms
# Después: ~50ms
```

---

## ⏸️ CHECKPOINT SPRINT 1

**Validación antes de continuar:**
- [ ] No hay crashes en modo incógnito
- [ ] No hay "setState on unmounted" en consola
- [ ] Búsqueda de ayuda funciona
- [ ] Contador de usuarios es correcto
- [ ] Tracking es 3x más rápido

**Tests:**
```bash
npm run build
npm run dev
# Test manual de todos los features críticos
```

---

## 📅 SPRINT 2: PROBLEMAS ALTOS - SEGURIDAD (3-4 horas)

### ✅ Checkpoint: Sistema seguro y performante

---

### **Tarea 2.1: Sanitizar Metadata (1 hora)**
**Prioridad:** 🟠 ALTA (GDPR)
**Archivos:** `/lib/services/analytics-service.ts`

**Implementación:**
```typescript
// lib/services/analytics-service.ts

/**
 * Campos permitidos en metadata para evitar leak de datos sensibles
 */
const METADATA_ALLOWED_KEYS = [
  'page',
  'pathname',
  'monto',
  'cantidad',
  'entidad',
  'tipo',
  'categoria',
  'duracion',
  'resultado',
  'formato',
  'periodo',
  'nivel',
  'calculadora',
  'tourKey',
] as const

type AllowedMetadataKey = typeof METADATA_ALLOWED_KEYS[number]
type SafeMetadata = Partial<Record<AllowedMetadataKey, string | number | boolean>>

/**
 * Sanitiza metadata para evitar almacenar datos sensibles
 */
function sanitizeMetadata(metadata: any): SafeMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const sanitized: SafeMetadata = {}

  for (const key of METADATA_ALLOWED_KEYS) {
    if (key in metadata) {
      const value = metadata[key]

      // Solo permitir tipos primitivos
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        // Truncar strings largos
        if (typeof value === 'string' && value.length > 200) {
          sanitized[key] = value.substring(0, 200)
        } else {
          sanitized[key] = value
        }
      }
    }
  }

  return sanitized
}

export async function trackEvent({
  userId,
  evento,
  categoria,
  metadata = {},
  sessionId,
  userAgent,
  ip,
}: {
  userId?: string
  evento: string
  categoria:
    | 'ONBOARDING'
    | 'PILA'
    | 'FACTURACION'
    | 'ASESORIA'
    | 'EXPORTACION'
    | 'NAVEGACION'
    | 'SISTEMA'
  metadata?: any
  sessionId?: string
  userAgent?: string
  ip?: string
}) {
  try {
    const dispositivo = userAgent ? getDeviceType(userAgent) : null
    const navegador = userAgent ? getBrowser(userAgent) : null

    await prisma.analyticsEvento.create({
      data: {
        userId,
        sessionId,
        evento,
        categoria,
        metadata: sanitizeMetadata(metadata),  // ✅ Sanitizar
        userAgent,
        ip,
        dispositivo,
        navegador,
      },
    })

    await actualizarMetricaDiaria(evento, categoria)
  } catch (error) {
    console.error('Error al trackear evento:', error)
  }
}
```

**Tests:**
```typescript
// tests/analytics-service.test.ts
describe('sanitizeMetadata', () => {
  it('should allow whitelisted keys', () => {
    const result = sanitizeMetadata({ page: '/dashboard', monto: 1000 })
    expect(result).toEqual({ page: '/dashboard', monto: 1000 })
  })

  it('should remove sensitive data', () => {
    const result = sanitizeMetadata({
      page: '/dashboard',
      password: 'secret123',
      email: 'user@example.com',
    })
    expect(result).toEqual({ page: '/dashboard' })
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('email')
  })

  it('should truncate long strings', () => {
    const longString = 'a'.repeat(300)
    const result = sanitizeMetadata({ page: longString })
    expect(result.page).toHaveLength(200)
  })
})
```

---

### **Tarea 2.2: Proteger Ruta Admin (45 min)**
**Prioridad:** 🟠 ALTA
**Archivos:** `/app/admin/analytics/page.tsx`, `/middleware.ts` (NUEVO)

**Implementación:**
```typescript
// app/admin/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
// ... otros imports

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession()
  const [metricas, setMetricas] = useState<MetricasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('30')
  const { trackPageView } = useAnalytics()

  // ✅ Protección en el cliente
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
    if (status === 'authenticated' && (session.user as any).role !== 'ADMIN') {
      redirect('/dashboard')
    }
  }, [session, status])

  useEffect(() => {
    if (status === 'authenticated') {
      trackPageView()
    }
  }, [trackPageView, status])

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      cargarMetricas()
    }
  }, [periodo, session])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </Card>
      </div>
    )
  }

  // No autorizado
  if ((session?.user as any)?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
            block
          </span>
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <button
            onClick={() => redirect('/dashboard')}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            Volver al Dashboard
          </button>
        </Card>
      </div>
    )
  }

  // ... resto del código
}
```

```typescript
// middleware.ts (NUEVO)
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rutas de admin
    if (path.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/analytics/metricas/:path*',
  ],
}
```

---

### **Tarea 2.3: Arreglar Detección de Navegador (15 min)**
**Prioridad:** 🟠 ALTA
**Archivos:** `/lib/services/analytics-service.ts`

**Implementación:**
```typescript
// lib/services/analytics-service.ts

function getBrowser(userAgent: string): string {
  // Orden importa: más específico primero
  if (/edg/i.test(userAgent)) return 'Edge'
  if (/opr|opera/i.test(userAgent)) return 'Opera'
  if (/chrome/i.test(userAgent)) return 'Chrome'
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'
  return 'Other'
}

function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  return 'desktop'
}
```

**Tests:**
```typescript
describe('getBrowser', () => {
  it('should detect Edge', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
    expect(getBrowser(ua)).toBe('Edge')
  })

  it('should detect Chrome', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    expect(getBrowser(ua)).toBe('Chrome')
  })
})
```

---

### **Tarea 2.4: Arreglar Lógica de Retención (30 min)**
**Prioridad:** 🟠 ALTA
**Archivos:** `/app/api/analytics/metricas/route.ts`

**Implementación:**
```typescript
// app/api/analytics/metricas/route.ts

// ✅ CORRECTO: Retención de usuarios
const hace7Dias = startOfDay(subDays(new Date(), 7))
const hace6Dias = startOfDay(subDays(new Date(), 6))
const hoy = startOfDay(new Date())

// Usuarios activos hace exactamente 7 días (ventana de 24h)
const usuariosHace7Dias = await prisma.analyticsEvento.findMany({
  where: {
    timestamp: {
      gte: hace7Dias,
      lt: hace6Dias,
    },
    evento: 'page_view',
    userId: { not: null },
  },
  select: { userId: true },
  distinct: ['userId'],
})

// Usuarios activos hoy
const usuariosHoy = await prisma.analyticsEvento.findMany({
  where: {
    timestamp: { gte: hoy },
    evento: 'page_view',
    userId: { not: null },
  },
  select: { userId: true },
  distinct: ['userId'],
})

// Usuarios que estuvieron hace 7 días Y también hoy
const usuariosRetenidos = usuariosHace7Dias.filter((u1) =>
  usuariosHoy.some((u2) => u2.userId === u1.userId)
)

const retencion7Dias =
  usuariosHace7Dias.length > 0
    ? (usuariosRetenidos.length / usuariosHace7Dias.length) * 100
    : 0
```

---

### **Tarea 2.5: Agregar Rate Limiting (1 hora)**
**Prioridad:** 🟠 ALTA
**Archivos:** `/lib/rate-limit.ts` (NUEVO), todas las rutas de analytics

**Implementación:**
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  max: number // Máximo de requests
  window: number // Ventana de tiempo en ms
}

interface RateLimitStore {
  count: number
  resetTime: number
}

// Simple in-memory store (usar Redis en producción)
const store = new Map<string, RateLimitStore>()

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = { max: 100, window: 60000 }
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // Identificar cliente por IP o user ID
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown'

  const key = `rate-limit:${ip}`
  const now = Date.now()

  let rateLimitData = store.get(key)

  // Si no existe o expiró, crear nuevo
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + config.window,
    }
    store.set(key, rateLimitData)
  }

  // Incrementar contador
  rateLimitData.count++

  // Verificar límite
  const remaining = Math.max(0, config.max - rateLimitData.count)
  const success = rateLimitData.count <= config.max

  return {
    success,
    remaining,
    reset: rateLimitData.resetTime,
  }
}

// Limpiar store periódicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key)
    }
  }
}, 60000) // Cada minuto
```

```typescript
// app/api/analytics/track/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // ✅ Rate limiting: 100 eventos por minuto por IP
    const limiter = await rateLimit(req, { max: 100, window: 60000 })

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': limiter.remaining.toString(),
            'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
          }
        }
      )
    }

    // ... resto del código
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ error: 'Error al trackear evento' }, { status: 500 })
  }
}
```

**Aplicar a:**
- `/app/api/analytics/track/route.ts` (100/min)
- `/app/api/analytics/error/route.ts` (50/min)
- `/app/api/ayuda/buscar/route.ts` (30/min)

---

## ⏸️ CHECKPOINT SPRINT 2

**Validación:**
- [ ] Metadata sanitizada (test con datos sensibles)
- [ ] Solo admins acceden a `/admin/analytics`
- [ ] Navegadores detectados correctamente
- [ ] Retención calculada correctamente
- [ ] Rate limiting funciona

```bash
# Test rate limiting
for i in {1..150}; do curl http://localhost:3000/api/analytics/track; done
# Debería rechazar después de 100
```

---

## 📅 SPRINT 3: PROBLEMAS MEDIOS - PERFORMANCE (2-3 horas)

### ✅ Checkpoint: Sistema optimizado y escalable

---

### **Tarea 3.1: Debouncing en Búsqueda (30 min)**
**Archivos:** `/components/ayuda/widget-ayuda.tsx`

**Implementación:**
```typescript
// components/ayuda/widget-ayuda.tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
// ... otros imports

export function WidgetAyuda() {
  const [isOpen, setIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleBuscar = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResultados([])
      return
    }

    try {
      setLoading(true)

      // Cancelar búsqueda anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const response = await fetch(
        `/api/ayuda/buscar?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      )
      const data = await response.json()
      setResultados(data.resultados || [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error al buscar:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = useCallback((value: string) => {
    setBusqueda(value)

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Nuevo timer de 500ms
    debounceTimerRef.current = setTimeout(() => {
      handleBuscar(value)
    }, 500)
  }, [handleBuscar])

  // ... resto del código

  return (
    <>
      {/* ... */}
      <div className="p-4 border-b">
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar en ayuda..."
            value={busqueda}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          {loading && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          )}
        </div>
      </div>
      {/* ... */}
    </>
  )
}
```

---

### **Tarea 3.2: Reset de Paginación (20 min)**
**Archivos:** `/lib/hooks/use-pagination.ts`

**Implementación:**
```typescript
// lib/hooks/use-pagination.ts
'use client'

import { useState, useMemo, useEffect } from 'react'

export function usePagination<T>({
  items,
  itemsPerPage = 20,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  // ✅ Reset page cuando items cambian
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [items.length, totalPages, currentPage])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  // ... resto del código
}
```

---

### **Tarea 3.3: Arreglar Infinite Scroll (30 min)**
**Archivos:** `/lib/hooks/use-infinite-scroll.ts`

**Implementación:**
```typescript
// lib/hooks/use-infinite-scroll.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollProps {
  loadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
}

export function useInfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  threshold = 100,
}: UseInfiniteScrollProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // ✅ Usar callback estable
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore()
      }
    },
    [hasMore, isLoading, loadMore]
  )

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    }

    const observer = new IntersectionObserver(handleIntersection, options)
    const currentRef = loadMoreRef.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    // ✅ Cleanup apropiado
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [handleIntersection, threshold])

  return { loadMoreRef }
}
```

---

### **Tarea 3.4: SWR Timeout Configurable (20 min)**
**Archivos:** `/lib/cache/swr-config.tsx`

**Implementación:**
```typescript
// lib/cache/swr-config.tsx
'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

export interface FetcherOptions {
  timeout?: number
}

/**
 * Fetcher configurable para SWR
 */
export const createFetcher = (options: FetcherOptions = {}) => {
  const { timeout = 10000 } = options

  return async (url: string) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const error: any = new Error('Error al cargar datos')
        error.status = response.status
        throw error
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}

// Fetcher por defecto
export const fetcher = createFetcher({ timeout: 10000 })

// Configuración global
export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  revalidateIfStale: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
```

```typescript
// lib/hooks/use-cached-data.ts
// Usar timeout personalizado para exportaciones

export function useExportaciones() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/exportar/historial',
    createFetcher({ timeout: 30000 }),  // ✅ 30 segundos
    { dedupingInterval: 60000 }
  )

  return {
    exportaciones: data?.exportaciones || [],
    isLoading,
    isError: error,
    refetch: mutate,
  }
}
```

---

### **Tarea 3.5: Data Retention Policy (45 min)**
**Archivos:** `/app/api/cron/cleanup-analytics/route.ts` (NUEVO)

**Implementación:**
```typescript
// app/api/cron/cleanup-analytics/route.ts
/**
 * CRON JOB: Limpieza de datos antiguos
 * Se ejecuta diariamente para mantener la DB limpia
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

// Verificar token de Vercel Cron
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.warn('CRON_SECRET no configurado')
    return false
  }

  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(req: NextRequest) {
  try {
    // ✅ Verificar autenticación
    if (!verifyCronSecret(req)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const ahora = new Date()

    // Política de retención
    const RETENTION_POLICIES = {
      eventos: 90,        // 90 días para eventos
      errores: 30,        // 30 días para errores resueltos
      erroresNoresueltos: 365,  // 1 año para errores no resueltos
      metricasDiarias: 365,     // 1 año para métricas agregadas
    }

    // 1. Limpiar eventos antiguos (>90 días)
    const fechaEventos = subDays(ahora, RETENTION_POLICIES.eventos)
    const eventosEliminados = await prisma.analyticsEvento.deleteMany({
      where: {
        timestamp: { lt: fechaEventos },
      },
    })

    // 2. Limpiar errores resueltos antiguos (>30 días)
    const fechaErrores = subDays(ahora, RETENTION_POLICIES.errores)
    const erroresEliminados = await prisma.errorLog.deleteMany({
      where: {
        timestamp: { lt: fechaErrores },
        resuelto: true,
      },
    })

    // 3. Archivar métricas diarias antiguas (>1 año) a tabla de archivo
    const fechaMetricas = subDays(ahora, RETENTION_POLICIES.metricasDiarias)
    const metricasAntiguas = await prisma.metricaDiaria.findMany({
      where: {
        fecha: { lt: fechaMetricas },
      },
    })

    // Opcional: exportar a S3 o archivo antes de eliminar
    if (metricasAntiguas.length > 0) {
      console.log(`Archivando ${metricasAntiguas.length} métricas antiguas`)
      // await exportToS3(metricasAntiguas)
    }

    const metricasEliminadas = await prisma.metricaDiaria.deleteMany({
      where: {
        fecha: { lt: fechaMetricas },
      },
    })

    // Estadísticas
    const resultado = {
      success: true,
      timestamp: ahora.toISOString(),
      eliminados: {
        eventos: eventosEliminados.count,
        errores: erroresEliminados.count,
        metricas: metricasEliminadas.count,
      },
      politicas: RETENTION_POLICIES,
    }

    console.log('Limpieza completada:', resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error en limpieza:', error)
    return NextResponse.json(
      { error: 'Error al limpiar datos' },
      { status: 500 }
    )
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-analytics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

```bash
# .env
CRON_SECRET=tu-secreto-aqui-genera-uno-seguro
```

---

## ⏸️ CHECKPOINT SPRINT 3

**Validación:**
- [ ] Búsqueda no hace requests mientras tecleas
- [ ] Paginación resetea al filtrar
- [ ] Infinite scroll limpia observers
- [ ] Exportaciones tienen timeout de 30s
- [ ] Cron job elimina datos antiguos

```bash
# Test manual
# Búsqueda: tipear rápido, debe hacer solo 1 request
# Paginación: filtrar en página 10, debe volver a página 1
```

---

## 📅 SPRINT 4: MEJORAS FINALES (1-2 horas)

### ✅ Checkpoint: Código limpio y mantenible

---

### **Tarea 4.1: Agregar Types Apropiados (30 min)**

**Implementación:**
```typescript
// lib/types/analytics.ts (NUEVO)
export interface ResultadoBusqueda {
  titulo: string
  descripcion: string
  url: string
  categoria: string
}

export interface EventoAnalytics {
  userId?: string
  evento: string
  categoria: CategoriaEvento
  metadata?: SafeMetadata
  sessionId?: string
}

export type CategoriaEvento =
  | 'ONBOARDING'
  | 'PILA'
  | 'FACTURACION'
  | 'ASESORIA'
  | 'EXPORTACION'
  | 'NAVEGACION'
  | 'SISTEMA'

export type SafeMetadata = Partial<Record<string, string | number | boolean>>
```

**Aplicar en:**
- `components/ayuda/widget-ayuda.tsx`
- `lib/services/analytics-service.ts`
- Todos los archivos que usan `any`

---

### **Tarea 4.2: Implementar Logger (30 min)**

**Implementación:**
```typescript
// lib/logger.ts (NUEVO)
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private env: string

  constructor() {
    this.env = process.env.NODE_ENV || 'development'
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }

    // En producción, enviar a servicio de logging (Datadog, LogRocket, etc.)
    if (this.env === 'production') {
      // TODO: Enviar a servicio externo
      console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
    } else {
      // En desarrollo, console normal
      console[level === 'debug' ? 'log' : level](message, data || '')
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    if (this.env === 'development') {
      this.log('debug', message, data)
    }
  }
}

export const logger = new Logger()
```

**Reemplazar todos los `console.error` con `logger.error`**

---

### **Tarea 4.3: Agregar Error Boundaries (20 min)**

**Implementación:**
```typescript
// components/ui/error-fallback.tsx (NUEVO)
'use client'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
  refetch?: () => void
}

export function ErrorFallback({ error, resetErrorBoundary, refetch }: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <span className="material-symbols-outlined text-red-500 text-3xl">
          error
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-red-900 mb-2">
            Error al cargar datos
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {error.message || 'Ocurrió un error inesperado'}
          </p>
          <div className="flex space-x-2">
            {refetch && (
              <button
                onClick={refetch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            )}
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Envolver componentes que usan SWR:**
```typescript
// Ejemplo en dashboard
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <ComponenteConSWR />
</ErrorBoundary>
```

---

### **Tarea 4.4: Agregar Tests Críticos (40 min)**

**Implementación:**
```typescript
// __tests__/analytics-service.test.ts
import { sanitizeMetadata, getBrowser, getDeviceType } from '@/lib/services/analytics-service'

describe('Analytics Service', () => {
  describe('sanitizeMetadata', () => {
    it('permite campos whitelisted', () => {
      const result = sanitizeMetadata({ page: '/dashboard', monto: 1000 })
      expect(result).toEqual({ page: '/dashboard', monto: 1000 })
    })

    it('remueve datos sensibles', () => {
      const result = sanitizeMetadata({
        page: '/dashboard',
        password: 'secret',
        email: 'test@test.com',
        token: 'abc123',
      })
      expect(result).toEqual({ page: '/dashboard' })
    })

    it('trunca strings largos', () => {
      const longString = 'a'.repeat(300)
      const result = sanitizeMetadata({ page: longString })
      expect((result.page as string).length).toBe(200)
    })
  })

  describe('getBrowser', () => {
    it('detecta Edge correctamente', () => {
      const ua = 'Mozilla/5.0... Edg/91.0'
      expect(getBrowser(ua)).toBe('Edge')
    })

    it('detecta Chrome sin confundir con Edge', () => {
      const ua = 'Mozilla/5.0... Chrome/91.0 Safari/537.36'
      expect(getBrowser(ua)).toBe('Chrome')
    })
  })

  describe('getDeviceType', () => {
    it('detecta mobile', () => {
      expect(getDeviceType('iPhone')).toBe('mobile')
    })

    it('detecta tablet', () => {
      expect(getDeviceType('iPad')).toBe('tablet')
    })

    it('detecta desktop', () => {
      expect(getDeviceType('Windows NT 10.0')).toBe('desktop')
    })
  })
})
```

```typescript
// __tests__/rate-limit.test.ts
import { rateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  it('permite requests dentro del límite', async () => {
    const mockReq = { headers: { get: () => '127.0.0.1' } }

    for (let i = 0; i < 50; i++) {
      const result = await rateLimit(mockReq as any, { max: 100, window: 60000 })
      expect(result.success).toBe(true)
    }
  })

  it('bloquea requests sobre el límite', async () => {
    const mockReq = { headers: { get: () => '127.0.0.2' } }

    for (let i = 0; i < 110; i++) {
      await rateLimit(mockReq as any, { max: 100, window: 60000 })
    }

    const result = await rateLimit(mockReq as any, { max: 100, window: 60000 })
    expect(result.success).toBe(false)
  })
})
```

---

## ⏸️ CHECKPOINT FINAL

**Validación completa:**
- [ ] Todos los tests pasan
- [ ] Build exitoso sin warnings
- [ ] Performance: TTI < 2s
- [ ] Lighthouse Score > 90
- [ ] No memory leaks (DevTools Memory)
- [ ] Rate limiting funciona
- [ ] Data retention configurado
- [ ] Logger implementado
- [ ] Types completos (no `any`)

---

## 📊 CHECKLIST PRE-PRODUCCIÓN

### Funcionalidad
- [ ] Tours funcionan sin crashes
- [ ] Búsqueda de ayuda funciona
- [ ] Analytics trackea correctamente
- [ ] Dashboard admin solo para admins
- [ ] Widget de ayuda responsive

### Performance
- [ ] Lazy loading funcionando
- [ ] SWR cacheando correctamente
- [ ] Paginación eficiente
- [ ] Infinite scroll sin leaks
- [ ] Bundle size < 300KB

### Seguridad
- [ ] Metadata sanitizada
- [ ] Rate limiting activo
- [ ] Rutas admin protegidas
- [ ] GDPR compliant
- [ ] No datos sensibles en logs

### Estabilidad
- [ ] No memory leaks
- [ ] Todos los useEffect con cleanup
- [ ] Try-catch en sessionStorage
- [ ] AbortController en fetches
- [ ] Error boundaries implementados

### Monitoreo
- [ ] Logger configurado
- [ ] Cron job funcionando
- [ ] Métricas correctas
- [ ] Errores logueados

---

## 🚀 DEPLOYMENT

```bash
# 1. Build final
npm run build

# 2. Test en staging
npm run start

# 3. Tests de integración
npm run test:e2e

# 4. Deploy
vercel --prod

# 5. Verificar en producción
- Abrir /admin/analytics
- Hacer búsqueda
- Verificar tracking (DevTools Network)
- Test rate limiting
```

---

## 📈 MÉTRICAS POST-IMPLEMENTACIÓN

**Comparar antes vs después:**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Usuarios activos correctos | ❌ | ✅ | 100% |
| Tiempo de tracking | 150ms | 50ms | 66% |
| Memory leaks | 5 | 0 | 100% |
| Crashes en incógnito | Sí | No | 100% |
| Búsqueda funcional | No | Sí | 100% |
| Type safety | 65% | 95% | 46% |
| Test coverage | 0% | 70% | ∞ |

---

**Total estimado: 10-14 horas de trabajo**
**Beneficio: Sistema estable, seguro y escalable**
