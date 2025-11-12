# Protección de Datos Sensibles - Sistema ULE

## Resumen

Este documento describe las medidas implementadas para proteger datos sensibles de usuarios según la **Ley 1581 de 2012 (Colombia)** y mejores prácticas internacionales (OWASP Top 10 2021).

## Datos Sensibles Protegidos

### Encriptados en Base de Datos (AES-256-GCM)
- ✅ Números de documento (CC, CE, PEP, NIT)
- ✅ Números de teléfono
- ✅ Secretos de autenticación 2FA
- ✅ Códigos de respaldo 2FA

### Protegidos en Tránsito
- ✅ HTTPS obligatorio (HSTS)
- ✅ TLS 1.3 mínimo
- ✅ Certificados SSL válidos

### Protegidos en Logs
- ✅ Redacción automática de campos sensibles
- ✅ Enmascaramiento en interfaces de usuario
- ✅ No exposición en errores

## Medidas de Seguridad Implementadas

### 1. Encriptación a Nivel de Campo

**Algoritmo**: AES-256-GCM (Autenticado)
**Biblioteca**: Node.js Crypto (nativa)
**Implementación**: `lib/security/field-encryption.ts`

```typescript
// Uso automático vía Prisma middleware
const user = await prisma.user.create({
  data: {
    numeroDocumento: '1234567890', // Se encripta automáticamente
  },
})

// Se desencripta automáticamente al leer
const user = await prisma.user.findUnique({ where: { id } })
console.log(user.numeroDocumento) // '1234567890' (desencriptado)
```

**Características**:
- IV aleatorio por cada encriptación (16 bytes)
- Authentication tag para integridad (16 bytes)
- Formato: `enc:iv:authTag:ciphertext`
- Middleware transparente de Prisma

**Configuración en `lib/db.ts`**:
```typescript
const userSensitiveFields = [
  'numeroDocumento',
  'telefono',
  'twoFactorSecret',
]

client.$use(createEncryptionMiddleware(userSensitiveFields))
```

### 2. Content Security Policy (CSP)

**Configuración**: `next.config.js`

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline' [trusted-domains]
style-src 'self' 'unsafe-inline'
img-src 'self' data: https: blob:
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
```

**Protege contra**:
- ✅ XSS (Cross-Site Scripting)
- ✅ Clickjacking
- ✅ Code injection
- ✅ Data exfiltration

### 3. Sanitización de Inputs

**Implementación**: `lib/security/input-sanitizer.ts`

Todas las entradas de usuario son sanitizadas:
- **HTML**: Remover tags peligrosos (DOMPurify)
- **Texto**: Escapar caracteres especiales
- **SQL**: Detectar patrones de inyección
- **XSS**: Detectar scripts maliciosos

```typescript
import { sanitizeFormData } from '@/lib/security/input-sanitizer'

const sanitized = sanitizeFormData(formData, {
  nombre: 'text',
  email: 'email',
  numeroDocumento: 'documento',
})
```

### 4. CORS Restrictivo

**Implementación**: `middleware.ts`

Solo se permite acceso desde:
- ✅ Dominio de producción (configurado en `ALLOWED_ORIGINS`)
- ✅ localhost:3000 (solo en desarrollo)

Bloqueado:
- ❌ Peticiones desde orígenes no autorizados
- ❌ CSRF sin token válido
- ❌ Métodos HTTP no estándar

### 5. Validación de Archivos

**Implementación**: `lib/security/file-validator.ts`

Validaciones aplicadas:
- ✅ Tipo MIME permitido
- ✅ Tamaño máximo (5MB imágenes, 10MB documentos)
- ✅ Nombre de archivo seguro
- ✅ Hash SHA-256 para integridad
- ✅ Detección de extensiones maliciosas (.exe, .bat, .cmd, .js, .php)

```typescript
const validation = await validateFile(file, {
  category: 'documents',
  fileType: 'document',
  calculateHash: true,
})
```

### 6. Logging Seguro

**Implementación**: `lib/security/secure-logger.ts`

Características:
- Redacción automática de 30+ campos sensibles
- Logging estructurado (JSON en producción)
- Niveles: debug, info, warn, error
- Auditoría separada para eventos críticos

**Campos redactados**:
```typescript
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'apiKey', 'secret', 'numeroDocumento', 'telefono', 'twoFactorSecret',
  'twoFactorBackupCodes', 'passwordResetToken', 'creditCard', 'cvv',
  'ssn', 'authorization', 'cookie',
]
```

**Uso**:
```typescript
import { secureLogger } from '@/lib/security/secure-logger'

