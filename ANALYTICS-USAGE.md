# Sistema de Analytics y Monitoreo - Guía de Uso

## 📊 Subfase 6.6 - Sistema Completo Implementado

### Características Implementadas

✅ **Tracking de Eventos** (20+ eventos)
- Registro y onboarding
- Uso de PILA, facturación y asesoría IA
- Interacciones con features
- Navegación y sesiones

✅ **Dashboard de Métricas Admin** (`/admin/analytics`)
- KPIs: Usuarios activos, nuevos usuarios, retención, errores
- Gráficos interactivos (usuarios, features, eventos)
- Lista de errores con severidad
- Filtros por período (7/30/90 días)

✅ **Captura de Errores**
- Error Boundary actualizado con tracking
- Integración con Sentry (opcional)
- Logging con contexto completo
- Clasificación por severidad

✅ **Métricas Agregadas**
- Rollups diarios automáticos
- Retención de usuarios
- Análisis de features más usados
- Performance del sistema

---

## 🚀 Cómo Usar

### 1. Trackear Eventos en Componentes

```typescript
'use client'

import { useAnalytics } from '@/lib/hooks/use-analytics'

export function MiComponente() {
  const { track, trackPageView, trackError } = useAnalytics()

  // Trackear vista de página (automático)
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  // Trackear evento específico
  const handleLiquidarPILA = async () => {
    try {
      // ... lógica de liquidación

      // Trackear éxito
      await track('pila_liquidada', 'PILA', {
        monto: 1500000,
        entidad: 'Salud',
      })
    } catch (error) {
      // Trackear error
      trackError(error as Error, 'MiComponente', 'liquidar_pila')
    }
  }

  return <button onClick={handleLiquidarPILA}>Liquidar PILA</button>
}
```

### 2. Eventos Disponibles

Ver la lista completa en `/lib/services/analytics-service.ts`:

```typescript
import { EVENTOS } from '@/lib/services/analytics-service'

// Ejemplos:
EVENTOS.REGISTRO_COMPLETADO       // Nuevo usuario registrado
EVENTOS.PERFIL_COMPLETADO         // Perfil completado
EVENTOS.PILA_LIQUIDADA            // PILA liquidada
EVENTOS.FACTURA_EMITIDA           // Factura emitida
EVENTOS.CONSULTA_IA_ENVIADA       // Consulta IA enviada
EVENTOS.EXPORTACION_GENERADA      // Exportación generada
// ... y más
```

### 3. Categorías de Eventos

```typescript
type Categoria =
  | 'ONBOARDING'      // Flujos de registro y setup
  | 'PILA'            // Liquidación de PILA
  | 'FACTURACION'     // Emisión de facturas
  | 'ASESORIA'        // Uso de asesor IA
  | 'EXPORTACION'     // Exportaciones PDF/Excel
  | 'NAVEGACION'      // Page views, clicks
  | 'SISTEMA'         // Eventos internos
```

### 4. Logging de Errores Manual

```typescript
import { logError } from '@/lib/services/analytics-service'

try {
  // ... código que puede fallar
} catch (error) {
  await logError({
    userId: user?.id,
    mensaje: error.message,
    stack: error.stack,
    tipo: error.name,
    severidad: 'ERROR',
    url: window.location.href,
    componente: 'CalculadoraPILA',
    accion: 'calcular_aportes',
    metadata: { valorIBC: 5000000 },
  })
}
```

### 5. Acceder al Dashboard Admin

1. Iniciar sesión como admin
2. Ir a `/admin/analytics`
3. Ver métricas en tiempo real:
   - Tab "Usuarios": Gráfico de usuarios activos y nuevos
   - Tab "Features": Distribución de uso (PILA, Facturación, IA)
   - Tab "Eventos": Top 10 eventos más frecuentes
   - Tab "Errores": Lista de errores sin resolver

---

## 📈 Métricas Disponibles

### KPIs Dashboard
- **Usuarios Activos**: Total de usuarios únicos en el período
- **Nuevos Usuarios**: Registros completados
- **Retención 7 días**: % de usuarios que regresan después de 7 días
- **Errores Sin Resolver**: Errores críticos que requieren atención

### Gráficos
- **Usuarios**: Evolución diaria de usuarios activos y nuevos
- **Features**: Distribución de uso por feature (Doughnut chart)
- **Eventos**: Top 10 eventos más frecuentes (Bar chart)
- **Errores**: Lista detallada con severidad y timestamp

---

## 🔒 Privacidad y GDPR

✅ **No se trackean datos sensibles**:
- No se guardan contraseñas
- No se guardan datos bancarios
- No se guardan documentos de identidad
- No se vende información a terceros

✅ **Datos capturados**:
- Session ID (temporal, no persistente)
- User agent (para debugging)
- IP (opcional, para geolocalización)
- Eventos de uso (acciones, no contenido)

---

## 🛠️ Configuración Opcional

### Habilitar Sentry (opcional)

1. Crear cuenta en [sentry.io](https://sentry.io)
2. Obtener DSN del proyecto
3. Agregar a `.env`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
4. Reiniciar servidor

### Habilitar Google Analytics (opcional)

El hook `useAnalytics` ya envía eventos a Google Analytics si está configurado:

```typescript
// En app/layout.tsx, agregar:
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

---

## 🎯 Objetivos Cumplidos

- ✅ Tracking de 20+ eventos clave
- ✅ Dashboard admin con visualizaciones
- ✅ Captura automática de errores
- ✅ Integración con Sentry (opcional)
- ✅ Logging estructurado con contexto
- ✅ GDPR compliant (no datos sensibles)
- ✅ Impacto mínimo en performance (async, non-blocking)
- ✅ Métricas agregadas para queries rápidas
- ✅ Retención de usuarios calculada
- ✅ Error severity classification

---

## 📝 API Endpoints

### POST `/api/analytics/track`
Trackea un evento de usuario.

**Body:**
```json
{
  "evento": "pila_liquidada",
  "categoria": "PILA",
  "metadata": { "monto": 1500000 },
  "sessionId": "uuid"
}
```

### POST `/api/analytics/error`
Registra un error con contexto.

**Body:**
```json
{
  "mensaje": "Error al calcular PILA",
  "stack": "...",
  "tipo": "ValidationError",
  "severidad": "ERROR",
  "url": "/pila/liquidar",
  "componente": "CalculadoraPILA",
  "accion": "calcular_aportes",
  "sessionId": "uuid",
  "metadata": { "valorIBC": 5000000 }
}
```

### GET `/api/analytics/metricas?dias=30`
Obtiene métricas agregadas (requiere rol ADMIN).

**Response:**
```json
{
  "metricasDiarias": [...],
  "totales": {
    "usuariosActivos": 150,
    "nuevosUsuarios": 25,
    "usosPILA": 450,
    "usosFacturacion": 320,
    "usosAsesoria": 180
  },
  "eventosFrecuentes": [...],
  "erroresRecientes": [...],
  "retencion7Dias": "68.50"
}
```

---

## 🎉 ¡Sistema Completo!

El sistema de analytics y monitoreo está completamente implementado y listo para usar. Ahora puedes:

1. ✅ Tomar decisiones basadas en datos reales
2. ✅ Identificar features más populares
3. ✅ Detectar errores proactivamente
4. ✅ Medir retención de usuarios
5. ✅ Optimizar el producto según uso real

**Próximos pasos sugeridos:**
- Agregar más eventos específicos según necesidades
- Configurar alertas para errores críticos
- Analizar retención y optimizar onboarding
- A/B testing basado en métricas
