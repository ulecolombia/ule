/**
 * ULE - GENERADOR DE PDF OFICIAL DIAN
 * Genera PDFs de facturas con formato oficial según normativa colombiana
 */

import PDFDocument from 'pdfkit'
import { FacturaCompleta, ConceptosFactura } from '@/lib/types/facturacion'
import { generateQRBuffer } from './qr-generator'
import { formatCurrency, formatDate } from './helpers'

/**
 * Genera PDF de factura con formato oficial DIAN
 *
 * El PDF incluye:
 * - Logo y datos del emisor
 * - Número de factura y fecha
 * - Datos del cliente
 * - Tabla de items/conceptos
 * - Totales (subtotal, IVA, total)
 * - Notas y términos
 * - CUFE y código QR
 * - Información de validación DIAN
 */
export async function generateFacturaPDF(
  factura: FacturaCompleta & { cufe?: string; qrCode?: string }
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Crear documento PDF tamaño carta
      const doc = new PDFDocument({
        size: 'LETTER', // 8.5" x 11"
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Factura ${factura.numeroFactura}`,
          Author: 'ULE - Sistema de Facturación Electrónica',
          Subject: `Factura Electrónica No. ${factura.numeroFactura}`,
          Keywords: 'factura, DIAN, Colombia, electrónica',
        },
      })

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })

      // ==============================================
      // HEADER - Logo y datos del emisor
      // ==============================================

      // Logo placeholder (en producción, usar logo real)
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#14B8A6')
        .text('ULE', 50, 50)

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text('Sistema de Facturación Electrónica', 50, 78)

      // Datos del emisor
      doc.fontSize(9).font('Helvetica')
      doc.text('NIT: 900.123.456-7', 50, 95)
      doc.text('Régimen Simple de Tributación', 50, 108)
      doc.text('Responsabilidad Fiscal: O-47', 50, 121)
      doc.text('Calle 123 #45-67, Bogotá D.C., Colombia', 50, 134)
      doc.text('Tel: (601) 123-4567', 50, 147)
      doc.text('contacto@ule.com | www.ule.com', 50, 160)

      // ==============================================
      // TÍTULO FACTURA Y DATOS PRINCIPALES
      // ==============================================

      // Rectángulo de color para el título
      doc.rect(350, 50, 215, 30).fillAndStroke('#14B8A6', '#14B8A6')

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .text('FACTURA ELECTRÓNICA', 350, 58, { width: 215, align: 'center' })

      doc.fillColor('#000000')

      // Número de factura en grande
      doc.fontSize(12).font('Helvetica-Bold')
      doc.text(`No. ${factura.numeroFactura}`, 350, 90, {
        width: 215,
        align: 'right',
      })

      // Datos de la factura
      doc.fontSize(9).font('Helvetica')
      doc.text(`Fecha de Emisión: ${formatDate(factura.fecha)}`, 350, 108, {
        width: 215,
        align: 'right',
      })

      if (factura.fechaVencimiento) {
        doc.text(
          `Fecha de Vencimiento: ${formatDate(factura.fechaVencimiento)}`,
          350,
          121,
          { width: 215, align: 'right' }
        )
      }

      if (factura.metodoPago) {
        const metodosPago: Record<string, string> = {
          EFECTIVO: 'Efectivo',
          TRANSFERENCIA: 'Transferencia',
          CHEQUE: 'Cheque',
          TARJETA_CREDITO: 'Tarjeta de Crédito',
          TARJETA_DEBITO: 'Tarjeta de Débito',
        }
        doc.text(
          `Método de Pago: ${metodosPago[factura.metodoPago] || factura.metodoPago}`,
          350,
          factura.fechaVencimiento ? 134 : 121,
          { width: 215, align: 'right' }
        )
      }

      // ==============================================
      // DATOS DEL CLIENTE
      // ==============================================

      doc.fontSize(11).font('Helvetica-Bold')
      doc.fillColor('#14B8A6')
      doc.text('CLIENTE', 50, 190)

      // Línea decorativa
      doc.strokeColor('#14B8A6').lineWidth(2)
      doc.moveTo(50, 205).lineTo(150, 205).stroke()

      doc.fillColor('#000000')
      doc.fontSize(9).font('Helvetica')

      const cliente = factura.cliente
      let clienteY = 215

      doc
        .font('Helvetica-Bold')
        .text('Nombre:', 50, clienteY, { continued: true })
      doc.font('Helvetica').text(` ${cliente.nombre}`, { continued: false })

      clienteY += 13
      doc
        .font('Helvetica-Bold')
        .text('Documento:', 50, clienteY, { continued: true })
      doc
        .font('Helvetica')
        .text(` ${cliente.tipoDocumento} ${cliente.numeroDocumento}`, {
          continued: false,
        })

      if (cliente.email) {
        clienteY += 13
        doc
          .font('Helvetica-Bold')
          .text('Email:', 50, clienteY, { continued: true })
        doc.font('Helvetica').text(` ${cliente.email}`, { continued: false })
      }

      if (cliente.telefono) {
        clienteY += 13
        doc
          .font('Helvetica-Bold')
          .text('Teléfono:', 50, clienteY, { continued: true })
        doc.font('Helvetica').text(` ${cliente.telefono}`, { continued: false })
      }

      if (cliente.direccion) {
        clienteY += 13
        doc
          .font('Helvetica-Bold')
          .text('Dirección:', 50, clienteY, { continued: true })
        doc
          .font('Helvetica')
          .text(` ${cliente.direccion}`, { continued: false })
      }

      if (cliente.ciudad) {
        clienteY += 13
        doc
          .font('Helvetica-Bold')
          .text('Ciudad:', 50, clienteY, { continued: true })
        doc
          .font('Helvetica')
          .text(
            ` ${cliente.ciudad}${cliente.departamento ? `, ${cliente.departamento}` : ''}`,
            { continued: false }
          )
      }

      // ==============================================
      // TABLA DE ITEMS
      // ==============================================

      const tableTop = clienteY + 30
      const itemHeight = 20

      // Header de tabla
      doc.rect(50, tableTop, 512, 22).fillAndStroke('#14B8A6', '#14B8A6')

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
      doc.text('#', 55, tableTop + 6, { width: 20 })
      doc.text('Descripción', 80, tableTop + 6, { width: 200 })
      doc.text('Cant.', 290, tableTop + 6, { width: 45, align: 'center' })
      doc.text('V. Unitario', 345, tableTop + 6, { width: 70, align: 'right' })
      doc.text('IVA', 425, tableTop + 6, { width: 35, align: 'center' })
      doc.text('Total', 470, tableTop + 6, { width: 85, align: 'right' })

      // Items
      doc.fillColor('#000000').font('Helvetica')
      const items = (factura.conceptos as unknown as ConceptosFactura) || []

      items.forEach((item, index) => {
        const y = tableTop + 22 + index * itemHeight

        // Alternar color de fondo
        if (index % 2 === 0) {
          doc.rect(50, y, 512, itemHeight).fillAndStroke('#F8FAFC', '#E2E8F0')
        } else {
          doc.rect(50, y, 512, itemHeight).stroke('#E2E8F0')
        }

        doc.fillColor('#000000')

        // Número
        doc.fontSize(9).text((index + 1).toString(), 55, y + 5, { width: 20 })

        // Descripción (truncar si es muy larga)
        const descripcionTruncada =
          item.descripcion.length > 50
            ? item.descripcion.substring(0, 47) + '...'
            : item.descripcion
        doc.text(descripcionTruncada, 80, y + 5, { width: 200, ellipsis: true })

        // Cantidad
        doc.text(item.cantidad.toString(), 290, y + 5, {
          width: 45,
          align: 'center',
        })

        // Valor Unitario
        doc.text(formatCurrency(item.valorUnitario), 345, y + 5, {
          width: 70,
          align: 'right',
        })

        // IVA
        doc.text(`${item.iva}%`, 425, y + 5, { width: 35, align: 'center' })

        // Total
        const totalItem =
          item.cantidad * item.valorUnitario * (1 + item.iva / 100)
        doc.text(formatCurrency(totalItem), 470, y + 5, {
          width: 85,
          align: 'right',
        })
      })

      // ==============================================
      // TOTALES
      // ==============================================

      const totalesY = tableTop + 27 + items.length * itemHeight

      // Cuadro de totales
      doc.rect(380, totalesY, 182, 90).stroke('#E2E8F0')

      doc.fontSize(9).font('Helvetica')

      // Subtotal
      doc.text('Subtotal:', 390, totalesY + 10, { width: 90, align: 'right' })
      doc
        .font('Helvetica-Bold')
        .text(formatCurrency(Number(factura.subtotal)), 480, totalesY + 10, {
          width: 75,
          align: 'right',
        })

      // Descuentos (si aplica)
      if (Number(factura.totalDescuentos) > 0) {
        doc.font('Helvetica')
        doc.text('Descuentos:', 390, totalesY + 25, {
          width: 90,
          align: 'right',
        })
        doc
          .font('Helvetica-Bold')
          .text(
            `-${formatCurrency(Number(factura.totalDescuentos))}`,
            480,
            totalesY + 25,
            { width: 75, align: 'right' }
          )
      }

      // IVA
      doc.font('Helvetica')
      doc.text('IVA:', 390, totalesY + 40, { width: 90, align: 'right' })
      doc
        .font('Helvetica-Bold')
        .text(formatCurrency(Number(factura.totalIva)), 480, totalesY + 40, {
          width: 75,
          align: 'right',
        })

      // Total
      doc.rect(380, totalesY + 60, 182, 25).fillAndStroke('#14B8A6', '#14B8A6')
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF')
      doc.text('TOTAL:', 390, totalesY + 67, { width: 90, align: 'right' })
      doc
        .fontSize(13)
        .text(formatCurrency(Number(factura.total)), 480, totalesY + 66, {
          width: 75,
          align: 'right',
        })

      doc.fillColor('#000000')

      // ==============================================
      // NOTAS Y TÉRMINOS
      // ==============================================

      let notasY = totalesY + 100

      if (factura.notas) {
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('Notas:', 50, notasY)
        doc.fontSize(9).font('Helvetica')
        doc.text(factura.notas, 50, notasY + 15, { width: 320, lineGap: 2 })
        notasY += 50
      }

      if (factura.terminosPago) {
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text('Términos y Condiciones:', 50, notasY)
        doc.fontSize(9).font('Helvetica')
        doc.text(factura.terminosPago, 50, notasY + 15, {
          width: 320,
          lineGap: 2,
        })
      }

      // ==============================================
      // CUFE Y QR EN LA PARTE INFERIOR
      // ==============================================

      if (factura.cufe) {
        const footerY = 650

        // Código QR
        try {
          const qrBuffer = await generateQRBuffer({
            cufe: factura.cufe,
            numeroFactura: factura.numeroFactura,
            fecha: factura.fecha,
            nit: '900123456',
            total: Number(factura.total),
          })

          doc.image(qrBuffer, 50, footerY, { width: 100, height: 100 })
        } catch (error) {
          console.error('Error al generar QR para PDF:', error)
        }

        // CUFE
        doc.fontSize(7).font('Helvetica-Bold')
        doc.text('CUFE (Código Único de Factura Electrónica):', 170, footerY)
        doc.fontSize(6).font('Helvetica')
        doc.text(factura.cufe, 170, footerY + 10, { width: 390, lineGap: 1 })

        // Información adicional
        doc.fontSize(7).font('Helvetica')
        doc.text(
          'Factura Electrónica de Venta validada por la DIAN',
          170,
          footerY + 45
        )
        doc.text(
          'Consulte la validez de esta factura en: https://catalogo-vpfe.dian.gov.co',
          170,
          footerY + 57
        )
        doc.text(
          `Generada: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`,
          170,
          footerY + 69
        )
        doc.text(
          'Resolución de Facturación DIAN No. 18760000001 del 01/01/2024',
          170,
          footerY + 81
        )
      } else {
        // Si no hay CUFE (es un borrador)
        const footerY = 700
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#FF6B6B')
        doc.text(
          'DOCUMENTO BORRADOR - NO VÁLIDO PARA EFECTOS FISCALES',
          50,
          footerY,
          {
            width: 512,
            align: 'center',
          }
        )
        doc.fillColor('#000000')
      }

      // Finalizar documento
      doc.end()
    } catch (error) {
      console.error('Error al generar PDF:', error)
      reject(error)
    }
  })
}

/**
 * Genera XML simplificado (mock)
 * En producción, debe generar XML UBL 2.1 completo según DIAN
 */
export function generateFacturaXML(
  factura: FacturaCompleta & { cufe?: string }
): string {
  const items = (factura.conceptos as unknown as ConceptosFactura) || []

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:ID>${factura.numeroFactura}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${factura.cufe || 'PENDING'}</cbc:UUID>
  <cbc:IssueDate>${factura.fecha.toISOString().split('T')[0]!}</cbc:IssueDate>
  <cbc:IssueTime>${factura.fecha.toISOString().split('T')[1]!.split('.')[0]!}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeName="31">900123456</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>ULE</cbc:Name>
      </cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:TaxLevelCode>O-47</cbc:TaxLevelCode>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeName="${factura.cliente.tipoDocumento === 'NIT' ? '31' : '13'}">${factura.cliente.numeroDocumento}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${factura.cliente.nombre}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${factura.totalIva}</cbc:TaxAmount>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${factura.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${factura.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${factura.total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

${items
  .map(
    (item, index) => `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity>${item.cantidad}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${item.cantidad * item.valorUnitario}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.descripcion}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="COP">${item.valorUnitario}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
`
  )
  .join('\n')}
</Invoice>`
}
