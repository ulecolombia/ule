/**
 * ULE - BÚSQUEDA GLOBAL
 * Barra de búsqueda global centrada en el header
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from 'use-debounce'

export function QuickActions() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [debouncedQuery] = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMac, setIsMac] = useState(false)

  // Detectar si es Mac
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform))
  }, [])

  // Escuchar atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K para Mac, Ctrl+K para Windows/Linux
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMac])

  // Buscar cuando cambia el query
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedQuery])

  const handleSearch = async (query: string) => {
    setIsSearching(true)
    try {
      // Aquí implementarías la búsqueda real en tu API
      // Por ahora simulamos resultados
      await new Promise((resolve) => setTimeout(resolve, 200))

      const mockResults = [
        {
          type: 'factura',
          id: '1',
          title: `Factura #${Math.floor(Math.random() * 1000)}`,
          subtitle: 'Cliente: Juan Pérez',
          icon: 'receipt_long',
          href: '/facturacion/facturas',
        },
        {
          type: 'cliente',
          id: '2',
          title: 'María García',
          subtitle: 'NIT: 900123456-7',
          icon: 'person',
          href: '/facturacion/clientes',
        },
      ].filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(mockResults)
    } catch (error) {
      console.error('Error buscando:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
      setIsSearchFocused(false)
      setSearchResults([])
    }
  }

  const shortcutKey = isMac ? '⌘K' : 'Ctrl+K'

  return (
    <div className="relative w-full max-w-2xl">
      {/* Barra de búsqueda */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => {
            // Delay para permitir clicks en resultados
            setTimeout(() => setIsSearchFocused(false), 200)
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Buscar archivos... (${shortcutKey})`}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm
                     transition-all duration-200 placeholder:text-gray-400 focus:border-primary
                     focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSearchResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1
                       text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {isSearchFocused &&
        (searchQuery.length >= 2 || searchResults.length > 0) && (
          <div
            className="animate-slideDown absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto
                        rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            {isSearching ? (
              <div className="p-4 text-center">
                <div
                  className="inline-block h-6 w-6 animate-spin rounded-full border-2
                              border-primary border-t-transparent"
                ></div>
                <p className="mt-2 text-sm text-gray-600">Buscando...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      router.push(result.href)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left
                             transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="material-symbols-outlined text-primary">
                        {result.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {result.title}
                      </p>
                      <p className="truncate text-xs text-gray-600">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-gray-400">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300">
                  search_off
                </span>
                <p className="text-sm font-medium text-gray-900">
                  No se encontraron resultados
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300">
                  search
                </span>
                <p className="text-sm font-medium text-gray-900">
                  Búsqueda global
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Escribe al menos 2 caracteres para buscar
                </p>
              </div>
            )}
          </div>
        )}

      {/* Shortcut hint */}
      {!isSearchFocused && !searchQuery && (
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
          <kbd
            className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold
                          text-gray-500"
          >
            {shortcutKey}
          </kbd>
        </div>
      )}
    </div>
  )
}
