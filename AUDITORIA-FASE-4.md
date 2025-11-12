# 🔍 AUDITORÍA TÉCNICA - FASE 4: ASESORÍA CON IA

**Fecha:** Noviembre 2024
**Alcance:** Subfases 4.4, 4.5 y 4.6
**Estado:** ⚠️ REQUIERE CORRECCIONES CRÍTICAS

---

## 🚨 PROBLEMAS CRÍTICOS (Alta Prioridad)

### 1. **Fuga de Recursos y Costos Descontrolados**

**Archivo:** `/app/api/asesoria/analisis-tributario/route.ts`
**Líneas:** 42-46

**Problema:**
```typescript
// Sin rate limiting ni caché
const reporte = await analizarPerfilTributario(user.id)
```

**Impacto:**
- Usuario puede generar análisis ilimitados (cada uno cuesta ~$0.02-0.10 USD)
- Posible abuso que genere facturas de miles de dólares
- Sin protección contra spam/DoS

**Corrección:**
```typescript
// Implementar rate limiting
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
})

export async function GET(req: NextRequest) {
  // Verificar rate limit
  try {
    await limiter.check(3, user.id) // 3 análisis por minuto máximo
  } catch {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.' },
      { status: 429 }
    )
  }

  // Cachear resultados por 1 hora
  const cacheKey = `analisis:${user.id}:${Date.now() - (Date.now() % 3600000)}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(JSON.parse(cached))

  const reporte = await analizarPerfilTributario(user.id)
  await redis.setex(cacheKey, 3600, JSON.stringify(reporte))

  return NextResponse.json(reporte)
}
```

---

### 2. **API Key No Validada - Crash Silencioso**

**Archivo:** `/lib/services/analisis-tributario-service.ts`
**Línea:** 6

**Problema:**
```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!, // ⚠️ Asume que existe
})
```

**Impacto:**
- Si la variable de entorno no existe, crashea en runtime
- Error críptico para debugging
- Aplicación inoperante sin mensaje claro

**Corrección:**
```typescript
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) {
  throw new Error(
    'ANTHROPIC_API_KEY no está configurada. ' +
    'Configura esta variable en .env o .env.local'
  )
}

const anthropic = new Anthropic({ apiKey: API_KEY })
```

---

### 3. **JSON Parse Sin Validación - Crash en Producción**

**Archivo:** `/lib/services/analisis-tributario-service.ts`
**Líneas:** 249, 263

**Problema:**
```typescript
const analisisJSON = JSON.parse(jsonText) // Sin try-catch

const reporte: ReporteTributario = {
  ...analisisJSON, // Sin validar estructura
  fechaAnalisis: new Date(),
}

// Peor aún:
reporteCompleto: reporte as any, // ⚠️ Perdiendo type safety
```

**Impacto:**
- Si la IA devuelve JSON inválido o incompleto, crashea
- Datos corruptos en base de datos
- Usuario ve error 500 sin explicación
- Type casting `as any` oculta problemas

**Corrección:**
```typescript
import { z } from 'zod'

// Definir schema de validación
const ReporteTributarioSchema = z.object({
  regimenRecomendado: z.enum(['SIMPLE', 'ORDINARIO', 'INDETERMINADO']),
  confianzaRecomendacion: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  razonesLegales: z.array(z.string()),
  razonesEconomicas: z.array(z.string()),
  comparativaTabla: z.object({
    caracteristicas: z.array(z.object({
      concepto: z.string(),
      regimenSimple: z.string(),
      regimenOrdinario: z.string(),
      ventajaPara: z.enum(['SIMPLE', 'ORDINARIO', 'NEUTRO']),
    })),
    proyeccionEconomica: z.object({
      ingresoAnualEstimado: z.number(),
      impuestoRegimenSimple: z.number(),
      impuestoRegimenOrdinario: z.number(),
      ahorroEstimado: z.number(),
      regimenMasEconomico: z.enum(['SIMPLE', 'ORDINARIO']),
    }),
  }),
  pasosSeguir: z.array(z.object({
    numero: z.number(),
    titulo: z.string(),
    descripcion: z.string(),
    plazo: z.string().optional(),
    prioridad: z.enum(['ALTA', 'MEDIA', 'BAJA']),
    enlaces: z.array(z.object({
      texto: z.string(),
      url: z.string(),
    })).optional(),
  })),
  consideracionesAdicionales: z.array(z.string()),
  advertencias: z.array(z.string()),
})

