import { prisma } from './prisma';
import { addDays, startOfDay } from 'date-fns';
import { formatearMoneda } from './calculadora-pila';

/**
 * Crea recordatorios para aportes próximos a vencer
 * OPTIMIZADO: Usa batch queries para evitar N+1 problem
 */
export async function crearRecordatoriosPendientes() {
  const hoy = startOfDay(new Date());

  // 1. Una sola query para obtener todo lo necesario
  const usuariosConAportes = await prisma.user.findMany({
    where: {
      configuracionPila: {
        recordatoriosActivos: true,
      },
    },
    include: {
      configuracionPila: true,
      aportes: {
        where: {
          estado: 'PENDIENTE',
          fechaLimite: {
            gte: hoy,
            // Máximo 10 días de anticipación para limitar resultados
            lte: addDays(hoy, 10),
          },
        },
      },
      recordatorios: {
        where: {
          tipo: { in: ['IN_APP', 'EMAIL'] },
        },
        select: {
          aporteId: true,
          tipo: true,
        },
      },
    },
  });

  // 2. Preparar batch de inserts
  const recordatoriosACrear: Array<{
    userId: string;
    aporteId: string;
    tipo: 'IN_APP' | 'EMAIL';
    titulo: string;
    mensaje: string;
    fechaEnvio: Date;
  }> = [];

  for (const usuario of usuariosConAportes) {
    const diasAnticipacion =
      usuario.configuracionPila?.diasAnticipacionRecordatorio || 5;
    const fechaLimiteRecordatorio = addDays(hoy, diasAnticipacion);

    // Crear un Map para lookups O(1) en lugar de O(n)
    const recordatoriosExistentesMap = new Map<string, Set<string>>();
    for (const rec of usuario.recordatorios) {
      if (rec.aporteId) {
        if (!recordatoriosExistentesMap.has(rec.aporteId)) {
          recordatoriosExistentesMap.set(rec.aporteId, new Set());
        }
        recordatoriosExistentesMap.get(rec.aporteId)!.add(rec.tipo);
      }
    }

    for (const aporte of usuario.aportes) {
      // Solo procesar aportes dentro del rango de anticipación
      if (aporte.fechaLimite > fechaLimiteRecordatorio) {
        continue;
      }

      const tiposExistentes = recordatoriosExistentesMap.get(aporte.id) || new Set();

      // Calcular días restantes
      const diasRestantes = Math.ceil(
        (aporte.fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Usar formatearMoneda() para conversión segura de Decimal a string
      const totalFormateado = formatearMoneda(Number(aporte.total));
      const mensaje = `Tu pago PILA de ${aporte.periodo} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. Total: ${totalFormateado}`;

      // Crear recordatorio IN_APP si no existe
      if (!tiposExistentes.has('IN_APP')) {
        recordatoriosACrear.push({
          userId: usuario.id,
          aporteId: aporte.id,
          tipo: 'IN_APP',
          titulo: 'Recordatorio de pago PILA',
          mensaje,
          fechaEnvio: hoy,
        });
      }

      // Crear recordatorio EMAIL si no existe y usuario tiene notificaciones activas
      if (
        !tiposExistentes.has('EMAIL') &&
        usuario.email &&
        usuario.notificacionesEmail
      ) {
        recordatoriosACrear.push({
          userId: usuario.id,
          aporteId: aporte.id,
          tipo: 'EMAIL',
          titulo: 'Recordatorio de pago PILA',
          mensaje,
          fechaEnvio: hoy,
        });
      }
    }
  }

  // 3. Inserción batch (1 sola query para todos los recordatorios)
  if (recordatoriosACrear.length > 0) {
    await prisma.recordatorio.createMany({
      data: recordatoriosACrear,
      skipDuplicates: true, // Prevenir duplicados por race conditions
    });
  }

  // 4. Actualizar aportes vencidos en batch (1 sola query)
  await prisma.aporte.updateMany({
    where: {
      estado: 'PENDIENTE',
      fechaLimite: {
        lt: hoy,
      },
    },
    data: {
      estado: 'VENCIDO',
    },
  });

  return { recordatoriosCreados: recordatoriosACrear.length };
}

/**
 * Envía recordatorios por email
 */
export async function enviarRecordatoriosEmail() {
  const recordatoriosPendientes = await prisma.recordatorio.findMany({
    where: {
      tipo: 'EMAIL',
      enviado: false,
      fechaEnvio: {
        lte: new Date(),
      },
    },
    include: {
      user: true,
      aporte: true,
    },
    take: 50, // Procesar en lotes
  });

  let emailsEnviados = 0;

  for (const recordatorio of recordatoriosPendientes) {
    try {
      // TODO: Integrar con servicio de email (Resend, SendGrid, etc.)
      await enviarEmail({
        to: recordatorio.user.email!,
        subject: `Recordatorio: Pago PILA próximo a vencer`,
        html: generarHTMLRecordatorio(recordatorio),
      });

      // Marcar como enviado
      await prisma.recordatorio.update({
        where: { id: recordatorio.id },
        data: {
          enviado: true,
          fechaEnviado: new Date(),
          emailEnviado: true,
        },
      });

      emailsEnviados++;
    } catch (error) {
      console.error(
        `Error al enviar email a ${recordatorio.user.email}:`,
        error
      );
    }
  }

  return { emailsEnviados };
}

/**
 * Mock de envío de email (reemplazar con servicio real)
 */
async function enviarEmail(data: {
  to: string;
  subject: string;
  html: string;
}) {
  // TODO: Integrar con Resend, SendGrid, NodeMailer, etc.
  console.log('Email enviado (mock):', data);
  return Promise.resolve();
}

/**
 * Genera HTML para el email de recordatorio
 */
function generarHTMLRecordatorio(recordatorio: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #14B8A6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #14B8A6;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recordatorio de Pago PILA</h1>
        </div>
        <div class="content">
          <p>Hola ${recordatorio.user.nombre || 'Usuario'},</p>
          <p>${recordatorio.mensaje}</p>

          ${
            recordatorio.aporte
              ? `
            <p><strong>Detalles del aporte:</strong></p>
            <ul>
              <li>Período: ${recordatorio.aporte.periodo}</li>
              <li>Total a pagar: ${formatearMoneda(Number(recordatorio.aporte.total))}</li>
              <li>Fecha límite: ${recordatorio.aporte.fechaLimite.toLocaleDateString('es-CO')}</li>
            </ul>
          `
              : ''
          }

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pila/liquidar" class="button">Ir a Pagar</a>
        </div>
        <div class="footer">
          <p>Este es un correo automático. No respondas a este mensaje.</p>
          <p>Ule - Tu plataforma de gestión financiera</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
