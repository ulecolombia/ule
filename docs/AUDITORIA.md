# Sistema de Auditoría y Trazabilidad - ULE

## 📋 Resumen Ejecutivo

Sistema completo de auditoría y trazabilidad que registra automáticamente todas las acciones críticas del sistema, cumpliendo con:

- **Ley 1581 de 2012** (Colombia): Registro de acceso a datos personales
- **Decreto 1377 de 2013**: Logs de tratamiento de datos
- **Ley 1273 de 2009**: Evidencia forense para delitos informáticos
- **ISO 27001**: Estándares de seguridad de la información

**Estado:** ✅ **100% Implementado y Funcional**

---

## 🎯 Características Principales

### 1. **Registro Automático de Logs**
- ✅ Captura automática de todas las acciones críticas
- ✅ 52 tipos de acciones catalogadas (LOGIN, FACTURA_CREADA, DATOS_EXPORTADOS, etc.)
- ✅ 12 categorías (AUTENTICACION, FACTURACION, DATOS_PERSONALES, etc.)
- ✅ 4 niveles de riesgo (BAJO, MEDIO, ALTO, CRITICO)
- ✅ Información completa de contexto (IP, user-agent, geo, duración, etc.)

### 2. **Sistema de Alertas Inteligentes**
- ✅ Detección automática de actividad sospechosa
- ✅ 10 tipos de alertas (intentos fallidos, ubicación inusual, etc.)
- ✅ 5 niveles de severidad (INFO → CRITICA)
- ✅ Workflow completo de gestión
- ✅ Notificaciones a administradores

### 3. **APIs de Consulta**
- ✅ Consulta de logs con filtros avanzados
- ✅ Estadísticas y métricas en tiempo real
- ✅ Gestión de alertas
- ✅ Exportación de reportes

### 4. **Cumplimiento Legal**
- ✅ Retención configurable por categoría
- ✅ Inmutabilidad de logs
- ✅ Trazabilidad completa
- ✅ Evidencia forense

---

## 🗄️ Arquitectura del Sistema

### Componentes Principales

```
/lib/audit/
├── audit-service.ts      # Servicio core de auditoría
├── audit-middleware.ts   # Middleware para APIs
└── audit-helpers.ts      # Helpers por módulo

/app/api/admin/
├── auditoria/
│   ├── route.ts         # GET: Listar logs
│   ├── [id]/route.ts    # GET/PATCH: Detalle y revisión
│   └── stats/route.ts   # GET: Estadísticas
└── alertas/
    ├── route.ts         # GET: Listar alertas
    └── [id]/route.ts    # GET/PATCH: Detalle y gestión

/prisma/schema.prisma
├── LogAuditoria         # Modelo principal de logs
├── AlertaSeguridad      # Modelo de alertas
└── PoliticaRetencion    # Políticas de retención
```

---

## 📊 Modelo de Datos

### LogAuditoria

**Campos principales:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String | ID único (cuid) |
| userId | String? | Usuario que realiza la acción |
| userEmail | String? | Email (duplicado para búsquedas) |
| accion | AccionAuditoria | Tipo de acción |
| recurso | String? | Recurso afectado (ej: "factura:123") |
| exitoso | Boolean | ¿Acción exitosa? |
| detalles | Json? | Información específica |
| detallesAntes | Json? | Estado anterior |
| detallesDespues | Json? | Estado posterior |
| ip | String | IP del usuario |
| ipGeo | Json? | {country, city, lat, lon} |
| userAgent | String | User agent completo |
| dispositivo | String? | mobile, desktop, tablet |
| navegador | String? | Chrome, Firefox, etc. |
| sistemaOperativo | String? | Windows, macOS, etc. |
| metodoHttp | String? | GET, POST, PUT, DELETE |
| ruta | String? | /api/facturas/create |
| duracionMs | Int? | Tiempo de ejecución |
| nivelRiesgo | NivelRiesgo | BAJO, MEDIO, ALTO, CRITICO |
| categoria | CategoriaAuditoria | AUTENTICACION, FACTURACION, etc. |
| timestamp | DateTime | Fecha/hora del evento |
| sessionId | String? | ID de sesión |
| requestId | String? | ID único de request |
| tags | String[] | Tags para búsqueda |

**Índices optimizados:**
- userId, userEmail, accion, timestamp
- nivelRiesgo, categoria, exitoso
- ip, sessionId, requestId
- Compuestos: (timestamp, userId), (timestamp, accion)

### AlertaSeguridad