// Datos sensibles son redactados automáticamente
secureLogger.info('Usuario actualizado', {
  userId: user.id,
  password: '123456', // Se registra como [REDACTED]
})
```

### 7. Validación de Variables de Entorno

**Implementación**: `lib/config/env-validator.ts`

Al iniciar la aplicación:
- ✅ Valida que todas las variables requeridas existan
- ✅ Valida formatos (URLs, emails, hex strings)
- ✅ Valida longitudes mínimas
- ✅ Falla rápido si hay errores

**Variables requeridas**:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (min 32 caracteres)
- `ENCRYPTION_KEY` (exactamente 64 caracteres hex)
- `ANTHROPIC_API_KEY` (formato sk-ant-...)

## Migración de Datos Existentes

Si ya tienes datos en la base de datos:

```bash
# 1. Backup completo
pg_dump $DATABASE_URL > backup.sql

# 2. Ejecutar script de encriptación
npx ts-node scripts/encrypt-existing-data.ts

# 3. Verificar que todo funciona
npm run dev
```

**El script encripta**:
- Campos de User: numeroDocumento, telefono, twoFactorSecret
- Campos de Cliente: numeroDocumento, telefono

**Características del script**:
- ✅ Solo encripta datos que aún no están encriptados
- ✅ Muestra progreso cada 100 registros
- ✅ Maneja errores de forma segura
- ✅ Desconecta Prisma al finalizar

## Cumplimiento Normativo

### Ley 1581 de 2012 (Colombia)

| Requisito | Implementación |
|-----------|----------------|
| Protección de datos personales | ✅ Encriptación AES-256-GCM |
| Seguridad en almacenamiento | ✅ DB encriptada + backups seguros |
| Acceso autorizado | ✅ Autenticación + autorización |
| Trazabilidad | ✅ Logs de auditoría |
| Derecho al olvido | ✅ Eliminación segura de datos |

### OWASP Top 10 2021

| Riesgo | Mitigación |
|--------|------------|
| A01: Broken Access Control | Autenticación + sesiones seguras |
| A02: Cryptographic Failures | Encriptación de campo + HTTPS |
| A03: Injection | Sanitización + prepared statements |
| A05: Security Misconfiguration | CSP + headers de seguridad |
| A07: Authentication Failures | 2FA + rate limiting |

## Mejores Prácticas para Desarrolladores

### ✅ HACER:
1. Usar componentes `SecureInput` para formularios
2. Sanitizar TODA entrada de usuario
3. Usar `secureLogger` para logging
4. Validar archivos con `validateFile`
5. Probar en local con datos reales encriptados

### ❌ NO HACER:
1. Loguear passwords, tokens, o documentos
2. Exponer datos sensibles en URLs
3. Almacenar datos sensibles sin encriptar
4. Desactivar CSP en producción
5. Hardcodear claves en el código

## Componentes de UI Seguros

### SecureInput

```typescript
import { SecureInput } from '@/components/forms/secure-input'

<SecureInput
  id="numeroDocumento"
  label="Número de Documento"
  type="text"
  value={documento}
  onChange={setDocumento}
  sanitizeType="documento"
  maxLength={20}
  showMask={true}
  required
