/**
 * ULE - API DE BIBLIOTECA DE DOCUMENTOS
 * Endpoint para obtener documentos del usuario con filtros
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  obtenerDocumentos,
  obtenerEstadisticas,
} from '@/lib/services/documentos-service'

/**
 * GET /api/biblioteca/documentos
 * Obtiene documentos del usuario con filtros opcionales
 *
 * Query params:
 * - tipo: Tipo de documento (COMPROBANTE_PILA, FACTURA_EMITIDA, etc.)
 * - categoria: Categoría (SEGURIDAD_SOCIAL, FACTURACION, etc.)
 * - anio: Año (2024, 2025, etc.)
 * - mes: Mes (1-12)
 * - etiquetas: Etiquetas separadas por coma
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Parsear query params
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') || undefined
    const categoriaStr = searchParams.get('categoria') || undefined
    const anioStr = searchParams.get('anio')
    const mesStr = searchParams.get('mes')
    const etiquetasStr = searchParams.get('etiquetas')

    const anio = anioStr ? parseInt(anioStr) : undefined
    const mes = mesStr ? parseInt(mesStr) : undefined
    const etiquetas = etiquetasStr ? etiquetasStr.split(',') : undefined

    // Manejar múltiples categorías (separadas por coma)
    const categorias = categoriaStr ? categoriaStr.split(',') : undefined

    // Obtener documentos con filtros
    const documentos = await obtenerDocumentos(user.id, {
      tipo,
      categoria: categorias?.[0], // Por ahora solo primera categoría
      categorias, // Pasar array completo
      anio,
      mes,
      etiquetas,
    })

    // Obtener estadísticas
    const estadisticas = await obtenerEstadisticas(user.id, anio)

    return NextResponse.json({
      success: true,
      documentos,
      estadisticas,
      filtros: {
        tipo,
        categoria: categoriaStr,
        anio,
        mes,
        etiquetas,
      },
    })
  } catch (error) {
    console.error('[API Biblioteca] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    )
  }
}
