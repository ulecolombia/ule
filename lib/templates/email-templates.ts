/**
 * ULE - TEMPLATES DE EMAIL PARA FACTURAS
 * Templates predefinidos para diferentes tipos de comunicación
 * MEJORADO: Usa utilidades centralizadas de formato
 */

import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Decimal } from '@prisma/client/runtime/library'

// ==============================================
// TIPOS
// ==============================================

// FIX: Soportar tipos Decimal de Prisma además de number
export interface FacturaTemplateData {
  numeroFactura: string
  clienteNombre: string
  fecha: Date | string
  fechaVencimiento?: Date | string | null
  total: number | Decimal
  subtotal?: number | Decimal
  iva?: number | Decimal
  cufe?: string | null
  terminosPago?: string | null
  notas?: string | null
}

// ==============================================
// TEMPLATE: FORMAL (EMPRESARIAL)
// ==============================================

export function templateFormal(
  factura: FacturaTemplateData,
  nombreEmpresa: string = 'Su Empresa'
): string {
  return `Estimado/a ${factura.clienteNombre},

Por medio de la presente, nos permitimos hacer entrega de la factura electrónica de venta correspondiente a los productos/servicios suministrados.

INFORMACIÓN DE LA FACTURA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de factura: ${factura.numeroFactura}
• Fecha de emisión: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Fecha de vencimiento: ${formatDate(factura.fechaVencimiento)}` : ''}
${factura.subtotal ? `• Subtotal: ${formatCurrency(Number(factura.subtotal))}` : ''}
${factura.iva ? `• IVA: ${formatCurrency(Number(factura.iva))}` : ''}
• Valor total: ${formatCurrency(Number(factura.total))}
${factura.cufe ? `• CUFE: ${factura.cufe}` : ''}

${factura.terminosPago ? `TÉRMINOS DE PAGO:\n${factura.terminosPago}\n\n` : ''}Esta factura electrónica tiene plena validez jurídica según el Decreto 2242 de 2015 y la Resolución DIAN 000042 de 2020.

Para verificar la autenticidad de este documento, puede ingresar a:
🔗 https://catalogo-vpfe.dian.gov.co/document/searchqr

Los archivos adjuntos (PDF y XML) constituyen el soporte legal de esta transacción y deben ser conservados para efectos tributarios.

${factura.notas ? `NOTAS ADICIONALES:\n${factura.notas}\n\n` : ''}Quedamos atentos a cualquier inquietud o aclaración que requiera.

Cordialmente,
${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Este es un correo automático. Por favor no responda a este mensaje.`
}

// ==============================================
// TEMPLATE: AMIGABLE (CASUAL)
// ==============================================

export function templateAmigable(
  factura: FacturaTemplateData,
  nombreEmpresa: string = 'Su Empresa'
): string {
  return `¡Hola ${factura.clienteNombre}! 👋

¡Gracias por confiar en nosotros! Te enviamos la factura de tu última compra/servicio.

📋 Detalles de tu factura:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Factura: ${factura.numeroFactura}
• Fecha: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Vencimiento: ${formatDate(factura.fechaVencimiento)}` : ''}
• Total: ${formatCurrency(Number(factura.total))}
${factura.terminosPago ? `• Términos de pago: ${factura.terminosPago}` : ''}

${factura.notas ? `📝 Nota: ${factura.notas}\n\n` : ''}Los archivos PDF y XML adjuntos son válidos ante la DIAN y puedes guardarlos para tus registros contables. ✅

Puedes verificar tu factura en cualquier momento en:
🔗 https://catalogo-vpfe.dian.gov.co/document/searchqr

¿Tienes alguna duda? ¡Escríbenos! Estamos aquí para ayudarte. 💬

¡Gracias por tu preferencia! 🙏

Un abrazo,
Equipo de ${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Correo automático - No responder`
}

// ==============================================
// TEMPLATE: RECORDATORIO DE PAGO
// ==============================================

