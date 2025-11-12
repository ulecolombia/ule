/**
 * ULE - TIPOS DE FACTURACIÓN
 * Tipos TypeScript para el sistema de facturación electrónica
 */

import { Prisma } from '@prisma/client'

// ============================================
// TIPOS PARA ITEMS DE FACTURA
// ============================================

/**
 * Tipo para un item individual de factura
 */
export interface ItemFactura {
  id?: string // ID temporal para el frontend
  descripcion: string
  cantidad: number
  valorUnitario: number
  iva: number // Porcentaje (0, 5, 19, etc.)
  descuento?: number // Valor o porcentaje
  total: number // Calculado: (cantidad * valorUnitario * (1 + iva/100)) - descuento
}

/**
 * Tipo para el array de conceptos en Factura.conceptos (JSON)
 */
export type ConceptosFactura = ItemFactura[]

// ============================================
// TIPOS CON RELACIONES DE PRISMA
// ============================================

/**
 * Cliente con todas sus facturas
 */
export type ClienteConFacturas = Prisma.ClienteGetPayload<{
  include: { facturas: true }
}>

/**
 * Factura con información del cliente
 */
export type FacturaConCliente = Prisma.FacturaGetPayload<{
  include: { cliente: true }
}>

/**
 * Factura completa con todas las relaciones
 */
