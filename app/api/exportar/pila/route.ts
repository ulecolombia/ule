/**
 * API DE EXPORTACIÓN PILA
 * POST /api/exportar/pila
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  exportarPilaExcel,
  exportarPilaCSV,
  exportarPilaPDF,
} from '@/lib/services/exportacion-pila-service'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener parámetros
    const body = await req.json()
    const {
      formato = 'excel',
      año,
      mes,
      estado,
    } = body

    // Validar formato
    if (!['excel', 'csv', 'pdf'].includes(formato)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: excel, csv o pdf' },
        { status: 400 }
      )
    }

    // Preparar filtros
    const filtros = {
      userId: user.id,
      ...(año && { año: parseInt(año) }),
      ...(mes && { mes: parseInt(mes) }),
      ...(estado && { estado }),
    }

    // Generar archivo según formato
    let result
    switch (formato) {
      case 'excel':
        result = await exportarPilaExcel(filtros)
        break
      case 'csv':
        result = await exportarPilaCSV(filtros)
        break
      case 'pdf':
        result = await exportarPilaPDF(filtros)
        break
      default:
        return NextResponse.json(
          { error: 'Formato no soportado' },
          { status: 400 }
        )
    }

    // Registrar exportación en base de datos
    const exportacion = await prisma.exportacion.create({
      data: {
        userId: user.id,
        tipo: 'PILA',
        formato: formato.toUpperCase(),
        nombreArchivo: result.fileName,
        urlArchivo: result.fileUrl,
        tamanoBytes: 0, // Se puede calcular después
        expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    })

    return NextResponse.json({
      success: true,
      exportacion: {
        id: exportacion.id,
        url: result.fileUrl,
        fileName: result.fileName,
        formato,
        expiraEn: exportacion.expiraEn,
      },
    })
  } catch (error) {
    console.error('[API Exportar PILA] Error:', error)
    return NextResponse.json(
      {
        error: 'Error al generar exportación',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
