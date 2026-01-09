/**
 * ULE - CONSTANTES TRIBUTARIAS
 * Valores oficiales para cálculos fiscales y tributarios en Colombia
 *
 * IMPORTANTE: Actualizar estos valores anualmente según decretos oficiales
 *
 * Referencias legales:
 * - UVT 2026: Resolución DIAN 238 de noviembre 2025 ($52,374)
 * - SMMLV 2026: Decreto del Ministerio de Trabajo ($1,750,905)
 * - Tarifas RST Profesionales: Art. 908 numeral 6 E.T. (Sentencia C-540/2023)
 * - Deducciones: Art. 336 E.T.
 * - Redondeo PILA: Decreto 1990 de 2016
 */

/**
 * Tarifas del Régimen Simple de Tributación para Profesiones Liberales
 * Art. 908 numeral 6 E.T. (revivido por Sentencia C-540/2023)
 */
export const TARIFAS_RST_PROFESIONALES = {
  2026: [
    { desdeUVT: 0, hastaUVT: 6000, tarifaConsolidada: 0.059 }, // 5.9%
    { desdeUVT: 6000, hastaUVT: 12000, tarifaConsolidada: 0.073 }, // 7.3%
    { desdeUVT: 12000, hastaUVT: 30000, tarifaConsolidada: 0.12 }, // 12.0%
    { desdeUVT: 30000, hastaUVT: 100000, tarifaConsolidada: 0.145 }, // 14.5%
  ],
  2025: [
    { desdeUVT: 0, hastaUVT: 6000, tarifaConsolidada: 0.059 }, // 5.9%
    { desdeUVT: 6000, hastaUVT: 12000, tarifaConsolidada: 0.073 }, // 7.3%
    { desdeUVT: 12000, hastaUVT: 30000, tarifaConsolidada: 0.12 }, // 12.0%
    { desdeUVT: 30000, hastaUVT: 100000, tarifaConsolidada: 0.145 }, // 14.5%
  ],
} as const

/**
 * Anticipos bimestrales para profesionales RST
 * Parágrafo 4 Art. 908 E.T.
 */
export const ANTICIPOS_BIMESTRALES_PROFESIONALES = {
  2026: [
    { desdeUVT: 0, hastaUVT: 6000, tarifaAnticipo: 0.03 }, // 3.0%
    { desdeUVT: 6000, hastaUVT: 12000, tarifaAnticipo: 0.037 }, // 3.7%
    { desdeUVT: 12000, hastaUVT: 30000, tarifaAnticipo: 0.06 }, // 6.0%
    { desdeUVT: 30000, hastaUVT: 100000, tarifaAnticipo: 0.073 }, // 7.3%
  ],
  2025: [
    { desdeUVT: 0, hastaUVT: 6000, tarifaAnticipo: 0.03 }, // 3.0%
    { desdeUVT: 6000, hastaUVT: 12000, tarifaAnticipo: 0.037 }, // 3.7%
    { desdeUVT: 12000, hastaUVT: 30000, tarifaAnticipo: 0.06 }, // 6.0%
    { desdeUVT: 30000, hastaUVT: 100000, tarifaAnticipo: 0.073 }, // 7.3%
  ],
} as const

/**
 * Constantes de deducciones según Art. 336 E.T.
 */
