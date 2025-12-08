/**
 * ULE - UTILIDADES DE FACTURACIÓN
 * Funciones de cálculo y validación para el sistema de facturación
 */

import {
  TotalesFactura,
  BreakdownIVA,
  FACTURA_NUMERO_REGEX,
  MAX_ITEMS_POR_FACTURA,
  MIN_VALOR_FACTURA,
  MAX_VALOR_FACTURA,
  MAX_CANTIDAD_ITEM,
  MAX_VALOR_UNITARIO,
} from '@/lib/types/facturacion'

// ============================================
// FUNCIONES DE CÁLCULO DE ITEMS
// ============================================

/**
 * Calcula el total de un item individual de factura
 * @param item - Item de factura
 * @returns Total calculado con 2 decimales
 */
export const calcularTotalItem = (item: any): number => {
  const subtotalItem = item.cantidad * item.valorUnitario

  // Determinar el porcentaje de IVA a usar
  // Priorizar aplicaIVA/porcentajeIVA sobre iva (nuevo sistema vs legacy)
  let porcentajeIVA = 0
  if (item.aplicaIVA !== undefined) {
    porcentajeIVA = item.aplicaIVA ? item.porcentajeIVA || 0 : 0
  } else {
    porcentajeIVA = item.iva || 0
  }

  const ivaItem = subtotalItem * (porcentajeIVA / 100)
  const descuentoItem = item.descuento || 0

  const total = subtotalItem + ivaItem - descuentoItem

  // Redondear a 2 decimales
  return Math.round(total * 100) / 100
}

/**
 * Calcula el subtotal de un item (sin IVA ni descuentos)
 * @param item - Item de factura
 * @returns Subtotal
 */
export const calcularSubtotalItem = (item: any): number => {
  return Math.round(item.cantidad * item.valorUnitario * 100) / 100
}

/**
 * Calcula el IVA de un item
 * @param item - Item de factura
 * @returns Valor del IVA
 */
export const calcularIvaItem = (item: any): number => {
  const subtotal = calcularSubtotalItem(item)

  // Determinar el porcentaje de IVA a usar
  // Priorizar aplicaIVA/porcentajeIVA sobre iva (nuevo sistema vs legacy)
  let porcentajeIVA = 0
  if (item.aplicaIVA !== undefined) {
    porcentajeIVA = item.aplicaIVA ? item.porcentajeIVA || 0 : 0
  } else {
    porcentajeIVA = item.iva || 0
  }

  return Math.round(subtotal * (porcentajeIVA / 100) * 100) / 100
}

// ============================================
// FUNCIONES DE CÁLCULO DE FACTURA COMPLETA
// ============================================

/**
 * Calcula todos los totales de una factura a partir de sus items
 * @param items - Array de items de la factura
 * @returns Objeto con todos los totales calculados
 */