**Campos principales:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tipo | TipoAlerta | MULTIPLES_INTENTOS_FALLIDOS, etc. |
| severidad | SeveridadAlerta | INFO, BAJA, MEDIA, ALTA, CRITICA |
| titulo | String | Título descriptivo |
| descripcion | String | Descripción detallada |
| userId | String? | Usuario afectado |
| logIds | String[] | IDs de logs relacionados |
| estado | EstadoAlerta | PENDIENTE, EN_REVISION, etc. |
| asignadoA | String? | Admin que gestiona |
| notas | String? | Notas del admin |
| accionTomada | String? | Acción realizada |
| notificado | Boolean | ¿Se notificó? |

---

## 🚀 Uso del Sistema

### 1. Registro Manual de Auditoría

```typescript
import { registrarAuditoria } from '@/lib/audit/audit-service'

// Ejemplo: Login exitoso
await registrarAuditoria({
  userId: user.id,
  accion: 'LOGIN',
  exitoso: true,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  sessionId: session.id,
  detalles: {
    metodo: 'email',
    dispositivo: 'mobile'
  }
})

// Ejemplo: Cambio de datos
await registrarAuditoria({
  userId: user.id,
  accion: 'PERFIL_ACTUALIZADO',
  detallesAntes: { telefono: '3001234567' },
  detallesDespues: { telefono: '3009876543' },
  ip: req.ip,
  nivelRiesgo: 'MEDIO'
})
```

### 2. Uso con Middleware (Automático)

```typescript
import { withAudit } from '@/lib/audit/audit-middleware'

// Envuelve tu handler para auditar automáticamente
export const POST = withAudit(
  async (req) => {
    // Tu lógica aquí
    const factura = await crearFactura(data)
    return NextResponse.json({ factura })
  },
  {
    action: 'FACTURA_CREADA',
    resourceExtractor: (req) => `factura:${facturaId}`
  }
)
```

### 3. Uso de Helpers Especializados

```typescript
import {
  auditarCreacionFactura,
  auditarLiquidacionPILA,
  auditarConsultaIA,
  auditarExportacionDatos
} from '@/lib/audit/audit-helpers'

// En tu handler de facturación
await auditarCreacionFactura(
  userId,
  factura.id,
  {
    numeroFactura: factura.numero,
    clienteNombre: factura.cliente.nombre,
    total: factura.total
  },
  req.ip
)

// En tu handler de PILA
await auditarLiquidacionPILA(
  userId,
  aporte.id,
  {
    periodo: '2024-01',
    ingresoBase: 5000000,
    total: 800000
  },
  req.ip
)
```

---

## 🔍 Consulta de Logs

### API: GET /api/admin/auditoria

**Parámetros de consulta:**

```typescript
{
  page?: number           // Página (default: 1)
  limit?: number          // Registros por página (default: 50, max: 100)
  userId?: string         // Filtrar por usuario
  userEmail?: string      // Filtrar por email
  accion?: string         // Filtrar por acción
  categoria?: string      // Filtrar por categoría
  nivelRiesgo?: string    // Filtrar por nivel de riesgo
  exitoso?: boolean       // Filtrar por éxito/fallo
  fechaInicio?: string    // Fecha inicio (ISO 8601)
  fechaFin?: string       // Fecha fin (ISO 8601)
  ip?: string             // Filtrar por IP
  sortBy?: string         // timestamp | nivelRiesgo | accion
  sortOrder?: string      // asc | desc
}
```

**Ejemplo de uso:**

```bash
# Obtener logs de login fallidos en las últimas 24 horas
GET /api/admin/auditoria?accion=LOGIN_FALLIDO&fechaInicio=2024-11-10T00:00:00Z

# Obtener logs de alto riesgo de un usuario
GET /api/admin/auditoria?userId=user-123&nivelRiesgo=ALTO&nivelRiesgo=CRITICO

# Obtener logs de facturación con paginación
GET /api/admin/auditoria?categoria=FACTURACION&page=1&limit=20
```

**Respuesta:**

```json
{
  "logs": [
    {
      "id": "log-123",
      "userId": "user-456",
      "userEmail": "usuario@example.com",
      "userName": "Juan Pérez",
      "accion": "FACTURA_CREADA",
      "recurso": "factura:789",
      "exitoso": true,
      "detalles": {
        "numeroFactura": "FE-001",
        "total": 500000
      },
      "ip": "192.168.1.1",
      "ipGeo": {
        "country": "Colombia",
        "city": "Bogotá"
      },
      "dispositivo": "desktop",
      "navegador": "Chrome",
      "categoria": "FACTURACION",
      "nivelRiesgo": "BAJO",
      "timestamp": "2024-11-11T10:30:00Z",
      "duracionMs": 250
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "totalPages": 25
  }
}
```

---

## 📈 Estadísticas

### API: GET /api/admin/auditoria/stats

**Parámetros:**

```typescript
{
  fechaInicio?: string    // ISO 8601 (default: hace 30 días)
  fechaFin?: string       // ISO 8601 (default: ahora)
}
```

**Respuesta:**

