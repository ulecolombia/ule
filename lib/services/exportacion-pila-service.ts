/**
 * SERVICIO DE EXPORTACIÓN PILA
 * Genera archivos en múltiples formatos para liquidaciones PILA
 */

import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import { formatearMoneda } from '@/lib/utils/format'
import fs from 'fs'
import path from 'path'

interface FiltrosPILA {
  userId: string
  año?: number
  mes?: number
  estado?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO'
}

interface ExportResult {
  filePath: string
  fileName: string
  fileUrl: string
}

/**
 * Genera archivo Excel con formato profesional para liquidaciones PILA
 */
export async function exportarPilaExcel(
  filtros: FiltrosPILA
): Promise<ExportResult> {
  // Obtener datos de aportes
  const liquidaciones = await prisma.aporte.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.año && { anio: filtros.año }),
      ...(filtros.mes && { mes: filtros.mes }),
      ...(filtros.estado && { estado: filtros.estado }),
    },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  })

  // Crear workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Ule'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Liquidaciones PILA', {
    properties: { tabColor: { argb: '0891B2' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  })

  // Configurar columnas
  worksheet.columns = [
    { header: 'Periodo', key: 'periodo', width: 15 },
    { header: 'Fecha Límite', key: 'fechaLimite', width: 15 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'IBC', key: 'ibc', width: 18 },
    { header: 'Salud', key: 'salud', width: 15 },
    { header: 'Pensión', key: 'pension', width: 15 },
    { header: 'ARL', key: 'arl', width: 15 },
    { header: 'Total a Pagar', key: 'total', width: 18 },
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
  liquidaciones.forEach((liq) => {
    const total = liq.total.toNumber()
    totalGeneral += total

    const row = worksheet.addRow({
      periodo: `${liq.mes.toString().padStart(2, '0')}/${liq.anio}`,
      fechaLimite: format(new Date(liq.fechaLimite), 'dd/MM/yyyy', {
        locale: es,
      }),
      estado: liq.estado,
      ibc: liq.ibc.toNumber(),
      salud: liq.salud.toNumber(),
      pension: liq.pension.toNumber(),
      arl: liq.arl.toNumber(),
      total,
    })

    // Formato de moneda para columnas numéricas
    row.getCell('ibc').numFmt = '"$"#,##0'
    row.getCell('salud').numFmt = '"$"#,##0'
    row.getCell('pension').numFmt = '"$"#,##0'
    row.getCell('arl').numFmt = '"$"#,##0'
    row.getCell('total').numFmt = '"$"#,##0'

    // Color según estado
    const estadoCell = row.getCell('estado')
    if (liq.estado === 'PAGADO') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' },
      }
      estadoCell.font = { color: { argb: '065F46' } }
    } else if (liq.estado === 'VENCIDO') {
      estadoCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEE2E2' },
      }
      estadoCell.font = { color: { argb: '991B1B' } }
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
  if (liquidaciones.length > 0) {
    const totalRow = worksheet.addRow({
      periodo: '',
      fechaLimite: '',
      estado: '',
      ibc: '',
      salud: '',
      pension: '',
      arl: 'TOTAL GENERAL:',
      total: totalGeneral,
    })

    totalRow.font = { bold: true, size: 11 }
    totalRow.getCell('arl').alignment = { horizontal: 'right' }
    totalRow.getCell('total').numFmt = '"$"#,##0'
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' },
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
  const fileName = `pila_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
  const exportsDir = path.join(process.cwd(), 'public', 'exports')

  // Crear directorio si no existe
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
 * Genera archivo CSV simple para liquidaciones PILA
 */
export async function exportarPilaCSV(
  filtros: FiltrosPILA
): Promise<ExportResult> {
  // Obtener datos
  const liquidaciones = await prisma.aporte.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.año && { anio: filtros.año }),
      ...(filtros.mes && { mes: filtros.mes }),
      ...(filtros.estado && { estado: filtros.estado }),
    },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  })

  // Construir CSV
  const headers = [
    'Periodo',
    'Fecha Limite',
    'Estado',
    'IBC',
    'Salud',
    'Pension',
    'ARL',
    'Total',
  ]

  const rows = liquidaciones.map((liq) => {
    return [
      `${liq.mes.toString().padStart(2, '0')}/${liq.anio}`,
      format(new Date(liq.fechaLimite), 'dd/MM/yyyy', { locale: es }),
      liq.estado,
      liq.ibc.toNumber(),
      liq.salud.toNumber(),
      liq.pension.toNumber(),
      liq.arl.toNumber(),
      liq.total.toNumber(),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  // Guardar archivo
  const fileName = `pila_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
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
 * Genera reporte PDF para liquidaciones PILA
 */
export async function exportarPilaPDF(
  filtros: FiltrosPILA
): Promise<ExportResult> {
  // Obtener datos
  const liquidaciones = await prisma.aporte.findMany({
    where: {
      userId: filtros.userId,
      ...(filtros.año && { anio: filtros.año }),
      ...(filtros.mes && { mes: filtros.mes }),
      ...(filtros.estado && { estado: filtros.estado }),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          numeroDocumento: true,
        },
      },
    },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  })

  // Construir HTML para PDF
  let totalGeneral = 0
  const rowsHTML = liquidaciones
    .map((liq) => {
      const total = liq.total.toNumber()
      totalGeneral += total

      const estadoColor =
        liq.estado === 'PAGADO'
          ? '#D1FAE5'
          : liq.estado === 'VENCIDO'
            ? '#FEE2E2'
            : '#FEF3C7'

      return `
        <tr>
          <td>${liq.mes.toString().padStart(2, '0')}/${liq.anio}</td>
          <td>${format(new Date(liq.fechaLimite), 'dd/MM/yyyy', { locale: es })}</td>
          <td style="background-color: ${estadoColor}; text-align: center;">${liq.estado}</td>
          <td style="text-align: right;">${formatearMoneda(liq.ibc.toNumber())}</td>
          <td style="text-align: right;">${formatearMoneda(liq.salud.toNumber())}</td>
          <td style="text-align: right;">${formatearMoneda(liq.pension.toNumber())}</td>
          <td style="text-align: right;">${formatearMoneda(liq.arl.toNumber())}</td>
          <td style="text-align: right; font-weight: bold;">${formatearMoneda(total)}</td>
        </tr>
      `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 40px;
          color: #1F2937;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #0891B2;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #0891B2;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #6B7280;
        }
        .info {
          margin-bottom: 30px;
          background: #F3F4F6;
          padding: 20px;
          border-radius: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #0891B2;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 11px;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 11px;
        }
        tr:hover {
          background-color: #F9FAFB;
        }
        .total-row {
          background-color: #F3F4F6;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #9CA3AF;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ule</h1>
        <h2>Reporte de Liquidaciones PILA</h2>
        <p>Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
      </div>

      <div class="info">
        <p><strong>Usuario:</strong> ${liquidaciones[0]?.user.name || 'N/A'}</p>
        <p><strong>Documento:</strong> ${liquidaciones[0]?.user.numeroDocumento || 'N/A'}</p>
        <p><strong>Email:</strong> ${liquidaciones[0]?.user.email || 'N/A'}</p>
        <p><strong>Total Liquidaciones:</strong> ${liquidaciones.length}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>Fecha Límite</th>
            <th>Estado</th>
            <th>IBC</th>
            <th>Salud</th>
            <th>Pensión</th>
            <th>ARL</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
          <tr class="total-row">
            <td colspan="7" style="text-align: right;">TOTAL GENERAL:</td>
            <td style="text-align: right;">${formatearMoneda(totalGeneral)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Este documento fue generado automáticamente por Ule</p>
        <p>Sistema de Gestión de Seguridad Social para Colombia</p>
      </div>
    </body>
    </html>
  `

  // Guardar HTML (luego se puede convertir a PDF con puppeteer o similar)
  const fileName = `pila_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`
  const exportsDir = path.join(process.cwd(), 'public', 'exports')

  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true })
  }

  const filePath = path.join(exportsDir, fileName)
  fs.writeFileSync(filePath, html, 'utf-8')

  return {
    filePath,
    fileName,
    fileUrl: `/exports/${fileName}`,
  }
}
