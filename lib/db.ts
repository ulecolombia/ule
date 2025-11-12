/**
 * ULE - CLIENTE PRISMA
 * Instancia única de PrismaClient para la aplicación
 *
 * Incluye middleware de encriptación automática para campos sensibles
 * Cumple con Ley 1581 de 2012 (Colombia) - Protección de datos personales
 */

import { PrismaClient } from '@prisma/client'
import { createEncryptionMiddleware } from '@/lib/security/field-encryption'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Crea una instancia de PrismaClient con middleware de encriptación
 */
const createPrismaClient = () => {
  const client = new PrismaClient()

  // Campos sensibles del modelo User
  const userSensitiveFields = [
    'numeroDocumento',
    'telefono',
    'twoFactorSecret',
  ]

  // Campos sensibles del modelo Cliente
  const clienteSensitiveFields = [
    'numeroDocumento',
    'telefono',
  ]

  // Agregar middleware de encriptación para User
  client.$use(createEncryptionMiddleware(userSensitiveFields))

  // TODO: Agregar middleware para Cliente cuando sea necesario
  // client.$use(createEncryptionMiddleware(clienteSensitiveFields))

  return client
}

export const prisma = global.prisma || createPrismaClient()
export const db = prisma // Alias para compatibilidad

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
