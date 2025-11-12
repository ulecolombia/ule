/**
 * ULE - DELETE ACCOUNT MODAL
 * Modal de confirmación para eliminar cuenta
 */

'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = confirmText === 'ELIMINAR'

  const handleDelete = async () => {
    if (!isConfirmed) return

    try {
      setIsDeleting(true)

      // TODO: Implementar endpoint DELETE /api/user/account
      // Por ahora solo mostramos un mensaje
      toast.info('Esta funcionalidad estará disponible próximamente')

      // const response = await fetch('/api/user/account', {
      //   method: 'DELETE',
      // })

      // if (!response.ok) {
      //   throw new Error('Error al eliminar cuenta')
      // }

      // toast.success('Cuenta eliminada exitosamente')
      // Router.push('/') // Redirigir a landing page
    } catch (error) {
      console.error('[Delete Account] Error:', error)
      toast.error('Error al eliminar la cuenta')
    } finally {
      setIsDeleting(false)
      handleClose()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
              </div>
              <h2 className="text-xl font-bold text-red-900">
                ¿Estás absolutamente seguro?
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-red-700 transition-colors hover:bg-red-100"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Warning */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  Esta acción no se puede deshacer
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Se eliminarán permanentemente todos tus datos, incluyendo:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                  <li>Información personal y laboral</li>
                  <li>Historial de aportes a PILA</li>
                  <li>Facturas generadas</li>
                  <li>Clientes y contratos</li>
                  <li>Configuración de la cuenta</li>
                </ul>
              </div>

              {/* Confirmation */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-dark">
                  Para confirmar, escribe{' '}
                  <span className="rounded bg-light-100 px-1.5 py-0.5 font-mono text-red-600">
                    ELIMINAR
                  </span>{' '}
                  en el siguiente campo:
                </p>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  className={
                    confirmText && !isConfirmed
                      ? 'border-red-300 focus:border-red-500'
                      : ''
                  }
                  autoComplete="off"
                />
              </div>

              {/* Additional Warning */}
              <p className="text-xs text-dark-100">
                Si tienes dudas o problemas con tu cuenta, puedes contactarnos
                en{' '}
                <a
                  href="mailto:soporte@ule.com"
                  className="font-medium text-primary hover:underline"
                >
                  soporte@ule.com
                </a>{' '}
                antes de eliminar tu cuenta.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined mr-2 animate-spin">
                      sync
                    </span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">
                      delete_forever
                    </span>
                    Sí, eliminar mi cuenta
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