export type FacturaCompleta = Prisma.FacturaGetPayload<{
  include: {
    cliente: true
    envios: true
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

/**
 * Cliente con facturas paginadas
 */
export type ClienteConFacturasPaginadas = Prisma.ClienteGetPayload<{
  include: {
    facturas: {
      take: number
      orderBy: { fecha: 'desc' }
    }
  }
}>

/**
 * Envío de factura con información de la factura
 */
export type EnvioConFactura = Prisma.EnvioFacturaGetPayload<{
  include: {
    factura: {
      include: {
        cliente: true
      }
    }
  }
}>

// ============================================
// CONSTANTES DE FACTURACIÓN
// ============================================

/**
 * Tasas de IVA válidas en Colombia
 */
export const IVA_RATES = {
  CERO: 0,
  CINCO: 5,
  DIECINUEVE: 19,
} as const

/**
 * Términos de pago comunes
 */
export const TERMINOS_PAGO = [
  'Pago inmediato',
  'Pago contra entrega',
  '15 días',
  '30 días',
  '45 días',
  '60 días',
  '90 días',
  'Otro',
] as const

/**
 * Prefijos comunes para facturas
 */
export const PREFIJOS_FACTURA = ['FACT', 'FV', 'FE', 'SETT'] as const

// ============================================
// VALIDACIONES
// ============================================

/**
 * Regex para validar número de factura
 * Formato: [PREFIJO-]NUMERO
 * Ejemplos: FACT-001, FV-12345, 001234
 */
export const FACTURA_NUMERO_REGEX = /^[A-Z]{0,4}-?\d{1,10}$/

/**
 * Límites de facturación
 */
export const MAX_ITEMS_POR_FACTURA = 100
export const MIN_VALOR_FACTURA = 0
export const MAX_VALOR_FACTURA = 999999999.99
export const MAX_CANTIDAD_ITEM = 999999
export const MAX_VALOR_UNITARIO = 999999999.99

/**
 * Longitudes máximas de campos
 */
export const MAX_LENGTH = {
  NOMBRE_CLIENTE: 200,
  EMAIL: 255,
  TELEFONO: 20,
  DIRECCION: 500,
  DESCRIPCION_ITEM: 500,
  NOTAS_FACTURA: 2000,
  NUMERO_FACTURA: 50,
  PREFIJO: 10,
  CUFE: 96, // Código Único de Factura Electrónica
} as const

// ============================================
// TIPOS DE FILTROS Y BÚSQUEDA
// ============================================

/**
 * Filtros para búsqueda de facturas
 */
export interface FiltrosFactura {
  estado?: string[]
  clienteId?: string
  fechaDesde?: Date
  fechaHasta?: Date
  montoMin?: number
  montoMax?: number
  busqueda?: string // Búsqueda en número, cliente, etc.
}

/**
 * Filtros para búsqueda de clientes
 */
export interface FiltrosCliente {
  busqueda?: string // Búsqueda en nombre, documento, email
  tipoDocumento?: string
  ciudad?: string
  regimenTributario?: string
}

/**
 * Opciones de ordenamiento para facturas
 */
export interface OrdenamientoFactura {
  campo: 'fecha' | 'total' | 'numeroFactura' | 'clienteNombre' | 'estado'
  direccion: 'asc' | 'desc'
}

/**
 * Opciones de ordenamiento para clientes
 */
export interface OrdenamientoCliente {
  campo: 'nombre' | 'numeroDocumento' | 'createdAt'
  direccion: 'asc' | 'desc'
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================

/**
 * Datos para crear un nuevo cliente
 */
export interface CrearClienteInput {
  nombre: string
  tipoDocumento: string
  numeroDocumento: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  departamento?: string
  razonSocial?: string
  nombreComercial?: string
  regimenTributario?: string
  responsabilidadFiscal?: string
}

/**
 * Datos para crear una nueva factura
 */
export interface CrearFacturaInput {
  clienteId: string
  numeroFactura: string
  prefijo?: string
  fecha: Date
  fechaVencimiento?: Date
  conceptos: ConceptosFactura
  notas?: string
  terminosPago?: string
}

/**
 * Datos para actualizar una factura (borrador)
 */
export interface ActualizarFacturaInput extends Partial<CrearFacturaInput> {
  id: string
}

/**
 * Datos para emitir una factura
 */
export interface EmitirFacturaInput {
  id: string
  enviarEmail?: boolean
  emailsAdicionales?: string[]
}

/**
 * Datos para anular una factura
 */
export interface AnularFacturaInput {
  id: string
  motivoAnulacion: string
}

// ============================================
// TIPOS PARA RESPUESTAS DE API
// ============================================

/**
 * Respuesta de listado paginado
 */
export interface RespuestaPaginada<T> {
  data: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

/**
 * Estadísticas de facturación
 */
export interface EstadisticasFacturacion {
  totalFacturas: number
  totalEmitidas: number
  totalBorradores: number
  totalAnuladas: number
  totalPagadas: number
  totalVencidas: number
  montoTotalEmitido: number
  montoTotalPagado: number
  montoTotalPendiente: number
  promedioFactura: number
}

/**
 * Estadísticas de cliente
 */
export interface EstadisticasCliente {
  totalClientes: number
  clientesActivos: number
  clientesNuevosEsteMes: number
  topClientes: {
    cliente: string
    totalFacturado: number
    numeroFacturas: number
  }[]
}

// ============================================
// TIPOS PARA GENERACIÓN DE DOCUMENTOS
// ============================================

/**
 * Datos para generar PDF de factura
 */
export interface DatosFacturaPDF {
  factura: FacturaCompleta
  emisor: {
    nombre: string
    nit: string
    direccion: string
    telefono: string
    email: string
    ciudad: string
  }
  qrCodeUrl?: string
}

/**
 * Configuración de emisor de facturas
 */
export interface ConfiguracionEmisor {
  nombre: string
  razonSocial?: string
  nit: string
  direccion: string
  ciudad: string
  departamento: string
  telefono: string
  email: string
  sitioWeb?: string
  logo?: string
  regimenTributario: string
  responsabilidadFiscal: string[]
}

// ============================================
// TIPOS PARA DIAN
// ============================================

/**
 * Datos para generar CUFE
 */
export interface DatosCUFE {
  numeroFactura: string
  fecha: Date
  nitEmisor: string
  tipoDocumentoAdquiriente: string
  numeroDocumentoAdquiriente: string
  subtotal: number
  iva: number
  total: number
}

/**
 * Respuesta de validación de DIAN
 */
export interface RespuestaDIAN {
  exitoso: boolean
  cufe?: string
  mensajes: string[]
  errores?: string[]
  fechaValidacion: Date
}

// ============================================
// TIPOS DE UTILIDADES
// ============================================

/**
 * Resultado de cálculo de totales
 */
export interface TotalesFactura {
  subtotal: number
  totalDescuentos: number
  totalIva: number
  totalImpuestos: number
  total: number
}

/**
 * Breakdown detallado por tasa de IVA
 */
export interface BreakdownIVA {
  tasa: number
  base: number
  impuesto: number
}

/**
 * Resumen de factura para listados
 */
export interface ResumenFactura {
  id: string
  numeroFactura: string
  fecha: Date
  clienteNombre: string
  total: number
  estado: string
  vencida: boolean
}
