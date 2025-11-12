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
    email?: string
    telefono?: string
    direccion?: string
    ciudad?: string
  }
  items: Array<{
    descripcion: string
    cantidad: number
    valorUnitario: number
    iva: number
  }>
  subtotal: number
  totalIva: number
  total: number
  notas?: string
  terminos?: string
  emisor?: {
    nombre: string
    numeroDocumento: string
    direccion?: string
    ciudad?: string
    telefono?: string
    email?: string
  }
}

export function FacturaPreview({
  numeroFactura = 'ULE-XXXXXX-XXX',
  fecha = new Date(),
  cliente,
  items,
  subtotal,
  totalIva,
  total,
  notas,
  terminos,
  emisor,
}: FacturaPreviewProps) {
  const calcularTotalItem = (item: any) => {
    const subtotalItem = item.cantidad * item.valorUnitario
    const ivaItem = subtotalItem * (item.iva / 100)
    return subtotalItem + ivaItem
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b border-gray-300 pb-6">
          <div>
            {/* Logo placeholder */}
            <div className="mb-4 flex h-12 w-32 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">ULE</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">
                {emisor?.nombre || 'Tu Empresa'}
              </p>
              <p>NIT: {emisor?.numeroDocumento || '000000000-0'}</p>
              {emisor?.direccion && <p>{emisor.direccion}</p>}
              {emisor?.ciudad && <p>{emisor.ciudad}</p>}
              {emisor?.telefono && <p>Tel: {emisor.telefono}</p>}
              {emisor?.email && <p>Email: {emisor.email}</p>}
            </div>
          </div>

          <div className="text-right">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">FACTURA</h1>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">No:</span> {numeroFactura}
              </p>
              <p>
                <span className="font-semibold">Fecha:</span>{' '}
                {format(fecha, 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            FACTURAR A:
          </h2>
          {cliente ? (
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">{cliente.nombre}</p>
              <p>Documento: {cliente.numeroDocumento}</p>
              {cliente.email && <p>Email: {cliente.email}</p>}
              {cliente.telefono && <p>Teléfono: {cliente.telefono}</p>}
              {cliente.direccion && <p>{cliente.direccion}</p>}
              {cliente.ciudad && <p>{cliente.ciudad}</p>}
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">
              Selecciona un cliente
            </p>
          )}
        </div>

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
                      {formatearMoneda(item.valorUnitario, false)}
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
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              NOTAS:
            </h3>
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
            Este documento es una vista previa. El CUFE se generará al emitir
            la factura.
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
