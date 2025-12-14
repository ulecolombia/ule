import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { procesarPagoMock } from '@/lib/pago-service'
import { generarComprobantePDF } from '@/lib/pdf-generator'
import { formatearPeriodo } from '@/lib/calculadora-pila'
import { guardarComprobantePILA } from '@/lib/services/documentos-service'

/**
 * Webhook que recibe confirmaciones de pago
 * En producción, validar firma/token del proveedor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { aporteId, referencia } = body

    // Validación básica
    if (!aporteId || !referencia) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Buscar el aporte
    const aporte = await prisma.aporte.findUnique({
      where: { id: aporteId },
      include: {
        user: {
          include: {
            configuracionPila: true,
          },
        },
      },
    })

    if (!aporte) {
      return NextResponse.json(
        { message: 'Aporte no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no esté ya pagado
    if (aporte.estado === 'PAGADO') {
      return NextResponse.json(
        { message: 'Este aporte ya fue procesado' },
        { status: 400 }
      )
    }

    // Procesar pago (mock)
    const resultadoPago = await procesarPagoMock(aporteId, referencia)

    if (resultadoPago.estado === 'APROBADO') {
      // Generar comprobante PDF
      const datosComprobante = {
        numeroComprobante: resultadoPago.numeroComprobante!,
        periodo: formatearPeriodo(aporte.mes, aporte.anio),
        fechaPago: resultadoPago.fechaPago!,
        usuario: {
          nombre: aporte.user.name || 'Usuario',
          documento: aporte.user.numeroDocumento || 'N/A',
          tipoDocumento: aporte.user.tipoDocumento || 'CC',
        },
        entidades: {
          eps: aporte.user.entidadSalud || 'N/A',
          pension: aporte.user.entidadPension || 'N/A',
          arl: aporte.user.arl || 'N/A',
        },
        aportes: {
          ibc: parseFloat(aporte.ibc.toString()),
          salud: parseFloat(aporte.salud.toString()),
          pension: parseFloat(aporte.pension.toString()),
          arl: parseFloat(aporte.arl.toString()),
          total: parseFloat(aporte.total.toString()),
        },
      }

      // Generar comprobante PDF
      const pdfDoc = generarComprobantePDF(datosComprobante)
      const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'))

      // ✨ NUEVO: Guardar automáticamente en biblioteca de documentos
      const documento = await guardarComprobantePILA(
        aporte.userId,
        aporteId,
        pdfBuffer,
        aporte.mes,
        aporte.anio
      )

      // Actualizar aporte en base de datos
      await prisma.aporte.update({
        where: { id: aporteId },
        data: {
          estado: 'PAGADO',
          fechaPago: resultadoPago.fechaPago,
          numeroComprobante: resultadoPago.numeroComprobante,
          comprobantePDF: documento.rutaArchivo, // Usar ruta del documento
        },
      })

      console.log(
        `✅ [Webhook PILA] Pago procesado y documento guardado: ${documento.id}`
      )

      return NextResponse.json({
        message: 'Pago procesado exitosamente',
        numeroComprobante: resultadoPago.numeroComprobante,
        comprobantePDF: documento.rutaArchivo,
        documentoId: documento.id,
      })
    } else {
      // Pago rechazado
      await prisma.aporte.update({
        where: { id: aporteId },
        data: {
          estado: 'PENDIENTE', // Mantener pendiente para reintentar
        },
      })

      return NextResponse.json({
        message: resultadoPago.mensaje || 'Pago rechazado',
        estado: resultadoPago.estado,
      })
    }
  } catch (error) {
    console.error('Error en webhook de pago:', error)
    return NextResponse.json(
      { message: 'Error al procesar pago' },
      { status: 500 }
    )
  }
}
