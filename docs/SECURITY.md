# 🔒 Documentación de Seguridad - ULE

Sistema completo de seguridad y autenticación para protección de cuentas de usuario y datos sensibles.

---

## 📋 Tabla de Contenidos

1. [Características Implementadas](#características-implementadas)
2. [Arquitectura de Seguridad](#arquitectura-de-seguridad)
3. [Configuración](#configuración)
4. [Guía de Usuario](#guía-de-usuario)
5. [Guía de Desarrollador](#guía-de-desarrollador)
6. [Monitoreo y Alertas](#monitoreo-y-alertas)
7. [Cumplimiento y Normativas](#cumplimiento-y-normativas)
8. [Troubleshooting](#troubleshooting)
9. [Roadmap](#roadmap)

---

## 🎯 Características Implementadas

### 1. Rate Limiting

Protección contra ataques de fuerza bruta y abuso:

- **Login**: Máximo 5 intentos cada 15 minutos por email
- **Registro**: Máximo 3 registros por hora por IP
- **Password Reset**: Máximo 3 solicitudes por hora por email
- **2FA Verification**: Máximo 5 intentos cada 5 minutos por sesión
- **API General**: Máximo 100 requests por minuto por usuario
- **AI Queries**: Máximo 20 consultas por hora por usuario
- **IPs Sospechosas**: Máximo 2 intentos cada 30 minutos

**Tecnología**: Upstash Redis con sliding window algorithm

### 2. Validación de Contraseñas

Sistema de scoring 0-100 con validación exhaustiva:

**Requisitos Mínimos**:
- ✓ Mínimo 8 caracteres
- ✓ Al menos 1 letra mayúscula
- ✓ Al menos 1 letra minúscula
- ✓ Al menos 1 número
- ✓ Al menos 1 carácter especial

**Validaciones Avanzadas**:
- ✗ No contiene información personal (email, nombre, documento)
- ✗ No es contraseña común (top 30+ passwords)
- ✗ No contiene patrones repetitivos
- ✗ No contiene secuencias obvias
- ✓ Integración con Have I Been Pwned API (k-anonymity)
- ✓ Indicador visual de fortaleza en tiempo real

### 3. Autenticación de Dos Factores (2FA)

Sistema TOTP compatible con apps estándar:

**Características**:
- ✓ Generación de QR code para configuración
- ✓ 10 códigos de respaldo encriptados
- ✓ Compatible con Google Authenticator, Authy, Microsoft Authenticator
- ✓ Tokens de 6 dígitos con validación de 30 segundos
- ✓ Verificación automática de tokens
- ✓ Opción de usar códigos de respaldo

**Flujo de Configuración**:
1. Usuario solicita habilitar 2FA
2. Sistema genera secret y QR code
3. Usuario escanea QR con app autenticadora
4. Usuario descarga códigos de respaldo
5. Usuario verifica código TOTP
6. 2FA activado

### 4. Recuperación de Contraseña

Sistema seguro con respuesta opaca:

**Flujo**:
1. Usuario solicita reset de contraseña
2. Sistema valida rate limiting
3. Si el email existe, envía link con token
4. Token expira en 1 hora
5. Usuario crea nueva contraseña fuerte
6. Todas las sesiones son revocadas automáticamente

**Seguridad**:
- ✓ Respuesta opaca (no revela si email existe)
- ✓ Tokens de un solo uso
- ✓ Expiración automática
- ✓ Rate limiting de solicitudes
- ✓ Revocación automática de sesiones

### 5. Gestión de Sesiones

Tracking completo con información detallada:

**Información por Sesión**:
- Tipo de dispositivo (desktop/mobile/tablet)
- Navegador y versión
- Sistema operativo
- IP address
- Ubicación geográfica (país, ciudad)
- Última actividad
- Fecha de inicio
- Estado (activa/revocada)

**Acciones Disponibles**:
- ✓ Ver todas las sesiones activas
- ✓ Cerrar sesión individual
- ✓ Cerrar todas las sesiones excepto actual
- ✓ Indicador visual de sesión actual
- ✓ Limpieza automática de sesiones expiradas

### 6. Protección de Cuenta

Mecanismos automáticos de seguridad:

- **Bloqueo Temporal**: Después de 5 intentos fallidos, cuenta bloqueada 30 minutos
- **Registro de Intentos**: Todos los intentos de login (exitosos y fallidos) son registrados
- **Detección de IPs Sospechosas**: Rate limiting más estricto para IPs con múltiples fallos
- **Eventos de Seguridad**: Log completo de eventos con severidad (BAJA, MEDIA, ALTA, CRÍTICA)

### 7. Encriptación de Datos

Protección de información sensible:

- **Algorithm**: AES-256-GCM
- **IV**: 16 bytes aleatorios por operación
- **Auth Tag**: Verificación de integridad
- **Datos Encriptados**:
  - Secrets de 2FA
  - Códigos de respaldo
  - Tokens de recuperación
  - Información sensible adicional

**Hashing de Contraseñas**:
- **Algorithm**: bcrypt
- **Rounds**: 12
- **Salt**: Automático por bcrypt

---

## 🏗️ Arquitectura de Seguridad

### Stack Tecnológico

```
┌─────────────────────────────────────────────────┐
│              Next.js 14 App Router              │
│                  TypeScript                     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│          API Routes con Rate Limiting           │
│   /api/auth/secure-login                        │
│   /api/auth/2fa/*                               │
│   /api/auth/password-reset/*                    │
│   /api/auth/sessions/*                          │
└─────────────────────────────────────────────────┘
                      ↓
┌──────────────────┬──────────────────┬───────────┐
│  Prisma ORM      │  Upstash Redis   │ Bcryptjs  │
│  (PostgreSQL)    │  (Rate Limiting) │ (Hashing) │
└──────────────────┴──────────────────┴───────────┘
```

### Flujo de Autenticación

```
Usuario → Login Form
           ↓
    Rate Limit Check (Upstash Redis)
           ↓
    Verify Credentials (bcrypt)
           ↓
    Check Account Lock Status
           ↓
    2FA Required? ────Yes──→ Verify TOTP/Backup Code
           │                        ↓
           No                  Valid Token?
           ↓                        ↓
    Create Session              Create Session
           ↓                        ↓
    Return JWT Token            Return JWT Token
           ↓                        ↓
    Redirect to Dashboard    Redirect to Dashboard
```

### Modelos de Base de Datos

```prisma
model User {
  // Campos de seguridad
  passwordHash            String?
  passwordChangedAt       DateTime?
  failedLoginAttempts     Int       @default(0)
  accountLockedUntil      DateTime?
  twoFactorEnabled        Boolean   @default(false)
  twoFactorSecret         String?   // Encriptado
  twoFactorBackupCodes    Json?     // Array de códigos encriptados

  // Relaciones
  sesiones                Sesion[]
  intentosLogin           IntentoLogin[]
  eventosSeguridad        EventoSeguridad[]
}

model Sesion {
  id              String   @id @default(cuid())
  userId          String
  token           String   @unique
  activa          Boolean  @default(true)
  esActual        Boolean  @default(false)
  dispositivo     String?
  navegador       String?
  sistemaOperativo String?
  ip              String
  pais            String?
  ciudad          String?
  expiraEn        DateTime
  revokedAt       DateTime?
}

model IntentoLogin {
  id                      String   @id @default(cuid())
  userId                  String?
  email                   String
  exitoso                 Boolean
  razonFallo              String?
  ip                      String
  bloqueadoPorRateLimit   Boolean  @default(false)
  createdAt               DateTime @default(now())
}

model EventoSeguridad {
  id          String              @id @default(cuid())
  userId      String
  tipo        TipoEventoSeguridad
  severidad   SeveridadEvento
  descripcion String
  ip          String?
  metadata    Json?
  createdAt   DateTime            @default(now())
}
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ule_db"

# Upstash Redis (REQUERIDO)
# Crear cuenta en: https://upstash.com
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Encriptación (REQUERIDO)
# Generar con: node scripts/generate-keys.js
ENCRYPTION_KEY="your-64-character-hex-string-here"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (para recuperación de contraseña)
EMAIL_FROM="noreply@yourdomain.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Generar Claves de Seguridad

```bash
# Genera ENCRYPTION_KEY y NEXTAUTH_SECRET
node scripts/generate-keys.js
```

Copia las claves generadas a tu archivo `.env`.

### 3. Configurar Upstash Redis

1. Crear cuenta en [upstash.com](https://upstash.com)
2. Crear base de datos Redis
3. Copiar URL y token a `.env`

### 4. Ejecutar Migraciones

```bash
# Generar migración
npx prisma migrate dev --name add_security_features

# Generar cliente
npx prisma generate

# Push schema (desarrollo)
npx prisma db push
```

### 5. Instalar Dependencias

```bash
npm install
```

Dependencias de seguridad ya incluidas:
- `@upstash/ratelimit` - Rate limiting
- `@upstash/redis` - Redis client
- `speakeasy` - TOTP 2FA
- `qrcode` - Generación de QR codes
- `bcryptjs` - Hashing de contraseñas
- `ua-parser-js` - Parsing de user agents
- `date-fns` - Manejo de fechas

---

## 👤 Guía de Usuario

### Crear Contraseña Segura

**Recomendaciones**:
1. Usa al menos 12 caracteres
2. Combina mayúsculas, minúsculas, números y símbolos
3. No reutilices contraseñas de otras cuentas
4. Evita información personal (nombres, fechas)
5. Usa frases fáciles de recordar: `Café!Verde$Montaña2024`

**Herramientas Recomendadas**:
- [1Password](https://1password.com)
- [Bitwarden](https://bitwarden.com)
- [LastPass](https://lastpass.com)

### Habilitar 2FA

1. Ve a `Configuración de Seguridad` → `Autenticación 2FA`
2. Click en "Habilitar 2FA"
3. Descarga una app autenticadora:
   - Google Authenticator ([iOS](https://apps.apple.com/app/google-authenticator/id388497605) / [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2))
   - Authy ([iOS](https://apps.apple.com/app/authy/id494168017) / [Android](https://play.google.com/store/apps/details?id=com.authy.authy))
   - Microsoft Authenticator ([iOS](https://apps.apple.com/app/microsoft-authenticator/id983156458) / [Android](https://play.google.com/store/apps/details?id=com.azure.authenticator))
4. Escanea el código QR con la app
5. **IMPORTANTE**: Descarga y guarda los códigos de respaldo en lugar seguro
6. Ingresa el código de 6 dígitos para verificar
7. ✓ 2FA habilitado

### Gestionar Sesiones

**Ver sesiones activas**:
1. Ve a `Configuración de Seguridad` → `Sesiones`
2. Verás lista de todas las sesiones con:
   - Dispositivo y navegador
   - Ubicación
   - Última actividad

**Cerrar sesión sospechosa**:
1. Identifica la sesión no reconocida
2. Click en el botón de cerrar sesión (🚪)
3. Confirma la acción

**Cerrar todas las sesiones**:
1. Click en "Cerrar todas las demás"
2. Se cerrarán todas excepto la actual
3. Útil si sospechas acceso no autorizado

### Recuperar Contraseña

1. Ve a la página de login
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Revisa tu correo (y carpeta spam)
5. Click en el link (válido por 1 hora)
6. Crea nueva contraseña fuerte
7. Todas tus sesiones serán cerradas automáticamente

---

## 👨‍💻 Guía de Desarrollador

### Estructura de Archivos

```
/lib/security/
├── encryption.ts          # Encriptación AES-256-GCM, bcrypt
├── rate-limit.ts          # 7 rate limiters con Upstash
├── password-validator.ts  # Validación y scoring de contraseñas
├── two-factor.ts          # Generación y verificación TOTP
├── session-manager.ts     # CRUD de sesiones con device tracking
└── password-reset.ts      # Flujo de recuperación de contraseña

/app/api/auth/
├── secure-login/route.ts          # Login con 2FA
├── 2fa/
│   ├── setup/route.ts             # Generar QR y códigos
│   └── verify/route.ts            # Activar 2FA
├── password-reset/
│   ├── request/route.ts           # Solicitar reset
│   ├── verify/[token]/route.ts    # Verificar token
│   └── complete/route.ts          # Cambiar contraseña
└── sessions/
    ├── route.ts                   # GET: Listar, POST: Crear
    ├── [id]/route.ts              # DELETE: Revocar específica
    └── revoke-all/route.ts        # POST: Revocar todas

/components/auth/
├── login-form.tsx                 # Formulario con soporte 2FA
├── password-strength-indicator.tsx # Indicador en tiempo real
├── two-factor-setup.tsx           # Wizard de 3 pasos
└── session-manager.tsx            # Gestión de sesiones

/app/
├── forgot-password/page.tsx       # Solicitar reset
├── reset-password/[token]/page.tsx # Completar reset
└── perfil/seguridad/page.tsx      # Hub de seguridad

/lib/cron/
└── cleanup-sessions.ts            # Limpieza diaria

/scripts/
└── generate-keys.js               # Generador de claves

/tests/security/
└── authentication.test.ts         # Tests completos
```

### Usar Rate Limiting

```typescript
import { loginRateLimit } from '@/lib/security/rate-limit'

export async function POST(req: NextRequest) {
  const identifier = `login:${email}:${ip}`

  const rateLimit = await loginRateLimit.limit(identifier)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Demasiados intentos',
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  }

  // Continuar con lógica...
}
```

### Validar Contraseña

```typescript
import { validatePassword } from '@/lib/security/password-validator'

const validation = validatePassword(password, {
  email: user.email,
  name: user.name,
  numeroDocumento: user.numeroDocumento,
})

if (!validation.valid) {
  return { errors: validation.errors }
}

if (validation.score < 60) {
  return { warning: 'Contraseña débil, considera una más fuerte' }
}
```

### Implementar 2FA

```typescript
import { generateTwoFactorSecret, verifyTwoFactorToken } from '@/lib/security/two-factor'
import { encrypt } from '@/lib/security/encryption'

// Setup
const { secret, qrCodeUrl, backupCodes } = await generateTwoFactorSecret(email)

await prisma.user.update({
  where: { id: userId },
  data: {
    twoFactorSecret: encrypt(secret),
    twoFactorBackupCodes: backupCodes.map(code => encrypt(code)),
  },
})

// Verificación
const isValid = verifyTwoFactorToken(encryptedSecret, userInputCode)
```

### Crear y Gestionar Sesiones

```typescript
import {
  createSession,
  getUserActiveSessions,
  revokeSession
} from '@/lib/security/session-manager'

// Crear sesión al login
const token = crypto.randomBytes(32).toString('hex')
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

await createSession({
  userId: user.id,
  token,
  expiresAt,
})

// Listar sesiones
const sesiones = await getUserActiveSessions(userId)

// Cerrar sesión
await revokeSession(sesionId, userId)
```

### Testing

```bash
# Ejecutar tests de seguridad
npm test tests/security/authentication.test.ts

# Con coverage
npm test -- --coverage
```

### Logging de Eventos de Seguridad

```typescript
import { prisma } from '@/lib/prisma'

await prisma.eventoSeguridad.create({
  data: {
    userId,
    tipo: 'LOGIN_EXITOSO',
    severidad: 'BAJA',
    descripcion: 'Usuario inició sesión correctamente',
    ip: req.headers.get('x-forwarded-for') || req.ip,
    metadata: {
      navegador: userAgent,
      ubicacion: 'Bogotá, Colombia',
    },
  },
})
```

---

## 📊 Monitoreo y Alertas

### Eventos a Monitorear

**Severidad CRÍTICA**:
- 🚨 Múltiples intentos de login fallidos (5+)
- 🚨 Intento de acceso con cuenta bloqueada
- 🚨 Token de reset usado múltiples veces
- 🚨 2FA deshabilitado sin verificación

**Severidad ALTA**:
- ⚠️ Login desde ubicación inusual
- ⚠️ Login desde nuevo dispositivo
- ⚠️ Cambio de contraseña
- ⚠️ Cambio de email

**Severidad MEDIA**:
- ℹ️ Login exitoso
- ℹ️ 2FA habilitado
- ℹ️ Cierre masivo de sesiones

**Severidad BAJA**:
- ✓ Sesión cerrada normalmente
- ✓ Actualización de perfil

### Query de Monitoreo

```sql
-- Intentos de login fallidos recientes
SELECT
  email,
  COUNT(*) as intentos,
  MAX(createdAt) as ultimo_intento
FROM IntentoLogin
WHERE
  exitoso = false
  AND createdAt > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) >= 3
ORDER BY intentos DESC;

-- Eventos de seguridad críticos
SELECT *
FROM EventoSeguridad
WHERE
  severidad = 'CRITICA'
  AND createdAt > NOW() - INTERVAL '24 hours'
ORDER BY createdAt DESC;

-- Sesiones activas por usuario
SELECT
  u.email,
  COUNT(s.id) as sesiones_activas
FROM User u
LEFT JOIN Sesion s ON u.id = s.userId AND s.activa = true
GROUP BY u.id, u.email
HAVING COUNT(s.id) > 5;
```

### Integración con Sentry

```typescript
import * as Sentry from '@sentry/nextjs'

// Capturar evento de seguridad
Sentry.captureMessage('Login fallido múltiple', {
  level: 'warning',
  tags: {
    category: 'security',
    type: 'failed_login',
  },
  extra: {
    email,
    intentos: failedAttempts,
    ip,
  },
})
```

---

## ✅ Cumplimiento y Normativas

### OWASP Top 10 2021

| Riesgo | Estado | Mitigación |
|--------|--------|-----------|
| **A01:2021 - Broken Access Control** | ✅ | Rate limiting, validación de sesiones, permisos por rol |
| **A02:2021 - Cryptographic Failures** | ✅ | AES-256-GCM, bcrypt con 12 rounds, secrets encriptados |
| **A03:2021 - Injection** | ✅ | Prisma ORM previene SQL injection, validación de inputs |
| **A04:2021 - Insecure Design** | ✅ | Respuesta opaca, rate limiting, account lockout |
| **A05:2021 - Security Misconfiguration** | ✅ | Variables de entorno, claves únicas por entorno |
| **A07:2021 - Identification/Authentication Failures** | ✅ | 2FA, contraseñas fuertes, gestión de sesiones |

### Ley 1581 de 2012 (Colombia)

**Protección de Datos Personales**:
- ✅ Datos sensibles encriptados (2FA secrets, backup codes)
- ✅ Logging de accesos y modificaciones
- ✅ Derecho al olvido (eliminación de cuenta)
- ✅ Consentimiento explícito para tratamiento de datos
- ✅ Política de privacidad clara

### Decreto 1377 de 2013

**Medidas de Seguridad**:
- ✅ Encriptación de datos en reposo y tránsito
- ✅ Control de acceso basado en roles
- ✅ Auditoría y registro de eventos
- ✅ Procedimientos de respuesta a incidentes

### Ley 1273 de 2009

**Delitos Informáticos**:
- ✅ Protección contra acceso abusivo
- ✅ Registro de intentos de violación
- ✅ Notificación de brechas de seguridad

---

## 🔧 Troubleshooting

### Error: "ENCRYPTION_KEY no configurada"

**Solución**:
```bash
# Genera una clave nueva
node scripts/generate-keys.js

# Copia ENCRYPTION_KEY a tu .env
echo 'ENCRYPTION_KEY="la-clave-generada"' >> .env
```

### Error: "Upstash Redis connection failed"

**Solución**:
1. Verifica que `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` están en `.env`
2. Confirma que la URL incluye `https://`
3. Prueba la conexión: `curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" $UPSTASH_REDIS_REST_URL/get/test`

### Error: "Invalid token" en password reset

**Causas comunes**:
- Token expirado (1 hora de validez)
- Token ya usado
- Token inválido

**Solución**: Solicitar nuevo link de reset

### 2FA no funciona después de cambiar servidor

**Causa**: El reloj del servidor está desincronizado

**Solución**:
```bash
# Sincronizar reloj (Linux)
sudo ntpdate -s time.nist.gov

# Verificar
date
```

### Sesiones no se limpian automáticamente

**Solución**: Configurar cron job

**Vercel**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-sessions",
    "schedule": "0 3 * * *"
  }]
}
```

**Linux**:
```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar diariamente a las 3 AM)
0 3 * * * cd /path/to/app && node -r ts-node/register lib/cron/cleanup-sessions.ts
```

---

## 🗺️ Roadmap

### Versión 2.0 (Q2 2024)

- [ ] **WebAuthn/Passkeys**: Autenticación sin contraseña
- [ ] **Biometría**: Face ID, Touch ID, Windows Hello
- [ ] **Magic Links**: Login vía email sin contraseña
- [ ] **Social Login**: Google, Apple, Microsoft
- [ ] **Email Verification**: Verificación obligatoria de email
- [ ] **SMS 2FA**: Alternativa a TOTP
- [ ] **IP Whitelist**: Restricción por ubicación geográfica

### Versión 2.1 (Q3 2024)

- [ ] **Security Dashboard**: Panel de seguridad para admins
- [ ] **Alertas en Tiempo Real**: Notificaciones push de eventos críticos
- [ ] **Device Management**: Administración avanzada de dispositivos
- [ ] **Session Recording**: Grabación de sesiones para auditoría
- [ ] **Compliance Reports**: Reportes automáticos de cumplimiento

### Versión 3.0 (Q4 2024)

- [ ] **AI-Powered Security**: Detección de anomalías con ML
- [ ] **Behavioral Biometrics**: Análisis de patrones de uso
- [ ] **Zero Trust Architecture**: Verificación continua
- [ ] **Blockchain Audit Log**: Log inmutable en blockchain
- [ ] **Quantum-Resistant Encryption**: Preparación para computación cuántica

---

## 📞 Contacto y Soporte

### Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad:

1. **NO** la reportes públicamente (GitHub issues, redes sociales)
2. Envía un email a: **security@ule.com**
3. Incluye:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación (opcional)
4. Recibirás respuesta en máximo 48 horas
5. Trabajaremos contigo para resolver el issue
6. Te daremos crédito en el changelog (si lo deseas)

### Soporte Técnico

- 📧 Email: support@ule.com
- 💬 Chat: [app.ule.com/support](https://app.ule.com/support)
- 📖 Docs: [docs.ule.com](https://docs.ule.com)

---

## 📄 Licencia

Este sistema de seguridad es parte del proyecto ULE.
Todos los derechos reservados © 2024 ULE.

---

## 🙏 Agradecimientos

Librerías y servicios utilizados:
- [Upstash](https://upstash.com) - Rate limiting infrastructure
- [Speakeasy](https://github.com/speakeasyjs/speakeasy) - TOTP implementation
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [Have I Been Pwned](https://haveibeenpwned.com) - Password breach database

---

**Última actualización**: 2024-11-11
**Versión**: 1.0.0
**Autor**: Equipo de Seguridad ULE
