/**
 * ULE - SERVICIO DE ENVÍO DE EMAILS
 * Maneja el envío de facturas por email usando Resend o NodeMailer
 * MEJORADO: Con validaciones de seguridad, timeouts y logging estructurado
 */

import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { readFile } from 'fs/promises'
import { emailLogger } from '@/lib/utils/logger'
import {
  validateFilePath,
  validateFile,
  withTimeout,
} from '@/lib/utils/security'
import { formatCurrency, formatDate, TIMEOUT_CONFIG } from '@/lib/utils/format'

// ==============================================
// CONFIGURACIÓN
// ==============================================

// Inicializar Resend (preferido)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Configurar NodeMailer como fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ==============================================
// TIPOS
// ==============================================

export interface SendFacturaEmailParams {
  facturaId: string
  numeroFactura: string
  clienteNombre: string
  clienteEmail: string
  destinatario: string
  cc?: string[]
  asunto: string
  mensaje: string
  adjuntarPdf: boolean
  adjuntarXml: boolean
  pdfUrl?: string | null
  xmlUrl?: string | null
}

export interface EmailResult {
  exitoso: boolean
  error?: string
  messageId?: string
  fecha: Date
}

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

// ==============================================
// FUNCIÓN PRINCIPAL: ENVIAR FACTURA POR EMAIL
// ==============================================

export async function sendFacturaEmail(
  params: SendFacturaEmailParams
): Promise<EmailResult> {
  try {
    emailLogger.info('Iniciando envío de email', {
      facturaId: params.facturaId,
      destinatario: params.destinatario,
      cc: params.cc,
    })

    // Preparar adjuntos
    const attachments = await prepararAdjuntos(params)

    emailLogger.info('Adjuntos preparados', { count: attachments.length })

    // Intentar con Resend primero
    if (resend && process.env.RESEND_API_KEY) {
      emailLogger.info('Usando Resend como proveedor principal')
      return await withTimeout(
        sendWithResend(params, attachments),
        TIMEOUT_CONFIG.EMAIL_SEND,
        'Timeout al enviar email con Resend'
      )
    }

    // Fallback a NodeMailer
    emailLogger.info('Usando NodeMailer como fallback')
    return await withTimeout(
      sendWithNodeMailer(params, attachments),
      TIMEOUT_CONFIG.EMAIL_SEND,
      'Timeout al enviar email con NodeMailer'
    )
  } catch (error) {
    emailLogger.error('Error al enviar email', error as Error, {
      facturaId: params.facturaId,
      destinatario: params.destinatario,
    })
    return {
      exitoso: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      fecha: new Date(),
    }
  }
}

// ==============================================
// PREPARAR ADJUNTOS
// ==============================================

