/**
 * ULE - API DE SOLICITUD DE FACTURACIÓN ELECTRÓNICA
 * Registra la solicitud del usuario para habilitar facturación electrónica
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { telefono, mensaje } = body

    if (!telefono) {
      return NextResponse.json(
        { error: 'El teléfono es requerido' },
        { status: 400 }
      )
    }

    // Actualizar el usuario con la fecha de solicitud
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        fechaSolicitudFacturacion: new Date(),
        telefono: telefono, // Actualizar teléfono si lo proporciona
      },
    })

    // Aquí se podría enviar un email de notificación al admin
    // o crear un registro en una tabla de solicitudes para seguimiento
    console.log(`[Solicitud Facturación] Usuario: ${session.user.email}`)
    console.log(`[Solicitud Facturación] Teléfono: ${telefono}`)
    console.log(`[Solicitud Facturación] Mensaje: ${mensaje || 'Sin mensaje'}`)

    return NextResponse.json({
      success: true,
      message: 'Solicitud registrada correctamente',
      fechaSolicitud: user.fechaSolicitudFacturacion,
    })
  } catch (error) {
    console.error('Error al procesar solicitud de facturación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
