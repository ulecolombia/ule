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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label="Ayuda"
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'help'}
        </span>
      </button>

      {/* Panel de ayuda */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col shadow-2xl">
          {/* Header */}
          <div className="rounded-t-lg border-b bg-primary p-4 text-white">
            <h3 className="text-lg font-bold">Centro de Ayuda</h3>
            <p className="text-sm opacity-90">¿En qué podemos ayudarte?</p>
          </div>

          {/* Búsqueda */}
          <div className="border-b p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Buscar en ayuda..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                disabled={isSearching}
              />
              <Button onClick={handleBuscar} size="sm" disabled={isSearching}>
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
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
                <h4 className="text-sm font-semibold text-gray-500">
                  Resultados
                </h4>
                {resultados.map((resultado, index) => (
                  <Link
                    key={index}
                    href={resultado.url}
                    className="block rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <h5 className="text-sm font-medium">{resultado.titulo}</h5>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {resultado.descripcion}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-500">
                    Artículos Populares
                  </h4>
                  <div className="space-y-2">
                    {articulosPopulares.map((articulo, index) => (
                      <Link
                        key={index}
                        href={articulo.url}
                        className="flex items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <span className="material-symbols-outlined mr-2 text-primary">
                          article
                        </span>
                        <span className="text-sm">{articulo.titulo}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-gray-500">
                    Acceso Rápido
                  </h4>
                  <div className="space-y-2">
                    <Link
                      href="/ayuda"
                      className="flex items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="material-symbols-outlined mr-2 text-primary">
                        library_books
                      </span>
                      <span className="text-sm">Centro de Ayuda Completo</span>
                    </Link>
                    <Link
                      href="/ayuda#glosario"
                      className="flex items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="material-symbols-outlined mr-2 text-primary">
                        book
                      </span>
                      <span className="text-sm">Glosario de Términos</span>
                    </Link>
                    <Link
                      href="/ayuda#videos"
                      className="flex items-center rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="material-symbols-outlined mr-2 text-primary">
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
          <div className="rounded-b-lg border-t bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-center text-xs text-gray-600 dark:text-gray-400">
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
