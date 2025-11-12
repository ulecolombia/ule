/**
 * ULE - API ENDPOINT PARA ENVIAR FACTURAS POR EMAIL
 * Envía factura PDF y XML por email usando Resend o NodeMailer
 * MEJORADO: Con rate limiting, logging estructurado y validaciones de seguridad
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { sendFacturaEmail } from '@/lib/services/email-service'
import { apiLogger } from '@/lib/utils/logger'
import {
  isValidCUID,
  emailRateLimiter,
  sanitizeInput,
  containsSuspiciousPatterns,
} from '@/lib/utils/security'
import { EMAIL_CONSTRAINTS } from '@/lib/utils/format'

// FIX: Usar constantes centralizadas para validación
const enviarEmailSchema = z.object({
  facturaId: z.string().cuid(),
  destinatario: z.string().email('Email inválido'),
  cc: z.array(z.string().email()).optional().default([]),
  asunto: z
    .string()
    .min(
      EMAIL_CONSTRAINTS.ASUNTO_MIN,
      `El asunto debe tener al menos ${EMAIL_CONSTRAINTS.ASUNTO_MIN} caracteres`
    )
    .max(
      EMAIL_CONSTRAINTS.ASUNTO_MAX,
      `El asunto no puede exceder ${EMAIL_CONSTRAINTS.ASUNTO_MAX} caracteres`
    ),
  mensaje: z
    .string()
    .min(
      EMAIL_CONSTRAINTS.MENSAJE_MIN,
      `El mensaje debe tener al menos ${EMAIL_CONSTRAINTS.MENSAJE_MIN} caracteres`
    )
    .max(
      EMAIL_CONSTRAINTS.MENSAJE_MAX,
      `El mensaje no puede exceder ${EMAIL_CONSTRAINTS.MENSAJE_MAX} caracteres`
    ),
  adjuntarPdf: z.boolean().default(true),
  adjuntarXml: z.boolean().default(true),
})

/**
 * POST /api/facturacion/enviar-email
 * Envía una factura por email
 *
 * Body:
 * {
 *   facturaId: string,
 *   destinatario: string,
 *   cc?: string[],
 *   asunto: string,
 *   mensaje: string,
 *   adjuntarPdf: boolean,
 *   adjuntarXml: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      apiLogger.warn('Intento de enviar email sin autenticación')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      apiLogger.warn('Usuario no encontrado', { email: session.user.email })
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // FIX: Rate limiting - 10 emails por minuto por usuario
    const rateLimitCheck = emailRateLimiter.check(user.id)
    if (!rateLimitCheck.allowed) {
      apiLogger.warn('Rate limit excedido', {
        userId: user.id,
        email: user.email,
      })
      return NextResponse.json(
        {
          error: 'Límite de envíos excedido',
          message:
            'Has excedido el límite de envíos de email. Por favor espera un momento antes de intentar nuevamente.',
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const {
      facturaId,
      destinatario,
      cc,
      asunto,
      mensaje,
      adjuntarPdf,
      adjuntarXml,
    } = enviarEmailSchema.parse(body)

    // FIX: Validación adicional de CUID (defensa en profundidad)
    if (!isValidCUID(facturaId)) {
      apiLogger.warn('ID de factura inválido', { facturaId })
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      )
    }

    // FIX: Sanitizar inputs para prevenir XSS
    const asuntoSanitizado = sanitizeInput(asunto)
    const mensajeSanitizado = sanitizeInput(mensaje)

    // FIX: Detectar patrones sospechosos
    if (
      containsSuspiciousPatterns(asunto) ||
      containsSuspiciousPatterns(mensaje)
    ) {
      apiLogger.warn('Patrones sospechosos detectados en input', {
        userId: user.id,
        facturaId,
      })
      return NextResponse.json(
        { error: 'Contenido no permitido detectado en el mensaje' },
        { status: 400 }
      )
    }

    apiLogger.info('Iniciando envío de email de factura', {
      userId: user.id,
      facturaId,
      destinatario,
    })

    // ==============================================
    // OBTENER FACTURA
    // ==============================================

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
    // VALIDACIONES
    // ==============================================

    // Solo se pueden enviar facturas emitidas
    if (factura.estado !== 'EMITIDA') {
      return NextResponse.json(
        {
          error: 'Estado inválido',
          message:
            'Solo se pueden enviar facturas emitidas. Esta factura está en estado ' +
            factura.estado,
        },
        { status: 400 }
      )
    }

    // Debe tener PDF si se solicita adjuntarlo
    if (adjuntarPdf && !factura.pdfUrl) {
      return NextResponse.json(
        {
          error: 'PDF no disponible',
          message: 'Esta factura no tiene PDF generado',
        },
        { status: 400 }
      )
    }

    // ==============================================
    // ENVIAR EMAIL CON SERVICIO REAL
    // ==============================================

    // FIX: Usar valores sanitizados
    const resultado = await sendFacturaEmail({
      facturaId: factura.id,
      numeroFactura: factura.numeroFactura,
      clienteNombre: factura.clienteNombre,
      clienteEmail: factura.clienteEmail || '',
      destinatario,
      cc,
      asunto: asuntoSanitizado,
      mensaje: mensajeSanitizado,
      adjuntarPdf,
      adjuntarXml,
      pdfUrl: factura.pdfUrl,
      xmlUrl: factura.xmlUrl,
    })

    apiLogger.info('Resultado del envío de email', {
      facturaId,
      exitoso: resultado.exitoso,
      messageId: resultado.messageId,
    })

    // ==============================================
    // REGISTRAR ENVÍO EN BASE DE DATOS
    // ==============================================

    const envio = await db.envioFactura.create({
      data: {
        facturaId: factura.id,
        destinatario,
        cc: cc.length > 0 ? cc.join(', ') : null,
        asunto: asuntoSanitizado,
        mensaje: mensajeSanitizado,
        adjuntoPdf: adjuntarPdf,
        adjuntoXml: adjuntarXml,
        exitoso: resultado.exitoso,
        error: resultado.error || null,
        fechaEnvio: resultado.fecha,
      },
    })

    apiLogger.info('Envío registrado en base de datos', { envioId: envio.id })

    // ==============================================
    // RESPUESTA
    // ==============================================

    if (!resultado.exitoso) {
      return NextResponse.json(
        {
          error: 'Error al enviar email',
          message: resultado.error || 'Error desconocido',
          envioId: envio.id,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Factura enviada exitosamente a ${destinatario}`,
      destinatario,
      cc,
      fechaEnvio: resultado.fecha,
      messageId: resultado.messageId,
      envioId: envio.id,
    })
  } catch (error) {
    apiLogger.error('Error en POST /api/facturacion/enviar-email', error as Error)

    if (error instanceof z.ZodError) {
      apiLogger.warn('Error de validación Zod', { errors: error.errors })
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
      { error: 'Error al enviar factura por email' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/facturacion/enviar-email?facturaId={id}
 * Obtiene historial de envíos de una factura
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      apiLogger.warn('Intento de obtener historial sin autenticación')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      apiLogger.warn('Usuario no encontrado en GET', {
        email: session.user.email,
      })
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

    // FIX: Validar formato CUID
    if (!isValidCUID(facturaId)) {
      apiLogger.warn('ID de factura inválido en GET', { facturaId })
      return NextResponse.json(
        { error: 'ID de factura inválido' },
        { status: 400 }
      )
    }

    apiLogger.info('Obteniendo historial de envíos', {
      userId: user.id,
      facturaId,
    })

    // Verificar que la factura pertenece al usuario
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

    // Obtener historial de envíos
    const envios = await db.envioFactura.findMany({
      where: {
        facturaId,
      },
      orderBy: {
        fechaEnvio: 'desc',
      },
    })

    apiLogger.info('Historial de envíos obtenido exitosamente', {
      facturaId,
      totalEnvios: envios.length,
    })

    return NextResponse.json({
      envios,
      total: envios.length,
    })
  } catch (error) {
    apiLogger.error('Error en GET /api/facturacion/enviar-email', error as Error)
    return NextResponse.json(
      { error: 'Error al obtener historial de envíos' },
      { status: 500 }
    )
  }
}
