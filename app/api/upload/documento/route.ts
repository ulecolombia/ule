import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  validateFile,
  generateSecureFilename,
} from '@/lib/security/file-validator'
import { secureLogger } from '@/lib/security/secure-logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * POST - Subir documento de forma segura
 *
 * Características de seguridad:
 * - Validación de tipo MIME
 * - Validación de tamaño
 * - Generación de nombre seguro
 * - Cálculo de hash para integridad
 * - Logging de auditoría
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await auth()

    if (!session?.user?.email) {
      secureLogger.warn('Intento de upload sin autenticación', {
        url: req.url,
      })
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener archivo del form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'documents'

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    // Validar archivo con todas las comprobaciones de seguridad
    const validation = await validateFile(file, {
      category: category as 'documents' | 'images',
      fileType: category === 'images' ? 'image' : 'document',
      calculateHash: true,
    })

    if (!validation.valid) {
      secureLogger.warn('Archivo rechazado por validación', {
        userId: user.id,
        filename: file.name,
        reason: validation.error,
      })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generar nombre seguro (previene path traversal)
    const secureFilename = generateSecureFilename(file.name)
    const uploadDir = join(process.cwd(), 'public', 'uploads', user.id)
    const filePath = join(uploadDir, secureFilename)

    // Crear directorio si no existe
    await mkdir(uploadDir, { recursive: true })

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Guardar metadata en DB (incluyendo hash en comentarios para futuro uso)
    const now = new Date()
    const documento = await db.documento.create({
      data: {
        userId: user.id,
        nombre: file.name,
        nombreAlmacenado: secureFilename,
        tipo: 'OTRO', // TipoDocumentoArchivo: FACTURA, RECIBO_PAGO, COMPROBANTE_PILA, OTRO
        tipoArchivo: file.type,
        tamanoBytes: file.size,
        url: `/uploads/${user.id}/${secureFilename}`,
        mes: now.getMonth() + 1, // 1-12
        anio: now.getFullYear(),
        etiquetas: [], // array vacío por defecto
        // Hash SHA-256 para verificación de integridad (guardado en logs de auditoría)
      },
    })

    // Log de auditoría
    secureLogger.audit('Documento subido', {
      userId: user.id,
      documentoId: documento.id,
      filename: secureFilename,
      size: file.size,
      hash: validation.hash,
      duration: `${Date.now() - startTime}ms`,
    })

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        filename: file.name,
        size: file.size,
        url: `/uploads/${user.id}/${secureFilename}`,
      },
    })
  } catch (error) {
    secureLogger.error('Error subiendo documento', error)
    return NextResponse.json(
      { error: 'Error al subir archivo' },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar documentos del usuario
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const documentos = await db.documento.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        nombre: true,
        nombreAlmacenado: true,
        url: true,
        tipoArchivo: true,
        tamanoBytes: true,
        tipo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documentos })
  } catch (error) {
    secureLogger.error('Error listando documentos', error)
    return NextResponse.json(
      { error: 'Error al listar documentos' },
      { status: 500 }
    )
  }
}
