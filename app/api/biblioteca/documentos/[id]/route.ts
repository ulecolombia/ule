/**
 * ULE - API DE ELIMINACIÓN DE DOCUMENTOS
 * Endpoint para eliminar documentos individuales
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

/**
 * DELETE /api/biblioteca/documentos/[id]
 * Elimina un documento (archivo físico + registro DB)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const documentoId = params.id

    // Buscar el documento
    const documento = await db.documento.findUnique({
      where: { id: documentoId },
    })

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el documento pertenece al usuario
    if (documento.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este documento' },
        { status: 403 }
      )
    }

    // Eliminar archivo físico
    const rutaCompleta = path.join(
      process.cwd(),
      'public',
      documento.rutaArchivo
    )
    try {
      await fs.unlink(rutaCompleta)
      console.log(`🗑️ [Biblioteca] Archivo eliminado: ${documento.rutaArchivo}`)
    } catch (error) {
      console.error('⚠️ [Biblioteca] Error al eliminar archivo físico:', error)
      // Continuar con la eliminación del registro aunque falle el archivo
    }

    // Eliminar registro de base de datos
    await db.documento.delete({
      where: { id: documentoId },
    })

    console.log(`✅ [Biblioteca] Documento eliminado: ${documentoId}`)

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
    })
  } catch (error) {
    console.error('[API Biblioteca Delete] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar documento' },
      { status: 500 }
    )
  }
}
