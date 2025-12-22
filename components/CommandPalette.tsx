/**
 * Command Palette - Búsqueda global con Ctrl+K
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandPalette } from '@/hooks/use-command-palette'

interface ResultadoBase {
  id: string
  tipo: 'factura' | 'cliente' | 'pila' | 'pagina'
  titulo: string
  descripcion: string
  ruta: string
  icono: string
  metadata: Record<string, any>
}

interface ResultadosAgrupados {
  facturas: ResultadoBase[]
  clientes: ResultadoBase[]
  aportes: ResultadoBase[]
  paginas: ResultadoBase[]
}

interface BusquedaResponse {
  resultados: ResultadosAgrupados
  totalResultados: number
  query: string
}

const LABELS_CATEGORIA = {
  facturas: 'Facturas',
  clientes: 'Clientes',
  aportes: 'Aportes PILA',
  paginas: 'Páginas',
}

const COLORS_CATEGORIA = {
  facturas: 'text-primary',
  clientes: 'text-success-text-light',
  aportes: 'text-warning-text-light',
  paginas: 'text-dark-100',
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadosAgrupados | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Lista plana de resultados para navegación con teclado
  const resultadosPlanos = resultados
    ? [
        ...resultados.paginas,
        ...resultados.facturas,
        ...resultados.clientes,
        ...resultados.aportes,
      ]
    : []

  // Buscar cuando cambia el query (con debounce)
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResultados(null)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      buscar(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // Focus en input cuando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset cuando cierra
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResultados(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  const buscar = async (q: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)

      if (!response.ok) {
        throw new Error('Error en búsqueda')
      }

      const data: BusquedaResponse = await response.json()
      setResultados(data.resultados)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error en búsqueda:', error)
      setResultados(null)
    } finally {
      setLoading(false)
    }
  }

  const navegar = useCallback(
    (ruta: string) => {
      close()
      router.push(ruta)
    },
    [close, router]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
      return
    }

    if (!resultadosPlanos.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % resultadosPlanos.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev === 0 ? resultadosPlanos.length - 1 : prev - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = resultadosPlanos[selectedIndex]
      if (selected) {
        navegar(selected.ruta)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="bg-dark/50 fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input de búsqueda */}
        <div className="border-light-200 flex items-center border-b px-4 py-3">
          <span className="material-symbols-outlined text-dark-100 mr-3">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar archivos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-dark placeholder-dark-100 flex-1 bg-transparent outline-none"
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
          <kbd className="bg-light-100 text-dark-100 ml-3 rounded px-2 py-1 text-xs">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length < 2 && (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-dark-100 mb-2 text-5xl">
                search
              </span>
              <p className="text-dark-100 text-sm">
                Escribe al menos 2 caracteres para buscar
              </p>
              <div className="text-dark-100 mt-4 flex items-center justify-center gap-2 text-xs">
                <kbd className="bg-light-100 rounded px-2 py-1">↑</kbd>
                <kbd className="bg-light-100 rounded px-2 py-1">↓</kbd>
                <span>para navegar</span>
                <kbd className="bg-light-100 rounded px-2 py-1">Enter</kbd>
                <span>para seleccionar</span>
              </div>
            </div>
          )}

          {query.length >= 2 && !loading && resultados && (
            <>
              {resultadosPlanos.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-dark-100 mb-2 text-5xl">
                    search_off
                  </span>
                  <p className="text-dark-100 text-sm">
                    No se encontraron resultados para &quot;{query}&quot;
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {(
                    Object.keys(LABELS_CATEGORIA) as Array<
                      keyof typeof LABELS_CATEGORIA
                    >
                  ).map((categoria) => {
                    const items = resultados[categoria]
                    if (!items || items.length === 0) return null

                    return (
                      <div key={categoria} className="mb-2">
                        <div className="px-4 py-2">
                          <p className="text-dark-100 text-xs font-semibold uppercase">
                            {LABELS_CATEGORIA[categoria]}
                          </p>
                        </div>
                        {items.map((item, _idx) => {
                          const globalIndex = resultadosPlanos.findIndex(
                            (r) => r.id === item.id && r.tipo === item.tipo
                          )
                          const isSelected = globalIndex === selectedIndex

                          return (
                            <button
                              key={`${item.tipo}-${item.id}`}
                              onClick={() => navegar(item.ruta)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                isSelected
                                  ? 'border-l-4 border-primary bg-primary/10'
                                  : 'hover:bg-light-50 border-l-4 border-transparent'
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined ${COLORS_CATEGORIA[categoria]}`}
                              >
                                {item.icono}
                              </span>
                              <div className="flex-1">
                                <p className="text-dark font-medium">
                                  {item.titulo}
                                </p>
                                <p className="text-dark-100 text-sm">
                                  {item.descripcion}
                                </p>
                              </div>
                              {isSelected && (
                                <span className="material-symbols-outlined text-primary">
                                  arrow_forward
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-light-200 text-dark-100 flex items-center justify-between border-t px-4 py-2 text-xs">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="bg-light-100 rounded px-2 py-1">Ctrl</kbd> +{' '}
              <kbd className="bg-light-100 rounded px-2 py-1">K</kbd> para abrir
            </span>
          </div>
          {resultadosPlanos.length > 0 && (
            <span>{resultadosPlanos.length} resultados</span>
          )}
        </div>
      </div>
    </div>
  )
}