// En el código:
let analisisJSON
try {
  analisisJSON = JSON.parse(jsonText)
} catch (parseError) {
  throw new Error(
    'La IA generó una respuesta inválida. Por favor intenta nuevamente.'
  )
}

// Validar con Zod
const validationResult = ReporteTributarioSchema.safeParse(analisisJSON)

if (!validationResult.success) {
  console.error('Validation errors:', validationResult.error.errors)
  throw new Error(
    'El análisis generado tiene un formato inválido. ' +
    'Por favor intenta nuevamente o contacta soporte.'
  )
}

const reporte: ReporteTributario = {
  ...validationResult.data,
  fechaAnalisis: new Date(),
}

// Guardar con tipo correcto
await prisma.analisisTributario.create({
  data: {
    userId,
    regimenRecomendado: reporte.regimenRecomendado,
    confianza: reporte.confianzaRecomendacion,
    reporteCompleto: reporte, // Sin 'as any'
    ingresoAnalizado: user.ingresoMensualPromedio,
  },
})
```

---

### 4. **Timeout Inexistente en Llamada a IA**

**Archivo:** `/lib/services/analisis-tributario-service.ts`
**Línea:** 223

**Problema:**
```typescript
const respuesta = await anthropic.messages.create({
  model: MODEL,
  max_tokens: 4000,
  // ⚠️ Sin timeout
  system: SYSTEM_PROMPT_TRIBUTARIO,
  messages: [...]
})
```

**Impacto:**
- Request puede colgar indefinidamente
- Usuario esperando sin feedback
- Recursos del servidor bloqueados
- En Vercel, timeout de 10s en hobby plan = error garantizado

**Corrección:**
```typescript
// Wrapper con timeout
async function createWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  )
  return Promise.race([promise, timeout])
}

// Usar:
const respuesta = await createWithTimeout(
  anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT_TRIBUTARIO,
    messages: [
      {
        role: 'user',
        content: promptAnalisis,
      },
    ],
  }),
  30000 // 30 segundos timeout
)
```

---

## ⚠️ PROBLEMAS MAYORES (Media Prioridad)

### 5. **Pérdida de Type Safety con `any`**

**Archivos Múltiples:**
- `/app/api/asesoria/faqs/route.ts`: Líneas 12, 29
- `/lib/services/analisis-tributario-service.ts`: Línea 339

**Problema:**
```typescript
const where: any = { activa: true }
const orderBy: any = []
export async function obtenerHistorialAnalisis(): Promise<any[]>
```

**Impacto:**
- Pérdida de autocompletado en IDE
- Errores de tipo no detectados en compile time
- Mantenimiento difícil
- Refactoring peligroso

**Corrección:**
```typescript
import { Prisma } from '@prisma/client'

const where: Prisma.FAQWhereInput = { activa: true }
const orderBy: Prisma.FAQOrderByWithRelationInput[] = []

export async function obtenerHistorialAnalisis(
  userId: string,
  limit = 10
): Promise<AnalisisTributario[]> {
  return prisma.analisisTributario.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
```

---

### 6. **Valores Hardcoded - Mantenimiento Difícil**

**Archivo:** `/lib/services/analisis-tributario-service.ts`
**Línea:** 298

**Problema:**
```typescript
const uvt2025 = 47065 // ⚠️ Hardcoded
const ingresoEnUVT = Math.round(ingresoAnual / uvt2025)
```

**Impacto:**
- Cada año hay que buscar y cambiar valores manualmente
- Múltiples lugares con mismo valor = inconsistencias
- Propenso a errores humanos

**Corrección:**
```typescript
// Crear /lib/constants/tributarios.ts
export const VALORES_TRIBUTARIOS = {
  2025: {
    UVT: 47065,
    SMMLV: 1423500,
    UMBRAL_SIMPLE: 80000, // en UVT
  },
  2026: {
    UVT: 49500, // Actualizar cuando se conozca
    SMMLV: 1500000,
    UMBRAL_SIMPLE: 80000,
  },
} as const

export function getValoresVigentes(anio: number = new Date().getFullYear()) {
  return VALORES_TRIBUTARIOS[anio as keyof typeof VALORES_TRIBUTARIOS]
    || VALORES_TRIBUTARIOS[2025] // Fallback
}

// En el código:
const { UVT } = getValoresVigentes()
const ingresoEnUVT = Math.round(ingresoAnual / UVT)
```

---

### 7. **Sin Paginación en Queries**

**Archivo:** `/app/api/asesoria/faqs/route.ts`
**Línea:** 37

**Problema:**
```typescript
const faqs = await prisma.fAQ.findMany({
  where,
  orderBy,
  // ⚠️ Sin límite - puede retornar miles de registros
})
```

**Impacto:**
- Con 10,000 FAQs = response de varios MB
- Performance horrible en cliente
- Timeout en requests grandes
- Consumo excesivo de memoria

**Corrección:**
```typescript
// Agregar paginación
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '50')
const skip = (page - 1) * limit

