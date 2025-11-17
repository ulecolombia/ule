/**
 * ULE - AUTOCOMPLETE DE CLIENTES
 * Componente de autocompletado con búsqueda debounced para selección de clientes
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'

interface Cliente {
  id: string
  nombre: string
  documento: string
  tipoDocumento: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
}

interface AutocompleteClienteProps {
  onSelect: (cliente: Cliente) => void
  onNuevoCliente: () => void
  onClear?: () => void
  selectedClienteId?: string
  error?: string
}

export function AutocompleteCliente({
  onSelect,
  onNuevoCliente,
  onClear,
  selectedClienteId,
  error,
}: AutocompleteClienteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesFrecuentes, setClientesFrecuentes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const debouncedSearch = useDebounce(searchQuery, 300)
  const displayClientes = searchQuery.trim() ? clientes : clientesFrecuentes

  // Cargar clientes frecuentes al montar
  useEffect(() => {
    const cargarClientesFrecuentes = async () => {
      try {
        const response = await fetch('/api/clientes/frecuentes')
        if (!response.ok) return

        const data = await response.json()
        setClientesFrecuentes(data.clientes || [])
      } catch (error) {
        console.error('Error cargando clientes frecuentes:', error)
      }
    }

    cargarClientesFrecuentes()
  }, [])

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setClientes(clientesFrecuentes)
      return
    }

    const buscarClientes = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/clientes/buscar?q=${encodeURIComponent(debouncedSearch)}`
        )

        if (!response.ok) throw new Error('Error en búsqueda')

        const data = await response.json()
        setClientes(data.clientes || [])
      } catch (error) {
        console.error('Error buscando clientes:', error)
        setClientes([])
      } finally {
        setIsLoading(false)
      }
    }

    buscarClientes()
  }, [debouncedSearch, clientesFrecuentes])

  // Cargar cliente seleccionado si se pasa ID
  useEffect(() => {
    // Si no hay selectedClienteId, limpiar el cliente
    if (!selectedClienteId || selectedClienteId === '') {
      if (selectedCliente) {
        setSelectedCliente(null)
      }
      return
    }

    // Si hay selectedClienteId pero no tenemos el cliente cargado, buscarlo
    if (
      selectedClienteId &&
      (!selectedCliente || selectedCliente.id !== selectedClienteId)
    ) {
      const cliente =
        clientes.find((c) => c.id === selectedClienteId) ||
        clientesFrecuentes.find((c) => c.id === selectedClienteId)
      if (cliente) {
        setSelectedCliente(cliente)
      }
    }
  }, [selectedClienteId, clientes, clientesFrecuentes])

  const handleSelect = useCallback(
    (cliente: Cliente) => {
      setSelectedCliente(cliente)
      setSearchQuery('')
      setIsOpen(false)
      onSelect(cliente)
    },
    [onSelect]
  )

  const handleClear = () => {
    setSelectedCliente(null)
    setSearchQuery('')
    setIsOpen(false)
    setFocusedIndex(-1)
    onClear?.()
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || displayClientes.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < displayClientes.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < displayClientes.length) {
          handleSelect(displayClientes[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [displayClientes])

  return (
    <div className="relative">
      <label className="text-dark mb-2 block text-sm font-medium">
        Cliente <span className="text-error">*</span>
      </label>

      {/* Selected cliente display */}
      {selectedCliente ? (
        <div className="flex items-center gap-2">
          <div className="border-light-300 flex-1 rounded-lg border bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark font-semibold">
                  {selectedCliente.nombre}
                </p>
                <p className="text-dark-100 text-sm">
                  {selectedCliente.tipoDocumento} {selectedCliente.documento}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-dark-100 rounded-lg p-2 transition-colors hover:bg-gray-200"
                title="Cambiar cliente"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="clientes-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                focusedIndex >= 0
                  ? `cliente-option-${displayClientes[focusedIndex]?.id}`
                  : undefined
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre o documento..."
              className={`w-full rounded-lg border ${
                error ? 'border-error' : 'border-light-300'
              } text-dark bg-white px-4 py-3 pr-10 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
            />
            <span className="material-symbols-outlined text-dark-100 absolute right-3 top-1/2 -translate-y-1/2 text-xl">
              search
            </span>
          </div>

          {error && <p className="text-error mt-1 text-sm">{error}</p>}

          {/* Dropdown results */}
          {isOpen && (
            <div className="border-light-300 absolute z-50 mt-2 w-full rounded-lg border bg-white shadow-lg">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {isLoading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-dark-100 mt-2 text-sm">Buscando...</p>
                  </div>
                ) : displayClientes.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <span className="material-symbols-outlined text-dark-100 mx-auto mb-2 text-4xl">
                      person_search
                    </span>
                    <p className="text-dark-100 text-sm">
                      {searchQuery.trim()
                        ? 'No se encontraron clientes'
                        : 'No tienes clientes frecuentes'}
                    </p>
                  </div>
                ) : (
                  <>
                    {!searchQuery.trim() && (
                      <div className="text-dark-100 mb-2 px-3 py-1 text-xs font-semibold">
                        Clientes Frecuentes
                      </div>
                    )}
                    <ul
                      role="listbox"
                      id="clientes-listbox"
                      aria-label="Listado de clientes"
                    >
                      {displayClientes.map((cliente, index) => (
                        <li
                          key={cliente.id}
                          role="option"
                          aria-selected={false}
                        >
                          <button
                            type="button"
                            id={`cliente-option-${cliente.id}`}
                            onClick={() => handleSelect(cliente)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100 ${
                              index === focusedIndex ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="material-symbols-outlined text-xl text-primary">
                                person
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-dark truncate font-semibold">
                                {cliente.nombre}
                              </p>
                              <p className="text-dark-100 truncate text-sm">
                                {cliente.tipoDocumento} {cliente.documento}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Nuevo cliente button */}
              <div className="border-light-200 border-t p-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    onNuevoCliente()
                  }}
                  className="w-full justify-start"
                >
                  <span className="material-symbols-outlined mr-2">add</span>
                  Nuevo Cliente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