```json
{
  "resumen": {
    "totalLogs": 15432,
    "fallidos": 234,
    "requierenRevision": 12,
    "tasaExito": "98.48"
  },
  "porNivelRiesgo": [
    { "nivel": "BAJO", "total": 12000 },
    { "nivel": "MEDIO", "total": 2500 },
    { "nivel": "ALTO", "total": 800 },
    { "nivel": "CRITICO": "total": 132 }
  ],
  "porCategoria": [
    { "categoria": "AUTENTICACION", "total": 5000 },
    { "categoria": "FACTURACION", "total": 3500 },
    { "categoria": "SEGURIDAD_SOCIAL", "total": 2800 }
  ],
  "porAccion": [
    { "accion": "LOGIN", "total": 3500 },
    { "accion": "FACTURA_CREADA", "total": 2100 }
  ],
  "actividadDiaria": [
    { "fecha": "2024-11-11", "total": 520 },
    { "fecha": "2024-11-10", "total": 485 }
  ],
  "topUsuarios": [
    {
      "userId": "user-123",
      "email": "usuario@example.com",
      "nombre": "Juan Pérez",
      "total": 450
    }
  ],
  "topIPs": [
    { "ip": "192.168.1.1", "total": 320 },
    { "ip": "10.0.0.5", "total": 180 }
  ]
}
```

---

## 🚨 Sistema de Alertas

### Tipos de Alertas Automáticas

1. **MULTIPLES_INTENTOS_FALLIDOS**
   - Trigger: ≥5 intentos de login fallidos en 15 minutos
   - Severidad: ALTA
   - Acción: Revisar si es ataque de fuerza bruta

2. **ACCESO_UBICACION_INUSUAL**
   - Trigger: Login desde país diferente al historial
   - Severidad: MEDIA
   - Acción: Verificar con usuario si es acceso legítimo

3. **CAMBIOS_MULTIPLES_RAPIDOS**
   - Trigger: ≥5 cambios en perfil/seguridad en 10 minutos
   - Severidad: ALTA
   - Acción: Verificar si cuenta fue comprometida

4. **ACCESO_HORARIO_INUSUAL**
   - Trigger: Login entre 2 AM y 5 AM
   - Severidad: BAJA
   - Acción: Monitorear patrón

5. **DESCARGA_MASIVA_DATOS**
   - Trigger: ≥10 descargas en 5 minutos
   - Severidad: ALTA
   - Acción: Verificar si es exfiltración de datos

### API: GET /api/admin/alertas

**Parámetros:**

```typescript
{
  page?: number
  limit?: number
  estado?: string    // PENDIENTE, EN_REVISION, etc.
  severidad?: string // INFO, BAJA, MEDIA, ALTA, CRITICA
  tipo?: string      // MULTIPLES_INTENTOS_FALLIDOS, etc.
}
```

### API: PATCH /api/admin/alertas/[id]

**Actualizar estado de alerta:**

```typescript
{
  estado: 'EN_REVISION' | 'FALSO_POSITIVO' | 'CONFIRMADA' | 'RESUELTA',
  notas?: string,
  accionTomada?: string
}
```

---

## 🔐 Seguridad del Sistema de Auditoría

### 1. **Inmutabilidad**
- Los logs NO se pueden modificar ni eliminar manualmente
- Solo se pueden marcar como "revisados"
- Eliminación solo mediante políticas de retención automáticas

### 2. **Sanitización Automática**
- Elimina automáticamente datos sensibles:
  - Passwords
  - Tokens
  - Secrets
  - API Keys
  - Datos de tarjetas de crédito
  - Códigos 2FA

### 3. **Control de Acceso**
- Solo administradores pueden consultar logs
- Super administradores tienen acceso completo
- Toda consulta de logs es auditada

### 4. **Geolocalización de IP**
- Usa servicio gratuito ipapi.co
- Timeout de 2 segundos para no afectar rendimiento
- Fallo silencioso si servicio no disponible

---

## 📦 Políticas de Retención

### Por Defecto

| Categoría | Días | Requisito Legal |
|-----------|------|-----------------|
| AUTENTICACION | 365 | Seguridad |
| DATOS_PERSONALES | 1825 (5 años) | Ley 1581 Art. 11 |
| DATOS_FINANCIEROS | 1825 (5 años) | Estatuto Tributario Art. 632 |
| FACTURACION | 1825 (5 años) | Estatuto Tributario |
| SEGURIDAD_SOCIAL | 1825 (5 años) | Normativa PILA |
| SEGURIDAD | 730 (2 años) | ISO 27001 |
| SISTEMA | 365 | Buenas prácticas |
| GENERAL | 365 | Por defecto |

### Configuración

