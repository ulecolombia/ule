# 🏗️ Arquitectura del Proyecto ULE

## Visión General

**Ule** es un sistema integral de gestión de seguridad social para Colombia, enfocado en independientes y trabajadores por prestación de servicios.

### Stack Tecnológico

- **Framework**: Next.js 14.2.33 (App Router)
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth v5 (beta)
- **Styling**: Tailwind CSS 3.4
- **Validación**: Zod
- **State Management**: React Hook Form + SWR
- **UI Components**: Radix UI + Custom components
- **Notificaciones**: Sonner (toast)
- **Iconos**: Material Symbols Outlined

---

## 📁 Estructura del Proyecto

```
/Ule
├── app/                          # Next.js App Router (páginas y rutas)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/                # Página de inicio de sesión
│   │   └── registro/             # Página de registro
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Endpoints de autenticación
│   │   ├── user/                 # Endpoints de usuario
│   │   ├── facturacion/          # Endpoints de facturación
│   │   ├── pila/                 # Endpoints PILA
│   │   ├── clientes/             # Endpoints de clientes
│   │   ├── ia/                   # Endpoints de IA (chat)
│   │   ├── notificaciones/       # Endpoints de notificaciones
│   │   └── analytics/            # Endpoints de analytics
│   │
│   ├── dashboard/                # Panel principal
│   ├── onboarding/               # Proceso de registro (4 pasos)
│   │   ├── paso-1/               # Datos personales
│   │   ├── paso-2/               # Información laboral
│   │   ├── paso-3/               # Seguridad social
│   │   └── paso-4/               # Confirmación
│   │
│   ├── facturacion/              # Módulo de facturación electrónica
│   │   └── nueva/                # Crear nueva factura
│   │
│   ├── pila/                     # Módulo PILA
│   │   └── liquidar/             # Liquidar aportes
│   │
│   ├── asesoria/                 # Chat de asesoría con IA
│   ├── perfil/                   # Perfil de usuario
│   ├── calendario/               # Calendario de obligaciones
│   ├── herramientas/             # Herramientas y calculadoras
│   └── biblioteca/               # Biblioteca de recursos
│
├── components/                   # Componentes React reutilizables
│   ├── ui/                       # Componentes base del sistema de diseño
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── MainNav.tsx
│   │   └── SidebarMenu.tsx
│   │
│   ├── auth/                     # Componentes de autenticación
│   ├── facturacion/              # Componentes de facturación
│   │   ├── items-table.tsx       # Tabla de items de factura
│   │   └── totales-card.tsx      # Card de totales
│   │
│   ├── onboarding/               # Componentes de onboarding
│   │   ├── summary-card.tsx
│   │   └── terms-modal.tsx
│   │
│   └── error-boundary.tsx        # Error boundary global
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── auth.ts                   # Configuración NextAuth
│   ├── db.ts                     # Cliente Prisma
│   ├── rate-limit.ts             # Rate limiting con Upstash
│   │
│   ├── calculators/              # Calculadoras (PILA, pensión, etc.)
│   │   └── pension-calculator.ts
│   │
│   ├── validations/              # Schemas de validación Zod
│   │   ├── factura.ts
│   │   ├── cliente.ts
│   │   └── ...
│   │
│   ├── utils/                    # Utilidades
│   │   ├── format.ts             # Formateo (moneda, fechas, etc.)
│   │   ├── facturacion-utils.ts
│   │   └── ...
│   │
│   ├── services/                 # Servicios externos
│   │   └── openai-service.ts    # Integración OpenAI
│   │
│   ├── security/                 # Seguridad
│   │   ├── encryption.ts         # Encriptación de datos sensibles
│   │   └── secure-logger.ts      # Logger seguro
│   │
│   └── types/                    # Tipos TypeScript
│       └── facturacion.ts
│
├── prisma/
│   └── schema.prisma             # Schema de base de datos (1800+ líneas)
│
├── public/                       # Archivos estáticos
│   ├── icons/                    # Iconos PWA
│   ├── facturas/                 # PDFs generados
│   └── sw.js                     # Service Worker
│
└── .claude/                      # Configuración Claude Code
    ├── agents/                   # Agentes especializados
    │   ├── fullstack-developer.md
    │   ├── debugger.md
    │   ├── context-manager.md
    │   ├── test-engineer.md
    │   └── test-automator.md
    └── settings.local.json
```

---

## 🔄 Flujos Principales

### 1. Flujo de Autenticación

```
/login → Validación → NextAuth Session → Middleware → /dashboard
   ↓
Nuevo usuario
   ↓
/registro → Crear cuenta → Auto-login → /onboarding/paso-1
```

### 2. Flujo de Onboarding (4 Pasos)

```
Paso 1: Datos Personales
  ├─ nombre, tipoDocumento, numeroDocumento
  ├─ telefono, direccion, ciudad, departamento
  └─ Guardar en localStorage

Paso 2: Información Laboral
  ├─ tipoContrato, profesion, actividadEconomica
  ├─ numeroContratos, ingresoMensualPromedio
  └─ Guardar en localStorage

Paso 3: Seguridad Social
  ├─ entidadSalud, fechaAfiliacionSalud
  ├─ entidadPension, fechaAfiliacionPension
  ├─ arl, nivelRiesgoARL, fechaAfiliacionARL
  └─ Guardar en localStorage

Paso 4: Confirmación
  ├─ estadoCivil, personasACargo
  ├─ Aceptar términos y condiciones
  ├─ Revisar resumen de todos los pasos
  ├─ Combinar datos de localStorage
  ├─ POST /api/user/profile
  └─ Redirigir a /dashboard
```

