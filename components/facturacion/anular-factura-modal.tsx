/**
 * ULE - MODAL PARA ANULAR FACTURA
 * Modal con confirmación y motivo de anulación
 */

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface AnularFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  factura: {
    id: string
    numeroFactura: string
    total: number
    cliente: {
      nombre: string
    }
  } | null
  onConfirmar: (facturaId: string, motivo: string) => Promise<void>
}

export function AnularFacturaModal({
  isOpen,
  onClose,
  factura,
  onConfirmar,
}: AnularFacturaModalProps) {
  const [motivo, setMotivo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleClose = () => {
    if (!isLoading) {
      setMotivo('')
      setError(null)
      onClose()
    }
  }

  const handleConfirmar = async () => {
    if (!factura) return

    // Validar motivo
    if (!motivo.trim()) {
      setError('El motivo es requerido')
      return
    }

    if (motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres')
      return
    }

    if (motivo.trim().length > 500) {
      setError('El motivo no puede exceder 500 caracteres')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await onConfirmar(factura.id, motivo.trim())
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular factura')
    } finally {
      setIsLoading(false)
    }
  }

  if (!factura) return null

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Anular Factura Electrónica</h2>
        {/* Advertencia */}
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <span className="material-symbols-outlined flex-shrink-0 text-2xl text-red-600">
            warning
          </span>
          <div>
            <p className="mb-1 font-semibold text-red-900">
              ¿Está seguro que desea anular esta factura?
            </p>
            <p className="text-sm text-red-700">
              Esta acción es irreversible y será reportada ante la DIAN. Solo
              proceda si está seguro.
            </p>
          </div>
        </div>

        {/* Información de la factura */}
        <div className="space-y-2 rounded-lg bg-slate-50 p-4">
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-600">Número de factura:</span>
            <span className="font-mono font-semibold text-slate-900">
              {factura.numeroFactura}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-600">Cliente:</span>
            <span className="text-right font-medium text-slate-900">
              {factura.cliente.nombre}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-sm text-slate-600">Total:</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(factura.total)}
            </span>
          </div>
        </div>

        {/* Campo de motivo */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Motivo de anulación *
            <span className="ml-1 font-normal text-slate-500">
              (mínimo 10 caracteres)
            </span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Factura emitida con error en datos del cliente..."
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={4}
            maxLength={500}
            disabled={isLoading}
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {motivo.length} / 500 caracteres
            </p>
            {motivo.length >= 10 && (
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                Motivo válido
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Requisitos DIAN */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="mb-2 text-xs font-medium text-blue-900">
            Requisitos DIAN para anulación:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-blue-800">
            <li>La factura debe estar en estado EMITIDA</li>
            <li>Debe tener CUFE válido asignado</li>
            <li>No debe haber superado el plazo de anulación (5 días)</li>
            <li>Se notificará automáticamente al cliente</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={isLoading || motivo.trim().length < 10}
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined mr-2 animate-spin">
                  progress_activity
                </span>
                Anulando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">cancel</span>
                Confirmar Anulación
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
