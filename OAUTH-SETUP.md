# = Configuración de OAuth para Ule

Guía completa para configurar Google y Apple OAuth en tu aplicación Ule.

---

## =Ë Índice

1. [Google OAuth](#google-oauth)
2. [Apple Sign In](#apple-sign-in)
3. [Variables de Entorno](#variables-de-entorno)
4. [Verificación](#verificación)
5. [Troubleshooting](#troubleshooting)

---

## =5 Google OAuth

### Paso 1: Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita "Google+ API" en **APIs y Servicios > Biblioteca**

### Paso 2: Configurar Pantalla de Consentimiento

1. Ve a **APIs y Servicios > Pantalla de consentimiento de OAuth**
2. Selecciona tipo de usuario: **Externo**
3. Completa la información requerida:
   - **Nombre de la aplicación**: Ule
   - **Correo de soporte**: tu-email@ejemplo.com
   - **Dominio de la aplicación**: http://localhost:3000 (desarrollo)
   - **Scopes**: `email`, `profile`, `openid`
4. Guarda y continúa

### Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **APIs y Servicios > Credenciales**
2. Click en **Crear credenciales > ID de cliente de OAuth 2.0**
3. Selecciona tipo de aplicación: **Aplicación web**
4. Configura:
   ```
   Nombre: Ule Web Client

   Orígenes de JavaScript autorizados:
   - http://localhost:3000
   - https://tu-dominio-produccion.com

   URIs de redirección autorizados:
   - http://localhost:3000/api/auth/callback/google
   - https://tu-dominio-produccion.com/api/auth/callback/google
   ```
5. Click en **Crear**
6. **Guarda el Client ID y Client Secret** que te proporciona

### Paso 4: Configurar Variables de Entorno

Agrega a tu archivo `.env`:

```bash
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
```

---

## <N Apple Sign In

### Paso 1: Registrarte en Apple Developer Program

1. Necesitas una cuenta de [Apple Developer](https://developer.apple.com/) ($99/año)
2. Si no tienes una, puedes omitir Apple OAuth por ahora

### Paso 2: Crear un App ID

1. Ve a [Apple Developer Console](https://developer.apple.com/account/)
2. Navega a **Certificates, Identifiers & Profiles**
3. Click en **Identifiers** > **+** (crear nuevo)
4. Selecciona **App IDs** > Continue
5. Configura:
   ```
   Description: Ule App
   Bundle ID: com.tudominio.ule
   Capabilities: Sign in with Apple (enabled)
   ```
6. Register

### Paso 3: Crear un Service ID

1. En **Identifiers**, click **+** (crear nuevo)
2. Selecciona **Services IDs** > Continue
3. Configura:
   ```
   Description: Ule Web Service
   Identifier: com.tudominio.ule.web
   ```
4. Enable **Sign in with Apple**
5. Click en **Configure** junto a "Sign in with Apple":
   ```
   Primary App ID: com.tudominio.ule (el que creaste antes)

   Domains and Subdomains:
   - localhost:3000 (solo desarrollo)
   - tu-dominio-produccion.com

   Return URLs:
   - http://localhost:3000/api/auth/callback/apple
   - https://tu-dominio-produccion.com/api/auth/callback/apple
   ```
6. Save > Continue > Register

### Paso 4: Crear una Private Key

1. En **Certificates, Identifiers & Profiles**, ve a **Keys**
2. Click **+** (crear nueva)
3. Configura:
   ```
   Key Name: Ule Apple Sign In Key
   Enable: Sign in with Apple
   ```
4. Click **Configure** junto a "Sign in with Apple"
5. Selecciona tu **Primary App ID**
6. Save > Continue > Register
7. **Descarga la key file (.p8)** - ¡Solo se puede descargar una vez!
8. Guarda el **Key ID** que te muestra

### Paso 5: Obtener el Team ID

1. En el [Apple Developer Console](https://developer.apple.com/account/)
2. Tu **Team ID** aparece en la esquina superior derecha
3. Guárdalo

### Paso 6: Generar el Client Secret

Apple requiere un JWT firmado como client secret. Necesitas generar uno cada 6 meses.

**Opción A: Usar herramienta online**
- [Apple Sign In Token Generator](https://developer.okta.com/blog/2019/06/04/what-the-heck-is-sign-in-with-apple#generate-the-client-secret)

**Opción B: Usar Node.js script**

Crea `generate-apple-secret.js`:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('./AuthKey_XXXXXXXXXX.p8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d', // 6 meses
  audience: 'https://appleid.apple.com',
  issuer: 'TU_TEAM_ID',
  subject: 'com.tudominio.ule.web', // Tu Service ID
  keyid: 'TU_KEY_ID'
});

console.log(token);
```

Ejecuta:
```bash
node generate-apple-secret.js
```

### Paso 7: Configurar Variables de Entorno

Agrega a tu archivo `.env`:

```bash
APPLE_CLIENT_ID="com.tudominio.ule.web"
APPLE_CLIENT_SECRET="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..." # El JWT generado
```

---

## =' Variables de Entorno

Tu archivo `.env` debe verse así:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ule_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-super-seguro-minimo-32-caracteres"

# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"

# Apple OAuth (opcional)
APPLE_CLIENT_ID="com.tudominio.ule.web"
APPLE_CLIENT_SECRET="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

##  Verificación

### 1. Verifica que el servidor esté corriendo

```bash
npm run dev
```

Deberías ver:
```
 Ready in 5s
- Local:        http://localhost:3000
```

### 2. Prueba el flujo de autenticación

1. Abre http://localhost:3000/login
2. Deberías ver:
   -  Botón "Continuar con Google"
   -  Botón "Continuar con Apple"
   -  Formulario de email/contraseña

3. Click en "Continuar con Google":
   - Deberías ser redirigido a la pantalla de login de Google
   - Después de autenticarte, regresas a Ule como usuario logueado
   - Tu usuario se crea automáticamente en la base de datos

4. Click en "Continuar con Apple" (si está configurado):
   - Deberías ver la pantalla de Apple Sign In
   - Después de autenticarte, regresas a Ule
   - Tu usuario se crea automáticamente

### 3. Verifica la base de datos

```bash
npx prisma studio
```

En la tabla `User`, deberías ver:
- Usuarios creados con Google: tienen `email`, `name`, `image` (foto de perfil)
- Usuarios creados con Apple: tienen `email`, `name`
- Campo `password` es `null` para usuarios OAuth (esperado)
- Campo `emailVerified` tiene fecha (confiamos en Google/Apple)

---

## =¨ Troubleshooting

### Error: "Redirect URI mismatch"

**Causa**: La URL de callback no coincide con la configurada en Google/Apple

**Solución**:
1. Verifica que `NEXTAUTH_URL` en `.env` sea exactamente igual a la URL configurada
2. En Google Console, verifica que la URI de redirección sea exactamente:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
3. NO debe tener slash al final
4. Debe usar `http://` en desarrollo (no `https://`)

### Error: "Invalid client_secret"

**Para Google:**
- Verifica que copiaste correctamente el Client Secret
- Regenera las credenciales si es necesario

**Para Apple:**
- El JWT expira cada 6 meses, genera uno nuevo
- Verifica que el Team ID, Key ID y Service ID sean correctos
- Asegúrate de usar el archivo `.p8` correcto

### Error: "User creation failed"

**Causa**: Problema al crear el usuario en la base de datos

**Solución**:
1. Verifica que la base de datos esté corriendo:
   ```bash
   psql -U user -d ule_db
   ```
2. Verifica que el schema esté actualizado:
   ```bash
   npx prisma migrate dev
   ```
3. Revisa los logs del servidor para ver el error específico

### Los botones de OAuth no aparecen

**Solución**:
1. Verifica que las variables de entorno estén definidas
2. Reinicia el servidor:
   ```bash
   # Mata el proceso actual
   pkill -f "next dev"

   # Inicia de nuevo
   npm run dev
   ```
3. Verifica que no haya errores de compilación en la consola

### Google OAuth funciona pero Apple no

**Normal**: Apple OAuth requiere:
- Cuenta de Apple Developer ($99/año)
- Configuración más compleja
- Regenerar el client secret cada 6 meses

**Alternativas**:
1. Usa solo Google OAuth por ahora
2. Comenta/deshabilita el botón de Apple en `SocialLoginButtons.tsx`
3. Implementa Apple OAuth cuando estés listo para producción

---

## =Ý Notas de Producción

### Para Google OAuth en producción:

1. Agrega tu dominio de producción a:
   - Orígenes de JavaScript autorizados
   - URIs de redirección autorizados

2. Actualiza `.env` de producción:
   ```bash
   NEXTAUTH_URL="https://tu-dominio.com"
   ```

3. Verifica pantalla de consentimiento en modo "Publicado"

### Para Apple OAuth en producción:

1. Agrega tu dominio de producción a:
   - Domains and Subdomains
   - Return URLs

2. Usa HTTPS obligatoriamente (Apple lo requiere)

3. Renueva el client secret JWT antes de que expire (cada 6 meses)

---

## <¯ Resumen de URLs de Callback

| Provider | Callback URL (Desarrollo) | Callback URL (Producción) |
|----------|---------------------------|---------------------------|
| Google | `http://localhost:3000/api/auth/callback/google` | `https://tu-dominio.com/api/auth/callback/google` |
| Apple | `http://localhost:3000/api/auth/callback/apple` | `https://tu-dominio.com/api/auth/callback/apple` |

---

## =Ú Recursos Adicionales

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [NextAuth.js Apple Provider](https://next-auth.js.org/providers/apple)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Apple Developer Console](https://developer.apple.com/account/)

---

**Nota**: Si solo quieres probar el flujo OAuth rápidamente, empieza solo con Google. Apple requiere más configuración y una cuenta de pago.

*Última actualización: 2025-11-10*
