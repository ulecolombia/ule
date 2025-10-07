/**
 * ULE - SEED DE BASE DE DATOS
 * Script para poblar la base de datos con datos de ejemplo
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de base de datos...')

  // Hash de contraseñas de ejemplo (password: "admin123" y "user123")
  const adminPassword = await hashPassword('admin123')
  const userPassword = await hashPassword('user123')

  // Crear usuarios de ejemplo
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ule.app' },
    update: {},
    create: {
      email: 'admin@ule.app',
      name: 'Administrador Ule',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'usuario@ule.app' },
    update: {},
    create: {
      email: 'usuario@ule.app',
      name: 'Usuario Demo',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log('✅ Usuarios creados:', { admin, user })
  console.log('📋 Credenciales de prueba:')
  console.log('   Admin: admin@ule.app / admin123')
  console.log('   User: usuario@ule.app / user123')
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
