/**
 * ULE - GENERADOR DE CÓDIGO QR
 * Genera códigos QR con información de la factura según estándar DIAN
 */

import QRCode from 'qrcode'

export interface QRData {
  cufe: string
  numeroFactura: string
  fecha: Date
  nit: string
  total: number
}

/**
 * Genera código QR con información de la factura
 * Formato según especificación DIAN
 *
 * El QR debe contener:
 * - Número de factura
 * - Fecha de emisión
 * - NIT del emisor
 * - Valor total
 * - CUFE
 * - URL de validación DIAN
 */
export async function generateQRCode(data: QRData): Promise<string> {
  // Construir URL de validación DIAN (mock)
  // En producción, esta URL es la oficial de la DIAN:
  // https://catalogo-vpfe.dian.gov.co/document/searchqr?documentKey={CUFE}
  const validationUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentKey=${data.cufe}`

  // Información adicional en el QR según estándar DIAN
  // Formato: Campo: Valor (uno por línea)
  const qrContent = [
    `NumFac: ${data.numeroFactura}`,
    `FecFac: ${data.fecha.toISOString().split('T')[0]}`,
    `NitFac: ${data.nit}`,
    `DocAdq: CLIENTE`, // Simplificado en mock
    `ValFac: ${data.total.toFixed(2)}`,
    `ValIva: ${(data.total * 0.19).toFixed(2)}`, // Mock: asume IVA 19%
    `ValOtroIm: 0.00`,
    `ValTotal: ${data.total.toFixed(2)}`,
    `CUFE: ${data.cufe}`,
    `QRCode: ${validationUrl}`,
  ].join('\n')

  try {
    // Generar QR como data URL (base64) para visualización en web
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'H', // Alto nivel de corrección de errores
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000', // Color del QR
        light: '#FFFFFF', // Color de fondo
      },
    })

    return qrDataUrl
  } catch (error) {
    console.error('Error generando QR:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Genera QR como buffer (para insertar en PDF)
 */
export async function generateQRBuffer(data: QRData): Promise<Buffer> {
  const validationUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentKey=${data.cufe}`

  const qrContent = [
    `NumFac: ${data.numeroFactura}`,
    `FecFac: ${data.fecha.toISOString().split('T')[0]}`,
    `NitFac: ${data.nit}`,
    `DocAdq: CLIENTE`,
    `ValFac: ${data.total.toFixed(2)}`,
    `ValIva: ${(data.total * 0.19).toFixed(2)}`,
    `ValOtroIm: 0.00`,
    `ValTotal: ${data.total.toFixed(2)}`,
    `CUFE: ${data.cufe}`,
    `QRCode: ${validationUrl}`,
  ].join('\n')

  try {
    const buffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return buffer
  } catch (error) {
    console.error('Error generando QR buffer:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Genera QR como SVG (alternativa vectorial)
 */
export async function generateQRSVG(data: QRData): Promise<string> {
  const validationUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentKey=${data.cufe}`

  const qrContent = [
    `NumFac: ${data.numeroFactura}`,
    `FecFac: ${data.fecha.toISOString().split('T')[0]}`,
    `NitFac: ${data.nit}`,
    `ValTotal: ${data.total.toFixed(2)}`,
    `CUFE: ${data.cufe}`,
    `URL: ${validationUrl}`,
  ].join('\n')

  try {
    const svg = await QRCode.toString(qrContent, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    })

    return svg
  } catch (error) {
    console.error('Error generando QR SVG:', error)
    throw new Error('No se pudo generar el código QR SVG')
  }
}

/**
 * Valida que un QR sea válido y legible
 */
export function validateQRContent(content: string): boolean {
  // Validar que contenga los campos mínimos requeridos
  const requiredFields = ['NumFac:', 'CUFE:', 'ValTotal:']
  return requiredFields.every((field) => content.includes(field))
}
