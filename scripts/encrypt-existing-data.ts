import { PrismaClient } from '@prisma/client'
import { encryptField } from '../lib/security/field-encryption'

const prisma = new PrismaClient()

/**
 * Script para encriptar datos sensibles existentes en la base de datos
 * EJECUTAR UNA SOLA VEZ después de implementar encriptación
 *
 * IMPORTANTE: Hacer backup de la base de datos antes de ejecutar
 */
async function encryptExistingData() {
  console.log('🔐 Iniciando encriptación de datos existentes...\n')

  try {
    // 1. Encriptar datos de usuarios
    console.log('📝 Encriptando datos de usuarios...')

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            numeroDocumento: {
              not: {
                startsWith: 'enc:',
              },
            },
          },
          {
            telefono: {
              not: {
                startsWith: 'enc:',
              },
            },
          },
        ],
      },
    })

    console.log(`   Encontrados ${users.length} usuarios con datos sin encriptar`)

    let encryptedUsers = 0
    for (const user of users) {
      const updates: any = {}

      // Encriptar número de documento
      if (
        user.numeroDocumento &&
        !user.numeroDocumento.startsWith('enc:')
      ) {
        updates.numeroDocumento = encryptField(user.numeroDocumento)
      }

      // Encriptar teléfono
      if (user.telefono && !user.telefono.startsWith('enc:')) {
        updates.telefono = encryptField(user.telefono)
      }

      // Encriptar 2FA secret (si existe)
      if (
        user.twoFactorSecret &&
        !user.twoFactorSecret.startsWith('enc:')
      ) {
        updates.twoFactorSecret = encryptField(user.twoFactorSecret)
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        })
        encryptedUsers++

        if (encryptedUsers % 100 === 0) {
          console.log(
            `   Progreso: ${encryptedUsers}/${users.length} usuarios encriptados`
          )
        }
      }
    }

    console.log(`   ✅ ${encryptedUsers} usuarios encriptados\n`)

    // 2. Encriptar datos de clientes
    console.log('📝 Encriptando datos de clientes...')

    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          {
            numeroDocumento: {
              not: {
                startsWith: 'enc:',
              },
            },
          },
          {
            AND: [
              {
                telefono: {
                  not: null,
                },
              },
              {
                telefono: {
                  not: {
                    startsWith: 'enc:',
                  },
                },
              },
            ],
          },
        ],
      },
    })

    console.log(
      `   Encontrados ${clientes.length} clientes con datos sin encriptar`
    )

    let encryptedClientes = 0
    for (const cliente of clientes) {
      const updates: any = {}

      if (
        cliente.numeroDocumento &&
        !cliente.numeroDocumento.startsWith('enc:')
      ) {
        updates.numeroDocumento = encryptField(cliente.numeroDocumento)
      }

      if (
        cliente.telefono &&
        !cliente.telefono.startsWith('enc:')
      ) {
        updates.telefono = encryptField(cliente.telefono)
      }

      if (Object.keys(updates).length > 0) {
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: updates,
        })
        encryptedClientes++

        if (encryptedClientes % 100 === 0) {
          console.log(
            `   Progreso: ${encryptedClientes}/${clientes.length} clientes encriptados`
          )
        }
      }
    }

    console.log(`   ✅ ${encryptedClientes} clientes encriptados\n`)

    console.log('═══════════════════════════════════════════════════════')
    console.log('🎉 Migración completada exitosamente')
    console.log(
      `   Total encriptado: ${encryptedUsers + encryptedClientes} registros`
    )
    console.log('═══════════════════════════════════════════════════════')
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar migración
encryptExistingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