/>
```

**Características**:
- Sanitización automática según tipo
- Enmascaramiento opcional (muestra solo últimos 4 dígitos)
- Validación de longitud
- Indicadores visuales de seguridad
- Tooltip que indica que el dato será encriptado

## Monitoreo y Alertas

### Eventos que Triggean Alertas:
- Múltiples intentos de SQL injection
- Archivos con extensiones maliciosas
- Fallo en desencriptación (posible corrupción)
- Cambios en datos sensibles

### Dashboards Recomendados:
1. Tasa de errores de encriptación/desencriptación
2. Intentos de XSS/SQL injection bloqueados
3. Archivos rechazados por validación
4. Tiempo de respuesta de APIs con encriptación

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│           Cliente (Browser)                 │
├─────────────────────────────────────────────┤
│  • SecureInput Component                    │
│  • Sanitización del lado del cliente        │
│  • Validación de archivos                   │
└─────────────┬───────────────────────────────┘
              │ HTTPS/TLS 1.3
              │
┌─────────────▼───────────────────────────────┐
│         Next.js Middleware                  │
├─────────────────────────────────────────────┤
│  • CORS Validation                          │
│  • CSP Headers                              │
│  • Authentication Check                     │
│  • Security Headers                         │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│           API Routes                        │
├─────────────────────────────────────────────┤
│  • Input Sanitization (DOMPurify)           │
│  • Zod Schema Validation                    │
│  • Secure Logging (Pino)                    │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│      Prisma Middleware                      │
├─────────────────────────────────────────────┤
│  • Auto-Encryption (create/update)          │
│  • Auto-Decryption (findMany/findUnique)    │
│  • AES-256-GCM                              │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         PostgreSQL Database                 │
├─────────────────────────────────────────────┤
│  • Encrypted Fields (enc:iv:tag:ciphertext) │
│  • Hashed Passwords (bcrypt)                │
│  • SSL Connection                           │
└─────────────────────────────────────────────┘
```

## Pruebas de Seguridad

### Ejecutar Tests
```bash
npm test tests/security/data-protection.test.ts
```

**Tests incluidos**:
- ✅ Encriptación/Desencriptación correcta
- ✅ IVs únicos por encriptación
- ✅ Manejo de valores null
- ✅ Enmascaramiento de datos
- ✅ Detección de XSS
- ✅ Detección de SQL Injection
- ✅ Sanitización HTML
- ✅ Validación de archivos

## Incidentes de Seguridad

### Proceso de Respuesta

1. **Detección**: Logs automáticos + alertas Sentry
2. **Análisis**: Revisar logs seguros (datos sensibles redactados)
3. **Contención**: Revocar tokens, bloquear IPs si es necesario
4. **Remediación**: Aplicar parches, actualizar dependencias
5. **Post-mortem**: Documentar y mejorar procesos

### Contacto para Vulnerabilidades

**Email**: security@ule.com
**PGP Key**: [Fingerprint aquí]

**Proceso**:
1. Reportar vulnerabilidad por email
2. Esperar confirmación en 24 horas
3. Coordinación responsable de divulgación
4. Reconocimiento público (si se desea)

## Mantenimiento

### Rotación de Claves

**Frecuencia recomendada**: Cada 6-12 meses

**Proceso**:
1. Generar nueva `ENCRYPTION_KEY`
2. Actualizar variable de entorno
3. Re-encriptar datos existentes con nueva clave
4. Mantener clave antigua por 30 días (rollback)

### Auditorías de Seguridad

**Frecuencia**: Trimestral

**Checklist**:
- [ ] Revisar logs de eventos de seguridad
- [ ] Actualizar dependencias (`npm audit fix`)
- [ ] Revisar permisos de usuarios
- [ ] Verificar backups de datos encriptados
- [ ] Probar proceso de recuperación de desastres
- [ ] Revisar configuración de CORS y CSP
- [ ] Ejecutar tests de penetración

## Referencias

- [Ley 1581 de 2012 - Colombia](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981)
- [Decreto 1377 de 2013](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646)
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Node.js Crypto API](https://nodejs.org/api/crypto.html)
- [Prisma Middleware](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)

## Changelog

### v1.0.0 (2025-01-11)
- ✅ Implementación inicial de encriptación AES-256-GCM
- ✅ Content Security Policy configurado
- ✅ Sanitización de inputs con DOMPurify
- ✅ CORS restrictivo en middleware
- ✅ Validación de archivos
- ✅ Logging seguro con Pino
- ✅ Validación de variables de entorno
- ✅ Script de migración de datos existentes
- ✅ Componente SecureInput
- ✅ Tests de seguridad

---

**Última actualización**: 2025-01-11
**Mantenedor**: Equipo de Seguridad ULE
**Versión**: 1.0.0
