import { NextRequest, NextResponse } from 'next/server';
import {
  crearRecordatoriosPendientes,
  enviarRecordatoriosEmail,
} from '@/lib/recordatorios-service';
import { acquireLock, releaseLock } from '@/lib/distributed-lock';

const LOCK_ID = 'cron:recordatorios';
const LOCK_TTL = 10 * 60 * 1000; // 10 minutos

/**
 * Cron job de recordatorios con distributed locking
 * Previene ejecuciones concurrentes que generarían recordatorios duplicados
 *
 * OPTIMIZADO CON:
 * - Distributed lock para prevenir race conditions
 * - Liberación automática de lock en caso de error
 * - Timeout configurable para prevenir locks colgados
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autorización
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // 2. Intentar adquirir lock distribuido
    const lockAcquired = await acquireLock(LOCK_ID, LOCK_TTL);

    if (!lockAcquired) {
      console.log('Cron job de recordatorios ya en ejecución, saltando...');
      return NextResponse.json({
        success: true,
        message: 'Ejecución en progreso por otra instancia',
        skipped: true,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      console.log('Ejecutando cron job de recordatorios...');

      // 3. Crear recordatorios para aportes próximos a vencer
      const { recordatoriosCreados } = await crearRecordatoriosPendientes();
      console.log(`${recordatoriosCreados} recordatorios creados`);

      // 4. Enviar recordatorios por email
      const { emailsEnviados } = await enviarRecordatoriosEmail();
      console.log(`${emailsEnviados} emails enviados`);

      return NextResponse.json({
        success: true,
        recordatoriosCreados,
        emailsEnviados,
        timestamp: new Date().toISOString(),
      });
    } finally {
      // 5. Siempre liberar el lock, incluso si hay error
      await releaseLock(LOCK_ID);
      console.log('Lock liberado');
    }
  } catch (error) {
    console.error('Error en cron job de recordatorios:', error);

    // Intentar liberar lock en caso de error crítico
    try {
      await releaseLock(LOCK_ID);
    } catch (releaseError) {
      console.error('Error al liberar lock:', releaseError);
    }

    return NextResponse.json(
      { success: false, error: 'Error al ejecutar cron job' },
      { status: 500 }
    );
  }
}
