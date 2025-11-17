/**
 * ULE - TABLA DINÁMICA DE ITEMS DE FACTURA (MEJORADA)
 * Componente para agregar, editar, clonar y eliminar items de una factura
 * Incluye integración con servicios frecuentes
 *
 * SOLUCIÓN CRÍTICA DE BUG - INPUTS NO FUNCIONABAN:
 * - Problema: Los inputs no funcionaban en vista normal, pero sí con DevTools abierto
 * - Causa Raíz: El grid de 12 columnas requiere ~940px mínimo, pero el layout solo
 *   proporcionaba ~788px en viewport de 1280px (xl: breakpoint) debido a:
 *   - Padding de página: 48px
 *   - Columna preview: 550px (mejorada para mejor legibilidad)
 *   - Gap: 24px
 *   - Resultado: 1280 - 48 - 550 - 24 = 658px disponibles vs 940px necesarios
 * - Solución FINAL: Vista CARD en todas las pantallas (grid eliminado completamente)
 *   - La vista card funciona perfectamente en todos los tamaños de pantalla
 *   - Proporciona mejor UX con layout vertical y inputs de ancho completo
 * - Por qué funcionaba con DevTools: Al abrir DevTools, viewport < 1280px activaba vista card
 */

'use client'

import { useState } from 'react'
import {
  UseFormRegister,
  UseFieldArrayReturn,
  Control,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ModalServiciosGuardados } from './modal-servicios-guardados'
import { formatearMoneda } from '@/lib/utils/facturacion-utils'

interface ItemsTableProps {
  fields: any[]
  register: UseFormRegister<any>
  append: UseFieldArrayReturn['append']
  remove: UseFieldArrayReturn['remove']
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  errors?: any
  control: Control<any>
  responsableIVA?: boolean // Del perfil del usuario
}

