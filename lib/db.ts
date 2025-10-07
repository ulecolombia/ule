/**
 * ULE - CLIENTE PRISMA
 * Instancia única de PrismaClient para la aplicación
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Crea una instancia de PrismaClient
 * En desarrollo usa una variable global para evitar múltiples instancias en hot reload
 */
export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
