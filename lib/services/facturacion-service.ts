/**
 * ULE - SERVICIO MOCK DE FACTURACIÓN ELECTRÓNICA
 * Simula integración con proveedores (Siigo/Facture/DIAN)
 *
 * IMPORTANTE: Este es un servicio MOCK para desarrollo
 * En producción, se reemplazará con APIs reales de:
 * - Siigo (https://api.siigo.com)
 * - Facture (https://www.facture.com)
 * - Carvajal (https://www.carvajaltecnologia.com)
 * - Directamente DIAN (más complejo)
 */

import { EstadoFactura } from '@prisma/client'
import { generateCUFE } from '@/lib/utils/cufe-generator'
import { generateQRCode } from '@/lib/utils/qr-generator'
import { delay, randomInRange } from '@/lib/utils/helpers'

export interface EmitirFacturaResponse {
  success: boolean
  cufe: string
  cude?: string
  qrCode: string
  pdfUrl: string
  xmlUrl: string
  fechaEmision: Date
  mensaje: string
}

export interface ConsultarEstadoResponse {
  estado: EstadoFactura
  cufe: string
  fechaEmision?: Date
  fechaValidacionDian?: Date
  mensajeDian?: string
}

export interface AnularFacturaResponse {
  success: boolean
  fechaAnulacion: Date
  mensaje: string
}

/**
 * MOCK - Simula emisión de factura ante DIAN
 * En producción, esta función hará request a API de Siigo/Facture
 *
 * Flujo real de emisión:
 * 1. Enviar factura a proveedor (Siigo/Facture)
 * 2. Proveedor valida y genera CUFE
 * 3. Proveedor envía a DIAN
 * 4. DIAN valida y retorna estado
 * 5. Proveedor genera PDF y XML oficiales
 * 6. Retornar URLs de descarga
 */
export async function emitirFactura(facturaData: {
  id: string
  numeroFactura: string
  fecha: Date
  clienteNombre: string
  clienteDocumento: string
  total: number
  userId: string
}): Promise<EmitirFacturaResponse> {
  // Simular tiempo de procesamiento real (1-3 segundos)
  // En producción, esto depende del tiempo de respuesta del proveedor
  const processingTime = randomInRange(1000, 3000)
  await delay(processingTime)

  // Validaciones previas (simulando validaciones del proveedor)
  if (!facturaData.numeroFactura) {
    throw new Error('Número de factura requerido')
  }

  if (!facturaData.clienteNombre || facturaData.clienteNombre.trim().length === 0) {
    throw new Error('Nombre del cliente requerido')
  }

  if (!facturaData.clienteDocumento || facturaData.clienteDocumento.trim().length === 0) {
    throw new Error('Documento del cliente requerido')
  }

  if (facturaData.total <= 0) {
    throw new Error('El total de la factura debe ser mayor a cero')
  }

  if (facturaData.total > 999999999) {
    throw new Error('El total de la factura excede el límite permitido')
  }

  // Calcular valores para CUFE (mock simplificado)
  const baseImponible = facturaData.total / 1.19 // Asumiendo IVA 19%
  const impuesto = facturaData.total - baseImponible

  // Generar CUFE realista (algoritmo simplificado)
  // En producción, el CUFE lo genera el proveedor
  const cufe = generateCUFE({
    numeroFactura: facturaData.numeroFactura,
    fecha: facturaData.fecha,
    nit: '900123456', // NIT del emisor (mock)
    tipoDocumento: '31', // Código DIAN para NIT
    total: facturaData.total,
    baseImponible,
    impuesto,
    totalConImpuestos: facturaData.total,
  })

  // Generar código QR con información del CUFE
  // En producción, el QR lo genera el proveedor
  const qrCode = await generateQRCode({
    cufe,
    numeroFactura: facturaData.numeroFactura,
    fecha: facturaData.fecha,
    nit: '900123456',
    total: facturaData.total,
  })

  // Generar URLs mock para PDF y XML
  // En producción, el proveedor retorna URLs reales de descarga
  const pdfUrl = `/api/facturacion/pdf/${facturaData.id}`
  const xmlUrl = `/api/facturacion/xml/${facturaData.id}`

  // Simular posible error de DIAN (5% de probabilidad para testing)
  // Esto ayuda a probar el manejo de errores
  if (Math.random() < 0.05) {
    const errores = [
      'Error en validación DIAN: Datos de cliente incompletos',
      'Error en validación DIAN: NIT del emisor inválido',
      'Error en validación DIAN: Total de la factura no coincide con items',
      'Error de conectividad con DIAN: Intente nuevamente',
      'Error en validación DIAN: Número de factura duplicado',
    ]
    const errorAleatorio = errores[Math.floor(Math.random() * errores.length)]
    throw new Error(errorAleatorio)
  }

  // Simular respuesta exitosa del proveedor
  return {
    success: true,
    cufe,
    qrCode,
    pdfUrl,
    xmlUrl,
    fechaEmision: new Date(),
    mensaje: 'Factura emitida exitosamente ante la DIAN',
  }
}

