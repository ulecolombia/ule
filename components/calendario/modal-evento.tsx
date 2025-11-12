/**
 * MODAL DE EVENTO DE CALENDARIO
 * Crear y editar eventos tributarios
 */

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ModalEventoProps {
  evento: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalEvento({
  evento,
  isOpen,
  onClose,
  onSuccess,
}: ModalEventoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    tipo: 'EVENTO_PERSONAL',
    categoria: 'PERSONAL',
    notificar: true,
    color: '#4472C4',
  })

  useEffect(() => {
    if (evento) {
      setFormData({
        titulo: evento.titulo || '',
        descripcion: evento.descripcion || '',
        fecha: evento.fecha
          ? new Date(evento.fecha).toISOString().slice(0, 16)
          : '',
        tipo: evento.tipo || 'EVENTO_PERSONAL',
        categoria: evento.categoria || 'PERSONAL',
        notificar: evento.notificar ?? true,
        color: evento.color || '#4472C4',
      })
    } else {
      // Resetear form
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: '',
        tipo: 'EVENTO_PERSONAL',
        categoria: 'PERSONAL',
        notificar: true,
        color: '#4472C4',
      })
    }
  }, [evento, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const method = evento?.id ? 'PUT' : 'POST'
      const url = evento?.id
        ? `/api/calendario/eventos/${evento.id}`
        : '/api/calendario/eventos'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar evento')
      }

      toast.success(evento?.id ? 'Evento actualizado' : 'Evento creado')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar evento'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!evento?.id) return
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/calendario/eventos/${evento.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error()

      toast.success('Evento eliminado')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Error al eliminar evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark">
            {evento?.id ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-100 hover:text-dark"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full rounded-lg border border-light-200 px-4 py-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full rounded-lg border border-light-200 px-4 py-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.fecha}
                onChange={(e) =>
                  setFormData({ ...formData, fecha: e.target.value })
                }
                className="w-full rounded-lg border border-light-200 px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                className="w-full rounded-lg border border-light-200 px-4 py-2 focus:border-primary focus:outline-none"
              >
                <option value="EVENTO_PERSONAL">Personal</option>
                <option value="VENCIMIENTO_PILA">Vencimiento PILA</option>
                <option value="DECLARACION_RENTA">Declaración Renta</option>
                <option value="PAGO_IMPUESTOS">Pago Impuestos</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notificar"
              checked={formData.notificar}
              onChange={(e) =>
                setFormData({ ...formData, notificar: e.target.checked })
              }
              className="h-4 w-4 rounded border-light-200 text-primary focus:ring-primary"
            />
            <label htmlFor="notificar" className="text-sm text-dark">
              Enviar recordatorios (7, 3 y 1 días antes)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {evento?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="rounded-lg border border-error px-4 py-2 text-error transition-colors hover:bg-error hover:text-white disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-light-200 px-4 py-2 text-dark transition-colors hover:bg-light-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
