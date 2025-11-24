/**
 * ULE - API DE EXPORTACIÓN DE DOCUMENTOS A ZIP
 * Endpoint para exportar todos los documentos del usuario en formato ZIP
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import archiver from 'archiver'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/biblioteca/export
 * Genera un archivo ZIP con todos los documentos del usuario
 */
export async function POST(req: NextRequest) {
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

    // Obtener todos los documentos del usuario
    const documentos = await db.documento.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
    })

    if (documentos.length === 0) {
      return NextResponse.json(
        { error: 'No hay documentos para exportar' },
        { status: 404 }
      )
    }

    // Crear el archivo ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Máxima compresión
    })

    // Arrays para almacenar los chunks del ZIP
    const chunks: Buffer[] = []

    // Escuchar eventos del archiver
    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    // Promesa que se resuelve cuando el archivo está listo
    const zipPromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      archive.on('error', (err) => {
        reject(err)
      })
    })

    // Agregar documentos al ZIP organizados por categoría
    const categorias: Record<string, typeof documentos> = {}

    documentos.forEach((doc) => {
      if (!categorias[doc.categoria]) {
        categorias[doc.categoria] = []
      }
      categorias[doc.categoria].push(doc)
    })

    // Agregar archivos al ZIP
    for (const [categoria, docs] of Object.entries(categorias)) {
      const carpetaCategoria = categoria.replace('_', ' ')

      for (const doc of docs) {
        try {
          const rutaCompleta = path.join(
            process.cwd(),
            'public',
            doc.rutaArchivo
          )

          // Verificar que el archivo existe
          if (fs.existsSync(rutaCompleta)) {
            // Generar nombre único si hay duplicados
            const extension = path.extname(doc.nombreAlmacenado)
            const nombreBase = doc.nombre.replace(extension, '')
            const nombreArchivo = `${nombreBase}${extension}`

            // Agregar al ZIP en la carpeta de la categoría
            archive.file(rutaCompleta, {
              name: `${carpetaCategoria}/${nombreArchivo}`,
            })
          } else {
            console.warn(`Archivo no encontrado: ${rutaCompleta}`)
          }
        } catch (error) {
          console.error(`Error al agregar archivo ${doc.nombre}:`, error)
        }
      }
    }

    // Agregar un archivo README con información
    const readme = `DOCUMENTOS EXPORTADOS
=====================

Usuario: ${user.email}
Fecha de exportación: ${new Date().toLocaleString('es-CO')}
Total de documentos: ${documentos.length}

Organización de carpetas:
${Object.entries(categorias)
  .map(
    ([cat, docs]) => `- ${cat.replace('_', ' ')}: ${docs.length} documento(s)`
  )
  .join('\n')}

Este archivo ZIP contiene todos tus documentos organizados por categoría.
Generado por ULE - Sistema de gestión para trabajadores independientes.
`

    archive.append(readme, { name: 'README.txt' })

    // Finalizar el archivo
    archive.finalize()

    // Esperar a que el ZIP esté listo
    const zipBuffer = await zipPromise

    console.log(
      `✅ [Biblioteca] ZIP generado: ${documentos.length} documentos, ${zipBuffer.length} bytes`
    )

    // Retornar el archivo ZIP
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="documentos-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[API Biblioteca Export] Error:', error)
    return NextResponse.json(
      { error: 'Error al generar archivo ZIP' },
      { status: 500 }
    )
  }
}
