/**
 * ULE - UTILIDADES PARA CUENTA DE COBRO
 * Funciones auxiliares para cálculos y generación de documentos
 */

import { ItemCuentaCobro } from '@/lib/validations/cuenta-cobro'

/**
 * Calcula los totales de una cuenta de cobro
 */
export function calcularTotalesCuentaCobro(items: ItemCuentaCobro[]) {
  const subtotal = items.reduce((acc, item) => {
    const cantidad = Number(item.cantidad) || 0
    const valorUnitario = Number(item.valorUnitario) || 0
    return acc + cantidad * valorUnitario
  }, 0)

  return {
    subtotal,
    total: subtotal, // Sin IVA, el total es igual al subtotal
  }
}

/**
 * Genera el número consecutivo de cuenta de cobro
 */
export function generarNumeroCuentaCobro(
  ultimoNumero: number,
  prefijo: string = 'CC'
): string {
  const nuevoNumero = ultimoNumero + 1
  const numeroFormateado = nuevoNumero.toString().padStart(4, '0')
  return `${prefijo}-${numeroFormateado}`
}

/**
 * Extrae el número de una cuenta de cobro (ej: "CC-0001" -> 1)
 */
export function extraerNumeroDeCuentaCobro(numeroCuenta: string): number {
  const match = numeroCuenta.match(/\d+$/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Formatea un valor como moneda colombiana
 */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/**
 * Formatea una fecha en español
 */
export function formatearFecha(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Genera el texto de la declaración de no responsable de IVA
 */
export function generarDeclaracionNoIVA(
  nombre: string,
  documento: string
): string {
  return (
    `Declaro bajo la gravedad de juramento que no soy responsable del Impuesto sobre las Ventas (IVA), ` +
    `de conformidad con el artículo 437 del Estatuto Tributario, modificado por el artículo 4 de la Ley 2010 de 2019. ` +
    `Mis ingresos brutos anuales son inferiores a 3.500 UVT y no tengo establecimiento de comercio. ` +
    `${nombre} - ${documento}`
  )
}

/**
 * Valida si una cuenta de cobro puede ser emitida
 */
export function validarParaEmision(cuentaCobro: {
  clienteId?: string
  items?: ItemCuentaCobro[]
}): { valido: boolean; errores: string[] } {
  const errores: string[] = []

  if (!cuentaCobro.clienteId) {
    errores.push('Debe seleccionar un cliente')
  }

  if (!cuentaCobro.items || cuentaCobro.items.length === 0) {
    errores.push('Debe agregar al menos un concepto')
  }

  if (cuentaCobro.items) {
    cuentaCobro.items.forEach((item, index) => {
      if (!item.descripcion?.trim()) {
        errores.push(`El concepto ${index + 1} no tiene descripción`)
      }
      if (!item.valorUnitario || item.valorUnitario <= 0) {
        errores.push(`El concepto ${index + 1} debe tener un valor mayor a 0`)
      }
    })
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}

/**
 * Prepara los items calculando el total de cada uno
 */
export function prepararItems(items: ItemCuentaCobro[]): ItemCuentaCobro[] {
  return items.map((item) => ({
    ...item,
    total: (Number(item.cantidad) || 0) * (Number(item.valorUnitario) || 0),
  }))
}