export const DEDUCCIONES = {
  2026: {
    // Límite global deducciones + rentas exentas (Art. 336)
    LIMITE_PORCENTUAL: 0.4, // 40% del ingreso neto
    LIMITE_UVT: 1340, // 1.340 UVT máximo

    // Renta exenta 25% (Art. 206 num. 10)
    RENTA_EXENTA_25_LIMITE_UVT: 790,

    // Dependientes (Art. 336 num. 3) - ADICIONAL al límite del 40%
    DEPENDIENTE_UVT: 72, // Por cada dependiente
    MAX_DEPENDIENTES: 4,

    // 1% compras factura electrónica (Art. 336 num. 5) - ADICIONAL al límite del 40%
    COMPRAS_FE_PORCENTAJE: 0.01, // 1%
    COMPRAS_FE_LIMITE_UVT: 240,

    // Aportes voluntarios (Art. 126-1, 126-4)
    AFC_PENSION_LIMITE_UVT: 2500,

    // Intereses vivienda (Art. 119)
    INTERESES_VIVIENDA_LIMITE_UVT: 1200,

    // Medicina prepagada (Art. 387)
    MEDICINA_PREPAGADA_MENSUAL_UVT: 16,
    MEDICINA_PREPAGADA_ANUAL_UVT: 192,

    // Aportes obligatorios pensión (ingreso no constitutivo)
    APORTE_OBLIGATORIO_PENSION: 0.16, // 16% del ingreso
  },
  2025: {
    // Límite global deducciones + rentas exentas (Art. 336)
    LIMITE_PORCENTUAL: 0.4, // 40% del ingreso neto
    LIMITE_UVT: 1340, // 1.340 UVT máximo

    // Renta exenta 25% (Art. 206 num. 10)
    RENTA_EXENTA_25_LIMITE_UVT: 790,

    // Dependientes (Art. 336 num. 3) - ADICIONAL al límite del 40%
    DEPENDIENTE_UVT: 72, // Por cada dependiente
    MAX_DEPENDIENTES: 4,

    // 1% compras factura electrónica (Art. 336 num. 5) - ADICIONAL al límite del 40%
    COMPRAS_FE_PORCENTAJE: 0.01, // 1%
    COMPRAS_FE_LIMITE_UVT: 240,

    // Aportes voluntarios (Art. 126-1, 126-4)
    AFC_PENSION_LIMITE_UVT: 2500,

    // Intereses vivienda (Art. 119)
    INTERESES_VIVIENDA_LIMITE_UVT: 1200,

    // Medicina prepagada (Art. 387)
    MEDICINA_PREPAGADA_MENSUAL_UVT: 16,
    MEDICINA_PREPAGADA_ANUAL_UVT: 192,

    // Aportes obligatorios pensión (ingreso no constitutivo)
    APORTE_OBLIGATORIO_PENSION: 0.16, // 16% del ingreso
  },
} as const

/**
 * Beneficios del Régimen Simple de Tributación
 */
export const BENEFICIOS_RST = {
  2026: {
    // Descuento pagos electrónicos (Art. 912)
    DESCUENTO_PAGOS_ELECTRONICOS: 0.005, // 0.5%

    // Exención anticipos si ingresos < 3.500 UVT (Parágrafo 3 Art. 910)
    UMBRAL_EXENCION_ANTICIPOS_UVT: 3500,

    // GMF descontable 100%
    GMF_DESCONTABLE: 1.0, // 100%
  },
  2025: {
    // Descuento pagos electrónicos (Art. 912)
    DESCUENTO_PAGOS_ELECTRONICOS: 0.005, // 0.5%

    // Exención anticipos si ingresos < 3.500 UVT (Parágrafo 3 Art. 910)
    UMBRAL_EXENCION_ANTICIPOS_UVT: 3500,

    // GMF descontable 100%
    GMF_DESCONTABLE: 1.0, // 100%
  },
} as const

/**
 * Valores tributarios por año
 */
