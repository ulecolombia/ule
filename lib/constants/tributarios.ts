/**
 * ULE - CONSTANTES TRIBUTARIAS
 * Valores oficiales para cálculos fiscales y tributarios en Colombia
 *
 * IMPORTANTE: Actualizar estos valores anualmente según decretos oficiales
 */

/**
 * Valores tributarios por año
 */
export const VALORES_TRIBUTARIOS = {
  2025: {
    /** Unidad de Valor Tributario (UVT) - Decreto 2258 de 2024 */
    UVT: 47065,

    /** Salario Mínimo Mensual Legal Vigente */
    SMMLV: 1423500,

    /** Auxilio de transporte */
    AUXILIO_TRANSPORTE: 200000,

    /** Umbral de ingresos para Régimen Simple (en UVT) */
    UMBRAL_SIMPLE: 80000,

    /** Umbral de ingresos para Régimen Simple (en pesos) */
    UMBRAL_SIMPLE_PESOS: 3765200000, // 80.000 UVT * 47.065

    /** Tarifas del Régimen Simple según ingresos */
    TARIFAS_REGIMEN_SIMPLE: [
      { desde: 0, hasta: 12000, tarifa: 1.5 },
      { desde: 12001, hasta: 20000, tarifa: 3.0 },
      { desde: 20001, hasta: 30000, tarifa: 5.0 },
      { desde: 30001, hasta: 40000, tarifa: 7.0 },
      { desde: 40001, hasta: 50000, tarifa: 9.0 },
      { desde: 50001, hasta: 60000, tarifa: 11.0 },
      { desde: 60001, hasta: 80000, tarifa: 13.5 },
    ],

    /** Tarifa general de renta para personas jurídicas */
    TARIFA_RENTA_JURIDICA: 35,

    /** Base mínima de aportes a seguridad social (en SMMLV) */
    BASE_MINIMA_SEGURIDAD_SOCIAL: 1,

    /** Porcentajes de aportes a seguridad social */
    APORTES_SEGURIDAD_SOCIAL: {
      salud: 12.5, // Total: empleador 8.5% + empleado 4%
      pension: 16.0, // Total: empleador 12% + empleado 4%
      arl: 0.522, // Varía según nivel de riesgo (0.522% - 6.96%)
      cajaCompensacion: 4.0,
      icbf: 3.0,
      sena: 2.0,
    },
  },

  2024: {
    UVT: 47065,
    SMMLV: 1300000,
    AUXILIO_TRANSPORTE: 162000,
    UMBRAL_SIMPLE: 80000,
    UMBRAL_SIMPLE_PESOS: 3765200000,
    TARIFAS_REGIMEN_SIMPLE: [
      { desde: 0, hasta: 12000, tarifa: 1.5 },
      { desde: 12001, hasta: 20000, tarifa: 3.0 },
      { desde: 20001, hasta: 30000, tarifa: 5.0 },
      { desde: 30001, hasta: 40000, tarifa: 7.0 },
      { desde: 40001, hasta: 50000, tarifa: 9.0 },
      { desde: 50001, hasta: 60000, tarifa: 11.0 },
      { desde: 60001, hasta: 80000, tarifa: 13.5 },
    ],
    TARIFA_RENTA_JURIDICA: 35,
    BASE_MINIMA_SEGURIDAD_SOCIAL: 1,
    APORTES_SEGURIDAD_SOCIAL: {
      salud: 12.5,
      pension: 16.0,
      arl: 0.522,
      cajaCompensacion: 4.0,
      icbf: 3.0,
      sena: 2.0,
    },
  },
} as const

/**
 * Obtener valores tributarios vigentes para un año específico
 * @param anio Año fiscal (default: año actual)
 * @returns Valores tributarios del año solicitado o del último año disponible
 */
export function getValoresVigentes(anio?: number) {
  const year = anio || new Date().getFullYear()
  const valores = VALORES_TRIBUTARIOS[year as keyof typeof VALORES_TRIBUTARIOS]

  if (!valores) {
    // Si no hay valores para el año solicitado, usar el último disponible
    console.warn(
      `No hay valores tributarios para ${year}. Usando valores de 2025.`
    )
    return VALORES_TRIBUTARIOS[2025]
  }

  return valores
}

/**
 * Calcular UVT en pesos para un año específico
 * @param uvt Cantidad de UVT
 * @param anio Año fiscal (default: año actual)
 * @returns Valor en pesos colombianos
 */
export function uvtAPesos(uvt: number, anio?: number): number {
  const { UVT } = getValoresVigentes(anio)
  return Math.round(uvt * UVT)
}

/**
 * Calcular pesos a UVT para un año específico
 * @param pesos Cantidad en pesos colombianos
 * @param anio Año fiscal (default: año actual)
 * @returns Valor en UVT
 */
export function pesosAUvt(pesos: number, anio?: number): number {
  const { UVT } = getValoresVigentes(anio)
  return Math.round(pesos / UVT)
}

/**
 * Determinar si un contribuyente es elegible para Régimen Simple
 * @param ingresoAnual Ingreso anual en pesos
 * @param anio Año fiscal (default: año actual)
 * @returns true si es elegible para Régimen Simple
 */
export function esElegibleRegimenSimple(
  ingresoAnual: number,
  anio?: number
): boolean {
  const { UMBRAL_SIMPLE_PESOS } = getValoresVigentes(anio)
  return ingresoAnual <= UMBRAL_SIMPLE_PESOS
}

/**
 * Calcular tarifa de Régimen Simple según ingresos
 * @param ingresoAnualUvt Ingreso anual en UVT
 * @param anio Año fiscal (default: año actual)
 * @returns Tarifa porcentual aplicable
 */
export function calcularTarifaRegimenSimple(
  ingresoAnualUvt: number,
  anio?: number
): number {
  const { TARIFAS_REGIMEN_SIMPLE } = getValoresVigentes(anio)

  const rango = TARIFAS_REGIMEN_SIMPLE.find(
    (t) => ingresoAnualUvt >= t.desde && ingresoAnualUvt <= t.hasta
  )

  return rango?.tarifa || 0
}

/**
 * Calcular SMMLV en pesos para un número de salarios mínimos
 * @param cantidad Número de salarios mínimos
 * @param anio Año fiscal (default: año actual)
 * @returns Valor en pesos
 */
export function calcularSMMLV(cantidad: number, anio?: number): number {
  const { SMMLV } = getValoresVigentes(anio)
  return Math.round(cantidad * SMMLV)
}

/**
 * Enlaces oficiales útiles
 */
export const ENLACES_OFICIALES = {
  DIAN: 'https://www.dian.gov.co/',
  UGPP: 'https://www.ugpp.gov.co/',
  JUNTA_CENTRAL_CONTADORES: 'https://www.contaduria.gov.co/',
  MINTRABAJO: 'https://www.mintrabajo.gov.co/',
  CONSULTA_RUT: 'https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces',
} as const

/**
 * Categorías de FAQs disponibles
 */
export const CATEGORIAS_FAQ = [
  'IMPUESTOS',
  'NOMINA',
  'PILA',
  'FACTURACION',
  'REGIMEN_SIMPLE',
  'CONTABILIDAD',
  'SEGURIDAD_SOCIAL',
] as const

export type CategoriaFAQ = typeof CATEGORIAS_FAQ[number]