### 3. Flujo de Facturación

```
/facturacion/nueva
  ├─ Seleccionar cliente (o crear nuevo)
  ├─ Fecha y método de pago
  ├─ Agregar ítems (descripción, cantidad, valor, IVA)
  ├─ Auto-save borrador cada 30s
  ├─ Calcular totales en tiempo real
  ├─ POST /api/facturacion/facturas
  │   ├─ Validar con Zod
  │   ├─ Generar CUFE
  │   ├─ Crear PDF
  │   └─ Guardar en BD
  └─ Redirigir a lista de facturas
```

### 4. Flujo de PILA

```
/pila/liquidar
  ├─ Ingresar ingreso mensual (formato: 1.423.500)
  ├─ Seleccionar nivel de riesgo ARL
  ├─ Seleccionar período (mes/año)
  ├─ Calcular aportes
  │   ├─ IBC (Ingreso Base de Cotización)
  │   ├─ Salud (12.5%)
  │   ├─ Pensión (16%)
  │   └─ ARL (variable según nivel)
  ├─ Mostrar desglose detallado
  ├─ Guardar liquidación
  └─ Generar link de pago (integración pendiente)
```

---

## 🔐 Seguridad

### Headers de Seguridad (next.config.js)

- **CSP**: Content Security Policy configurado
- **HSTS**: Strict-Transport-Security habilitado
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: origin-when-cross-origin

### Autenticación

- NextAuth v5 con providers:
  - Credentials (email/password)
  - Google OAuth
  - GitHub OAuth (preparado)
- Middleware protege rutas privadas
- Rate limiting con Upstash Redis

### Encriptación de Datos Sensibles

```typescript
// Campos encriptados en BD:
;-numeroDocumento - telefono - direccion
```

### Cumplimiento Legal

- **Ley 1581 de 2012** (Protección de Datos Personales - Colombia)
- Consentimientos rastreados en BD
- GDPR-ready (exportación y eliminación de datos)

---

## 🗄️ Base de Datos

### Modelos Principales

```prisma
User
  ├─ Datos personales (nombre, email, documento, etc.)
  ├─ Información laboral (tipoContrato, profesion, ingresos)
  ├─ Seguridad social (EPS, pensión, ARL)
  ├─ Configuración (theme, notifications)
  └─ Relaciones: Cliente[], Factura[], LiquidacionPILA[]

Cliente
  ├─ Datos básicos (nombre, email, documento)
  └─ Relación: Factura[]

Factura
  ├─ Datos factura (numeroFactura, fecha, total, CUFE)
  ├─ Items (descripcion, cantidad, valor, IVA)
  └─ Estado (BORRADOR, EMITIDA, PAGADA, ANULADA)

LiquidacionPILA
  ├─ Período (mes, año)
  ├─ Montos (IBC, salud, pensión, ARL)
  └─ Estado (PENDIENTE, PAGADO, VENCIDO)
```

### Índices Optimizados

- Usuario: email (unique), numeroDocumento
- Cliente: userId + numeroDocumento
- Factura: userId + estado, numeroFactura
- PILA: userId + periodo

---

## 📦 Dependencias Clave

### Producción

```json
{
  "next": "14.2.33",
  "react": "18.3.1",
  "next-auth": "5.0.0-beta.25",
  "@prisma/client": "6.1.0",
  "zod": "3.23.8",
  "react-hook-form": "7.53.2",
  "swr": "2.2.5",
  "sonner": "1.7.1",
  "@radix-ui/react-*": "múltiples",
  "tailwindcss": "3.4.17"
}
```

### Desarrollo

```json
{
  "typescript": "5.7.2",
  "eslint": "9.17.0",
  "prettier": "3.4.2",
  "prisma": "6.1.0",
  "husky": "9.1.7"
}
```

---

## 🎨 Sistema de Diseño

Ver `/docs/DESIGN_SYSTEM.md` para detalles completos.

**Resumen**:

- Paleta: Turquesa (#14B8A6) como color primario
- Tipografía: Inter (Google Fonts)
- Componentes: Radix UI + Custom
- Responsive: Mobile-first
- Dark mode: Preparado pero no implementado

---

## 🚀 Despliegue

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Encriptación
ENCRYPTION_KEY=

# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email (opcional)
RESEND_API_KEY=

# IA (opcional)
OPENAI_API_KEY=
```

### Comandos de Despliegue

```bash
# Build
npm run build

# Migraciones
npx prisma migrate deploy

# Start
npm start
```

---

## 📝 Notas Técnicas

### Convenciones de Código

1. **Componentes**: PascalCase (`UserProfile.tsx`)
2. **Utilidades**: camelCase (`formatCurrency.ts`)
3. **Constantes**: UPPER_SNAKE_CASE (`SMMLV_2025`)
4. **Tipos**: PascalCase + Type suffix (`UserType`, `FacturaInput`)

### Patrones de Diseño

1. **Custom Hooks**: `use-*.ts` para lógica reutilizable
2. **Server Components**: Por defecto en App Router
3. **Client Components**: Solo cuando se necesita interactividad
4. **API Routes**: RESTful con validación Zod
5. **Error Handling**: Try-catch + logger + toast user feedback

### Performance

- SWR para cache y revalidación
- React Hook Form para formularios optimizados
- Lazy loading preparado (no implementado aún)
- Bundle optimization con Next.js

---

**Última actualización**: 2025-11-15
**Versión del proyecto**: 0.2.1
