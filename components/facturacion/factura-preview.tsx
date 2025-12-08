/**
 * ULE - VISTA PREVIA DE FACTURA
 * Componente que muestra una vista previa de la factura en formato PDF
 */

'use client'

import { formatearMoneda } from '@/lib/utils/facturacion-utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface FacturaPreviewProps {
  numeroFactura?: string
  fecha?: Date
  cliente?: {
    nombre: string
    numeroDocumento: string
    tipoDocumento?: string
    email?: string
    telefono?: string
    direccion?: string
    ciudad?: string
  }
  items: Array<{
    descripcion: string
    cantidad: number
    unidad?: string
    valorUnitario: number | string
    // Soportar ambos formatos (antiguo y nuevo)
    iva?: number
    aplicaIVA?: boolean
    porcentajeIVA?: number
  }>
  subtotal: number
  totalIva: number
  total: number
  notas?: string
  terminos?: string
  metodoPago?: string
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
  showPlaceholders?: boolean
}

export function FacturaPreview({
  numeroFactura = 'PREVIEW-001',
  fecha = new Date(),
  cliente,
  items,
  subtotal,
  totalIva,
  total,
  notas,
  terminos,
  metodoPago,
  emisor,
  showPlaceholders = true,
}: FacturaPreviewProps) {
  // Función helper para obtener porcentaje de IVA (soporta ambos formatos)
  const obtenerPorcentajeIVA = (item: any): number => {
    if (item.aplicaIVA && item.porcentajeIVA !== undefined) {
      return item.porcentajeIVA
    }
    return item.iva ?? 0
  }

  // Función helper para calcular total de un item
  const calcularTotalItem = (item: any) => {
    const valorUnit =
      typeof item.valorUnitario === 'string'
        ? parseFloat(item.valorUnitario.replace(/\./g, '')) || 0
        : item.valorUnitario || 0
    const subtotalItem = item.cantidad * valorUnit
    const porcentajeIVA = obtenerPorcentajeIVA(item)
    const ivaItem = subtotalItem * (porcentajeIVA / 100)
    return subtotalItem + ivaItem
  }

  return (
    <div
      id="factura-preview-print"
      className="h-full overflow-auto bg-white"
      style={{
        width: '100%',
        aspectRatio: '8.5 / 11',
      }}
    >
      <div className="mx-auto bg-white p-6 text-[11px]">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between border-b-2 border-primary pb-4">
          <div className="flex-1">
            {/* Logo placeholder */}
            <div className="mb-3 flex h-14 w-28 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-xl font-bold text-primary">ULE</span>
            </div>
            <div className="space-y-0.5 text-xs text-gray-700">
              <p className="text-sm font-bold text-gray-900">
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

          <div className="text-right">
            <div className="mb-2 rounded-t-lg bg-primary px-4 py-2">
              <h1 className="text-lg font-bold text-white">
                FACTURA ELECTRÓNICA
              </h1>
            </div>
            <div className="space-y-0.5 rounded-b-lg bg-primary/10 px-4 py-2 text-xs">
              <p className="font-semibold">No. {numeroFactura}</p>
              <p>Fecha: {format(fecha, 'dd/MM/yyyy', { locale: es })}</p>
              {showPlaceholders && (
                <p className="text-muted-foreground mt-1 text-[10px]">
                  CUFE: Se generará al emitir
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-primary">
            Información del Cliente
          </h3>
          <div className="rounded-lg bg-gray-50 p-3">
            {cliente ? (
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">
                    {cliente.nombre}
                  </p>
                  <p className="text-[10px]">
                    {cliente.tipoDocumento || 'CC'}: {cliente.numeroDocumento}
                  </p>
                </div>
                <div className="text-right">
                  {cliente.email && (
                    <p className="text-[10px]">{cliente.email}</p>
                  )}
                  {cliente.telefono && (
                    <p className="text-[10px]">Tel: {cliente.telefono}</p>
                  )}
                </div>
                {cliente.direccion && (
                  <div className="col-span-2 text-[10px]">
                    <p>{cliente.direccion}</p>
                    {cliente.ciudad && <p>{cliente.ciudad}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="py-2 text-center text-xs italic text-gray-400">
                Selecciona un cliente
              </p>
            )}
          </div>
        </div>

        {/* Método de pago */}
        {metodoPago && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">Método de pago:</span>
            <span className="text-gray-600">{metodoPago}</span>
          </div>
        )}

        {/* Items */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="pb-2 text-left font-semibold text-gray-700">
                  #
                </th>
                <th className="pb-2 text-left font-semibold text-gray-700">
                  Descripción
                </th>
                <th className="pb-2 text-right font-semibold text-gray-700">
                  Cant.
                </th>
                <th className="pb-2 text-right font-semibold text-gray-700">
                  Valor Unit.
                </th>
                <th className="pb-2 text-right font-semibold text-gray-700">
                  IVA %
                </th>
                <th className="pb-2 text-right font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No hay ítems agregados
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 text-gray-600">{index + 1}</td>
                    <td className="py-3 text-gray-900">{item.descripcion}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.cantidad}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatearMoneda(Number(item.valorUnitario) || 0, false)}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {item.iva}%
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {formatearMoneda(calcularTotalItem(item), false)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mb-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA:</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(totalIva)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 text-base">
              <span className="font-bold text-gray-900">TOTAL:</span>
              <span className="text-xl font-bold text-primary">
                {formatearMoneda(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {notas && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">NOTAS:</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{notas}</p>
          </div>
        )}

        {/* Términos */}
        {terminos && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              TÉRMINOS Y CONDICIONES:
            </h3>
            <p className="whitespace-pre-wrap text-sm text-gray-600">
              {terminos}
            </p>
          </div>
        )}

        {/* CUFE */}
        <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">CUFE:</span> Pendiente de emisión
            DIAN
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Este documento es una vista previa. El CUFE se generará al emitir la
            factura.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>Factura Electrónica de Venta - Resolución DIAN</p>
          <p className="mt-1">
            Este documento fue generado por ULE - Sistema de Facturación
            Electrónica
          </p>
        </div>
      </div>
    </div>
  )
}
