/**
 * ULE - API ENDPOINT PARA ESTADÍSTICAS DE USO DE IA
 * GET /api/ia/estadisticas - Obtener estadísticas de uso
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiLogger } from '@/lib/utils/logger'

/**
 * GET - Obtener estadísticas de uso de IA del usuario
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      apiLogger.warn('Intento de acceder estadísticas sin autenticación')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Estadísticas generales
    const totalConversaciones = await db.conversacion.count({
      where: { userId: user.id },
    })

    const totalMensajes = await db.mensaje.count({
      where: {
        conversacion: {
          userId: user.id,
        },
      },
    })

    // Contar solo mensajes del usuario (consultas reales)
    const totalConsultas = await db.mensaje.count({
      where: {
        conversacion: {
          userId: user.id,
        },
        rol: 'USER',
      },
    })

    // Uso del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const usoMesActual = await db.usoIA.aggregate({
      where: {
        userId: user.id,
        fecha: { gte: inicioMes },
      },
      _sum: {
        consultasRealizadas: true,
        tokensUsados: true,
      },
    })

    // Conversaciones recientes (últimas 5)
    const conversacionesRecientes = await db.conversacion.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { mensajes: true },
        },
      },
    })

    // Tokens usados en total (suma de todos los mensajes de ASSISTANT)
    const tokensUsadosTotal = await db.mensaje.aggregate({
      where: {
        conversacion: {
          userId: user.id,
        },
        rol: 'ASSISTANT',
        tokensUsados: {
          not: null,
        },
      },
      _sum: {
        tokensUsados: true,
      },
    })

    // Última actividad
    const ultimaActividad = await db.conversacion.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        updatedAt: true,
      },
    })

    // Estadísticas por día de los últimos 7 días
    const hace7Dias = new Date()
    hace7Dias.setDate(hace7Dias.getDate() - 7)
    hace7Dias.setHours(0, 0, 0, 0)

    const usoUltimos7Dias = await db.usoIA.findMany({
      where: {
        userId: user.id,
        fecha: { gte: hace7Dias },
      },
      orderBy: { fecha: 'asc' },
    })

    apiLogger.info('Estadísticas recuperadas', {
      userId: user.id,
      totalConversaciones,
      totalMensajes,
    })

    return NextResponse.json({
      estadisticas: {
        // Generales
        totalConversaciones,
        totalMensajes,
        totalConsultas,
        tokensUsadosTotal: tokensUsadosTotal._sum.tokensUsados || 0,

        // Mes actual
        consultasMes: usoMesActual._sum.consultasRealizadas || 0,
        tokensUsadosMes: usoMesActual._sum.tokensUsados || 0,

        // Actividad
        ultimaActividad: ultimaActividad?.updatedAt || null,

        // Conversaciones recientes
        conversacionesRecientes: conversacionesRecientes.map((c) => ({
          id: c.id,
          titulo: c.titulo,
          updatedAt: c.updatedAt,
          mensajesCount: c._count.mensajes,
        })),

        // Histórico de 7 días
        usoUltimos7Dias: usoUltimos7Dias.map((u) => ({
          fecha: u.fecha,
          consultas: u.consultasRealizadas,
          tokens: u.tokensUsados,
        })),

        // Promedios
        promedioMensajesPorConversacion:
          totalConversaciones > 0
            ? Math.round(totalMensajes / totalConversaciones)
            : 0,
        promedioTokensPorConsulta:
          totalConsultas > 0
            ? Math.round(
                (tokensUsadosTotal._sum.tokensUsados || 0) / totalConsultas
              )
            : 0,
      },
    })
  } catch (error) {
    apiLogger.error('Error en GET /api/ia/estadisticas', error as Error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
