/**
 * ULE - SIDEBAR DE ASESORÍA
 * Historial de conversaciones con búsqueda
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Conversacion {
  id: string
  titulo: string
  updatedAt: Date | string
}

interface SidebarProps {
  conversaciones: Conversacion[]
  conversacionActual: string | null
  onSeleccionarConversacion: (id: string) => void
  onNuevaConversacion: () => void
  onEliminarConversacion: (id: string) => void
  isLoading: boolean
}

/**
 * Formatear tiempo relativo
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

/**
 * Sidebar con historial de conversaciones
 */
export function Sidebar({
  conversaciones,
  conversacionActual,
  onSeleccionarConversacion,
  onNuevaConversacion,
  onEliminarConversacion,
  isLoading,
}: SidebarProps) {
  const [busqueda, setBusqueda] = useState('')

  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = conversaciones.filter((c) =>
    c.titulo.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-3">
          Asesoría Tributaria
        </h1>

        {/* Botón nueva conversación */}
        <Button
          onClick={onNuevaConversacion}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva conversación
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar conversaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : conversacionesFiltradas.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {busqueda
                ? 'No se encontraron conversaciones'
                : 'No tienes conversaciones aún'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {conversacionesFiltradas.map((conversacion) => (
              <ConversacionItem
                key={conversacion.id}
                conversacion={conversacion}
                isActual={conversacion.id === conversacionActual}
                onSeleccionar={() =>
                  onSeleccionarConversacion(conversacion.id)
                }
                onEliminar={() => onEliminarConversacion(conversacion.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Item de conversación
 */
function ConversacionItem({
  conversacion,
  isActual,
  onSeleccionar,
  onEliminar,
}: {
  conversacion: Conversacion
  isActual: boolean
  onSeleccionar: () => void
  onEliminar: () => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className={`
        group relative px-4 py-3 cursor-pointer
        hover:bg-gray-50 transition-colors
        ${isActual ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}
      `}
      onClick={onSeleccionar}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Contenido */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p
            className={`
              text-sm font-medium truncate
              ${isActual ? 'text-indigo-900' : 'text-gray-900'}
            `}
          >
            {conversacion.titulo}
          </p>
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatTime(conversacion.updatedAt)}</span>
          </div>
        </div>

        {/* Botón eliminar */}
        {showDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              if (
                confirm('¿Estás seguro de eliminar esta conversación?')
              ) {
                onEliminar()
              }
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  )
}