async function prepararAdjuntos(
  params: SendFacturaEmailParams
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = []

  // Adjuntar PDF
  if (params.adjuntarPdf && params.pdfUrl) {
    try {
      // FIX: Validar path para prevenir path traversal
      const pdfValidation = validateFilePath(params.pdfUrl, 'public')

      if (!pdfValidation.isValid || !pdfValidation.safePath) {
        emailLogger.warn('Intento de acceso a path inválido (PDF)', {
          pdfUrl: params.pdfUrl,
          error: pdfValidation.error,
        })
        throw new Error(pdfValidation.error || 'Path inválido')
      }

      // FIX: Validar tamaño y tipo de archivo antes de cargar
      const fileValidation = await validateFile(pdfValidation.safePath)

      if (!fileValidation.isValid) {
        emailLogger.warn('Archivo PDF no válido', {
          error: fileValidation.error,
          size: fileValidation.size,
        })
        throw new Error(fileValidation.error || 'Archivo no válido')
      }

      // FIX: Usar path validado
      const pdfBuffer = await readFile(pdfValidation.safePath)

      attachments.push({
        filename: `Factura-${params.numeroFactura}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      })

      emailLogger.info('PDF adjuntado correctamente', {
        size: fileValidation.size,
        filename: `Factura-${params.numeroFactura}.pdf`,
      })
    } catch (error) {
      emailLogger.error('Error al leer PDF', error as Error, {
        pdfUrl: params.pdfUrl,
      })
      // No fallar por esto, continuar sin PDF
    }
  }

  // Adjuntar XML
  if (params.adjuntarXml && params.xmlUrl) {
    try {
      // FIX: Validar path para prevenir path traversal
      const xmlValidation = validateFilePath(params.xmlUrl, 'public')

      if (!xmlValidation.isValid || !xmlValidation.safePath) {
        emailLogger.warn('Intento de acceso a path inválido (XML)', {
          xmlUrl: params.xmlUrl,
          error: xmlValidation.error,
        })
        throw new Error(xmlValidation.error || 'Path inválido')
      }

      // FIX: Validar tamaño y tipo de archivo antes de cargar
      const fileValidation = await validateFile(xmlValidation.safePath)

      if (!fileValidation.isValid) {
        emailLogger.warn('Archivo XML no válido', {
          error: fileValidation.error,
          size: fileValidation.size,
        })
        throw new Error(fileValidation.error || 'Archivo no válido')
      }

      // FIX: Usar path validado
      const xmlBuffer = await readFile(xmlValidation.safePath)

      attachments.push({
        filename: `Factura-${params.numeroFactura}.xml`,
        content: xmlBuffer,
        contentType: 'application/xml',
      })

      emailLogger.info('XML adjuntado correctamente', {
        size: fileValidation.size,
        filename: `Factura-${params.numeroFactura}.xml`,
      })
    } catch (error) {
      emailLogger.error('Error al leer XML', error as Error, {
        xmlUrl: params.xmlUrl,
      })
      // No fallar por esto, continuar sin XML
    }
  }

  return attachments
}

// ==============================================
// ENVIAR CON RESEND (RECOMENDADO)
// ==============================================

async function sendWithResend(
  params: SendFacturaEmailParams,
  attachments: EmailAttachment[]
): Promise<EmailResult> {
  if (!resend) {
    throw new Error('Resend no está configurado')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Facturas <facturas@tuempresa.com>',
      to: [params.destinatario],
      cc: params.cc,
      subject: params.asunto,
      text: params.mensaje,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    if (error) {
      emailLogger.error('Error de Resend', new Error(error.message), {
        destinatario: params.destinatario,
      })
      throw new Error(error.message)
    }

    emailLogger.info('Email enviado con Resend exitosamente', {
      messageId: data?.id,
      destinatario: params.destinatario,
    })

    return {
      exitoso: true,
      messageId: data?.id,
      fecha: new Date(),
    }
  } catch (error) {
    emailLogger.error('Error con Resend', error as Error)
    throw error
  }
}

// ==============================================
// ENVIAR CON NODEMAILER (FALLBACK)
// ==============================================

async function sendWithNodeMailer(
  params: SendFacturaEmailParams,
  attachments: EmailAttachment[]
): Promise<EmailResult> {
  try {
    // Verificar que NodeMailer esté configurado
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        'NodeMailer no está configurado. Define SMTP_USER y SMTP_PASS en .env'
      )
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Facturas <facturas@tuempresa.com>',
      to: params.destinatario,
      cc: params.cc?.join(', '),
      subject: params.asunto,
      text: params.mensaje,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })

    emailLogger.info('Email enviado con NodeMailer', {
      messageId: info.messageId,
      destinatario: params.destinatario,
    })

    return {
      exitoso: true,
      messageId: info.messageId,
      fecha: new Date(),
    }
  } catch (error) {
    emailLogger.error('Error con NodeMailer', error as Error)
    throw error
  }
}

// ==============================================
// ENVIAR NOTIFICACIÓN DE FACTURA ANULADA
// ==============================================

export async function sendFacturaAnuladaNotification(params: {
  facturaId: string
  numeroFactura: string
  clienteNombre: string
  clienteEmail: string
  motivo: string
  total: number
  pdfUrl?: string | null
}): Promise<EmailResult> {
  const asunto = `⚠️ Factura ${params.numeroFactura} - ANULADA`

  const mensaje = `Estimado/a ${params.clienteNombre},

Le informamos que la factura ${params.numeroFactura} por un valor de ${formatCurrency(params.total)} ha sido ANULADA.

MOTIVO DE ANULACIÓN:
${params.motivo}

Esta anulación ha sido registrada ante la DIAN y el documento no tiene validez fiscal.

Si tiene alguna pregunta o requiere aclaración adicional, por favor no dude en contactarnos.

Agradecemos su comprensión.

Cordialmente,
Equipo de Facturación

━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Este es un correo automático. Por favor no responda a este mensaje.`

  return sendFacturaEmail({
    facturaId: params.facturaId,
    numeroFactura: params.numeroFactura,
    clienteNombre: params.clienteNombre,
    clienteEmail: params.clienteEmail,
    destinatario: params.clienteEmail,
    asunto,
    mensaje,
    adjuntarPdf: false,
    adjuntarXml: false,
  })
}

// ==============================================
// ENVIAR RECORDATORIO DE PAGO
// ==============================================

export async function sendRecordatorioPago(params: {
  facturaId: string
  numeroFactura: string
  clienteNombre: string
  clienteEmail: string
  total: number
  fechaVencimiento: Date
  diasVencimiento: number
  pdfUrl?: string | null
  xmlUrl?: string | null
}): Promise<EmailResult> {
  const vencido = params.diasVencimiento < 0
  const asunto = vencido
    ? `⏰ URGENTE: Factura ${params.numeroFactura} - VENCIDA`
    : `🔔 Recordatorio: Factura ${params.numeroFactura} - Vence en ${params.diasVencimiento} días`

  const mensaje = vencido
    ? `Estimado/a ${params.clienteNombre},

Le recordamos que la factura ${params.numeroFactura} por un valor de ${formatCurrency(params.total)} VENCIÓ hace ${Math.abs(params.diasVencimiento)} días.

DETALLES DE LA FACTURA:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número: ${params.numeroFactura}
• Valor: ${formatCurrency(params.total)}
• Fecha de vencimiento: ${formatDate(params.fechaVencimiento)}
• Estado: VENCIDA

Por favor, regularice este pago a la brevedad posible para evitar inconvenientes.

Si ya realizó el pago, por favor ignore este mensaje y envíenos el comprobante.

Quedamos atentos.

Cordialmente,
Equipo de Facturación`
    : `Estimado/a ${params.clienteNombre},

Le recordamos que la factura ${params.numeroFactura} por un valor de ${formatCurrency(params.total)} vence en ${params.diasVencimiento} días.

DETALLES DE LA FACTURA:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número: ${params.numeroFactura}
• Valor: ${formatCurrency(params.total)}
• Fecha de vencimiento: ${formatDate(params.fechaVencimiento)}

Por favor, realice el pago antes de la fecha límite para evitar inconvenientes.

Si ya realizó el pago, por favor ignore este mensaje.

Gracias por su atención.

Cordialmente,
Equipo de Facturación`

  return sendFacturaEmail({
    facturaId: params.facturaId,
    numeroFactura: params.numeroFactura,
    clienteNombre: params.clienteNombre,
    clienteEmail: params.clienteEmail,
    destinatario: params.clienteEmail,
    asunto,
    mensaje,
    adjuntarPdf: !!params.pdfUrl,
    adjuntarXml: !!params.xmlUrl,
    pdfUrl: params.pdfUrl,
    xmlUrl: params.xmlUrl,
  })
}

// ==============================================
// VERIFICAR CONFIGURACIÓN
// ==============================================

export function verificarConfiguracionEmail(): {
  configurado: boolean
  servicio: 'resend' | 'nodemailer' | 'ninguno'
  errores: string[]
} {
  const errores: string[] = []

  if (process.env.RESEND_API_KEY) {
    return {
      configurado: true,
      servicio: 'resend',
      errores: [],
    }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (!process.env.SMTP_HOST) {
      errores.push('SMTP_HOST no está definido')
    }
    if (!process.env.SMTP_PORT) {
      errores.push('SMTP_PORT no está definido')
    }

    return {
      configurado: errores.length === 0,
      servicio: 'nodemailer',
      errores,
    }
  }

  errores.push(
    'No hay configuración de email. Define RESEND_API_KEY o SMTP_USER/SMTP_PASS'
  )

  return {
    configurado: false,
    servicio: 'ninguno',
    errores,
  }
}