export function templateRecordatorio(
  factura: FacturaTemplateData,
  diasVencimiento: number,
  nombreEmpresa: string = 'Su Empresa'
): string {
  const vencida = diasVencimiento < 0
  const diasAbsolutos = Math.abs(diasVencimiento)

  if (vencida) {
    return `Estimado/a ${factura.clienteNombre},

Le recordamos cortésmente que la factura ${factura.numeroFactura} se encuentra VENCIDA desde hace ${diasAbsolutos} días.

DETALLES DEL PAGO PENDIENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de factura: ${factura.numeroFactura}
• Fecha de emisión: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Fecha de vencimiento: ${formatDate(factura.fechaVencimiento)}` : ''}
• Valor a pagar: ${formatCurrency(Number(factura.total))}
• Estado: ⚠️ VENCIDA

Por favor, regularice este pago a la brevedad posible para evitar inconvenientes adicionales.

Si ya realizó el pago, por favor ignore este mensaje y envíenos el comprobante de pago para actualizar nuestros registros.

Si tiene alguna dificultad para realizar el pago, por favor contáctenos para buscar una solución.

Quedamos atentos a su pronta respuesta.

Cordialmente,
${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Correo automático - No responder`
  }

  return `Estimado/a ${factura.clienteNombre},

Le recordamos que la factura ${factura.numeroFactura} vence en ${diasVencimiento} días.

DETALLES DEL PAGO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de factura: ${factura.numeroFactura}
• Fecha de emisión: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Fecha límite de pago: ${formatDate(factura.fechaVencimiento)}` : ''}
• Valor a pagar: ${formatCurrency(Number(factura.total))}
• Días restantes: ${diasVencimiento}

${factura.terminosPago ? `Términos de pago: ${factura.terminosPago}\n\n` : ''}Por favor, realice el pago antes de la fecha límite para evitar inconvenientes.

Si ya realizó el pago, por favor ignore este mensaje.

Gracias por su atención.

Cordialmente,
${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Correo automático - No responder`
}

// ==============================================
// TEMPLATE: ANULACIÓN DE FACTURA
// ==============================================

export function templateAnulacion(
  factura: FacturaTemplateData,
  motivo: string,
  nombreEmpresa: string = 'Su Empresa'
): string {
  return `Estimado/a ${factura.clienteNombre},

Le informamos que la factura ${factura.numeroFactura} ha sido ANULADA en nuestro sistema y ante la DIAN.

DETALLES DE LA FACTURA ANULADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de factura: ${factura.numeroFactura}
• Fecha de emisión: ${formatDate(factura.fecha)}
• Valor original: ${formatCurrency(Number(factura.total))}
• Estado: ❌ ANULADA
${factura.cufe ? `• CUFE: ${factura.cufe}` : ''}

MOTIVO DE ANULACIÓN:
${motivo}

Esta anulación ha sido registrada ante la DIAN y el documento no tiene validez fiscal. Por favor, NO realice ningún pago relacionado con esta factura.

${factura.notas ? `Nota adicional: ${factura.notas}\n\n` : ''}Si se emitió una nueva factura correcta, la recibirá en un correo separado.

Si tiene alguna pregunta o requiere aclaración adicional, por favor no dude en contactarnos.

Agradecemos su comprensión.

Cordialmente,
${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Este es un correo automático. Por favor no responda a este mensaje.`
}

// ==============================================
// TEMPLATE: BIENVENIDA (PRIMERA FACTURA)
// ==============================================

export function templatePrimeraFactura(
  factura: FacturaTemplateData,
  nombreEmpresa: string = 'Su Empresa'
): string {
  return `¡Bienvenido/a ${factura.clienteNombre}! 🎉

¡Es un placer tenerte como cliente! Esta es tu primera factura electrónica con nosotros.

📋 Detalles de tu factura:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Factura: ${factura.numeroFactura}
• Fecha: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Vencimiento: ${formatDate(factura.fechaVencimiento)}` : ''}
• Total: ${formatCurrency(Number(factura.total))}

📌 Información importante sobre facturas electrónicas:

✅ **Validez legal**: Esta factura es completamente válida ante la DIAN
✅ **Archivos adjuntos**: Encontrarás el PDF (visual) y XML (datos estructurados)
✅ **Verificación**: Puedes verificar su autenticidad en https://catalogo-vpfe.dian.gov.co
✅ **Conservación**: Guarda estos archivos para tu contabilidad

${factura.terminosPago ? `💳 **Términos de pago**: ${factura.terminosPago}\n\n` : ''}${factura.notas ? `📝 **Nota**: ${factura.notas}\n\n` : ''}¿Tienes preguntas? Estamos aquí para ayudarte en todo momento.

¡Gracias por confiar en nosotros! 🙏

Saludos cordiales,
Equipo de ${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Correo automático - No responder`
}

// ==============================================
// TEMPLATE: PERSONALIZADO (BASE)
// ==============================================

export function templatePersonalizado(
  factura: FacturaTemplateData,
  nombreEmpresa: string = 'Su Empresa'
): string {
  return `Estimado/a ${factura.clienteNombre},

Adjunto encontrarás la factura electrónica correspondiente a los servicios/productos suministrados.

📄 Detalles de la factura:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de factura: ${factura.numeroFactura}
• Fecha de emisión: ${formatDate(factura.fecha)}
${factura.fechaVencimiento ? `• Fecha de vencimiento: ${formatDate(factura.fechaVencimiento)}` : ''}
• Total: ${formatCurrency(Number(factura.total))}
${factura.cufe ? `• CUFE: ${factura.cufe.slice(0, 20)}...` : ''}

${factura.terminosPago ? `Términos de pago: ${factura.terminosPago}\n\n` : ''}${factura.notas ? `Notas: ${factura.notas}\n\n` : ''}Esta factura es válida como documento electrónico según la normativa DIAN. Puedes consultar su autenticidad ingresando el CUFE en:
🔗 https://catalogo-vpfe.dian.gov.co/document/searchqr

Si tienes alguna pregunta o necesitas aclaración sobre esta factura, no dudes en contactarnos.

Gracias por tu confianza.

Saludos cordiales,
${nombreEmpresa}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Este es un correo automático. Por favor no respondas a este mensaje.`
}

// ==============================================
// EXPORTAR TODOS LOS TEMPLATES
// ==============================================

export const emailTemplates = {
  formal: templateFormal,
  amigable: templateAmigable,
  recordatorio: templateRecordatorio,
  anulacion: templateAnulacion,
  primeraFactura: templatePrimeraFactura,
  personalizado: templatePersonalizado,
}

export type TemplateType = keyof typeof emailTemplates
