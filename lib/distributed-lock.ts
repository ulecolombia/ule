/**
 * ULE - DISTRIBUTED LOCK SYSTEM
 * Sistema de locks distribuidos usando PostgreSQL
 * Previene ejecuciones concurrentes de cron jobs y tareas críticas
 */

import { prisma } from './prisma';

const DEFAULT_LOCK_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Intenta adquirir un lock distribuido
 *
 * @param lockId - Identificador único del lock
 * @param ttl - Tiempo de vida del lock en milisegundos (default: 5 minutos)
 * @returns true si se adquirió el lock, false si ya está tomado
 *
 * @example
 * ```typescript
 * const acquired = await acquireLock('cron:recordatorios', 300000);
 * if (!acquired) {
 *   console.log('Otra instancia ya está ejecutando');
 *   return;
 * }
 * try {
 *   // Ejecutar tarea crítica
 * } finally {
 *   await releaseLock('cron:recordatorios');
 * }
 * ```
 */
export async function acquireLock(
  lockId: string,
  ttl: number = DEFAULT_LOCK_TTL
): Promise<boolean> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    // 1. Limpiar locks expirados (optimización)
    await prisma.cronLock.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // 2. Intentar crear el lock
    // Si ya existe y no ha expirado, fallará por unique constraint
    await prisma.cronLock.create({
      data: {
        id: lockId,
        expiresAt,
      },
    });

    return true; // Lock adquirido exitosamente
  } catch (error) {
    // Si falla es porque ya existe un lock activo
    // Verificar si el lock existente ya expiró
    try {
      const existingLock = await prisma.cronLock.findUnique({
        where: { id: lockId },
      });

      if (existingLock && existingLock.expiresAt < new Date()) {
        // El lock expiró, intentar eliminarlo y readquirirlo
        await prisma.cronLock.delete({
          where: { id: lockId },
        });

        // Reintentar adquisición
        const expiresAt = new Date(Date.now() + ttl);
        await prisma.cronLock.create({
          data: {
            id: lockId,
            expiresAt,
          },
        });

        return true;
      }
    } catch (retryError) {
      // Si falla el retry, otro proceso lo tomó
      return false;
    }

    return false; // Lock no disponible
  }
}

/**
 * Libera un lock distribuido
 *
 * @param lockId - Identificador único del lock a liberar
 * @returns true si se liberó correctamente
 *
 * @example
 * ```typescript
 * await releaseLock('cron:recordatorios');
 * ```
 */
export async function releaseLock(lockId: string): Promise<boolean> {
  try {
    await prisma.cronLock.delete({
      where: { id: lockId },
    });
    return true;
  } catch (error) {
    // Lock ya no existe (posiblemente expiró)
    console.warn(`Lock ${lockId} no encontrado al intentar liberar`);
    return false;
  }
}

/**
 * Verifica si un lock está activo
 *
 * @param lockId - Identificador único del lock
 * @returns true si el lock está activo, false si no existe o expiró
 */
export async function isLockActive(lockId: string): Promise<boolean> {
  try {
    const lock = await prisma.cronLock.findUnique({
      where: { id: lockId },
    });

    if (!lock) {
      return false;
    }

    // Verificar si no ha expirado
    return lock.expiresAt > new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Extiende el tiempo de vida de un lock activo
 *
 * @param lockId - Identificador único del lock
 * @param additionalTtl - Tiempo adicional en milisegundos
 * @returns true si se extendió correctamente
 */
export async function extendLock(
  lockId: string,
  additionalTtl: number = DEFAULT_LOCK_TTL
): Promise<boolean> {
  try {
    const lock = await prisma.cronLock.findUnique({
      where: { id: lockId },
    });

    if (!lock) {
      return false;
    }

    const newExpiresAt = new Date(Date.now() + additionalTtl);

    await prisma.cronLock.update({
      where: { id: lockId },
      data: { expiresAt: newExpiresAt },
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Limpia todos los locks expirados
 * Útil para mantenimiento periódico
 *
 * @returns Número de locks eliminados
 */
export async function cleanExpiredLocks(): Promise<number> {
  try {
    const result = await prisma.cronLock.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error al limpiar locks expirados:', error);
    return 0;
  }
}

/**
 * Wrapper de alto nivel para ejecutar una función con lock automático
 *
 * @param lockId - Identificador único del lock
 * @param fn - Función a ejecutar con lock
 * @param ttl - Tiempo de vida del lock
 * @returns Resultado de la función o null si no se pudo adquirir el lock
 *
 * @example
 * ```typescript
 * const result = await withLock('cron:recordatorios', async () => {
 *   // Lógica del cron job
 *   return { success: true };
 * });
 * ```
 */
export async function withLock<T>(
  lockId: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_LOCK_TTL
): Promise<T | null> {
  const acquired = await acquireLock(lockId, ttl);

  if (!acquired) {
    console.log(`Lock ${lockId} no disponible, saltando ejecución`);
    return null;
  }

  try {
    const result = await fn();
    return result;
  } finally {
    await releaseLock(lockId);
  }
}
