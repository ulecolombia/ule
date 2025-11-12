import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { calcularProximaDeclaracionRenta, formatearFechaTributaria } from '@/lib/utils/calendario-tributario'

/**
 * GET /api/dashboard/stats
 * Obtiene estadísticas del dashboard: próximo pago PILA, facturas del mes, actividad reciente
 */
export async function GET(req: NextRequest) {
  let session
  try {
    session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        numeroDocumento: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Calcular próxima fecha tributaria basada en la cédula
    const proximaFechaTributaria = user.numeroDocumento
      ? calcularProximaDeclaracionRenta(user.numeroDocumento)
      : null

    // Obtener datos en paralelo para mejor performance
    const [proximoPagoPILA, facturasDelMes, actividadReciente, usoIA] = await Promise.all([
      // 1. Próximo pago PILA pendiente
      prisma.aporte.findFirst({
        where: {
          userId: user.id,
          estado: 'PENDIENTE',
          fechaLimite: {
            gte: new Date(), // Solo pagos futuros
          },
        },
        orderBy: {
          fechaLimite: 'asc',
        },
        select: {
          id: true,
          periodo: true,
          total: true,
          fechaLimite: true,
        },
      }),

      // 2. Facturas del mes actual
      prisma.factura.aggregate({
        where: {
          userId: user.id,
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
        _count: true,
        _sum: {
          total: true,
        },
      }),

      // 3. Actividad reciente (últimas 10 acciones)
      getActividadReciente(user.id),

      // 4. Uso de IA (si existe la tabla)
      prisma.usoIA.count({
        where: {
          userId: user.id,
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).catch(() => 0), // Si falla, retornar 0
    ])

    return NextResponse.json({
      proximoPagoPILA: proximoPagoPILA ? {
        id: proximoPagoPILA.id,
        periodo: proximoPagoPILA.periodo,
        monto: Number(proximoPagoPILA.total),
        fechaLimite: proximoPagoPILA.fechaLimite.toISOString(),
        diasRestantes: Math.ceil(
          (proximoPagoPILA.fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      } : null,

      facturasDelMes: {
        cantidad: facturasDelMes._count,
        total: facturasDelMes._sum.total ? Number(facturasDelMes._sum.total) : 0,
      },

      consultasIA: {
        usadas: usoIA,
        total: 20, // Límite del plan
      },

      proximaFechaTributaria: proximaFechaTributaria ? {
        fecha: proximaFechaTributaria.fecha.toISOString(),
        fechaFormateada: formatearFechaTributaria(proximaFechaTributaria.fecha),
        descripcion: proximaFechaTributaria.descripcion,
        diasRestantes: proximaFechaTributaria.diasRestantes,
      } : null,

      actividadReciente,
    })
  } catch (error) {
    logger.error(
      'Error al obtener estadísticas del dashboard',
      error instanceof Error ? error : new Error(String(error)),
      { userId: session?.user?.email }
    )

    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}

/**
 * Obtiene la actividad reciente del usuario (últimas 10 acciones)
 */
async function getActividadReciente(userId: string) {
  try {
    // Obtener últimas facturas
    const facturas = await prisma.factura.findMany({
      where: { userId },
      orderBy: { fecha: 'desc' },
      take: 5,
      select: {
        id: true,
        numeroFactura: true,
        clienteNombre: true,
        total: true,
        fecha: true,
      },
    })

    // Obtener últimos aportes
    const aportes = await prisma.aporte.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        periodo: true,
        total: true,
        estado: true,
        createdAt: true,
      },
    })

    // Combinar y ordenar por fecha
    const actividades = [
      ...facturas.map((f) => ({
        id: f.id,
        tipo: 'factura' as const,
        titulo: `Factura ${f.numeroFactura} generada`,
        descripcion: `Cliente: ${f.clienteNombre} - $${Number(f.total).toLocaleString('es-CO')}`,
        fecha: f.fecha,
        icono: 'receipt_long',
        color: 'text-primary',
      })),
      ...aportes.map((a) => ({
        id: a.id,
        tipo: 'pila' as const,
        titulo: a.estado === 'PAGADO' ? 'Pago PILA confirmado' : 'PILA calculada',
        descripcion: `${a.periodo} - $${Number(a.total).toLocaleString('es-CO')}`,
        fecha: a.createdAt,
        icono: 'account_balance',
        color: a.estado === 'PAGADO' ? 'text-success-text-light' : 'text-warning-text-light',
      })),
    ]
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 10)
      .map((actividad) => ({
        ...actividad,
        fecha: formatearTiempoRelativo(actividad.fecha),
        fechaISO: actividad.fecha.toISOString(),
      }))

    return actividades
  } catch (error) {
    logger.error('Error al obtener actividad reciente', error as Error)
    return []
  }
}

/**
 * Formatea una fecha a tiempo relativo (ej: "Hace 2 horas")
 */
function formatearTiempoRelativo(fecha: Date): string {
  const ahora = Date.now()
  const diff = ahora - fecha.getTime()
  const segundos = Math.floor(diff / 1000)
  const minutos = Math.floor(segundos / 60)
  const horas = Math.floor(minutos / 60)
  const dias = Math.floor(horas / 24)

  if (dias > 7) {
    return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  } else if (dias > 0) {
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  } else if (horas > 0) {
    return `Hace ${horas} hora${horas > 1 ? 's' : ''}`
  } else if (minutos > 0) {
    return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`
  } else {
    return 'Hace un momento'
  }
}
