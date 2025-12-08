/**
 * SERVICIO DE EXPORTACIÓN FACTURACIÓN
 * Genera archivos en múltiples formatos para facturas
 */

import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

interface FiltrosFacturas {
  userId: string
  fechaInicio?: Date
  fechaFin?: Date
  estado?:
    | 'BORRADOR'
    | 'EMITIDA'
    | 'PAGADA'
    | 'VENCIDA'
    | 'ANULADA'
    | 'RECHAZADA'
  clienteId?: string
}

interface ExportResult {
  filePath: string
  fileName: string
  fileUrl: string
}

/**
 * Genera archivo Excel con formato profesional para facturas
 */
export async function exportarFacturasExcel(
  filtros: FiltrosFacturas
): Promise<ExportResult> {
  // Obtener datos de facturas
  const facturas = await prisma.factura.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.fechaInicio && {
        fechaEmision: { gte: filtros.fechaInicio },
      }),
      ...(filtros.fechaFin && { fechaEmision: { lte: filtros.fechaFin } }),
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.clienteId && { clienteId: filtros.clienteId }),
    },
    include: {
      cliente: {
        select: {
          nombre: true,
          numeroDocumento: true,
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  })

  // Crear workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Ule'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Facturas', {
    properties: { tabColor: { argb: '0891B2' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  })

  // Configurar columnas
  worksheet.columns = [
    { header: 'No. Factura', key: 'numero', width: 15 },
    { header: 'Fecha Emisión', key: 'fechaEmision', width: 15 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'NIT/CC Cliente', key: 'documentoCliente', width: 18 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 15 },
    { header: 'IVA', key: 'iva', width: 15 },
    { header: 'Retención', key: 'retencion', width: 15 },
    { header: 'Total', key: 'total', width: 18 },
  ]

  // Estilo del header
  worksheet.getRow(1).font = {
    name: 'Inter',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0891B2' },
  }
  worksheet.getRow(1).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  }
  worksheet.getRow(1).height = 25

  // Agregar datos
  let totalGeneral = 0
  let subtotalGeneral = 0
  let ivaGeneral = 0
  let retencionGeneral = 0

  facturas.forEach((factura) => {
    const subtotal = factura.subtotal.toNumber()
    const iva = factura.totalIva.toNumber()
    const retencion = factura.totalImpuestos?.toNumber() || 0
    const total = factura.total.toNumber()

    subtotalGeneral += subtotal
    ivaGeneral += iva
    retencionGeneral += retencion
    totalGeneral += total

    const row = worksheet.addRow({
      numero: factura.numeroFactura,
      fechaEmision: format(new Date(factura.fecha), 'dd/MM/yyyy', {
        locale: es,
      }),
      fechaVencimiento: factura.fechaVencimiento
        ? format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy', {
            locale: es,
          })
        : '',
      cliente: factura.cliente.nombre,
      documentoCliente: factura.cliente.numeroDocumento,
      estado: factura.estado,
      subtotal,
      iva,
      retencion,
      total,
    })

    // Formato de moneda
    row.getCell('subtotal').numFmt = '"$"#,##0'
    row.getCell('iva').numFmt = '"$"#,##0'
    row.getCell('retencion').numFmt = '"$"#,##0'
    row.getCell('total').numFmt = '"$"#,##0'

    // Color según estado
    const estadoCell = row.getCell('estado')
    if (factura.estado === 'PAGADA') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' },
      }
      estadoCell.font = { color: { argb: '065F46' } }
    } else if (factura.estado === 'VENCIDA') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEE2E2' },
      }
      estadoCell.font = { color: { argb: '991B1B' } }
    } else if (factura.estado === 'ANULADA') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F3F4F6' },
      }
      estadoCell.font = { color: { argb: '6B7280' } }
    } else if (factura.estado === 'EMITIDA') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DBEAFE' },
      }
      estadoCell.font = { color: { argb: '1E40AF' } }
    } else {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEF3C7' },
      }
      estadoCell.font = { color: { argb: '92400E' } }
    }

    // Alineación
    row.alignment = { vertical: 'middle' }
    estadoCell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // Fila de totales
  if (facturas.length > 0) {
    worksheet.addRow({}) // Fila vacía

    const totalRow = worksheet.addRow({
      numero: '',
      fechaEmision: '',
      fechaVencimiento: '',
      cliente: '',
      documentoCliente: '',
      estado: 'TOTALES:',
      subtotal: subtotalGeneral,
      iva: ivaGeneral,
      retencion: retencionGeneral,
      total: totalGeneral,
    })

    totalRow.font = { bold: true, size: 12 }
    totalRow.getCell('estado').alignment = { horizontal: 'right' }
    totalRow.getCell('subtotal').numFmt = '"$"#,##0'
    totalRow.getCell('iva').numFmt = '"$"#,##0'
    totalRow.getCell('retencion').numFmt = '"$"#,##0'
    totalRow.getCell('total').numFmt = '"$"#,##0'
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0891B2' },
    }
    totalRow.font = {
      bold: true,
      size: 12,
      color: { argb: 'FFFFFFFF' },
    }
  }

  // Bordes para todas las celdas
  worksheet.eachRow((row, _rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      }
    })
  })

  // Guardar archivo
  const fileName = `facturas_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
  const exportsDir = path.join(process.cwd(), 'public', 'exports')

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  const filePath = path.join(exportsDir, fileName)
  await workbook.xlsx.writeFile(filePath)

  return {
    filePath,
    fileName,
    fileUrl: `/exports/${fileName}`,
  }
}

/**
 * Genera archivo CSV simple para facturas
 */
export async function exportarFacturasCSV(
  filtros: FiltrosFacturas
): Promise<ExportResult> {
  // Obtener datos
  const facturas = await prisma.factura.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.fechaInicio && {
        fechaEmision: { gte: filtros.fechaInicio },
      }),
      ...(filtros.fechaFin && { fechaEmision: { lte: filtros.fechaFin } }),
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.clienteId && { clienteId: filtros.clienteId }),
    },
    include: {
      cliente: {
        select: {
          nombre: true,
          numeroDocumento: true,
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  })

  // Construir CSV
  const headers = [
    'No. Factura',
    'Fecha Emision',
    'Fecha Vencimiento',
    'Cliente',
    'NIT/CC Cliente',
    'Estado',
    'Subtotal',
    'IVA',
    'Retencion',
    'Total',
  ]

  const rows = facturas.map((factura) => [
    factura.numeroFactura,
    format(new Date(factura.fecha), 'dd/MM/yyyy', { locale: es }),
    factura.fechaVencimiento
      ? format(new Date(factura.fechaVencimiento), 'dd/MM/yyyy', { locale: es })
      : '',
    factura.cliente.nombre,
    factura.cliente.numeroDocumento,
    factura.estado,
    factura.subtotal.toNumber(),
    factura.totalIva.toNumber(),
    factura.totalImpuestos?.toNumber() || 0,
    factura.total.toNumber(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  // Guardar archivo
  const fileName = `facturas_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
  const exportsDir = path.join(process.cwd(), 'public', 'exports')

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  const filePath = path.join(exportsDir, fileName)
  fs.writeFileSync(filePath, csvContent, 'utf-8')

  return {
    filePath,
    fileName,
    fileUrl: `/exports/${fileName}`,
  }
}

