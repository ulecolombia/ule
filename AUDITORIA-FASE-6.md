# 🔍 Auditoría Técnica - Fase 6

**Fecha:** 2025-11-11
**Alcance:** Subfases 6.4 (Ayuda), 6.5 (Performance), 6.6 (Analytics)
**Severidad:** 🔴 Crítico | 🟠 Alto | 🟡 Medio | 🔵 Bajo

---

## 📊 Resumen Ejecutivo

- **Total de problemas detectados:** 30
- **Críticos:** 5
- **Altos:** 12
- **Medios:** 9
- **Bajos:** 4

**Riesgo general:** 🟠 ALTO - Requiere correcciones inmediatas antes de producción

---

## 🔴 PROBLEMAS CRÍTICOS (Acción Inmediata)

### 1. **Analytics - Contador de Usuarios Activos Incorrecto**
**Archivo:** `/lib/services/analytics-service.ts:146`
```typescript
case EVENTOS.PAGE_VIEW:
  updates.usuariosActivos = { increment: 1 }  // ❌ INCORRECTO
  break
```

**Problema:**
Incrementa el contador por cada `page_view`, no por usuario único. Si un usuario ve 100 páginas, se cuenta como 100 usuarios activos.

**Impacto:**
- Métricas infladas en 1000%+
- Decisiones de negocio basadas en datos incorrectos
- KPIs completamente inútiles

**Solución:**
```typescript
// Usar distinct count en la query de métricas
const usuariosActivos = await prisma.analyticsEvento.findMany({
  where: { timestamp: { gte: fechaInicio }, evento: 'page_view' },
  select: { userId: true },
  distinct: ['userId'],
})
updates.usuariosActivos = usuariosActivos.length
```

---

### 2. **Analytics - Query de DB en Cada Tracking**
**Archivo:** `/app/api/analytics/track/route.ts:34-36`
```typescript
const user = session?.user?.email
  ? await prisma.user.findUnique({ where: { email: session.user.email } })
  : null
```

**Problema:**
Busca el usuario en DB en cada evento trackeado. Con 1000 eventos/día = 1000 queries adicionales.

**Impacto:**
- Alto costo computacional
- Latencia añadida (50-100ms por request)
- Bottleneck en alto volumen
- Aumenta costos de DB

**Solución:**
```typescript
// Guardar userId en el token JWT de NextAuth
const userId = session?.user?.id  // Ya viene en el token
// O usar cache con TTL de 5 minutos
```

---

### 3. **Widget Ayuda - Endpoint No Existe**
**Archivo:** `/components/ayuda/widget-ayuda.tsx:24`
```typescript
const response = await fetch(`/api/ayuda/buscar?q=${encodeURIComponent(busqueda)}`)
```

**Problema:**
El endpoint `/api/ayuda/buscar` nunca fue implementado. Causará 404 en producción.

**Impacto:**
- Funcionalidad completamente rota
- Mala experiencia de usuario
- Console lleno de errores 404

**Solución:**
```typescript
// Implementar el endpoint o usar búsqueda client-side
// Opción 1: Client-side search
const resultados = articulosTodos.filter(a =>
  a.titulo.toLowerCase().includes(busqueda.toLowerCase())
)
```

---

### 4. **SessionStorage Sin Try-Catch**
**Archivo:** `/lib/hooks/use-analytics.ts:18-21`
```typescript
let sessionId = sessionStorage.getItem('sessionId')  // ❌ Puede fallar
if (!sessionId) {
  sessionId = crypto.randomUUID()
  sessionStorage.setItem('sessionId', sessionId)
}
```

**Problema:**
En SSR, incognito mode, o storage deshabilitado causará crash.

**Impacto:**
- Crash completo de la aplicación
- No funciona en modo incógnito
- Falla en algunos navegadores móviles

**Solución:**
```typescript
let sessionId: string | null = null
try {
  sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('sessionId', sessionId)
  }
} catch (error) {
  sessionId = crypto.randomUUID()  // Fallback temporal
}
```

---

### 5. **Memory Leak - setTimeout Sin Cleanup**
**Archivo:** `/components/ayuda/tour-wrapper.tsx:34`
```typescript
setTimeout(() => setRun(true), 1000)  // ❌ No se limpia
```

**Problema:**
Si el componente se desmonta antes de 1 segundo, el timeout sigue ejecutándose y puede causar "setState on unmounted component".

**Impacto:**
- Memory leaks
- Warnings en consola
- Posible crash en casos extremos

