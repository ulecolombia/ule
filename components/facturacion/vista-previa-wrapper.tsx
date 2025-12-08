/**
 * ULE - WRAPPER RESPONSIVE PARA VISTA PREVIA DE FACTURA
 * Maneja la presentación responsive: sticky en desktop, modal en móvil
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VistaPreviaFactura } from './vista-previa-factura'
import type { CrearFacturaInput } from '@/lib/validations/factura'
import { formatCurrency } from '@/lib/utils'

interface VistaPreviaWrapperProps {
  data: Partial<CrearFacturaInput>
  numeroFactura?: string
  emisor?: {
    razonSocial?: string
    nombre?: string
    documento?: string
    numeroDocumento?: string
    direccion?: string
    ciudad?: string
    telefono?: string
    email?: string
  }
  cliente?: {
    nombre: string
    numeroDocumento: string
    tipoDocumento?: string
    email?: string
    telefono?: string
    direccion?: string
    ciudad?: string
  }
}

export function VistaPreviaWrapper({
  data,
  numeroFactura,
  emisor,
  cliente,
}: VistaPreviaWrapperProps) {
  const [modalOpen, setModalOpen] = useState(false)

  // Calcular totales para la vista de impresión
  const calcularTotalesItem = (item: any) => {
    const valorUnit =
      typeof item.valorUnitario === 'string'
        ? parseFloat(item.valorUnitario.replace(/\./g, '')) || 0
        : item.valorUnitario || 0
    const cantidad = item.cantidad || 0
    const subtotalItem = cantidad * valorUnit

    const porcentajeIVA = item.aplicaIVA ? item.porcentajeIVA || 0 : 0
    const ivaItem = subtotalItem * (porcentajeIVA / 100)

    return {
      subtotal: subtotalItem,
      iva: ivaItem,
      total: subtotalItem + ivaItem,
      porcentajeIVA,
    }
  }

  const totales = (data.items || []).reduce(
    (acc, item) => {
      const itemTotales = calcularTotalesItem(item)
      return {
        subtotal: acc.subtotal + itemTotales.subtotal,
        iva: acc.iva + itemTotales.iva,
        total: acc.total + itemTotales.total,
      }
    },
    { subtotal: 0, iva: 0, total: 0 }
  )

  // Función para imprimir en nueva ventana
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir')
      return
    }

    const itemsHTML = (data.items || [])
      .map((item) => {
        const itemCalc = calcularTotalesItem(item)
        const valorUnitario = Number(item.valorUnitario) || 0

        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; vertical-align: top;">
            <p style="white-space: pre-wrap; word-break: break-word; line-height: 1.5;">
              ${item.descripcion || 'Descripción del servicio'}
            </p>
          </td>
          <td style="padding: 12px; text-align: center; vertical-align: top;">
            ${item.cantidad || 0}
          </td>
          <td style="padding: 12px; text-align: center; vertical-align: top;">
            ${item.unidad || 'UND'}
          </td>
          <td style="padding: 12px; text-align: right; vertical-align: top;">
            ${formatCurrency(valorUnitario)}
          </td>
          <td style="padding: 12px; text-align: center; vertical-align: top;">
            ${itemCalc.porcentajeIVA > 0 ? `${itemCalc.porcentajeIVA}%` : '-'}
          </td>
          <td style="padding: 12px; text-align: right; vertical-align: top; font-weight: 600;">
            ${formatCurrency(itemCalc.subtotal)}
          </td>
        </tr>
      `
      })
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Factura ${numeroFactura || 'PREVIEW-001'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 14px;
              line-height: 1.5;
              color: #1e293b;
              background: white;
              padding: 40px;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
            }
            @media print {
              body { padding: 0; }
              @page { size: letter; margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #14B8A6;">
              <div>
                <!-- Logo -->
                <div style="width: 160px; height: 80px; background-color: #e0f2f1; border: 2px solid #14B8A6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                  <span style="font-size: 30px; font-weight: bold; color: #14B8A6;">ULE</span>
                </div>
                <!-- Datos emisor -->
                <div style="font-size: 14px;">
                  <p style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
                    ${emisor?.razonSocial || emisor?.nombre || 'Nombre del Emisor'}
                  </p>
                  <p style="margin-bottom: 4px;">NIT: ${emisor?.documento || emisor?.numeroDocumento || '000000000-0'}</p>
                  <p style="margin-bottom: 4px;">${emisor?.direccion || 'Dirección fiscal'}</p>
                  <p style="margin-bottom: 4px;">${emisor?.ciudad || 'Ciudad'}</p>
                  <p style="margin-bottom: 4px;">Tel: ${emisor?.telefono || 'Teléfono'}</p>
                  <p>Email: ${emisor?.email || 'email@ejemplo.com'}</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="background-color: #14B8A6; color: white; padding: 12px 24px; border-radius: 8px 8px 0 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                  <p style="font-size: 20px; font-weight: bold; color: white;">FACTURA ELECTRÓNICA</p>
                </div>
                <div style="background-color: #e0f2f1; padding: 12px 24px; border-radius: 0 0 8px 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                  <p style="font-weight: 600; margin-bottom: 6px;">No. ${numeroFactura || 'PREVIEW-001'}</p>
                  <p style="margin-bottom: 6px;">
                    Fecha: ${data.fecha ? new Date(data.fecha).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO')}
                  </p>
                  <p style="font-size: 12px; color: #64748b;">CUFE: Se generará al emitir</p>
                </div>
              </div>
            </div>

            <!-- CLIENTE -->
            <div style="margin-bottom: 24px;">
              <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 12px; color: #14B8A6;">
                INFORMACIÓN DEL CLIENTE
              </h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                ${
                  cliente
                    ? `
                  <p style="margin-bottom: 6px;"><span style="font-weight: 600;">Cliente:</span> ${cliente.nombre}</p>
                  <p style="margin-bottom: 6px;"><span style="font-weight: 600;">${cliente.tipoDocumento || 'CC'}:</span> ${cliente.numeroDocumento}</p>
                  <p style="margin-bottom: 6px;"><span style="font-weight: 600;">Email:</span> ${cliente.email || 'No especificado'}</p>
                  <p style="margin-bottom: 6px;"><span style="font-weight: 600;">Ciudad:</span> ${cliente.ciudad || 'No especificado'}</p>
                  ${cliente.direccion ? `<p style="margin-bottom: 6px;"><span style="font-weight: 600;">Dirección:</span> ${cliente.direccion}</p>` : ''}
                  ${cliente.telefono ? `<p><span style="font-weight: 600;">Teléfono:</span> ${cliente.telefono}</p>` : ''}
                `
                    : '<p style="text-align: center; color: #9ca3af; padding: 12px; font-style: italic;">Selecciona un cliente</p>'
                }
              </div>
            </div>

            <!-- MÉTODO DE PAGO -->
            ${
              data.metodoPago
                ? `
              <div style="margin-bottom: 20px;">
                <p><span style="font-weight: 600;">Método de pago:</span> <span style="color: #4b5563;">${data.metodoPago}</span></p>
              </div>
            `
                : ''
            }

            <!-- TABLA -->
            <div style="margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background-color: #14B8A6; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    <th style="text-align: left; padding: 12px; font-weight: 600; color: white;">Descripción</th>
                    <th style="text-align: center; padding: 12px; font-weight: 600; width: 80px; color: white;">Cant.</th>
                    <th style="text-align: center; padding: 12px; font-weight: 600; width: 80px; color: white;">Unid.</th>
                    <th style="text-align: right; padding: 12px; font-weight: 600; width: 112px; color: white;">Vr. Unit.</th>
                    <th style="text-align: center; padding: 12px; font-weight: 600; width: 80px; color: white;">IVA%</th>
                    <th style="text-align: right; padding: 12px; font-weight: 600; width: 128px; color: white;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML || '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #9ca3af;">Agrega ítems para ver la vista previa</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- TOTALES -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
              <div style="width: 320px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span>Subtotal:</span>
                  <span style="font-weight: 600;">${formatCurrency(totales.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                  <span>IVA Total:</span>
                  <span style="font-weight: 600;">${formatCurrency(totales.iva)}</span>
                </div>
                <div style="height: 1px; background-color: #d1d5db; margin-bottom: 12px;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #14B8A6;">
                  <span>TOTAL A PAGAR:</span>
                  <span>${formatCurrency(totales.total)}</span>
                </div>
              </div>
            </div>

            <!-- NOTAS -->
            ${
              data.notas
                ? `
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">Notas:</p>
                <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.5;">${data.notas}</p>
              </div>
            `
                : ''
            }

            <!-- FOOTER -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="flex: 1; font-size: 12px; color: #6b7280;">
                <p style="font-weight: 600; margin-bottom: 8px;">CUFE:</p>
                <p style="font-family: monospace; background-color: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                  Se generará al emitir la factura electrónica
                </p>
              </div>
              <div style="width: 96px; height: 96px; background-color: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-left: 24px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <span style="font-size: 12px; color: #6b7280; text-align: center; font-weight: 600;">QR<br/>Code</span>
              </div>
            </div>

            <!-- LEYENDA DIAN -->
            <div style="margin-top: 16px; text-align: center;">
              <p style="font-size: 12px; color: #6b7280;">
                Factura electrónica generada de acuerdo con la Resolución DIAN
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()

    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <>
      {/* Desktop: Vista previa sticky - Solo en pantallas 2XL+ (1536px+) */}
      <div className="hidden 2xl:block">
        <div className="sticky top-4 space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vista Previa</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="Imprimir vista previa"
              className="no-print"
            >
              <span className="material-symbols-outlined text-base">print</span>
            </Button>
          </div>
          <VistaPreviaFactura
            data={data}
            numeroFactura={numeroFactura}
            emisor={emisor}
            cliente={cliente}
          />
        </div>
      </div>

      {/* Mobile/Tablet: Botón para abrir modal - Oculto solo en 2XL+ */}
      <div className="no-print pointer-events-auto fixed bottom-20 right-4 z-30 2xl:hidden">
        <Button
          type="button"
          size="lg"
          onClick={() => setModalOpen(true)}
          className="pointer-events-auto min-h-[44px] min-w-[44px] bg-primary shadow-lg hover:bg-primary/90"
        >
          <span className="material-symbols-outlined mr-2">visibility</span>
          Ver Vista Previa
        </Button>
      </div>

      {/* Modal para móvil */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[95vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Vista Previa de la Factura
            </DialogTitle>
          </DialogHeader>
          <VistaPreviaFactura
            data={data}
            numeroFactura={numeroFactura}
            emisor={emisor}
            cliente={cliente}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
