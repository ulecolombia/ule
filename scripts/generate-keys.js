/**
 * SCRIPT: GENERADOR DE CLAVES DE SEGURIDAD
 *
 * Genera claves criptográficas seguras para:
 * - ENCRYPTION_KEY: Encriptación de datos sensibles (AES-256-GCM)
 * - NEXTAUTH_SECRET: Autenticación de sesiones
 *
 * Uso:
 *   node scripts/generate-keys.js
 *
 * IMPORTANTE:
 * - Copia las claves generadas a tu archivo .env
 * - NO compartas estas claves ni las subas a Git
 * - Genera nuevas claves diferentes para producción
 * - Guarda las claves en un lugar seguro
 */

const crypto = require('crypto')

console.log('═══════════════════════════════════════════════════════════')
console.log('GENERADOR DE CLAVES DE SEGURIDAD - ULE')
console.log('═══════════════════════════════════════════════════════════\n')

// Generar clave de encriptación (32 bytes = 64 hex chars)
const encryptionKey = crypto.randomBytes(32).toString('hex')
console.log('✓ ENCRYPTION_KEY (AES-256-GCM - 32 bytes)')
console.log('  Copia esta línea a tu archivo .env:\n')
console.log(`ENCRYPTION_KEY="${encryptionKey}"`)
console.log()

// Generar NextAuth secret (32 bytes en base64)
const nextAuthSecret = crypto.randomBytes(32).toString('base64')
console.log('✓ NEXTAUTH_SECRET (Autenticación de sesiones)')
console.log('  Copia esta línea a tu archivo .env:\n')
console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`)
console.log()

console.log('═══════════════════════════════════════════════════════════')
console.log('⚠️  ADVERTENCIAS DE SEGURIDAD')
console.log('═══════════════════════════════════════════════════════════')
console.log('1. Guarda estas claves en un lugar seguro (gestor de contraseñas)')
console.log('2. NO compartas estas claves con nadie')
console.log('3. NO subas estas claves a Git o repositorios públicos')
console.log('4. Genera claves DIFERENTES para cada entorno:')
console.log('   - Desarrollo: Claves de prueba')
console.log('   - Staging: Claves diferentes')
console.log('   - Producción: Claves únicas y más fuertes')
console.log('5. Si una clave se compromete, genera una nueva inmediatamente')
console.log('6. Mantén copias de respaldo encriptadas en lugar seguro')
console.log('═══════════════════════════════════════════════════════════\n')

console.log('📝 Próximos pasos:')
console.log('1. Copia las claves generadas arriba')
console.log('2. Pégalas en tu archivo .env (NO en .env.example)')
console.log('3. Verifica que .env está en tu .gitignore')
console.log('4. Reinicia tu servidor de desarrollo')
console.log('5. Ejecuta: npx prisma db push')
console.log()
