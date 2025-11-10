/**
 * ULE - CLIENTE PRISMA
 * Instancia única de PrismaClient para la aplicación
 *
 * NOTA: No podemos usar middleware de Prisma ($use) porque Next.js Middleware
 * corre en Edge Runtime, donde Prisma Client no soporta middleware.
 *
 * Para soft deletes, usar las funciones helper en lib/soft-delete.ts
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Crea una instancia de PrismaClient sin middleware
 * (El middleware no es compatible con Edge Runtime)
 */
export const prisma = global.prisma || new PrismaClient()
export const db = prisma // Alias para compatibilidad

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