const [faqs, total] = await Promise.all([
  prisma.fAQ.findMany({
    where,
    orderBy,
    take: limit,
    skip,
  }),
  prisma.fAQ.count({ where }),
])

return NextResponse.json({
  faqs: faqsPorCategoria,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
  estadisticas,
})
```

---

### 8. **Manejo de Errores Silencioso**

**Archivo:** `/components/asesoria/modal-bienvenida.tsx`
**Líneas:** 54-62

**Problema:**
```typescript
if (response.ok) {
  setIsOpen(false)
  onAceptar()
}
// ⚠️ Si response.ok es false, no hace nada
} catch (error) {
  console.error('Error al aceptar términos:', error)
  // ⚠️ Usuario no sabe que hubo error
} finally {
  setIsSubmitting(false)
}
```

**Impacto:**
- Usuario no sabe si aceptación falló
- UI queda en estado inconsistente
- Mala experiencia de usuario

**Corrección:**
```typescript
import { toast } from 'sonner' // o tu sistema de notificaciones

try {
  const response = await fetch('/api/asesoria/aceptar-terminos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipoTermino: 'ASESORIA_IA',
      version: '1.0',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al aceptar términos')
  }

  setIsOpen(false)
  onAceptar()
  toast.success('Términos aceptados correctamente')
} catch (error) {
  console.error('Error al aceptar términos:', error)
  toast.error(
    error instanceof Error
      ? error.message
      : 'Error al aceptar términos. Por favor intenta nuevamente.'
  )
} finally {
  setIsSubmitting(false)
}
```

---

### 9. **Race Condition en Comparación de Análisis**

**Archivo:** `/lib/services/analisis-tributario-service.ts`
**Línea:** 362

**Problema:**
```typescript
const analisisAnterior = await prisma.analisisTributario.findFirst({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  skip: 1, // ⚠️ Asume que el "actual" ya está guardado
})
```

**Impacto:**
- Si usuario hace clic 2 veces rápido, podría comparar análisis incorrectos
- Si hay error al guardar el actual, compara con el equivocado
- Lógica frágil

**Corrección:**
```typescript
// Guardar primero, luego comparar
const nuevoAnalisis = await prisma.analisisTributario.create({
  data: {
    userId,
    regimenRecomendado: reporte.regimenRecomendado,
    confianza: reporte.confianzaRecomendacion,
    reporteCompleto: reporte,
    ingresoAnalizado: user.ingresoMensualPromedio,
  },
})

// Ahora buscar el anterior al que acabamos de crear
const analisisAnterior = await prisma.analisisTributario.findFirst({
  where: {
    userId,
    id: { not: nuevoAnalisis.id }, // Excluir el recién creado
  },
  orderBy: { createdAt: 'desc' },
})
```

---

### 10. **Eventos de Scroll Sin Debounce**

**Archivo:** `/components/asesoria/modal-bienvenida.tsx`
**Línea:** 65

**Problema:**
```typescript
const handleScroll = (e: any) => {
  const element = e.target
  if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
    setLeyoCompleto(true)
  }
}

// En JSX:
<ScrollArea onScroll={handleScroll}>
```

**Impacto:**
- Se ejecuta cientos de veces por segundo al scrollear
- Múltiples re-renders innecesarios
- Performance pobre en dispositivos lentos

**Corrección:**
```typescript
import { useCallback, useEffect, useRef } from 'react'

const [leyoCompleto, setLeyoCompleto] = useState(false)
const scrollTimeoutRef = useRef<NodeJS.Timeout>()

const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  // Debounce
  if (scrollTimeoutRef.current) {
    clearTimeout(scrollTimeoutRef.current)
  }

  scrollTimeoutRef.current = setTimeout(() => {
    const element = e.target as HTMLDivElement
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50

    if (scrolledToBottom && !leyoCompleto) {
      setLeyoCompleto(true)
    }
  }, 150) // 150ms debounce
}, [leyoCompleto])

