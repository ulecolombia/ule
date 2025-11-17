/**
 * ULE - VISTA PREVIA DE FACTURA EN TIEMPO REAL
 * Componente que muestra el diseño oficial de factura electrónica DIAN
 */

'use client'

import { useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { CrearFacturaInput } from '@/lib/validations/factura'

interface VistaPreviaFacturaProps {
  data: Partial<CrearFacturaInput>
  numeroFactura?: string
  showPlaceholders?: boolean
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

export function VistaPreviaFactura({
  data,
  numeroFactura = 'PREVIEW-001',
  showPlaceholders = true,
  emisor,
  cliente,
}: VistaPreviaFacturaProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  // Calcular totales
  const calcularTotalesItem = (item: any) => {
    const valorUnit =
      typeof item.valorUnitario === 'string'
        ? parseFloat(item.valorUnitario.replace(/\./g, '')) || 0
        : item.valorUnitario || 0
    const cantidad = item.cantidad || 0
    const subtotalItem = cantidad * valorUnit

    // Calcular IVA según configuración del item
    const porcentajeIVA = item.aplicaIVA ? item.porcentajeIVA || 0 : 0

    const ivaItem = subtotalItem * (porcentajeIVA / 100)
    return {
      subtotal: subtotalItem,
      iva: ivaItem,
      total: subtotalItem + ivaItem,
      porcentajeIVA,
    }
  }

  // Calcular totales generales
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

  return (
    <div
      ref={previewRef}
      className="vista-previa-factura overflow-hidden rounded-lg bg-white shadow-lg"
      style={{
        width: '100%',
        minHeight: '800px',
        fontSize: '14px',
      }}
    >
      <div className="flex flex-col p-10">
        {/* HEADER - Logo y datos empresa */}
        <div className="mb-8 flex items-start justify-between border-b-2 border-primary pb-6">
          <div>
            {/* Logo (placeholder si no existe) */}
            <div
              className="mb-3 flex h-20 w-40 items-center justify-center rounded"
              style={{
                backgroundColor: '#e0f2f1',
                border: '2px solid #14B8A6',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <span className="text-3xl font-bold" style={{ color: '#14B8A6' }}>
                ULE
              </span>
            </div>

            {/* Datos del emisor */}
            <div className="space-y-1 text-sm">
              <p className="text-base font-bold">
                {emisor?.razonSocial || emisor?.nombre || 'Nombre del Emisor'}
              </p>
              <p>
                NIT:{' '}
                {emisor?.documento || emisor?.numeroDocumento || '000000000-0'}
              </p>
              <p>{emisor?.direccion || 'Dirección fiscal'}</p>
              <p>{emisor?.ciudad || 'Ciudad'}</p>
              <p>Tel: {emisor?.telefono || 'Teléfono'}</p>
              <p>Email: {emisor?.email || 'email@ejemplo.com'}</p>
            </div>
          </div>

          {/* Información de la factura */}
          <div className="text-right">
            <div
              className="rounded-t px-6 py-3"
              style={{
                backgroundColor: '#14B8A6',
                color: 'white',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <p className="text-xl font-bold">FACTURA ELECTRÓNICA</p>
            </div>
            <div
              className="space-y-1.5 rounded-b px-6 py-3 text-sm"
              style={{
                backgroundColor: '#e0f2f1',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >
              <p className="font-semibold">No. {numeroFactura}</p>
              <p>
                Fecha:{' '}
                {data.fecha
                  ? new Date(data.fecha).toLocaleDateString('es-CO')
                  : new Date().toLocaleDateString('es-CO')}
              </p>
              {showPlaceholders && (
                <p className="text-muted-foreground text-xs">
                  CUFE: Se generará al emitir
                </p>
              )}
            </div>
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="mb-6">
          <h3 className="mb-3 text-base font-bold text-primary">
            INFORMACIÓN DEL CLIENTE
          </h3>
          <div
            className="space-y-1.5 rounded p-4 text-sm"
            style={{
              backgroundColor: '#f9fafb',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {cliente ? (
              <>
                <p>
                  <span className="font-semibold">Cliente:</span>{' '}
                  {cliente.nombre}
                </p>
                <p>
                  <span className="font-semibold">
                    {cliente.tipoDocumento || 'CC'}:
                  </span>{' '}
                  {cliente.numeroDocumento}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{' '}
                  {cliente.email || 'No especificado'}
                </p>
                <p>
                  <span className="font-semibold">Ciudad:</span>{' '}
                  {cliente.ciudad || 'No especificado'}
                </p>
                {cliente.direccion && (
                  <p>
                    <span className="font-semibold">Dirección:</span>{' '}
                    {cliente.direccion}
                  </p>
                )}
                {cliente.telefono && (
                  <p>
                    <span className="font-semibold">Teléfono:</span>{' '}
                    {cliente.telefono}
                  </p>
                )}
              </>
            ) : (
              <p className="py-3 text-center italic text-gray-400">
                Selecciona un cliente para ver sus datos
              </p>
            )}
          </div>
        </div>

        {/* MÉTODO DE PAGO */}
        {data.metodoPago && (
          <div className="mb-5">
            <p className="text-sm">
              <span className="font-semibold">Método de pago:</span>{' '}
              <span className="text-gray-600">{data.metodoPago}</span>
            </p>
          </div>
        )}

        {/* TABLA DE ITEMS */}
        <div className="mb-8 flex-1">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: '#14B8A6',
                  color: 'white',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <th className="p-3 text-left font-semibold">Descripción</th>
                <th className="w-20 p-3 text-center font-semibold">Cant.</th>
                <th className="w-20 p-3 text-center font-semibold">Unid.</th>
                <th className="w-28 p-3 text-right font-semibold">Vr. Unit.</th>
                <th className="w-20 p-3 text-center font-semibold">IVA%</th>
                <th className="w-32 p-3 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => {
                  const itemCalc = calcularTotalesItem(item)
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-3 align-top">
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {item.descripcion || 'Descripción del servicio'}
                        </p>
                      </td>
                      <td className="p-3 text-center align-top">
                        {item.cantidad || 0}
                      </td>
                      <td className="p-3 text-center align-top">
                        {item.unidad || 'UND'}
                      </td>
                      <td className="p-3 text-right align-top">
                        {formatCurrency(
                          typeof item.valorUnitario === 'string'
                            ? parseFloat(
                                item.valorUnitario.replace(/\./g, '')
                              ) || 0
                            : item.valorUnitario || 0
                        )}
                      </td>
                      <td className="p-3 text-center align-top">
                        {itemCalc.porcentajeIVA > 0
                          ? `${itemCalc.porcentajeIVA}%`
                          : '-'}
                      </td>
                      <td className="p-3 text-right align-top font-semibold">
                        {formatCurrency(itemCalc.subtotal)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Agrega ítems para ver la vista previa
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALES */}
        <div className="mt-auto">
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  {formatCurrency(totales.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA Total:</span>
                <span className="font-semibold">
                  {formatCurrency(totales.iva)}
                </span>
              </div>
              <div className="h-px bg-gray-300"></div>
              <div className="flex justify-between text-base font-bold text-primary">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCurrency(totales.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          {data.notas && (
            <div className="mt-6 border-t border-gray-200 pt-5">
              <p className="mb-2 text-sm font-semibold">Notas:</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {data.notas}
              </p>
            </div>
          )}

          {/* Términos y condiciones */}
          {data.terminos && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">
                Términos y Condiciones:
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {data.terminos}
              </p>
            </div>
          )}

          {/* Footer con placeholders CUFE y QR */}
          {showPlaceholders && (
            <div className="mt-8 flex items-end justify-between gap-6 border-t border-gray-200 pt-6">
              <div className="flex-1 text-xs text-gray-500">
                <p className="mb-2 font-semibold">CUFE:</p>
                <p
                  className="break-all rounded p-3 font-mono leading-relaxed"
                  style={{
                    backgroundColor: '#f3f4f6',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  Se generará al emitir la factura electrónica
                </p>
              </div>
              <div
                className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded"
                style={{
                  backgroundColor: '#e5e7eb',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <span className="text-center text-xs font-semibold text-gray-500">
                  QR
                  <br />
                  Code
                </span>
              </div>
            </div>
          )}

          {/* Leyenda DIAN */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Factura electrónica generada de acuerdo con la Resolución DIAN
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
