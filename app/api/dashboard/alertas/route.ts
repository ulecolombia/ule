import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface Alerta {
  id: string
  tipo: 'error' | 'warning' | 'info'
  titulo: string
  descripcion: string
  icono: string
  accion?: {
    texto: string
    href: string
  }
  dismissible?: boolean
}

/**
 * GET /api/dashboard/alertas
 * Obtiene alertas importantes para el usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const alertas: Alerta[] = []

    // 1. Verificar pagos PILA próximos a vencer (< 5 días)
    const ahora = new Date()
    const cincoDiasFuturo = new Date()
    cincoDiasFuturo.setDate(cincoDiasFuturo.getDate() + 5)

    const pagoProximo = await prisma.aporte.findFirst({
      where: {
        userId: user.id,
        estado: 'PENDIENTE',
        fechaLimite: {
          gte: ahora,
          lte: cincoDiasFuturo,
        },
      },
      orderBy: {
        fechaLimite: 'asc',
      },
    })

    if (pagoProximo) {
      const diasRestantes = Math.ceil(
        (pagoProximo.fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      )

      alertas.push({
        id: `pago-${pagoProximo.id}`,
        tipo: diasRestantes <= 2 ? 'error' : 'warning',
        titulo: `Pago PILA próximo a vencer`,
        descripcion: `Tu pago de ${pagoProximo.periodo} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. Total: $${Number(pagoProximo.total).toLocaleString('es-CO')}`,
        icono: 'schedule',
        accion: {
          texto: 'Ver detalles',
          href: '/pila/historial',
        },
        dismissible: false,
      })
    }

    // 2. Verificar perfil incompleto
    const perfilIncompleto = !user.tipoDocumento || !user.numeroDocumento || !user.tipoContrato

    if (perfilIncompleto) {
      alertas.push({
        id: 'perfil-incompleto',
        tipo: 'warning',
        titulo: 'Completa tu perfil',
        descripcion:
          'Tu perfil está incompleto. Complétalo para acceder a todas las funcionalidades.',
        icono: 'account_circle',
        accion: {
          texto: 'Completar perfil',
          href: '/perfil',
        },
        dismissible: true,
      })
    }

    // 3. Verificar si hay facturas del mes anterior sin emitir (alerta informativa)
    const mesAnterior = new Date()
    mesAnterior.setMonth(mesAnterior.getMonth() - 1)
    const inicioMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1)
    const finMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0)

    const facturasDelMesAnterior = await prisma.factura.count({
      where: {
        userId: user.id,
        fecha: {
          gte: inicioMesAnterior,
          lte: finMesAnterior,
        },
      },
    })

    if (facturasDelMesAnterior === 0) {
      alertas.push({
        id: 'sin-facturas-mes-anterior',
        tipo: 'info',
        titulo: 'Sin facturas el mes pasado',
        descripcion: `No registraste facturas en ${inicioMesAnterior.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}. ¿Olvidaste registrar alguna?`,
        icono: 'info',
        accion: {
          texto: 'Crear factura',
          href: '/facturacion/nueva',
        },
        dismissible: true,
      })
    }

    // 4. Verificar si tiene consultas IA disponibles pero no las ha usado
    const consultasIAUsadas = await prisma.usoIA.count({
      where: {
        userId: user.id,
      },
    })

    if (consultasIAUsadas === 0) {
      alertas.push({
        id: 'asesoria-ia-disponible',
        tipo: 'info',
        titulo: 'Asesoría IA disponible',
        descripcion:
          'Tienes consultas gratuitas de asesoría tributaria con IA. ¡Aprovéchalas!',
        icono: 'psychology',
        accion: {
          texto: 'Consultar ahora',
          href: '/asesoria',
        },
        dismissible: true,
      })
    }

    return NextResponse.json({ alertas })
  } catch (error) {
    logger.error(
      'Error al obtener alertas del dashboard',
      error instanceof Error ? error : new Error(String(error))
    )

    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    )
  }
}