// Cleanup
useEffect(() => {
  return () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
  }
}, [])
```

---

## 📊 PROBLEMAS MENORES (Baja Prioridad)

### 11. **Sanitización de Input Faltante**

**Archivo:** `/app/api/asesoria/faqs/route.ts`
**Línea:** 20

**Problema:**
```typescript
if (busqueda) {
  where.OR = [
    { pregunta: { contains: busqueda, mode: 'insensitive' } },
    // ⚠️ Sin sanitización
  ]
}
```

**Impacto:** Riesgo menor de inyección si Prisma no sanitiza correctamente

**Corrección:**
```typescript
// Sanitizar caracteres especiales
const sanitizeBusqueda = (input: string): string => {
  return input.replace(/[^\w\s\-áéíóúñ]/gi, '').trim().slice(0, 100)
}

const busquedaSanitizada = sanitizeBusqueda(busqueda)
```

---

### 12. **Versión Hardcoded**

**Archivo:** `/components/asesoria/modal-bienvenida.tsx`
**Línea:** 50

**Problema:**
```typescript
version: '1.0', // ⚠️ Hardcoded en múltiples lugares
```

**Corrección:**
```typescript
// Crear /lib/constants/terms.ts
export const CURRENT_TERMS_VERSION = '1.0'

// Usar en todos los lugares
import { CURRENT_TERMS_VERSION } from '@/lib/constants/terms'
version: CURRENT_TERMS_VERSION,
```

---

### 13. **Queries Secuenciales - Performance**

**Archivo:** `/app/api/asesoria/faqs/route.ts`
**Líneas:** 37, 52

**Problema:**
```typescript
const faqs = await prisma.fAQ.findMany(...)
const estadisticas = await prisma.fAQ.aggregate(...) // Secuencial
```

**Impacto:** 2x tiempo de respuesta

**Corrección:**
```typescript
const [faqs, estadisticas] = await Promise.all([
  prisma.fAQ.findMany({ where, orderBy }),
  prisma.fAQ.aggregate({
    _sum: { vecesConsultada: true },
    _count: true,
    where, // Mismo filtro
  }),
])
```

---

### 14. **Sin Logging Estructurado**

**Múltiples Archivos**

**Problema:**
```typescript
console.error('Error al...', error)
```

**Corrección:**
```typescript
// Usar logger estructurado
import { logger } from '@/lib/logger'

logger.error('Error al analizar perfil tributario', {
  userId,
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
})
```

---

## 🎯 RESUMEN EJECUTIVO

### Severidad de Problemas

| Severidad | Cantidad | Impacto |
|-----------|----------|---------|
| 🚨 Crítico | 4 | Costos descontrolados, crashes en producción |
| ⚠️ Mayor | 6 | Type safety, performance, UX |
| 📊 Menor | 4 | Code quality, mantenimiento |

### Prioridades de Corrección

**Inmediato (Esta semana):**
1. Rate limiting en análisis tributario
2. Validación de API key
3. Validación de JSON con Zod
4. Timeouts en llamadas a IA

**Corto plazo (2 semanas):**
5. Eliminar `any` types
6. Agregar paginación
7. Mejorar manejo de errores
8. Fix race condition

**Mediano plazo (1 mes):**
9. Valores configurables
10. Debounce en eventos
11. Logging estructurado
12. Queries paralelas

---

## ✅ ASPECTOS POSITIVOS

- ✅ Estructura de archivos clara y organizada
- ✅ Uso de TypeScript (aunque con `any` en varios lugares)
- ✅ Comentarios descriptivos en código
- ✅ Separación de concerns (service, API, componentes)
- ✅ Uso de Prisma para type-safe DB queries (en su mayoría)
- ✅ Sistema de disclaimers legal robusto
- ✅ Tracking de términos con IP y User Agent

---

## 📝 RECOMENDACIONES ARQUITECTÓNICAS

1. **Implementar Circuit Breaker** para llamadas a Anthropic
2. **Redis/Cache Layer** para análisis recientes
3. **Queue System** (Bull/BullMQ) para análisis pesados
4. **Monitoring** (Sentry, DataDog) para tracking de errores
5. **Feature Flags** para controlar rollout de nuevas versiones
6. **End-to-end tests** para flujos críticos

---

**Estimación de correcciones:** 16-20 horas de desarrollo
**Impacto en producción si no se corrige:** ALTO - Costos descontrolados + crashes frecuentes
