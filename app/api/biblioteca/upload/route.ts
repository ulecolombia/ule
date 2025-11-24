/**
 * ULE - API DE SUBIDA DE DOCUMENTOS
 * Endpoint para subir archivos PDF o JPG a la categoría OTROS
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { crearDocumento } from '@/lib/services/documentos-service'
import fs from 'fs/promises'
import path from 'path'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg']

/**
 * POST /api/biblioteca/upload
 * Sube un archivo PDF o JPG a la biblioteca en categoría OTROS
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

    // Obtener el archivo y tipo del FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const tipoDocumento = (formData.get('tipo') as string) || 'OTRO'

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de documento
    const tiposPermitidos = [
      'FACTURA_RECIBIDA',
      'CERTIFICADO',
      'CONTRATO',
      'OTRO',
    ]
    if (!tiposPermitidos.includes(tipoDocumento)) {
      return NextResponse.json(
        { error: 'Tipo de documento no válido' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos PDF o JPG' },
        { status: 400 }
      )
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar categoría y carpeta según tipo de documento
    let categoria: string
    let carpeta: string

    switch (tipoDocumento) {
      case 'FACTURA_RECIBIDA':
        categoria = 'GASTOS'
        carpeta = 'facturas'
        break
      case 'CERTIFICADO':
        categoria = 'CERTIFICACIONES'
        carpeta = 'certificados'
        break
      case 'CONTRATO':
        categoria = 'CONTRATOS'
        carpeta = 'contratos'
        break
      default:
        categoria = 'OTROS'
        carpeta = 'otros'
    }

    // Determinar extensión del archivo
    const extension = file.type === 'application/pdf' ? 'pdf' : 'jpg'

    // Crear directorio si no existe
    const directorioBase = path.join(
      process.cwd(),
      'public',
      'documentos',
      user.id,
      carpeta
    )
    await fs.mkdir(directorioBase, { recursive: true })

    // Generar nombre de archivo único
    const timestamp = Date.now()
    const nombreOriginalLimpio = file.name
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Reemplazar caracteres especiales
      .substring(0, 50) // Limitar longitud

    const nombreAlmacenado = `${nombreOriginalLimpio}-${timestamp}.${extension}`
    const rutaCompleta = path.join(directorioBase, nombreAlmacenado)
    const rutaPublica = `/documentos/${user.id}/${carpeta}/${nombreAlmacenado}`

    // Guardar archivo físico
    await fs.writeFile(rutaCompleta, buffer)

    // Obtener fecha actual para periodo
    const ahora = new Date()
    const mes = ahora.getMonth() + 1
    const anio = ahora.getFullYear()
    const periodo = `${anio}-${mes.toString().padStart(2, '0')}`

    // Generar etiquetas según tipo de documento
    const etiquetas: string[] = ['manual']
    switch (tipoDocumento) {
      case 'FACTURA_RECIBIDA':
        etiquetas.push('factura', 'gastos', 'proveedor')
        break
      case 'CERTIFICADO':
        etiquetas.push('certificado', 'laboral')
        break
      case 'CONTRATO':
        etiquetas.push('contrato', 'legal')
        break
      default:
        etiquetas.push('otros')
    }

    // Crear registro en base de datos
    const documento = await crearDocumento({
      userId: user.id,
      tipo: tipoDocumento as any,
      categoria: categoria as any,
      nombre: file.name,
      nombreAlmacenado,
      rutaArchivo: rutaPublica,
      tipoMIME: file.type,
      tamanoBytes: file.size,
      periodo,
      mes,
      anio,
      etiquetas,
      descripcion: 'Archivo subido manualmente',
    })

    console.log(`✅ [Biblioteca] Archivo subido: ${documento.id}`)

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nombre: documento.nombre,
        rutaArchivo: documento.rutaArchivo,
        tipo: documento.tipo,
        categoria: documento.categoria,
        tamanoBytes: documento.tamanoBytes,
        createdAt: documento.createdAt,
      },
    })
  } catch (error) {
    console.error('[API Biblioteca Upload] Error:', error)
    return NextResponse.json(
      { error: 'Error al subir el archivo' },
      { status: 500 }
    )
  }
}