export function ItemsTable({
  fields,
  register,
  append,
  remove,
  watch,
  setValue,
  errors,
  responsableIVA = false,
}: ItemsTableProps) {
  const [isModalServiciosOpen, setIsModalServiciosOpen] = useState(false)

  // Agregar ítem vacío
  const agregarItem = () => {
    append({
      descripcion: '',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: '',
      aplicaIVA: responsableIVA,
      porcentajeIVA: responsableIVA ? 19 : 0,
      iva: responsableIVA ? 19 : 0, // Mantener retrocompatibilidad
    })
  }

  // Duplicar ítem existente
  const duplicarItem = (index: number) => {
    const item = watch(`items.${index}`)
    if (!item) return

    append({
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad || 'UND',
      valorUnitario: item.valorUnitario,
      aplicaIVA: item.aplicaIVA ?? false,
      porcentajeIVA: item.porcentajeIVA ?? 0,
      iva: item.iva ?? 0,
    })
  }

  // Usar servicio guardado
  const usarServicio = async (servicio: any) => {
    append({
      descripcion: servicio.descripcion,
      cantidad: 1,
      unidad: servicio.unidad,
      valorUnitario: parseFloat(servicio.valorUnitario),
      aplicaIVA: servicio.aplicaIVA,
      porcentajeIVA: servicio.porcentajeIVA,
      iva: servicio.aplicaIVA ? servicio.porcentajeIVA : 0,
    })

    // Incrementar contador de uso
    try {
      await fetch(`/api/servicios-frecuentes/${servicio.id}/incrementar`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error incrementando contador:', error)
    }

    setIsModalServiciosOpen(false)
  }

  // Calcular total de un ítem
  const calcularTotalItem = (index: number) => {
    const item = watch(`items.${index}`)
    if (!item) return 0

    // Limpiar el valor unitario de puntos si es string
    const valorLimpio =
      typeof item.valorUnitario === 'string'
        ? parseFloat(item.valorUnitario.replace(/\./g, '') || '0')
        : item.valorUnitario || 0

    const subtotal = (item.cantidad || 0) * valorLimpio

    // Usar aplicaIVA y porcentajeIVA si están disponibles, sino usar iva
    let porcentaje = 0
    if (item.aplicaIVA !== undefined) {
      porcentaje = item.aplicaIVA ? item.porcentajeIVA || 0 : 0
    } else {
      porcentaje = item.iva || 0
    }

    const ivaAmount = subtotal * (porcentaje / 100)
    return subtotal + ivaAmount
  }

  // Formatear número con puntos de miles
  const formatearNumero = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  return (
    <div className="space-y-4">
      {/* Header con botón de servicios */}
      <div className="flex items-center justify-between">
        <h3 className="text-dark text-lg font-semibold">Ítems de la Factura</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalServiciosOpen(true)}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">bolt</span>
          Usar Servicio Guardado
        </Button>
      </div>

      {/* Vista GRID eliminada - solo usamos vista CARD que funciona */}

      {/* Rows */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="border-light-200 bg-light-50 rounded-lg border border-dashed p-8 text-center">
            <span className="material-symbols-outlined text-dark-100 mx-auto mb-3 block text-5xl">
              inventory_2
            </span>
            <p className="text-dark mb-2 text-sm font-medium">
              No hay ítems en la factura
            </p>
            <p className="text-dark-100 mb-4 text-xs">
              Agrega al menos un ítem para continuar
            </p>
            <Button type="button" onClick={agregarItem} variant="outline">
              <span className="material-symbols-outlined mr-2">add</span>
              Agregar primer ítem
            </Button>
          </div>
        ) : (
          fields.map((field, index) => {
            const totalItem = calcularTotalItem(index)
            const itemErrors = errors?.items?.[index]

            return (
              <div
                key={field.id}
                className="border-light-200 rounded-lg border bg-white p-4"
              >
                {/* Vista GRID eliminada - causaba problemas de interacción */}
                <div className="hidden">
                  {/* Número */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-dark text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>

                  {/* Descripción */}
                  <div className="relative z-20 col-span-3">
                    <textarea
                      {...register(`items.${index}.descripcion`)}
                      placeholder="Ej: Desarrollo de software personalizado"
                      rows={2}
                      aria-label={`Descripción del ítem ${index + 1}`}
                      aria-invalid={!!itemErrors?.descripcion}
                      className={`relative z-20 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.descripcion
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.descripcion && (
                      <p className="text-error mt-1 text-xs" role="alert">
                        {itemErrors.descripcion.message}
                      </p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="relative z-20 col-span-1">
                    <input
                      type="number"
                      min="0.01"
                      step="1"
                      {...register(`items.${index}.cantidad`, {
                        valueAsNumber: true,
                      })}
                      aria-label={`Cantidad del ítem ${index + 1}`}
                      aria-invalid={!!itemErrors?.cantidad}
                      className={`text-dark relative z-20 h-12 w-full rounded-lg border px-3 text-center text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.cantidad
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.cantidad && (
                      <p className="text-error mt-1 text-xs" role="alert">
                        {itemErrors.cantidad.message}
                      </p>
                    )}
                  </div>

                  {/* Unidad */}
                  <div className="relative z-20 col-span-1">
                    <select
                      {...register(`items.${index}.unidad`)}
                      aria-label={`Unidad de medida del ítem ${index + 1}`}
                      className="border-light-200 hover:border-light-300 text-dark relative z-20 h-12 w-full rounded-lg border bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="UND">UND</option>
                      <option value="HORA">HORA</option>
                      <option value="DIA">DÍA</option>
                      <option value="MES">MES</option>
                      <option value="SERVICIO">SERV</option>
                    </select>
                  </div>

                  {/* Valor Unitario */}
                  <div className="relative z-20 col-span-2">
                    <input
                      type="text"
                      {...register(`items.${index}.valorUnitario`)}
                      placeholder="0"
                      aria-label={`Valor unitario del ítem ${index + 1}`}
                      aria-invalid={!!itemErrors?.valorUnitario}
                      className={`text-dark relative z-20 h-12 w-full rounded-lg border px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.valorUnitario
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.valorUnitario && (
                      <p className="text-error mt-1 text-xs" role="alert">
                        {itemErrors.valorUnitario.message}
                      </p>
                    )}
                  </div>

                  {/* IVA - Selector simplificado */}
                  <div className="relative z-20 col-span-2">
                    <select
                      {...register(`items.${index}.porcentajeIVA`, {
                        valueAsNumber: true,
                        onChange: (e) => {
                          // Actualizar aplicaIVA automáticamente
                          const porcentaje = parseInt(e.target.value)
                          setValue(`items.${index}.aplicaIVA`, porcentaje > 0)
                        },
                      })}
                      className="border-light-200 hover:border-light-300 text-dark relative z-20 h-12 w-full rounded-lg border bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="Porcentaje de IVA"
                    >
                      <option value={0}>Sin IVA (0%)</option>
                      <option value={5}>IVA 5%</option>
                      <option value={19}>IVA 19%</option>
                    </select>
                  </div>

                  {/* Total */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-dark text-sm font-semibold">
                      {formatearMoneda(totalItem, false)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicarItem(index)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                      title="Duplicar ítem"
                      aria-label="Duplicar ítem"
                    >
                      <span className="material-symbols-outlined text-xl">
                        content_copy
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-danger hover:bg-danger/10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      title="Eliminar ítem"
                      aria-label="Eliminar ítem"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                </div>

                {/* Vista CARD - SIEMPRE visible en todas las pantallas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-dark text-sm font-semibold">
                      Ítem #{index + 1}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => duplicarItem(index)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                        aria-label="Duplicar ítem"
                      >
                        <span className="material-symbols-outlined text-xl">
                          content_copy
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-danger hover:bg-danger/10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50"
                        aria-label="Eliminar ítem"
                      >
                        <span className="material-symbols-outlined text-xl">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-dark mb-1 block text-xs font-medium">
                      Descripción *
                    </label>
                    <textarea
                      {...register(`items.${index}.descripcion`)}
                      placeholder="Ej: Desarrollo de software"
                      rows={2}
                      className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.descripcion
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.descripcion && (
                      <p className="text-error mt-1 text-xs">
                        {itemErrors.descripcion.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-dark mb-1 block text-xs font-medium">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="1"
                        {...register(`items.${index}.cantidad`, {
                          valueAsNumber: true,
                        })}
                        className={`text-dark h-12 w-full rounded-lg border px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          itemErrors?.cantidad
                            ? 'border-error'
                            : 'border-light-200'
                        }`}
                      />
                      {itemErrors?.cantidad && (
                        <p className="text-error mt-1 text-xs">
                          {itemErrors.cantidad.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-dark mb-1 block text-xs font-medium">
                        Unidad
                      </label>
                      <select
                        {...register(`items.${index}.unidad`)}
                        className="border-light-200 hover:border-light-300 text-dark h-12 w-full rounded-lg border bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="UND">UND</option>
                        <option value="HORA">HORA</option>
                        <option value="DIA">DÍA</option>
                        <option value="MES">MES</option>
                        <option value="SERVICIO">SERV</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-dark mb-1 block text-xs font-medium">
                      Valor Unitario *
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.valorUnitario`)}
                      placeholder="0"
                      className={`text-dark h-12 w-full rounded-lg border px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.valorUnitario
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.valorUnitario && (
                      <p className="text-error mt-1 text-xs">
                        {itemErrors.valorUnitario.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-dark mb-1 block text-xs font-medium">
                      IVA
                    </label>
                    <select
                      {...register(`items.${index}.porcentajeIVA`, {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const porcentaje = parseInt(e.target.value)
                          setValue(`items.${index}.aplicaIVA`, porcentaje > 0)
                        },
                      })}
                      className="border-light-200 hover:border-light-300 text-dark h-12 w-full rounded-lg border bg-white px-3 text-sm font-medium transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="Porcentaje de IVA"
                    >
                      <option value={0}>Sin IVA (0%)</option>
                      <option value={5}>IVA 5%</option>
                      <option value={19}>IVA 19%</option>
                    </select>
                  </div>

                  <div className="bg-light-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-dark text-sm font-medium">
                        Total del ítem:
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatearMoneda(totalItem)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Botón agregar ítem */}
      {fields.length > 0 && (
        <Button
          type="button"
          onClick={agregarItem}
          variant="outline"
          className="w-full"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Agregar ítem
        </Button>
      )}

      {/* Modal de servicios guardados */}
      <ModalServiciosGuardados
        isOpen={isModalServiciosOpen}
        onClose={() => setIsModalServiciosOpen(false)}
        onSelect={usarServicio}
      />
    </div>
  )
}
