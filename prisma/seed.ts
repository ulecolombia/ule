/**
 * ULE - SEED DE BASE DE DATOS
 * Script para poblar la base de datos con datos de ejemplo
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Crear usuarios de ejemplo
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ule.app' },
    update: {},
    create: {
      email: 'admin@ule.app',
      name: 'Administrador Ule',
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'usuario@ule.app' },
    update: {},
    create: {
      email: 'usuario@ule.app',
      name: 'Usuario Demo',
      role: 'USER',
    },
  })

  console.log('✅ Usuarios creados:', { admin, user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