export const VALORES_TRIBUTARIOS = {
  2026: {
    /** Unidad de Valor Tributario (UVT) - Resolución DIAN 238 de noviembre 2025 */
    UVT: 52374,

    /** Salario Mínimo Mensual Legal Vigente 2026 */
    SMMLV: 1750905,

    /** Auxilio de transporte 2026 (NO aplica para contratistas OPS) */
    AUXILIO_TRANSPORTE: 249095,

    /** Umbral de ingresos para Régimen Simple - TODAS las profesiones liberales (en UVT) */
    UMBRAL_RST_UVT: 100000,

    /** Umbral de ingresos para Régimen Simple (en pesos) - 100.000 × 52.374 */
    UMBRAL_RST_PESOS: 5237400000,

    /** @deprecated Usar UMBRAL_RST_UVT - Mantenido para compatibilidad */
    UMBRAL_SIMPLE: 100000,

    /** @deprecated Usar UMBRAL_RST_PESOS - Mantenido para compatibilidad */
    UMBRAL_SIMPLE_PESOS: 5237400000,

    /** Tarifas del Régimen Simple según ingresos (actividades comerciales) */
    TARIFAS_REGIMEN_SIMPLE: [
      { desde: 0, hasta: 6000, tarifa: 1.2 },
      { desde: 6001, hasta: 15000, tarifa: 2.8 },
      { desde: 15001, hasta: 30000, tarifa: 8.1 },
      { desde: 30001, hasta: 100000, tarifa: 11.6 },
    ],

    /** Tarifas RST para profesiones liberales (Art. 908 num. 6) */
    TARIFAS_RST_PROFESIONALES: TARIFAS_RST_PROFESIONALES[2026],

    /** Anticipos bimestrales profesionales */
    ANTICIPOS_BIMESTRALES_PROFESIONALES:
      ANTICIPOS_BIMESTRALES_PROFESIONALES[2026],

    /** Deducciones aplicables */
    DEDUCCIONES: DEDUCCIONES[2026],

    /** Beneficios RST */
    BENEFICIOS_RST: BENEFICIOS_RST[2026],

    /** Tarifa general de renta para personas jurídicas */
    TARIFA_RENTA_JURIDICA: 35,

    /** Base mínima de aportes a seguridad social (en SMMLV) */
    BASE_MINIMA_SEGURIDAD_SOCIAL: 1,

    /** IBC Máximo para aportes (25 SMMLV) */
    IBC_MAXIMO_SMMLV: 25,

    /** IBC Máximo en pesos (25 × 1,750,905) */
    IBC_MAXIMO: 43772625,

    /** Porcentajes de aportes a seguridad social para independientes/OPS */
    APORTES_SEGURIDAD_SOCIAL: {
      salud: 12.5, // 100% lo paga el contratista OPS
      pension: 16.0, // 100% lo paga el contratista OPS
      arl: 0.522, // Varía según nivel de riesgo (0.522% - 6.96%)
      cajaCompensacion: 4.0, // NO aplica para OPS
      icbf: 3.0, // NO aplica para OPS
      sena: 2.0, // NO aplica para OPS
    },

    /** Tarifas ARL por nivel de riesgo */
    TARIFAS_ARL: {
      I: 0.522,
      II: 1.044,
      III: 2.436,
      IV: 4.35,
      V: 6.96,
    },
  },

  2025: {
    /** Unidad de Valor Tributario (UVT) - Resolución DIAN 000193 de diciembre 4 de 2024 */
    UVT: 49799,

    /** Salario Mínimo Mensual Legal Vigente */
    SMMLV: 1423500,

    /** Auxilio de transporte */
    AUXILIO_TRANSPORTE: 200000,

    /** Umbral de ingresos para Régimen Simple - TODAS las profesiones liberales (en UVT) */
    UMBRAL_RST_UVT: 100000,

    /** Umbral de ingresos para Régimen Simple (en pesos) - 100.000 × 49.799 */
    UMBRAL_RST_PESOS: 4979900000,

    /** @deprecated Usar UMBRAL_RST_UVT - Mantenido para compatibilidad */
    UMBRAL_SIMPLE: 100000,

    /** @deprecated Usar UMBRAL_RST_PESOS - Mantenido para compatibilidad */
    UMBRAL_SIMPLE_PESOS: 4979900000,

    /** Tarifas del Régimen Simple según ingresos (actividades comerciales) */
    TARIFAS_REGIMEN_SIMPLE: [
      { desde: 0, hasta: 6000, tarifa: 1.2 },
      { desde: 6001, hasta: 15000, tarifa: 2.8 },
      { desde: 15001, hasta: 30000, tarifa: 8.1 },
      { desde: 30001, hasta: 100000, tarifa: 11.6 },
    ],

    /** Tarifas RST para profesiones liberales (Art. 908 num. 6) */
    TARIFAS_RST_PROFESIONALES: TARIFAS_RST_PROFESIONALES[2025],

    /** Anticipos bimestrales profesionales */
    ANTICIPOS_BIMESTRALES_PROFESIONALES:
      ANTICIPOS_BIMESTRALES_PROFESIONALES[2025],

    /** Deducciones aplicables */
    DEDUCCIONES: DEDUCCIONES[2025],

    /** Beneficios RST */
    BENEFICIOS_RST: BENEFICIOS_RST[2025],

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
    UMBRAL_RST_UVT: 100000,
    UMBRAL_RST_PESOS: 4706500000,
    UMBRAL_SIMPLE: 100000,
    UMBRAL_SIMPLE_PESOS: 4706500000,
    TARIFAS_REGIMEN_SIMPLE: [
      { desde: 0, hasta: 6000, tarifa: 1.2 },
      { desde: 6001, hasta: 15000, tarifa: 2.8 },
      { desde: 15001, hasta: 30000, tarifa: 8.1 },
      { desde: 30001, hasta: 100000, tarifa: 11.6 },
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
 * Tipo para los valores tributarios de un año
 */
export type ValoresTributarios = (typeof VALORES_TRIBUTARIOS)[2026]

/**
 * Obtener valores tributarios vigentes para un año específico
 * @param anio Año fiscal (default: año actual)
 * @returns Valores tributarios del año solicitado o del último año disponible
 */
export function getValoresVigentes(anio?: number): ValoresTributarios {
  const year = anio || new Date().getFullYear()
  const valores = VALORES_TRIBUTARIOS[year as keyof typeof VALORES_TRIBUTARIOS]

  if (!valores) {
    // Si no hay valores para el año solicitado, usar el último disponible
    console.warn(
      `No hay valores tributarios para ${year}. Usando valores de 2026.`
    )
    return VALORES_TRIBUTARIOS[2026]
  }

  return valores as ValoresTributarios
}

/**
 * Convertir UVT a pesos colombianos
 * @param uvt Cantidad de UVT
 * @param anio Año fiscal (default: año actual)
 * @returns Valor en pesos colombianos
 */
export function uvtToCOP(uvt: number, anio?: number): number {
  const { UVT } = getValoresVigentes(anio)
  return Math.round(uvt * UVT)
}

/**
 * Alias para compatibilidad - usar uvtToCOP
 */
export const uvtAPesos = uvtToCOP

/**
 * Convertir pesos colombianos a UVT
 * @param cop Cantidad en pesos colombianos
 * @param anio Año fiscal (default: año actual)
 * @returns Valor en UVT
 */
export function copToUVT(cop: number, anio?: number): number {
  const { UVT } = getValoresVigentes(anio)
  return cop / UVT
}

/**
 * Alias para compatibilidad - usar copToUVT
 */
export const pesosAUvt = (pesos: number, anio?: number): number =>
  Math.round(copToUVT(pesos, anio))

/**
 * Formatear valor como moneda colombiana
 * @param value Valor numérico
 * @returns String formateado como COP
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Formatear valor corto (millones/miles)
 * @param value Valor numérico
 * @returns String formateado abreviado
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
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
  const { UMBRAL_RST_PESOS } = getValoresVigentes(anio)
  return ingresoAnual <= UMBRAL_RST_PESOS
}

/**
 * Calcular tarifa RST para profesiones liberales
 * @param ingresoAnualUvt Ingreso anual en UVT
 * @param anio Año fiscal (default: año actual)
 * @returns Tarifa porcentual aplicable (decimal)
 */
export function calcularTarifaRSTProfesional(
  ingresoAnualUvt: number,
  anio?: number
): number {
  const year = anio || new Date().getFullYear()
  const tarifas =
    TARIFAS_RST_PROFESIONALES[year as keyof typeof TARIFAS_RST_PROFESIONALES] ||
    TARIFAS_RST_PROFESIONALES[2026]

  const rango = tarifas.find(
    (t) => ingresoAnualUvt >= t.desdeUVT && ingresoAnualUvt <= t.hastaUVT
  )

  return rango?.tarifaConsolidada || 0
}

/**
 * Calcular anticipo bimestral RST para profesionales
 * @param ingresoAnualUvt Ingreso anual en UVT
 * @param anio Año fiscal (default: año actual)
 * @returns Tarifa de anticipo (decimal)
 */
export function calcularAnticipoRSTProfesional(
  ingresoAnualUvt: number,
  anio?: number
): number {
  const year = anio || new Date().getFullYear()
  const anticipos =
    ANTICIPOS_BIMESTRALES_PROFESIONALES[
      year as keyof typeof ANTICIPOS_BIMESTRALES_PROFESIONALES
    ] || ANTICIPOS_BIMESTRALES_PROFESIONALES[2026]

  const rango = anticipos.find(
    (t) => ingresoAnualUvt >= t.desdeUVT && ingresoAnualUvt <= t.hastaUVT
  )

  return rango?.tarifaAnticipo || 0
}

/**
 * Calcular tarifa de Régimen Simple según ingresos (actividades comerciales)
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
 * Calcular límite de deducciones según Art. 336 E.T.
 * @param ingresoNeto Ingreso neto anual en pesos
 * @param anio Año fiscal (default: año actual)
 * @returns Límite máximo de deducciones en pesos
 */
export function calcularLimiteDeducciones(
  ingresoNeto: number,
  anio?: number
): number {
  const valores = getValoresVigentes(anio)
  const deducciones = valores.DEDUCCIONES || DEDUCCIONES[2026]

  const limitePorcentual = ingresoNeto * deducciones.LIMITE_PORCENTUAL
  const limiteUVT = uvtToCOP(deducciones.LIMITE_UVT, anio)

  return Math.min(limitePorcentual, limiteUVT)
}

/**
 * Calcular deducción por dependientes
 * @param numeroDependientes Número de dependientes (máximo 4)
 * @param anio Año fiscal (default: año actual)
 * @returns Deducción total por dependientes en pesos
 */
export function calcularDeduccionDependientes(
  numeroDependientes: number,
  anio?: number
): number {
  const valores = getValoresVigentes(anio)
  const deducciones = valores.DEDUCCIONES || DEDUCCIONES[2026]

  const dependientesAplicables = Math.min(
    numeroDependientes,
    deducciones.MAX_DEPENDIENTES
  )
  return uvtToCOP(deducciones.DEPENDIENTE_UVT * dependientesAplicables, anio)
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
 * Verificar si aplica exención de anticipos RST
 * @param ingresoAnualUvt Ingreso anual en UVT
 * @param anio Año fiscal (default: año actual)
 * @returns true si está exento de anticipos
 */
export function estaExentoAnticiposRST(
  ingresoAnualUvt: number,
  anio?: number
): boolean {
  const valores = getValoresVigentes(anio)
  const beneficios = valores.BENEFICIOS_RST || BENEFICIOS_RST[2026]

  return ingresoAnualUvt < beneficios.UMBRAL_EXENCION_ANTICIPOS_UVT
}

/**
 * Enlaces oficiales útiles
 */
export const ENLACES_OFICIALES = {
  DIAN: 'https://www.dian.gov.co/',
  UGPP: 'https://www.ugpp.gov.co/',
  JUNTA_CENTRAL_CONTADORES: 'https://www.contaduria.gov.co/',
  MINTRABAJO: 'https://www.mintrabajo.gov.co/',
  CONSULTA_RUT:
    'https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces',
  ESTATUTO_TRIBUTARIO: 'https://estatuto.co/',
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
  'DEDUCCIONES',
  'RST_PROFESIONALES',
] as const

export type CategoriaFAQ = (typeof CATEGORIAS_FAQ)[number]
