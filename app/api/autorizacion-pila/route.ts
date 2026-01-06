/**
 * ULE - API DE AUTORIZACIÓN PILA
 * Registra la autorización del usuario para gestión de PILA
 * Cumplimiento Ley 1581 de 2012
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'

// Schema de validación
const autorizacionPILASchema = z.object({
  autorizaGestionPILA: z.boolean(),
  autorizaCrearAportante: z.boolean(),
  autorizaConsultarInfo: z.boolean(),
  autorizaCompartirDatos: z.boolean(),
  aceptaTodo: z.boolean(),
})

/**
 * Genera un hash SHA-256 de las autorizaciones para integridad
 */
function generarHashIntegridad(data: {
  userId: string
  autorizaGestionPILA: boolean
  autorizaCrearAportante: boolean
  autorizaConsultarInfo: boolean
  autorizaCompartirDatos: boolean
  aceptaTodo: boolean
  fechaAutorizacion: Date
}): string {
  const contenido = JSON.stringify({
    userId: data.userId,
    autorizaGestionPILA: data.autorizaGestionPILA,
    autorizaCrearAportante: data.autorizaCrearAportante,
    autorizaConsultarInfo: data.autorizaConsultarInfo,
    autorizaCompartirDatos: data.autorizaCompartirDatos,
    aceptaTodo: data.aceptaTodo,
    fechaAutorizacion: data.fechaAutorizacion.toISOString(),
  })
  return crypto.createHash('sha256').update(contenido).digest('hex')
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        perfilCompleto: true,
        autorizacionPILACompleta: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el perfil esté completo
    if (!user.perfilCompleto) {
      return NextResponse.json(
        { error: 'Debes completar tu perfil antes de autorizar' },
        { status: 400 }
      )
    }

    // Verificar si ya tiene autorización
    if (user.autorizacionPILACompleta) {
      return NextResponse.json(
        { error: 'Ya tienes una autorización PILA registrada' },
        { status: 400 }
      )
    }

    // Validar body
    const body = await request.json()
    const validacion = autorizacionPILASchema.safeParse(body)

    if (!validacion.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validacion.error.errors },
        { status: 400 }
      )
    }

    const {
      autorizaGestionPILA,
      autorizaCrearAportante,
      autorizaConsultarInfo,
      autorizaCompartirDatos,
      aceptaTodo,
    } = validacion.data

    // Validar que todas las autorizaciones estén marcadas
    if (
      !autorizaGestionPILA ||
      !autorizaCrearAportante ||
      !autorizaConsultarInfo ||
      !autorizaCompartirDatos ||
      !aceptaTodo
    ) {
      return NextResponse.json(
        { error: 'Debes aceptar todas las autorizaciones' },
        { status: 400 }
      )
    }

    // Obtener IP y User-Agent
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const fechaAutorizacion = new Date()

    // Generar hash de integridad
    const hashIntegridad = generarHashIntegridad({
      userId: user.id,
      autorizaGestionPILA,
      autorizaCrearAportante,
      autorizaConsultarInfo,
      autorizaCompartirDatos,
      aceptaTodo,
      fechaAutorizacion,
    })

    // Crear autorización en transacción
    await prisma.$transaction(async (tx) => {
      // Crear registro de autorización
      await tx.autorizacionPILA.create({
        data: {
          userId: user.id,
          autorizaGestionPILA,
          autorizaCrearAportante,
          autorizaConsultarInfo,
          autorizaCompartirDatos,
          aceptaTodo,
          versionTerminos: '1.0',
          ipAddress,
          userAgent,
          fechaAutorizacion,
          hashIntegridad,
        },
      })

      // Actualizar flag en usuario
      await tx.user.update({
        where: { id: user.id },
        data: { autorizacionPILACompleta: true },
      })

      // Registrar en log de auditoría si existe el modelo
      try {
        await tx.logAuditoria.create({
          data: {
            userId: user.id,
            userEmail: session.user.email,
            userName: session.user.name || '',
            accion: 'CONSENTIMIENTO_OTORGADO',
            categoria: 'SEGURIDAD_SOCIAL',
            recurso: 'autorizacion-pila',
            exitoso: true,
            ip: ipAddress,
            userAgent,
            detalles: {
              tipo: 'AUTORIZACION_PILA',
              version: '1.0',
              autorizaciones: {
                gestionPILA: autorizaGestionPILA,
                crearAportante: autorizaCrearAportante,
                consultarInfo: autorizaConsultarInfo,
                compartirDatos: autorizaCompartirDatos,
              },
            },
          },
        })
      } catch {
        // Ignorar si el modelo de auditoría no existe
        console.log(
          '[AutorizacionPILA] Auditoría no registrada (modelo no disponible)'
        )
      }
    })

    console.log(
      `[AutorizacionPILA] Autorización registrada para ${session.user.email}`
    )

    return NextResponse.json({
      success: true,
      message: 'Autorización registrada correctamente',
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Error al registrar autorización PILA:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener estado de autorización PILA del usuario
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        autorizacionPILACompleta: true,
        autorizacionPILA: {
          select: {
            fechaAutorizacion: true,
            versionTerminos: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      completa: user.autorizacionPILACompleta,
      fechaAutorizacion: user.autorizacionPILA?.fechaAutorizacion || null,
      versionTerminos: user.autorizacionPILA?.versionTerminos || null,
    })
  } catch (error) {
    console.error('Error al obtener estado de autorización PILA:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