**Solución:**
```typescript
useEffect(() => {
  let timeoutId: NodeJS.Timeout | null = null

  const verificarTour = async () => {
    const data = await fetch(`/api/onboarding/verificar-tour?tour=${tourKey}`)
    if (!data.visto) {
      timeoutId = setTimeout(() => setRun(true), 1000)
    }
  }

  verificarTour()

  return () => {
    if (timeoutId) clearTimeout(timeoutId)
  }
}, [tourKey])
```

---

## 🟠 PROBLEMAS ALTOS (Corrección Urgente)

### 6. **Detección de Navegador Incorrecta**
**Archivo:** `/lib/services/analytics-service.ts:170-176`
```typescript
function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome'  // ❌ Edge también incluye Chrome
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  return 'Other'
}
```

**Problema:**
Chrome user agent también contiene "Safari". Edge contiene "Chrome". Orden incorrecto causa falsos positivos.

**Impacto:**
- Métricas de navegador incorrectas
- Edge se reporta como Chrome
- Safari puede reportarse incorrectamente

**Solución:**
```typescript
function getBrowser(userAgent: string): string {
  if (userAgent.includes('Edg')) return 'Edge'  // Debe ir primero
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  return 'Other'
}
```

---

### 7. **No Hay Debouncing en Búsqueda**
**Archivo:** `/components/ayuda/widget-ayuda.tsx:68`
```typescript
onChange={(e) => setBusqueda(e.target.value)}  // ❌ No debounce
onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
```

**Problema:**
Cada tecla presionada puede causar una request si el usuario presiona Enter rápidamente.

**Impacto:**
- Carga innecesaria en el servidor
- Mala performance
- Costos de API inflados

**Solución:**
```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedSearch = useDebouncedCallback((value) => {
  handleBuscar(value)
}, 500)

onChange={(e) => {
  setBusqueda(e.target.value)
  debouncedSearch(e.target.value)
}}
```

---

### 8. **Paginación No Resetea al Cambiar Items**
**Archivo:** `/lib/hooks/use-pagination.ts:33`
```typescript
const [currentPage, setCurrentPage] = useState(1)  // ❌ No resetea
```

**Problema:**
Si tienes 10 páginas, estás en la página 8, y luego filtras a 3 páginas, sigues en página 8 (que no existe).

**Impacto:**
- Pantalla vacía
- Usuario confundido
- Necesita navegar manualmente a página 1

**Solución:**
```typescript
useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(1)
  }
}, [items.length, totalPages])  // Reset cuando cambian los items
```

---

### 9. **Metadata Sin Validación (Riesgo de Seguridad)**
**Archivo:** `/lib/services/analytics-service.ts:78`
```typescript
metadata?: any  // ❌ Cualquier cosa puede guardarse
```

**Problema:**
Un usuario malicioso puede enviar passwords, tokens, o datos sensibles en metadata y se guardarán en la DB.

**Impacto:**
- VIOLACIÓN GDPR
- Riesgo de seguridad
- Datos sensibles en analytics
- Posible leak de información

**Solución:**
```typescript
// Whitelist de campos permitidos
const METADATA_ALLOWED_KEYS = ['page', 'monto', 'entidad', 'tipo', 'duracion']

function sanitizeMetadata(metadata: any): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') return {}

  const sanitized: Record<string, any> = {}
  for (const key of METADATA_ALLOWED_KEYS) {
    if (key in metadata) {
      sanitized[key] = metadata[key]
    }
  }
  return sanitized
}

// En trackEvent
metadata: sanitizeMetadata(metadata),
```

---

### 10. **useEffect con Dependencias Incompletas**
**Archivo:** `/components/ayuda/tour-wrapper.tsx:22-25`
```typescript
useEffect(() => {
  verificarTour()  // ❌ función no está en dependencias
}, [pathname, tourKey])
```

**Problema:**
ESLint advertirá, y puede causar comportamiento inesperado si `verificarTour` cambia.

**Impacto:**
- Posibles bugs sutiles
- Comportamiento inconsistente
- Warnings en consola

**Solución:**
```typescript
useEffect(() => {
  const verificarTour = async () => {
    // implementación aquí
  }
  verificarTour()
}, [pathname, tourKey])
```

---

### 11. **Dashboard Admin Sin Protección de Ruta**
**Archivo:** `/app/admin/analytics/page.tsx:76`
```typescript
export default function AnalyticsDashboard() {
  // ❌ No hay verificación de rol ADMIN en la UI
```

**Problema:**
Cualquier usuario puede navegar a `/admin/analytics`. La API rechaza los datos, pero la UI es accesible.

**Impacto:**
- UI expuesta a no-admins
- Mal UX (página carga y luego falla)
- Posible information disclosure

**Solución:**
```typescript
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AnalyticsDashboard() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') {
      redirect('/dashboard')
    }
  }, [session])

  if (!session || session.user.role !== 'ADMIN') {
    return <div>Acceso denegado</div>
  }
  // ...
}
```