/**
 * Genera archivo ZIP con PDFs de todas las facturas
 */
export async function exportarFacturasZIP(
  filtros: FiltrosFacturas
): Promise<ExportResult> {
  // Obtener facturas
  const facturas = await prisma.factura.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.fechaInicio && {
        fechaEmision: { gte: filtros.fechaInicio },
      }),
      ...(filtros.fechaFin && { fechaEmision: { lte: filtros.fechaFin } }),
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.clienteId && { clienteId: filtros.clienteId }),
    },
    orderBy: { fechaEmision: 'desc' },
  })

  // Crear ZIP
  const zip = new JSZip()

  // Agregar cada factura al ZIP
  for (const factura of facturas) {
    if (factura.pdfUrl) {
      const pdfPath = path.join(process.cwd(), 'public', factura.pdfUrl)

      // Verificar si existe el PDF
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath)
        const pdfFileName = `Factura_${factura.numeroFactura}.pdf`
        zip.file(pdfFileName, pdfBuffer)
      }
    }
  }

  // Generar buffer del ZIP
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  // Guardar archivo ZIP
  const fileName = `facturas_${format(new Date(), 'yyyyMMdd_HHmmss')}.zip`
  const exportsDir = path.join(process.cwd(), 'public', 'exports')

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  const filePath = path.join(exportsDir, fileName)
  fs.writeFileSync(filePath, zipBuffer)

  return {
    filePath,
    fileName,
    fileUrl: `/exports/${fileName}`,
  }
}
