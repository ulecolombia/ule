/**
 * API: GET /api/analytics/metricas
 * Obtiene metricas agregadas para el dashboard de admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que es admin (optional - ajustar segun tu logica)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dias = parseInt(searchParams.get('dias') || '30')

    const fechaInicio = startOfDay(subDays(new Date(), dias))

    // ✅ CORRECTO: Calcular usuarios activos únicos
    const usuariosActivos = await prisma.analyticsEvento.findMany({
      where: {
        timestamp: { gte: fechaInicio },
        evento: 'page_view',
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Obtener metricas diarias
    const metricasDiarias = await prisma.metricaDiaria.findMany({
      where: {
        fecha: { gte: fechaInicio },
      },
      orderBy: { fecha: 'asc' },
    })

    // Calcular totales
    const totales = metricasDiarias.reduce(
      (acc, metrica) => ({
        usuariosActivos: acc.usuariosActivos, // No sumar, usar count único
        nuevosUsuarios: acc.nuevosUsuarios + metrica.nuevosUsuarios,
        usosPILA: acc.usosPILA + metrica.usosPILA,
        usosFacturacion: acc.usosFacturacion + metrica.usosFacturacion,
        usosAsesoria: acc.usosAsesoria + metrica.usosAsesoria,
      }),
      {
        usuariosActivos: usuariosActivos.length, // ✅ Count único
        nuevosUsuarios: 0,
        usosPILA: 0,
        usosFacturacion: 0,
        usosAsesoria: 0,
      }
    )

    // Eventos mas frecuentes
    const eventosFrecuentes = await prisma.analyticsEvento.groupBy({
      by: ['evento'],
      _count: { evento: true },
      where: {
        timestamp: { gte: fechaInicio },
      },
      orderBy: {
        _count: { evento: 'desc' },
      },
      take: 10,
    })

    // Errores recientes
    const erroresRecientes = await prisma.errorLog.findMany({
      where: {
        timestamp: { gte: fechaInicio },
        resuelto: false,
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    })

    // ✅ CORRECTO: Retención de usuarios
    // Usuarios activos hace exactamente 7 días (ventana de 24h)
    const hace7Dias = startOfDay(subDays(new Date(), 7))
    const hace6Dias = startOfDay(subDays(new Date(), 6))
    const hoy = startOfDay(new Date())

    // Usuarios que estuvieron activos hace 7 días
    const usuariosHace7Dias = await prisma.analyticsEvento.findMany({
      where: {
        timestamp: {
          gte: hace7Dias,
          lt: hace6Dias, // ✅ Ventana de 24 horas hace 7 días
        },
        evento: 'page_view',
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Usuarios activos hoy
    const usuariosHoy = await prisma.analyticsEvento.findMany({
      where: {
        timestamp: { gte: hoy },
        evento: 'page_view',
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    // Usuarios que estuvieron hace 7 días Y también hoy
    const usuariosRetenidos = usuariosHace7Dias.filter((u1) =>
      usuariosHoy.some((u2) => u2.userId === u1.userId)
    )

    const retencion7Dias =
      usuariosHace7Dias.length > 0
        ? (usuariosRetenidos.length / usuariosHace7Dias.length) * 100
        : 0

    return NextResponse.json({
      metricasDiarias,
      totales,
      eventosFrecuentes,
      erroresRecientes,
      retencion7Dias: retencion7Dias.toFixed(2),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener metricas' },
      { status: 500 }
    )
  }
}
