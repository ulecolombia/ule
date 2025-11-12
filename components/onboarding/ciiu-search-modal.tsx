/**
 * ULE - CIIU SEARCH MODAL
 * Modal con buscador completo de códigos CIIU
 */

'use client'

import React, { useState, useMemo } from 'react'
import { CODIGOS_CIIU } from '@/lib/data/codigos-ciiu'
import { cn } from '@/lib/utils'

interface CIIUSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (codigo: string) => void
}

export function CIIUSearchModal({
  isOpen,
  onClose,
  onSelect,
}: CIIUSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return CODIGOS_CIIU

    return CODIGOS_CIIU.filter(
      (item) =>
        item.codigo.includes(query) ||
        item.descripcion.toLowerCase().includes(query) ||
        item.categoria.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const handleSelect = (codigo: string) => {
    onSelect(codigo)
    onClose()
    setSearchQuery('')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-light-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-dark">
                Buscar Código CIIU
              </h2>
              <p className="mt-1 text-sm text-dark-100">
                Encuentra tu código de actividad económica
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50 hover:text-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="border-b border-light-200 p-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-dark-100">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código, descripción o categoría..."
                autoFocus
                className="w-full rounded-lg border border-light-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-6">
            {filteredCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-dark-100">
                  search_off
                </span>
                <p className="text-lg font-semibold text-dark">
                  No se encontraron resultados
                </p>
                <p className="mt-1 text-sm text-dark-100">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCodes.map((item) => (
                  <button
                    key={item.codigo}
                    type="button"
                    onClick={() => handleSelect(item.codigo)}
                    className={cn(
                      'w-full rounded-lg border border-light-200 p-4 text-left transition-all',
                      'hover:border-primary hover:bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Código */}
                      <div className="flex-shrink-0">
                        <div className="rounded-md bg-primary/10 px-3 py-1 font-mono text-sm font-semibold text-primary">
                          {item.codigo}
                        </div>
                      </div>

                      {/* Descripción y Categoría */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark">
                          {item.descripcion}
                        </p>
                        <p className="mt-1 text-xs text-dark-100">
                          <span className="material-symbols-outlined mr-1 text-xs align-middle">
                            category
                          </span>
                          {item.categoria}
                        </p>
                      </div>

                      {/* Arrow Icon */}
                      <span className="material-symbols-outlined flex-shrink-0 text-dark-100">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-light-200 p-6">
            <p className="text-xs text-dark-100">
              <strong>Nota:</strong> Si no encuentras tu actividad económica,
              selecciona la que más se aproxime a tu profesión u oficio principal.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