```sql
-- Crear/actualizar política de retención
INSERT INTO "politicas_retencion" (categoria, dias_retencion, descripcion, requisito_legal)
VALUES ('DATOS_FINANCIEROS', 1825, 'Datos tributarios', 'Estatuto Tributario Art. 632')
ON CONFLICT (categoria) DO UPDATE
SET dias_retencion = EXCLUDED.dias_retencion;
```

---

## 🎨 Dashboard de Administración (Futuro)

### Pantallas a Implementar

1. **Dashboard Principal**
   - Métricas en tiempo real
   - Gráficos de actividad
   - Alertas pendientes

2. **Explorador de Logs**
   - Tabla con filtros avanzados
   - Búsqueda full-text
   - Exportación a CSV/PDF

3. **Gestión de Alertas**
   - Lista priorizada por severidad
   - Workflow de resolución
   - Timeline de eventos

4. **Reportes de Compliance**
   - Reportes predefinidos
   - Exportación para auditorías
   - Certificados de cumplimiento

---

## 🧪 Testing

```typescript
// Ejecutar tests de auditoría
npm test lib/audit/

// Tests incluyen:
// ✅ Registro de logs
// ✅ Sanitización de datos sensibles
// ✅ Generación de alertas
// ✅ Categorización automática
// ✅ Determinación de nivel de riesgo
// ✅ Geolocalización de IP
```

---

## 📚 Casos de Uso

### Caso 1: Investigación de Incidente

**Escenario:** Reporte de acceso no autorizado a cuenta

```typescript
// 1. Buscar todos los logs del usuario en las últimas 24h
GET /api/admin/auditoria?userEmail=victima@example.com&fechaInicio=...

// 2. Filtrar por acciones sospechosas
GET /api/admin/auditoria?userEmail=victima@example.com&nivelRiesgo=ALTO

// 3. Revisar IPs de acceso
// Resultado: IP nueva detectada desde Venezuela (usuario en Colombia)

// 4. Revisar alertas generadas
GET /api/admin/alertas?userEmail=victima@example.com

// 5. Marcar alerta como confirmada
PATCH /api/admin/alertas/alerta-123
{
  "estado": "CONFIRMADA",
  "accionTomada": "Usuario notificado, cambio de contraseña forzado"
}
```

### Caso 2: Auditoría de Compliance

**Escenario:** Auditoría anual de protección de datos

```typescript
// 1. Obtener estadísticas del año
GET /api/admin/auditoria/stats?fechaInicio=2024-01-01&fechaFin=2024-12-31

// 2. Logs de exportación de datos (Art. 20 Ley 1581)
GET /api/admin/auditoria?accion=DATOS_EXPORTADOS&fechaInicio=2024-01-01

// 3. Logs de eliminación (Derecho al Olvido)
GET /api/admin/auditoria?accion=CUENTA_ELIMINADA&fechaInicio=2024-01-01

// 4. Logs de consentimientos
GET /api/admin/auditoria?accion=CONSENTIMIENTO_OTORGADO&categoria=DATOS_PERSONALES

// 5. Exportar a PDF para auditor externo
```

### Caso 3: Detección de Fraude

**Escenario:** Patrón sospechoso de facturas

```typescript
// 1. Buscar facturas del usuario
GET /api/admin/auditoria?userId=user-123&categoria=FACTURACION

// 2. Análisis: 50 facturas creadas en 10 minutos
// Sistema generó alerta automáticamente

// 3. Revisar alerta
GET /api/admin/alertas?userId=user-123&tipo=DESCARGA_MASIVA_DATOS

// 4. Marcar como confirmada y bloquear usuario
PATCH /api/admin/alertas/alerta-456
{
  "estado": "CONFIRMADA",
  "accionTomada": "Usuario bloqueado temporalmente, investigación en curso"
}
```

---

## 🚀 Roadmap Futuro

### Fase 1: ✅ Completada
- ✅ Modelos de base de datos
- ✅ Servicio core de auditoría
- ✅ Sistema de alertas automáticas
- ✅ APIs de consulta
- ✅ Middleware y helpers

### Fase 2: 🔄 En progreso
- Dashboard web de administración
- Visualización de logs en tiempo real
- Reportes predefinidos
- Exportación a CSV/PDF/Excel

### Fase 3: 📋 Planificado
- Machine Learning para detección de anomalías
- Alertas predictivas
- Integración con SIEM externos
- Reportes automáticos mensuales
- Certificados de compliance automáticos

---

## 📞 Soporte

Para dudas o problemas con el sistema de auditoría:

- **Documentación:** Este archivo
- **Código fuente:** `/lib/audit/`, `/app/api/admin/auditoria/`
- **Tests:** `/tests/audit/`

---

**Documento generado automáticamente**
Sistema ULE - Auditoría y Trazabilidad v1.0
© 2024 Todos los derechos reservados
