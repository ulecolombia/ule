/**
 * ULE - PDF EXPORT UTILITIES
 * Exportación de resultados de calculadoras a PDF
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatearMoneda } from './format'

interface PDFOptions {
  title: string
  subtitle?: string
  filename: string
}

/**
 * Exportar resultados de simulación pensional a PDF
 */
export function exportarSimulacionPensionalPDF(
  resultado: any,
  inputs: {
    edadActual: string
    genero: string
    ingresoMensual: string
    semanasActuales: string
    regimen: string
  },
  options: PDFOptions
) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241) // primary color
  doc.text(options.title, 20, 20)

  if (options.subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(options.subtitle, 20, 28)
  }

  // Fecha de generación
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 20, 36)

  let yPos = 45

  // Sección: Datos de entrada
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Datos de Entrada', 20, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Campo', 'Valor']],
    body: [
      ['Edad Actual', `${inputs.edadActual} años`],
      ['Género', inputs.genero === 'M' ? 'Masculino' : 'Femenino'],
      [
        'Ingreso Mensual',
        formatearMoneda(
          parseFloat(inputs.ingresoMensual.replace(/[^0-9]/g, ''))
        ),
      ],
      ['Semanas Cotizadas', inputs.semanasActuales],
      [
        'Régimen Actual',
        inputs.regimen === 'RPM' ? 'RPM (Colpensiones)' : 'RAIS (Privado)',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Advertencias
  if (resultado.advertencias && resultado.advertencias.length > 0) {
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('⚠️ Advertencias', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    resultado.advertencias.forEach((adv: string) => {
      const lines = doc.splitTextToSize(`• ${adv}`, 170)
      doc.text(lines, 20, yPos)
      yPos += lines.length * 5
    })
    yPos += 10
  }

  // Resultados comparativos
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Comparación de Regímenes', 20, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'RPM (Colpensiones)', 'RAIS (Privado)']],
    body: [
      [
        'Pensión Mensual Estimada',
        formatearMoneda(resultado.RPM.pensionMensual),
        formatearMoneda(resultado.RAIS.pensionMensual),
      ],
      [
        'Tasa de Reemplazo',
        `${(resultado.RPM.tasaReemplazo * 100).toFixed(1)}%`,
        `${(resultado.RAIS.tasaReemplazo * 100).toFixed(1)}%`,
      ],
      [
        'Edad de Pensión',
        `${resultado.RPM.edadPension} años`,
        `${resultado.RAIS.edadPension} años`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Recomendación
  if (resultado.recomendacion) {
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('✅ Recomendación', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const recomendacionLines = doc.splitTextToSize(resultado.recomendacion, 170)
    doc.text(recomendacionLines, 20, yPos)
  }

  // Footer
  const pageCount = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'Generado con ULE - Sistema de Gestión Contable',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Descargar
  doc.save(options.filename)
}

/**
 * Exportar comparación de regímenes tributarios a PDF
 */
export function exportarComparacionRegimenPDF(
  resultado: any,
  inputs: {
    ingresoAnual: string
    gastosDeducibles: string
  },
  options: PDFOptions
) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241)
  doc.text(options.title, 20, 20)

  if (options.subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(options.subtitle, 20, 28)
  }

  // Fecha
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 20, 36)

  let yPos = 45

  // Datos de entrada
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Datos de Entrada', 20, yPos)
  yPos += 10

  const ingresoVal = parseFloat(inputs.ingresoAnual.replace(/[^0-9]/g, ''))
  const gastosVal = inputs.gastosDeducibles
    ? parseFloat(inputs.gastosDeducibles.replace(/[^0-9]/g, ''))
    : 0

  autoTable(doc, {
    startY: yPos,
    head: [['Campo', 'Valor']],
    body: [
      ['Ingreso Anual', formatearMoneda(ingresoVal)],
      ['Gastos Deducibles', formatearMoneda(gastosVal)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Comparación
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Comparación de Regímenes', 20, yPos)
  yPos += 10

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Régimen Simple', 'Régimen Ordinario']],
    body: [
      [
        'Base Gravable',
        formatearMoneda(resultado.ingresoAnual),
        formatearMoneda(resultado.regimenOrdinario.rentaLiquida),
      ],
      [
        'Tarifa Efectiva',
        `${(resultado.regimenSimple.tarifa * 100).toFixed(2)}%`,
        `${(resultado.regimenOrdinario.tarifa * 100).toFixed(2)}%`,
      ],
      [
        'Impuesto a Pagar',
        formatearMoneda(resultado.regimenSimple.impuesto),
        formatearMoneda(resultado.regimenOrdinario.impuesto),
      ],
      [
        'Ingreso Neto',
        formatearMoneda(resultado.regimenSimple.ingresoNeto),
        formatearMoneda(resultado.regimenOrdinario.ingresoNeto),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Recomendación
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(
    `✅ Régimen Recomendado: ${resultado.regimenMasConveniente === 'SIMPLE' ? 'Simple' : 'Ordinario'}`,
    20,
    yPos
  )
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const recomendacionLines = doc.splitTextToSize(resultado.recomendacion, 170)
  doc.text(recomendacionLines, 20, yPos)
  yPos += recomendacionLines.length * 5 + 5

  if (Math.abs(resultado.diferencia) > 0) {
    doc.setFontSize(12)
    doc.setTextColor(34, 197, 94) // green
    doc.text(
      `Ahorro anual: ${formatearMoneda(Math.abs(resultado.diferencia))}`,
      20,
      yPos
    )
  }

  // Footer
  const pageCountRegimen = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCountRegimen; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      'Generado con ULE - Sistema de Gestión Contable',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  doc.save(options.filename)
}
