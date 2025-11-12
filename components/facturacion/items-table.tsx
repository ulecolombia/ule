/**
 * ULE - TABLA DINÁMICA DE ITEMS DE FACTURA
 * Componente para agregar, editar y eliminar items de una factura
 * Usa useFieldArray de react-hook-form para manejo dinámico
 */

'use client'

import { UseFormRegister, UseFieldArrayReturn, Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MoneyInput } from '@/components/ui/currency-input'
import { OPCIONES_IVA } from '@/lib/validations/factura'
import { formatearMoneda } from '@/lib/utils/facturacion-utils'

interface ItemsTableProps {
  fields: any[]
  register: UseFormRegister<any>
  append: UseFieldArrayReturn['append']
  remove: UseFieldArrayReturn['remove']
  watch: any
  errors?: any
  control: Control<any>
}

export function ItemsTable({
  fields,
  register,
  append,
  remove,
  watch,
  errors,
}: ItemsTableProps) {
  const agregarItem = () => {
    append({
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      iva: 19,
    })
  }

  const calcularTotalItem = (index: number) => {
    const item = watch(`items.${index}`)
    if (!item) return 0

    const subtotal = (item.cantidad || 0) * (item.valorUnitario || 0)
    const ivaAmount = subtotal * ((item.iva || 0) / 100)
    return subtotal + ivaAmount
  }

  return (
    <div className="space-y-4">
      {/* Header de la tabla - Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-12 gap-3 rounded-t-lg border border-b-0 border-light-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-dark">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Descripción *</div>
          <div className="col-span-2">Cantidad *</div>
          <div className="col-span-2">Valor Unit. *</div>
          <div className="col-span-1">IVA %</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3 md:space-y-0">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-light-200 bg-light-50 p-8 text-center">
            <span className="material-symbols-outlined mx-auto mb-3 block text-5xl text-dark-100">
              inventory_2
            </span>
            <p className="mb-2 text-sm font-medium text-dark">
              No hay ítems en la factura
            </p>
            <p className="mb-4 text-xs text-dark-100">
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
                className="rounded-lg border border-light-200 bg-white p-4 md:rounded-none md:border-l md:border-r md:border-b md:p-0"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:px-4 md:py-3">
                  {/* Número */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-medium text-dark">
                      {index + 1}
                    </span>
                  </div>

                  {/* Descripción */}
                  <div className="col-span-4">
                    <textarea
                      {...register(`items.${index}.descripcion`)}
                      placeholder="Ej: Desarrollo de software personalizado"
                      rows={2}
                      className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        itemErrors?.descripcion
                          ? 'border-error'
                          : 'border-light-200'
                      }`}
                    />
                    {itemErrors?.descripcion && (
                      <p className="mt-1 text-xs text-error">
                        {itemErrors.descripcion.message}
                      </p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`items.${index}.cantidad`, {
                        valueAsNumber: true,
                      })}
                      error={itemErrors?.cantidad?.message}
                      className="text-center"
                    />
                  </div>

                  {/* Valor Unitario */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.valorUnitario`, {
                        valueAsNumber: true,
                      })}
                      error={itemErrors?.valorUnitario?.message}
                      placeholder="0"
                    />
                  </div>

                  {/* IVA */}
                  <div className="col-span-1">
                    <select
                      {...register(`items.${index}.iva`, {
                        valueAsNumber: true,
                      })}
                      className="h-12 w-full rounded-lg border border-light-200 bg-white px-2 text-sm transition-colors hover:border-light-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {OPCIONES_IVA.map((opcion) => (
                        <option key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Total */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-sm font-semibold text-dark">
                      {formatearMoneda(totalItem, false)}
                    </span>
                  </div>

                  {/* Eliminar */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                      title="Eliminar ítem"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="space-y-3 md:hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-dark">
                      Ítem #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                      title="Eliminar ítem"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-dark">
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
                      <p className="mt-1 text-xs text-error">
                        {itemErrors.descripcion.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-dark">
                        Cantidad *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...register(`items.${index}.cantidad`, {
                          valueAsNumber: true,
                        })}
                        error={itemErrors?.cantidad?.message}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-dark">
                        IVA %
                      </label>
                      <select
                        {...register(`items.${index}.iva`, {
                          valueAsNumber: true,
                        })}
                        className="h-12 w-full rounded-lg border border-light-200 bg-white px-3 text-sm transition-colors hover:border-light-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {OPCIONES_IVA.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-dark">
                      Valor Unitario *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`items.${index}.valorUnitario`, {
                        valueAsNumber: true,
                      })}
                      error={itemErrors?.valorUnitario?.message}
                      placeholder="0"
                    />
                  </div>

                  <div className="rounded-lg bg-light-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark">
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
          className="w-full md:w-auto"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Agregar ítem
        </Button>
      )}
    </div>
  )
}
