/**
 * ULE - API ENDPOINT PARA ANULAR FACTURAS
 * Anula una factura electrónica ante la DIAN (mock)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { anularFactura } from '@/lib/services/facturacion-service'
import { z } from 'zod'

const anularFacturaSchema = z.object({
  facturaId: z.string().cuid(),
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres'),
})

/**
 * POST /api/facturacion/anular
 * Anula una factura electrónica
 *
 * Requisitos DIAN para anulación:
 * - Factura debe estar en estado EMITIDA
 * - Debe tener CUFE válido
 * - Motivo de anulación claro (mínimo 10 caracteres)
 * - No debe haber pasado más de X días (varía según normativa)
 * - Cliente debe ser notificado
 *
 * Flujo:
 * 1. Validar que la factura esté EMITIDA
 * 2. Validar que tenga CUFE
 * 3. Llamar al servicio mock de anulación
 * 4. Actualizar estado en DB a ANULADA
 * 5. Registrar fecha y motivo de anulación
 * 6. (Opcional) Notificar al cliente
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
    const { facturaId, motivo } = anularFacturaSchema.parse(body)

    // Obtener factura con relaciones
    const factura = await db.factura.findFirst({
      where: {
        id: facturaId,
        userId: user.id,
      },
      include: {
        cliente: true,
      },
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // ==============================================
    // VALIDACIONES PREVIAS
    // ==============================================

    // Validar que esté EMITIDA
    if (factura.estado !== 'EMITIDA') {
      return NextResponse.json(
        {
          error: 'Estado inválido',
          message: `Solo se pueden anular facturas emitidas. Esta factura está en estado: ${factura.estado}`,
        },
        { status: 400 }
      )
    }

    // Validar que tenga CUFE
    if (!factura.cufe) {
      return NextResponse.json(
        {
          error: 'Factura sin CUFE',
          message:
            'Esta factura no tiene CUFE asignado. No se puede anular en DIAN.',
        },
        { status: 400 }
      )
    }

    // Validar que no esté vencido el plazo de anulación (ejemplo: 5 días)
    const diasDesdeEmision = Math.floor(
      (new Date().getTime() - factura.fechaEmision.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    const DIAS_LIMITE_ANULACION = 5 // Configurable según normativa

    if (diasDesdeEmision > DIAS_LIMITE_ANULACION) {
      return NextResponse.json(
        {
          error: 'Plazo vencido',
          message: `Han pasado ${diasDesdeEmision} días desde la emisión. Solo se pueden anular facturas dentro de los primeros ${DIAS_LIMITE_ANULACION} días.`,
        },
        { status: 400 }
      )
    }

    // ==============================================
    // ANULAR EN EL SERVICIO MOCK (Simula DIAN)
    // ==============================================

    const resultado = await anularFactura(factura.id, factura.cufe, motivo)

    // ==============================================
    // ACTUALIZAR EN BASE DE DATOS
    // ==============================================

    const facturaAnulada = await db.factura.update({
      where: { id: facturaId },
      data: {
        estado: 'ANULADA',
        fechaAnulacion: resultado.fechaAnulacion,
        motivoAnulacion: motivo,
        updatedAt: new Date(),
      },
      include: {
        cliente: true,
      },
    })

    // ==============================================
    // REGISTRAR EN HISTORIAL
    // ==============================================

    // Aquí se podría crear un registro en tabla de auditoría
    // con detalles de quién anuló, cuándo, y por qué

    // ==============================================
    // NOTIFICAR AL CLIENTE (opcional - próxima subfase)
    // ==============================================

    // if (factura.cliente.email) {
    //   await enviarNotificacionAnulacion(
    //     factura.cliente.email,
    //     factura.numeroFactura,
    //     motivo
    //   )
    // }

    return NextResponse.json({
      success: true,
      message: resultado.mensaje,
      factura: facturaAnulada,
      fechaAnulacion: resultado.fechaAnulacion,
    })
  } catch (error) {
    console.error('[API Anular Factura] Error:', error)

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
      { error: 'Error al anular factura' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/facturacion/anular?facturaId={id}
 * Consulta si una factura puede ser anulada
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

    const { searchParams } = new URL(req.url)
    const facturaId = searchParams.get('facturaId')

    if (!facturaId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    const factura = await db.factura.findFirst({
      where: {
        id: facturaId,
        userId: user.id,
      },
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Validar si puede ser anulada
    const puedeAnular = factura.estado === 'EMITIDA' && factura.cufe !== null

    let razon = ''
    if (!puedeAnular) {
      if (factura.estado !== 'EMITIDA') {
        razon = `La factura está en estado ${factura.estado}, solo se pueden anular facturas EMITIDAS`
      } else if (!factura.cufe) {
        razon = 'La factura no tiene CUFE asignado'
      }
    }

    // Validar plazo
    const diasDesdeEmision = factura.fechaEmision
      ? Math.floor(
          (new Date().getTime() - factura.fechaEmision.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    const DIAS_LIMITE_ANULACION = 5
    const dentroDePlazo = diasDesdeEmision <= DIAS_LIMITE_ANULACION

    if (!dentroDePlazo && puedeAnular) {
      razon = `Han pasado ${diasDesdeEmision} días desde la emisión. Plazo límite: ${DIAS_LIMITE_ANULACION} días`
    }

    return NextResponse.json({
      puedeAnular: puedeAnular && dentroDePlazo,
      razon: razon || 'La factura puede ser anulada',
      diasDesdeEmision,
      diasRestantes:
        DIAS_LIMITE_ANULACION - diasDesdeEmision > 0
          ? DIAS_LIMITE_ANULACION - diasDesdeEmision
          : 0,
    })
  } catch (error) {
    console.error('[API Consultar Anulación] Error:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado de anulación' },
      { status: 500 }
    )
  }
}
