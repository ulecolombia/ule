/**
 * WIDGET FLOTANTE DE AYUDA
 * Widget siempre visible para acceso rápido a ayuda
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResultadoBusqueda, RespuestaBusqueda } from '@/lib/types/analytics'

export function WidgetAyuda() {
  const [isOpen, setIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ✅ Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  // ✅ Búsqueda automática con debouncing (500ms)
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Si búsqueda vacía, resetear resultados
    if (!busqueda.trim()) {
      setResultados([])
      return
    }

    // Si búsqueda muy corta, no buscar
    if (busqueda.trim().length < 2) {
      return
    }

    // Debounce de 500ms
    debounceTimerRef.current = setTimeout(() => {
      handleBuscar()
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [busqueda])

  const handleBuscar = async () => {
    if (!busqueda.trim() || busqueda.trim().length < 2) return

    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    try {
      setIsSearching(true)
      abortControllerRef.current = new AbortController()

      const response = await fetch(
        `/api/ayuda/buscar?q=${encodeURIComponent(busqueda)}`,
        { signal: abortControllerRef.current.signal }
      )
      const data: RespuestaBusqueda = await response.json()
      setResultados(data.resultados || [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error al buscar:', error)
      }
    } finally {
      setIsSearching(false)
    }
  }

  const articulosPopulares = [
    { titulo: '¿Cómo liquidar mi PILA?', url: '/ayuda#pila' },
    { titulo: '¿Qué es el IBC?', url: '/ayuda#glosario' },
    { titulo: 'Emitir mi primera factura', url: '/ayuda#facturacion' },
    { titulo: '¿Cuándo debo declarar renta?', url: '/ayuda#tributario' },
  ]

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Ayuda"
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'help'}
        </span>
      </button>

      {/* Panel de ayuda */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-primary text-white rounded-t-lg">
            <h3 className="font-bold text-lg">Centro de Ayuda</h3>
            <p className="text-sm opacity-90">¿En qué podemos ayudarte?</p>
          </div>

          {/* Búsqueda */}
          <div className="p-4 border-b">
            <div className="flex space-x-2">
              <Input
                placeholder="Buscar en ayuda..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                disabled={isSearching}
              />
              <Button onClick={handleBuscar} size="icon" disabled={isSearching}>
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <span className="material-symbols-outlined">search</span>
                )}
              </Button>
            </div>
          </div>

          {/* Contenido */}
          <ScrollArea className="flex-1 p-4">
            {resultados.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-500">Resultados</h4>
                {resultados.map((resultado, index) => (
                  <Link
                    key={index}
                    href={resultado.url}
                    className="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h5 className="font-medium text-sm">{resultado.titulo}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {resultado.descripcion}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-3">
                    Artículos Populares
                  </h4>
                  <div className="space-y-2">
                    {articulosPopulares.map((articulo, index) => (
                      <Link
                        key={index}
                        href={articulo.url}
                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-primary mr-2">
                          article
                        </span>
                        <span className="text-sm">{articulo.titulo}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-3">
                    Acceso Rápido
                  </h4>
                  <div className="space-y-2">
                    <Link
                      href="/ayuda"
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary mr-2">
                        library_books
                      </span>
                      <span className="text-sm">Centro de Ayuda Completo</span>
                    </Link>
                    <Link
                      href="/ayuda#glosario"
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary mr-2">
                        book
                      </span>
                      <span className="text-sm">Glosario de Términos</span>
                    </Link>
                    <Link
                      href="/ayuda#videos"
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary mr-2">
                        play_circle
                      </span>
                      <span className="text-sm">Video Tutoriales</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              ¿No encuentras lo que buscas?{' '}
              <Link href="/contacto" className="text-primary hover:underline">
                Contáctanos
              </Link>
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