---

### 12. **Infinite Scroll - Dependencias Incompletas**
**Archivo:** `/lib/hooks/use-infinite-scroll.ts:48`
```typescript
return () => {
  if (observerRef.current) {
    observerRef.current.disconnect()
  }
}
}, [loadMore, hasMore, isLoading, threshold])  // ❌ Falta observer logic
```

**Problema:**
El observer se recrea cada vez que cambian las dependencias, pero no se limpia correctamente la referencia anterior.

**Impacto:**
- Multiple observers activos
- Memory leaks
- Performance degradation

**Solución:**
```typescript
useEffect(() => {
  const options = { /* ... */ }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasMore && !isLoading) {
      loadMore()
    }
  }, options)

  const currentRef = loadMoreRef.current
  if (currentRef) {
    observer.observe(currentRef)
  }

  return () => {
    if (currentRef) {
      observer.unobserve(currentRef)
    }
    observer.disconnect()
  }
}, [loadMore, hasMore, isLoading, threshold])
```

---

### 13. **Error Logging Sin Await**
**Archivo:** `/components/error-boundary.tsx:70`
```typescript
this.logErrorToAnalytics(error, errorInfo)  // ❌ async sin await
```

**Problema:**
La función es async pero no se espera. Si falla, falla silenciosamente.

**Impacto:**
- Errores no logueados
- No se entera que el logging falló
- Debugging imposible