export const calcularTotalesFactura = (items: any[]): TotalesFactura => {
  // Subtotal: suma de cantidad * valorUnitario de cada item
  const subtotal = items.reduce((acc, item) => {
    return acc + calcularSubtotalItem(item)
  }, 0)

  // Total de descuentos
  const totalDescuentos = items.reduce((acc, item) => {
    return acc + (item.descuento || 0)
  }, 0)

  // Total de IVA
  const totalIva = items.reduce((acc, item) => {
    return acc + calcularIvaItem(item)
  }, 0)

  // Total impuestos (por ahora solo IVA, pero se puede extender)
  const totalImpuestos = totalIva

  // Total final
  const total = subtotal + totalImpuestos - totalDescuentos

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDescuentos: Math.round(totalDescuentos * 100) / 100,
    totalIva: Math.round(totalIva * 100) / 100,
    totalImpuestos: Math.round(totalImpuestos * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Calcula el breakdown de IVA por tasa
 * Útil para el desglose en el PDF de la factura
 * @param items - Array de items de la factura
 * @returns Array de objetos con base e impuesto por cada tasa de IVA
 */
export const calcularBreakdownIVA = (items: any[]): BreakdownIVA[] => {
  const breakdown = new Map<number, { base: number; impuesto: number }>()

  items.forEach((item) => {
    // Determinar el porcentaje de IVA a usar
    let tasa = 0
    if (item.aplicaIVA !== undefined) {
      tasa = item.aplicaIVA ? item.porcentajeIVA || 0 : 0
    } else {
      tasa = item.iva || 0
    }

    const base = calcularSubtotalItem(item)
    const impuesto = calcularIvaItem(item)

    if (breakdown.has(tasa)) {
      const actual = breakdown.get(tasa)!
      breakdown.set(tasa, {
        base: actual.base + base,
        impuesto: actual.impuesto + impuesto,
      })
    } else {
      breakdown.set(tasa, { base, impuesto })
    }
  })

  // Convertir a array y ordenar por tasa
  return Array.from(breakdown.entries())
    .map(([tasa, valores]) => ({
      tasa,
      base: Math.round(valores.base * 100) / 100,
      impuesto: Math.round(valores.impuesto * 100) / 100,
    }))
    .sort((a, b) => a.tasa - b.tasa)
}

// ============================================
// FUNCIONES DE GENERACIÓN DE NÚMEROS
// ============================================

/**
 * Genera el siguiente número de factura
 * @param ultimoNumero - Último número de factura usado (solo la parte numérica)
 * @param prefijo - Prefijo opcional (ej: "FACT", "FV")
 * @returns Número de factura formateado
 */
export const generarNumeroFactura = (
  ultimoNumero: number,
  prefijo?: string
): string => {
  const numero = (ultimoNumero + 1).toString().padStart(6, '0')
  return prefijo ? `${prefijo}-${numero}` : numero
}

/**
 * Extrae el número entero de un string de número de factura
 * @param numeroFactura - Número de factura completo (ej: "FACT-000123")
 * @returns Número entero extraído
 */
export const extraerNumeroDeFactura = (numeroFactura: string): number => {
  // Eliminar prefijo y guiones
  const soloNumeros = numeroFactura.replace(/[^0-9]/g, '')
  return parseInt(soloNumeros, 10) || 0
}

/**
 * Genera un CUFE (Código Único de Factura Electrónica)
 * Simplificado para MVP - en producción usar algoritmo oficial DIAN
 * @param numeroFactura - Número de factura
 * @param fecha - Fecha de emisión
 * @param nitEmisor - NIT del emisor
 * @param total - Total de la factura
 * @returns CUFE generado
 */
export const generarCUFE = (
  numeroFactura: string,
  fecha: Date,
  nitEmisor: string,
  total: number
): string => {
  // IMPORTANTE: Esto es una versión simplificada para MVP
  // En producción, usar el algoritmo SHA-384 oficial de la DIAN
  // Ver: https://www.dian.gov.co/facturacionelectronica

  const timestamp = fecha.getTime()
  const dataString = `${numeroFactura}-${timestamp}-${nitEmisor}-${total}`

  // Generar hash simple (en producción usar SHA-384)
  let hash = 0
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convertir a string hexadecimal y pad
  const cufe = Math.abs(hash).toString(16).toUpperCase().padStart(32, '0')

  return cufe
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida el formato de un número de factura
 * @param numero - Número de factura a validar
 * @returns true si es válido
 */
export const validarNumeroFactura = (numero: string): boolean => {
  return FACTURA_NUMERO_REGEX.test(numero)
}

/**
 * Valida un item de factura
 * @param item - Item a validar
 * @returns Objeto con validación y errores
 */
export const validarItem = (
  item: any
): { valido: boolean; errores: string[] } => {
  const errores: string[] = []

  if (!item.descripcion || item.descripcion.trim().length === 0) {
    errores.push('La descripción es requerida')
  }

  if (item.cantidad <= 0) {
    errores.push('La cantidad debe ser mayor a 0')
  }

  if (item.cantidad > MAX_CANTIDAD_ITEM) {
    errores.push(`La cantidad no puede ser mayor a ${MAX_CANTIDAD_ITEM}`)
  }

  if (item.valorUnitario <= 0) {
    errores.push('El valor unitario debe ser mayor a 0')
  }

  if (item.valorUnitario > MAX_VALOR_UNITARIO) {
    errores.push(`El valor unitario no puede ser mayor a ${MAX_VALOR_UNITARIO}`)
  }

  // Validar IVA según el sistema usado
  if (item.aplicaIVA !== undefined && item.porcentajeIVA !== undefined) {
    if (item.porcentajeIVA < 0 || item.porcentajeIVA > 100) {
      errores.push('El IVA debe estar entre 0 y 100%')
    }
  } else if (item.iva !== undefined) {
    if (item.iva < 0 || item.iva > 100) {
      errores.push('El IVA debe estar entre 0 y 100%')
    }
  }

  if (item.descuento && item.descuento < 0) {
    errores.push('El descuento no puede ser negativo')
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}

/**
 * Valida una factura completa
 * @param items - Items de la factura
 * @returns Objeto con validación y errores
 */
export const validarFactura = (
  items: any[]
): { valida: boolean; errores: string[] } => {
  const errores: string[] = []

  if (!items || items.length === 0) {
    errores.push('La factura debe tener al menos un item')
  }

  if (items.length > MAX_ITEMS_POR_FACTURA) {
    errores.push(
      `La factura no puede tener más de ${MAX_ITEMS_POR_FACTURA} items`
    )
  }

  // Validar cada item
  items.forEach((item, index) => {
    const validacion = validarItem(item)
    if (!validacion.valido) {
      errores.push(`Item ${index + 1}: ${validacion.errores.join(', ')}`)
    }
  })

  // Validar total de la factura
  if (items.length > 0) {
    const totales = calcularTotalesFactura(items)

    if (totales.total < MIN_VALOR_FACTURA) {
      errores.push(
        `El total de la factura debe ser mayor a ${MIN_VALOR_FACTURA}`
      )
    }

    if (totales.total > MAX_VALOR_FACTURA) {
      errores.push(
        `El total de la factura no puede ser mayor a ${MAX_VALOR_FACTURA}`
      )
    }
  }

  return {
    valida: errores.length === 0,
    errores,
  }
}

// ============================================
// FUNCIONES DE FORMATO
// ============================================

/**
 * Formatea un valor monetario a string con formato colombiano
 * @param valor - Valor numérico
 * @param incluirSimbolo - Si incluir el símbolo $
 * @returns String formateado
 */
export const formatearMoneda = (
  valor: number,
  incluirSimbolo = true
): string => {
  const formato = new Intl.NumberFormat('es-CO', {
    style: incluirSimbolo ? 'currency' : 'decimal',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formato.format(valor)
}

/**
 * Formatea una fecha para mostrar en facturas
 * @param fecha - Fecha a formatear
 * @returns String formateado (ej: "15 de Enero de 2025")
 */
export const formatearFechaFactura = (fecha: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
}

/**
 * Formatea una fecha corta
 * @param fecha - Fecha a formatear
 * @returns String formateado (ej: "15/01/2025")
 */
export const formatearFechaCorta = (fecha: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

// ============================================
// FUNCIONES DE ANÁLISIS
// ============================================

/**
 * Determina si una factura está vencida
 * @param fechaVencimiento - Fecha de vencimiento de la factura
 * @param estado - Estado actual de la factura
 * @returns true si está vencida
 */
export const estaVencida = (
  fechaVencimiento: Date | null,
  estado: string
): boolean => {
  if (!fechaVencimiento || estado === 'PAGADA' || estado === 'ANULADA') {
    return false
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  return vencimiento < hoy
}

/**
 * Calcula los días hasta el vencimiento (o desde el vencimiento si es negativo)
 * @param fechaVencimiento - Fecha de vencimiento
 * @returns Número de días (positivo = por vencer, negativo = vencida)
 */
export const diasHastaVencimiento = (
  fechaVencimiento: Date | null
): number | null => {
  if (!fechaVencimiento) {
    return null
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  const diff = vencimiento.getTime() - hoy.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Obtiene el color del badge de estado de factura
 * @param estado - Estado de la factura
 * @returns Color para el badge
 */
export const obtenerColorEstado = (
  estado: string
): 'default' | 'success' | 'warning' | 'danger' | 'primary' => {
  switch (estado) {
    case 'BORRADOR':
      return 'default'
    case 'EMITIDA':
      return 'primary'
    case 'PAGADA':
      return 'success'
    case 'VENCIDA':
      return 'danger'
    case 'ANULADA':
      return 'warning'
    case 'RECHAZADA':
      return 'danger'
    default:
      return 'default'
  }
}

/**
 * Obtiene el label legible del estado de factura
 * @param estado - Estado de la factura
 * @returns Label legible
 */
export const obtenerLabelEstado = (estado: string): string => {
  const labels: Record<string, string> = {
    BORRADOR: 'Borrador',
    EMITIDA: 'Emitida',
    PAGADA: 'Pagada',
    VENCIDA: 'Vencida',
    ANULADA: 'Anulada',
    RECHAZADA: 'Rechazada',
  }

  return labels[estado] || estado
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Genera un ID temporal único para items del frontend
 * @returns ID temporal
 */
export const generarIdTemporal = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Limpia un número de documento (elimina puntos, guiones, espacios)
 * @param documento - Documento a limpiar
 * @returns Documento limpio
 */
export const limpiarNumeroDocumento = (documento: string): string => {
  return documento.replace(/[.\-\s]/g, '')
}

/**
 * Formatea un número de documento para mostrar
 * @param documento - Documento a formatear
 * @param tipoDocumento - Tipo de documento
 * @returns Documento formateado
 */
export const formatearNumeroDocumento = (
  documento: string,
  tipoDocumento: string
): string => {
  const limpio = limpiarNumeroDocumento(documento)

  // Formatear NIT con guión verificador
  if (tipoDocumento === 'NIT') {
    if (limpio.length > 1) {
      const digito = limpio.slice(-1)
      const numero = limpio.slice(0, -1)
      return `${numero}-${digito}`
    }
  }

  // Para otros tipos de documento, formatear con puntos cada 3 dígitos
  return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