/**
 * MOCK - Simula consulta de estado de factura en DIAN
 * En producción, consulta el estado en el proveedor o directamente en DIAN
 */
export async function consultarEstadoFactura(
  facturaId: string,
  cufe: string
): Promise<ConsultarEstadoResponse> {
  // Simular tiempo de consulta
  await delay(randomInRange(500, 1500))

  // Mock: siempre retorna estado exitoso
  // En producción, puede retornar:
  // - EMITIDA: Factura validada por DIAN
  // - RECHAZADA: Factura rechazada por DIAN
  // - EN_PROCESO: Factura en validación
  // - ANULADA: Factura anulada
  return {
    estado: 'EMITIDA' as EstadoFactura,
    cufe,
    fechaEmision: new Date(),
    fechaValidacionDian: new Date(),
    mensajeDian: 'Documento validado y autorizado por la DIAN',
  }
}

/**
 * MOCK - Simula anulación de factura ante DIAN
 * En producción, envía solicitud de anulación al proveedor
 *
 * Requisitos para anular:
 * - Factura debe estar EMITIDA
 * - Debe tener CUFE válido
 * - Motivo de anulación (mínimo 10 caracteres)
 * - No debe tener más de X días (varía según normativa)
 */
export async function anularFactura(
  facturaId: string,
  cufe: string,
  motivo: string
): Promise<AnularFacturaResponse> {
  // Simular tiempo de procesamiento
  await delay(randomInRange(1000, 2500))

  // Validaciones
  if (!motivo || motivo.trim().length < 10) {
    throw new Error('El motivo de anulación debe tener al menos 10 caracteres')
  }

  if (!cufe || cufe.length !== 96) {
    throw new Error('CUFE inválido')
  }

  // Simular posible error (2% probabilidad)
  if (Math.random() < 0.02) {
    throw new Error(
      'Error en DIAN: La factura no puede ser anulada después de 5 días de emisión'
    )
  }

  // Mock: siempre exitoso
  return {
    success: true,
    fechaAnulacion: new Date(),
    mensaje: 'Factura anulada exitosamente en DIAN. El cliente será notificado.',
  }
}

/**
 * MOCK - Simula descarga de representación gráfica (PDF)
 * En producción, descarga el PDF del proveedor
 */
export async function descargarPDF(facturaId: string, cufe: string): Promise<string> {
  await delay(randomInRange(500, 1000))

  // En producción, retorna URL firmada de S3/GCS con el PDF
  return `/facturas/pdf/${facturaId}_${cufe.substring(0, 8)}.pdf`
}

/**
 * MOCK - Simula descarga de XML (UBL 2.1)
 * En producción, descarga el XML del proveedor
 */
export async function descargarXML(facturaId: string, cufe: string): Promise<string> {
  await delay(randomInRange(500, 1000))

  // En producción, retorna URL firmada de S3/GCS con el XML
  return `/facturas/xml/${facturaId}_${cufe.substring(0, 8)}.xml`
}

/**
 * MOCK - Simula envío de factura por email
 * En producción, el proveedor se encarga del envío
 */
export async function enviarFacturaPorEmail(
  facturaId: string,
  email: string
): Promise<{ success: boolean; mensaje: string }> {
  await delay(randomInRange(1000, 2000))

  if (!email || !email.includes('@')) {
    throw new Error('Email inválido')
  }

  return {
    success: true,
    mensaje: `Factura enviada exitosamente a ${email}`,
  }
}

/**
 * MOCK - Simula consulta de límite de facturación
 * Algunos proveedores tienen límites según el plan contratado
 */
export async function consultarLimiteFacturacion(userId: string): Promise<{
  limite: number
  usado: number
  disponible: number
  periodo: string
}> {
  await delay(300)

  // Mock: retorna límites ficticios
  return {
    limite: 1000, // 1000 facturas por mes
    usado: 47, // 47 facturas usadas
    disponible: 953,
    periodo: 'mensual',
  }
}
