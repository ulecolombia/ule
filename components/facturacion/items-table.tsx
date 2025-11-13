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
      valorUnitario: '',
      iva: 19,
    })
  }

  const calcularTotalItem = (index: number) => {
    const item = watch(`items.${index}`)
    if (!item) return 0

    // Limpiar el valor unitario de puntos si es string
    const valorLimpio =
      typeof item.valorUnitario === 'string'
        ? parseFloat(item.valorUnitario.replace(/\./g, '') || '0')
        : item.valorUnitario || 0

    const subtotal = (item.cantidad || 0) * valorLimpio
    const ivaAmount = subtotal * ((item.iva || 0) / 100)
    return subtotal + ivaAmount
  }

  // Formatear número con puntos de miles
  const formatearNumero = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Manejar cambio en valor unitario
  const handleValorChange = (index: number, value: string, onChange: any) => {
    const formateado = formatearNumero(value)
    onChange(formateado)
  }

  return (
    <div className="space-y-4">
      {/* Header de la tabla - Desktop */}
      <div className="hidden md:block">
        <div className="border-light-200 text-dark grid grid-cols-12 gap-3 rounded-t-lg border border-b-0 bg-gray-50 px-4 py-3 text-sm font-semibold">
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
                className="border-light-200 rounded-lg border bg-white p-4 md:rounded-none md:border-b md:border-l md:border-r md:p-0"
              >
                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:px-4 md:py-3">
                  {/* Número */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-dark text-sm font-medium">
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
                      <p className="text-error mt-1 text-xs">
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
                      type="text"
                      {...register(`items.${index}.valorUnitario`, {
                        onChange: (e) => {
                          const formateado = formatearNumero(e.target.value)
                          e.target.value = formateado
                        },
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
                      className="border-light-200 hover:border-light-300 h-12 w-full rounded-lg border bg-white px-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <span className="text-dark text-sm font-semibold">
                      {formatearMoneda(totalItem, false)}
                    </span>
                  </div>

                  {/* Eliminar */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-danger hover:bg-danger/10 rounded-lg p-2 transition-colors"
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
                    <span className="text-dark text-sm font-semibold">
                      Ítem #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-danger hover:bg-danger/10 rounded-lg p-2 transition-colors"
                      title="Eliminar ítem"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
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
                      <label className="text-dark mb-1 block text-xs font-medium">
                        IVA %
                      </label>
                      <select
                        {...register(`items.${index}.iva`, {
                          valueAsNumber: true,
                        })}
                        className="border-light-200 hover:border-light-300 h-12 w-full rounded-lg border bg-white px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <label className="text-dark mb-1 block text-xs font-medium">
                      Valor Unitario *
                    </label>
                    <Input
                      type="text"
                      {...register(`items.${index}.valorUnitario`, {
                        onChange: (e) => {
                          const formateado = formatearNumero(e.target.value)
                          e.target.value = formateado
                        },
                      })}
                      error={itemErrors?.valorUnitario?.message}
                      placeholder="0"
                    />
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
          className="w-full md:w-auto"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Agregar ítem
        </Button>
      )}
    </div>
  )
}
