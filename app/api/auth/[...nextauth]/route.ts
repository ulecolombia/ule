/**
 * ULE - NEXTAUTH API ROUTE
 * Handler de NextAuth para autenticación
 */

import { handlers } from '@/lib/auth'

/**
 * Handler de NextAuth para Ule
 * Ruta: /api/auth/*
 */
export const { GET, POST } = handlers