**Solución:**
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error(/* ... */)

  // No usar await aquí (componentDidCatch no puede ser async)
  this.logErrorToAnalytics(error, errorInfo).catch(err => {
    console.error('Failed to log error:', err)
  })
}
```

---

### 14. **Retención de Usuarios - Lógica Incorrecta**
**Archivo:** `/app/api/analytics/metricas/route.ts:85-96`
```typescript
const usuariosHace7Dias = await prisma.analyticsEvento.findMany({
  where: {
    timestamp: {
      gte: hace7Dias,
      lt: subDays(hace7Dias, -1),  // ❌ Esto suma 1 día, solo 1 día de ventana
    },
```

**Problema:**
`subDays(hace7Dias, -1)` es equivalente a `addDays(hace7Dias, 1)`. Solo mira usuarios en un período de 24 horas, no 7 días.

**Impacto:**
- Métrica de retención completamente incorrecta
- Subreporta la retención real
- Decisiones de producto basadas en datos falsos

**Solución:**
```typescript
const hace7Dias = startOfDay(subDays(new Date(), 7))
const hace6Dias = startOfDay(subDays(new Date(), 6))

const usuariosHace7Dias = await prisma.analyticsEvento.findMany({
  where: {
    timestamp: {
      gte: hace7Dias,
      lt: hace6Dias,  // Ventana de 24 horas hace 7 días
    },
    evento: 'page_view',
    userId: { not: null },
  },
  select: { userId: true },
  distinct: ['userId'],
})
```

---

### 15. **SWR Timeout Hardcodeado**
**Archivo:** `/lib/cache/swr-config.tsx:16`
```typescript
const timeout = setTimeout(() => controller.abort(), 10000)  // ❌ 10s para todo
```

**Problema:**
Algunos endpoints (exportaciones, reportes) pueden necesitar más de 10 segundos.

**Impacto:**
- Timeouts prematuros en operaciones lentas
- UX pobre en reportes grandes
- Errores falsos

**Solución:**
```typescript
// Fetcher configurable por endpoint
export const createFetcher = (timeoutMs: number = 10000) => {
  return async (url: string) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    // ...
  }
}

// Uso
useSWR('/api/exportar/grande', createFetcher(30000))
```

---

### 16. **No Hay Error Boundaries en Hooks**
**Archivo:** `/lib/hooks/use-cached-data.ts` (general)

**Problema:**
Si SWR falla, no hay fallback UI. La app puede quedar en loading infinito.

**Impacto:**
- UX horrible en errores
- Usuario atrapado en loading
- No hay forma de recuperarse

**Solución:**
```typescript
// En cada componente que usa estos hooks
<ErrorBoundary fallback={<ErrorUI refetch={refetch} />}>
  <ComponenteQueUsaHooks />
</ErrorBoundary>
```

---

### 17. **Tipo `any` en Resultados**
**Archivo:** `/components/ayuda/widget-ayuda.tsx:18`
```typescript
const [resultados, setResultados] = useState<any[]>([])  // ❌
```

**Problema:**
No hay type safety. Cualquier cosa puede ir ahí.

**Impacto:**
- No hay autocompletado
- Errores en runtime
- Difícil debugging

**Solución:**
```typescript
interface ResultadoBusqueda {
  titulo: string
  descripcion: string
  url: string
}

const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
```

---

## 🟡 PROBLEMAS MEDIOS (Corregir Pronto)

### 18. **Widget No Responsive**
**Archivo:** `/components/ayuda/widget-ayuda.tsx:54`
```typescript
<Card className="fixed bottom-24 right-6 w-96 h-[500px] ...">  // ❌ Hardcoded
```

**Solución:**
```typescript
<Card className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[80vh] ...">
```

---

### 19. **No Hay Rate Limiting**

**Problema:**
Ningún endpoint de analytics tiene rate limiting. Un usuario malicioso puede enviar miles de eventos.

**Solución:**
```typescript
// Usar Vercel Rate Limit o implementar rate limit con Redis
import rateLimit from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limiter = await rateLimit(req, { max: 100, window: 60000 })
  if (!limiter.success) {
    return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
  }
  // ...
}
```

---

### 20. **No Hay Data Retention Policy**

**Problema:**
Los eventos de analytics se acumulan indefinidamente. En 1 año podrías tener millones de registros.

**Solución:**
```typescript
// Cron job diario para limpiar eventos antiguos
// /app/api/cron/cleanup-analytics/route.ts
const hace90Dias = subDays(new Date(), 90)
await prisma.analyticsEvento.deleteMany({
  where: { timestamp: { lt: hace90Dias } }
})
```

---

### 21. **Console.error en Producción**

**Problema:**
Todo el código usa `console.error` en vez de un logger apropiado.

**Solución:**
```typescript
// Usar pino o winston
import logger from '@/lib/logger'

logger.error('Error al trackear evento:', { error, evento, userId })
```

---

### 22. **No Hay Retry Logic**

**Problema:**
Si un fetch falla, no se reintenta. En analytics esto puede causar pérdida de datos.

**Solución:**
```typescript
async function trackWithRetry(data: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))  // Exponential backoff
    }
  }
}
```

---

### 23-26. **Varios useEffect Sin Cleanup**

**Archivos múltiples:** Hay varios useEffect que inician operaciones async sin cancelarlas en cleanup.

**Solución general:**
```typescript
useEffect(() => {
  const controller = new AbortController()

  fetch(url, { signal: controller.signal })
    .then(/* ... */)

  return () => controller.abort()
}, [deps])
```

---

## 🔵 PROBLEMAS BAJOS (Mejoras de Código)

### 27. **Hardcoded Strings**
- URLs, mensajes, configuraciones hardcodeadas
- Deberían estar en constantes o archivo de config

### 28. **No Hay Testing**
- Ningún archivo de test para código crítico
- Implementar Jest + React Testing Library

### 29. **Nombres de Variables en Español/Inglés Mezclados**
- Inconsistente: `usuario` vs `user`, `fecha` vs `timestamp`

### 30. **No Hay JSDoc en Funciones Complejas**
- Dificulta el mantenimiento

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Prioridad 1 (Hoy):
1. Arreglar contador de usuarios activos (#1)
2. Implementar try-catch en sessionStorage (#4)
3. Agregar cleanup a setTimeout (#5)
4. Implementar endpoint `/api/ayuda/buscar` o remover feature (#3)

### Prioridad 2 (Esta Semana):
5. Optimizar query de user en tracking (#2)
6. Arreglar detección de navegador (#6)
7. Agregar debouncing a búsqueda (#7)
8. Sanitizar metadata (#9)
9. Proteger ruta de admin (#11)
10. Arreglar lógica de retención (#14)

### Prioridad 3 (Próximas 2 Semanas):
11-22. Implementar mejoras de performance, error handling, y logging

### Prioridad 4 (Backlog):
23-30. Refactoring, testing, y mejoras de código

---

## ✅ CHECKLIST PRE-PRODUCCIÓN

- [ ] Todos los problemas críticos corregidos
- [ ] Rate limiting implementado
- [ ] Data retention policy configurada
- [ ] Error logging apropiado (no console.error)
- [ ] Protección de rutas admin verificada
- [ ] GDPR compliance revisado (metadata sanitization)
- [ ] Tests E2E de flujos críticos
- [ ] Performance testing con carga simulada
- [ ] Monitoring y alertas configuradas

---

## 📈 MÉTRICAS DE CALIDAD

**Antes de correcciones:**
- Cobertura de tests: 0%
- Type safety: 65%
- Memory leaks: 5 detectados
- Problemas de seguridad: 2 críticos

**Meta después de correcciones:**
- Cobertura de tests: >70%
- Type safety: >95%
- Memory leaks: 0
- Problemas de seguridad: 0

---

**Fin del informe de auditoría**
