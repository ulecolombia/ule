/**
 * ULE - MODAL DE CREAR/EDITAR SERVICIO FRECUENTE
 * Modal completo con react-hook-form + zod para gestión de servicios
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  servicioFrecuenteSchema,
  ServicioFrecuenteData,
} from '@/lib/validations/servicio-frecuente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

interface ModalServicioProps {
  mode: 'create' | 'edit'
  servicio?: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalServicio({
  mode,
  servicio,
  isOpen,
  onClose,
  onSuccess,
}: ModalServicioProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServicioFrecuenteData>({
    resolver: zodResolver(servicioFrecuenteSchema),
    defaultValues: {
      descripcion: servicio?.descripcion || '',
      valorUnitario: servicio?.valorUnitario
        ? Number(servicio.valorUnitario)
        : 0,
      unidad: servicio?.unidad || 'UND',
      aplicaIVA: servicio?.aplicaIVA || false,
      porcentajeIVA: servicio?.porcentajeIVA || 0,
      categoria: servicio?.categoria || '',
    },
  })

  const aplicaIVA = watch('aplicaIVA')

  // Reset form cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      reset({
        descripcion: servicio?.descripcion || '',
        valorUnitario: servicio?.valorUnitario
          ? Number(servicio.valorUnitario)
          : 0,
        unidad: servicio?.unidad || 'UND',
        aplicaIVA: servicio?.aplicaIVA || false,
        porcentajeIVA: servicio?.porcentajeIVA || 0,
        categoria: servicio?.categoria || '',
      })
    }
  }, [isOpen, servicio, reset])

  // Auto-ajustar porcentaje IVA cuando se desactiva
  useEffect(() => {
    if (!aplicaIVA) {
      setValue('porcentajeIVA', 0)
    }
  }, [aplicaIVA, setValue])

  const onSubmit = async (data: ServicioFrecuenteData) => {
    setIsSubmitting(true)
    try {
      const url =
        mode === 'edit' && servicio
          ? `/api/servicios-frecuentes/${servicio.id}`
          : '/api/servicios-frecuentes'

      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
      } else {
        throw new Error(result.error || 'Error al guardar servicio')
      }
    } catch (error: any) {
      console.error('Error al guardar servicio:', error)
      alert(error.message || 'Error al guardar servicio')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-dark text-2xl font-bold">
              {mode === 'create' ? 'Nuevo Servicio' : 'Editar Servicio'}
            </h2>
            <p className="text-dark-100 text-sm">
              {mode === 'create'
                ? 'Completa la información del servicio'
                : 'Actualiza la información del servicio'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-100 hover:bg-light-100 rounded-lg p-2 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECCIÓN: DESCRIPCIÓN DEL SERVICIO */}
          <div>
            <h3 className="text-dark mb-4 text-lg font-semibold">
              Información del Servicio
            </h3>
            <div className="space-y-4">
              {/* Descripción */}
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Descripción del Servicio <span className="text-error">*</span>
                </label>
                <textarea
                  {...register('descripcion')}
                  placeholder="Ej: Consulta médica especializada en cardiología"
                  maxLength={300}
                  rows={3}
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.descripcion && (
                  <p className="text-error mt-1 text-sm">
                    {errors.descripcion.message}
                  </p>
                )}
              </div>

              {/* Categoría (opcional) */}
              <Input
                label="Categoría (opcional)"
                placeholder="Ej: Consultoría, Desarrollo, Diseño"
                error={errors.categoria?.message}
                {...register('categoria')}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Valor Unitario */}
                <div>
                  <label className="text-dark mb-2 block text-sm font-medium">
                    Valor Unitario (COP) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="150000"
                    {...register('valorUnitario', { valueAsNumber: true })}
                    className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.valorUnitario && (
                    <p className="text-error mt-1 text-sm">
                      {errors.valorUnitario.message}
                    </p>
                  )}
                </div>

                {/* Unidad de Medida */}
                <Select
                  label="Unidad de Medida *"
                  error={errors.unidad?.message}
                  {...register('unidad')}
                  icon={
                    <span className="material-symbols-outlined">
                      straighten
                    </span>
                  }
                >
                  <option value="UND">Unidad</option>
                  <option value="HORA">Hora</option>
                  <option value="DIA">Día</option>
                  <option value="MES">Mes</option>
                  <option value="SERVICIO">Servicio</option>
                </Select>
              </div>
            </div>
          </div>

          {/* SECCIÓN: INFORMACIÓN TRIBUTARIA */}
          <div>
            <h3 className="text-dark mb-4 text-lg font-semibold">
              Información Tributaria
            </h3>
            <div className="space-y-4">
              {/* Switch: ¿Aplica IVA? */}
              <div className="border-light-300 flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <label className="text-dark block text-sm font-medium">
                    ¿Aplica IVA?
                  </label>
                  <p className="text-dark-100 text-xs">
                    Activa si este servicio debe incluir IVA
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    {...register('aplicaIVA')}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                </label>
              </div>

              {/* Porcentaje IVA (solo si aplica) */}
              {aplicaIVA && (
                <Select
                  label="Porcentaje de IVA *"
                  error={errors.porcentajeIVA?.message}
                  {...register('porcentajeIVA', { valueAsNumber: true })}
                  icon={
                    <span className="material-symbols-outlined">percent</span>
                  }
                >
                  <option value={0}>0% (Exento)</option>
                  <option value={5}>5%</option>
                  <option value={19}>19%</option>
                </Select>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="border-light-200 flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear Servicio'
                  : 'Actualizar Servicio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
