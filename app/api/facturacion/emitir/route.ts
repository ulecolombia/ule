/**
 * ULE - API ENDPOINT PARA EMITIR FACTURAS
 * Emite una factura ante la DIAN (mock) y genera PDF/XML oficiales
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { emitirFactura } from '@/lib/services/facturacion-service'
import {
  generateFacturaPDF,
  generateFacturaXML,
} from '@/lib/utils/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'
import { guardarFacturaEmitida } from '@/lib/services/documentos-service'

const emitirFacturaSchema = z.object({
  facturaId: z.string().cuid(),
})

/**
 * POST /api/facturacion/emitir
 * Emite una factura electrónica ante la DIAN
 *
 * Flujo:
 * 1. Validar que la factura esté en estado BORRADOR
 * 2. Validar datos completos
 * 3. Llamar al servicio mock de emisión (simula Siigo/Facture)
 * 4. Generar PDF oficial con CUFE y QR
 * 5. Generar XML (UBL 2.1 simplificado)
 * 6. Guardar archivos en el servidor
 * 7. Actualizar factura en DB con estado EMITIDA
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

    const body = await req.json()
    const { facturaId } = emitirFacturaSchema.parse(body)

    // Obtener factura con relaciones completas
    const factura = await db.factura.findFirst({
      where: {
        id: facturaId,
        userId: user.id,
      },
      include: {
        cliente: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Validar que esté en estado BORRADOR
    if (factura.estado !== 'BORRADOR') {
      return NextResponse.json(
        {
          error: 'Estado inválido',
          message: `Esta factura ya fue ${factura.estado.toLowerCase()}. Solo se pueden emitir facturas en estado BORRADOR.`,
        },
        { status: 400 }
      )
    }

    // Validar datos completos
    const conceptos = factura.conceptos as any[]
    if (!conceptos || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'La factura debe tener al menos un item' },
        { status: 400 }
      )
    }

    if (Number(factura.total) <= 0) {
      return NextResponse.json(
        { error: 'El total de la factura debe ser mayor a cero' },
        { status: 400 }
      )
    }

    // Validar que el cliente tenga datos completos
    if (!factura.cliente.numeroDocumento) {
      return NextResponse.json(
        { error: 'El cliente debe tener número de documento' },
        { status: 400 }
      )
    }

    // ==============================================
    // EMITIR FACTURA (Servicio Mock - Simula Siigo/Facture/DIAN)
    // ==============================================

    const resultado = await emitirFactura({
      id: factura.id,
      numeroFactura: factura.numeroFactura,
      fecha: factura.fecha,
      clienteNombre: factura.cliente.nombre,
      clienteDocumento: factura.cliente.numeroDocumento,
      total: Number(factura.total),
      userId: user.id,
    })

    // ==============================================
    // GENERAR PDF OFICIAL CON CUFE Y QR
    // ==============================================

    const pdfBuffer = await generateFacturaPDF({
      ...factura,
      cufe: resultado.cufe,
      qrCode: resultado.qrCode,
    } as any)

    // ==============================================
    // GENERAR XML (UBL 2.1 simplificado)
    // ==============================================

    const xmlContent = generateFacturaXML({
      ...factura,
      cufe: resultado.cufe,
    } as any)

    // ==============================================
    // GUARDAR ARCHIVOS EN EL SERVIDOR
    // En producción, usar cloud storage (S3, GCS, Azure Blob)
    // ==============================================

    const facturaDir = join(process.cwd(), 'public', 'facturas', user.id)
    await mkdir(facturaDir, { recursive: true })

    // Nombre de archivo seguro (sin caracteres especiales)
    const safeFilename = factura.numeroFactura.replace(/[^a-zA-Z0-9]/g, '_')

    // Guardar PDF
    const pdfFilename = `factura-${safeFilename}.pdf`
    const pdfPath = join(facturaDir, pdfFilename)
    await writeFile(pdfPath, pdfBuffer)
    const pdfUrl = `/facturas/${user.id}/${pdfFilename}`

    // Guardar XML
    const xmlFilename = `factura-${safeFilename}.xml`
    const xmlPath = join(facturaDir, xmlFilename)
    await writeFile(xmlPath, xmlContent)
    const xmlUrl = `/facturas/${user.id}/${xmlFilename}`

    // ==============================================
    // ✨ NUEVO: GUARDAR AUTOMÁTICAMENTE EN BIBLIOTECA
    // ==============================================

    const documento = await guardarFacturaEmitida(
      user.id,
      facturaId,
      pdfBuffer,
      factura.numeroFactura,
      factura.fecha
    )

    console.log(
      `✅ [Facturación] Factura emitida y guardada en biblioteca: ${documento.id}`
    )

    // ==============================================
    // ACTUALIZAR FACTURA EN BASE DE DATOS
    // ==============================================

    const facturaActualizada = await db.factura.update({
      where: { id: facturaId },
      data: {
        estado: 'EMITIDA',
        cufe: resultado.cufe,
        qrCode: resultado.qrCode,
        pdfUrl: documento.rutaArchivo, // Usar ruta del documento
        xmlUrl,
        fechaEmision: resultado.fechaEmision,
        updatedAt: new Date(),
      },
      include: {
        cliente: true,
      },
    })

    // ==============================================
    // ENVIAR EMAIL (opcional - próxima subfase)
    // ==============================================

    // if (factura.cliente.email) {
    //   await enviarFacturaPorEmail(factura.id, factura.cliente.email)
    // }

    return NextResponse.json({
      success: true,
      message: 'Factura emitida exitosamente ante la DIAN',
      factura: facturaActualizada,
      cufe: resultado.cufe,
      pdfUrl,
      xmlUrl,
      qrCode: resultado.qrCode,
    })
  } catch (error) {
    console.error('[API Emitir Factura] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Error al emitir factura' },
      { status: 500 }
    )
  }
}
