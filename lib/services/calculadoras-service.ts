/**
 * SERVICIO DE CALCULADORAS TRIBUTARIAS
 * Cálculos según normativa colombiana 2025
 */

/**
 * Constantes tributarias Colombia 2025
 */
export const CONSTANTES_2025 = {
  UVT: 47065,
  SMMLV: 1423500,
  IVA_GENERAL: 0.19,
  SALUD: 0.125,
  PENSION: 0.16,
  ARL_RIESGOS: {
    I: 0.00522,
    II: 0.01044,
    III: 0.02436,
    IV: 0.0435,
    V: 0.0696,
  },
}

/**
 * 1. CALCULADORA DE RETENCIÓN EN LA FUENTE
 * Tabla de retención según UVT (personas naturales)
 */
export interface CalculoRetencionFuente {
  ingresoMensual: number
  ingresoAnual: number
  uvtAnual: number
  baseRetencion: number
  retencion: number
  ingresoNeto: number
  tarifa: number
}

export function calcularRetencionFuente(
  ingresoMensual: number
): CalculoRetencionFuente {
  const { UVT } = CONSTANTES_2025
  const ingresoAnual = ingresoMensual * 12
  const uvtAnual = ingresoAnual / UVT

  // Tabla de retención 2025 para personas naturales (asalariados/independientes)
  let tarifa = 0
  let baseUVT = 0

  if (uvtAnual <= 1090) {
    // 0 - 1.090 UVT: 0%
    tarifa = 0
    baseUVT = 0
  } else if (uvtAnual <= 1700) {
    // 1.090 - 1.700 UVT: 19%
    tarifa = 0.19
    baseUVT = 1090
  } else if (uvtAnual <= 4100) {
    // 1.700 - 4.100 UVT: 28%
    tarifa = 0.28
    baseUVT = 1700
  } else if (uvtAnual <= 8670) {
    // 4.100 - 8.670 UVT: 33%
    tarifa = 0.33
    baseUVT = 4100
  } else if (uvtAnual <= 18970) {
    // 8.670 - 18.970 UVT: 35%
    tarifa = 0.35
    baseUVT = 8670
  } else if (uvtAnual <= 31000) {
    // 18.970 - 31.000 UVT: 37%
    tarifa = 0.37
    baseUVT = 18970
  } else {
    // > 31.000 UVT: 39%
    tarifa = 0.39
    baseUVT = 31000
  }

  const baseRetencion = (uvtAnual - baseUVT) * UVT
  const retencion = baseRetencion * tarifa
  const ingresoNeto = ingresoAnual - retencion

  return {
    ingresoMensual,
    ingresoAnual,
    uvtAnual,
    baseRetencion,
    retencion,
    ingresoNeto,
    tarifa,
  }
}

/**
 * 2. CALCULADORA DE IVA
 */
export interface CalculoIVA {
  valorBase: number
  porcentajeIVA: number
  valorIVA: number
  valorTotal: number
}

export function calcularIVA(
  valorBase: number,
  porcentajeIVA: number = CONSTANTES_2025.IVA_GENERAL
): CalculoIVA {
  const valorIVA = valorBase * porcentajeIVA
  const valorTotal = valorBase + valorIVA

  return {
    valorBase,
    porcentajeIVA,
    valorIVA,
    valorTotal,
  }
}

/**
 * Calcular valor base desde valor total (reverse)
 */
export function calcularBaseDesdeTotal(
  valorTotal: number,
  porcentajeIVA: number = CONSTANTES_2025.IVA_GENERAL
): CalculoIVA {
  const valorBase = valorTotal / (1 + porcentajeIVA)
  const valorIVA = valorTotal - valorBase

  return {
    valorBase,
    porcentajeIVA,
    valorIVA,
    valorTotal,
  }
}

/**
 * 3. PROYECCIÓN DE APORTES PILA ANUAL
 */
export interface ProyeccionPILA {
  ingresoMensual: number
  ibc: number
  aportes: {
    mensual: {
      salud: number
      pension: number
      arl: number
      total: number
    }
    anual: {
      salud: number
      pension: number
      arl: number
      total: number
    }
  }
  porcentajes: {
    salud: number
    pension: number
    arl: number
  }
}

export function proyectarAportesPILA(
  ingresoMensual: number,
  nivelRiesgo: 'I' | 'II' | 'III' | 'IV' | 'V' = 'I'
): ProyeccionPILA {
  const { SMMLV, SALUD, PENSION, ARL_RIESGOS } = CONSTANTES_2025

  // IBC: mínimo 1 SMMLV, máximo 25 SMMLV
  let ibc = ingresoMensual
  if (ibc < SMMLV) ibc = SMMLV
  if (ibc > SMMLV * 25) ibc = SMMLV * 25

  // Cálculos mensuales
  const saludMensual = ibc * SALUD
  const pensionMensual = ibc * PENSION
  const arlMensual = ibc * ARL_RIESGOS[nivelRiesgo]
  const totalMensual = saludMensual + pensionMensual + arlMensual

  // Cálculos anuales
  const saludAnual = saludMensual * 12
  const pensionAnual = pensionMensual * 12
  const arlAnual = arlMensual * 12
  const totalAnual = totalMensual * 12

  return {
    ingresoMensual,
    ibc,
    aportes: {
      mensual: {
        salud: saludMensual,
        pension: pensionMensual,
        arl: arlMensual,
        total: totalMensual,
      },
      anual: {
        salud: saludAnual,
        pension: pensionAnual,
        arl: arlAnual,
        total: totalAnual,
      },
    },
    porcentajes: {
      salud: SALUD,
      pension: PENSION,
      arl: ARL_RIESGOS[nivelRiesgo],
    },
  }
}

/**
 * 4. SIMULADOR DE RÉGIMEN TRIBUTARIO
 */
export interface SimulacionRegimen {
  ingresoAnual: number
  gastosDeducibles: number
  regimenSimple: {
    tarifa: number
    impuesto: number
    ingresoNeto: number
  }
  regimenOrdinario: {
    rentaLiquida: number
    tarifa: number
    impuesto: number
    ingresoNeto: number
  }
  diferencia: number
  regimenMasConveniente: 'SIMPLE' | 'ORDINARIO'
  recomendacion: string
}

export function simularRegimenes(
  ingresoAnual: number,
  gastosDeducibles: number = 0
): SimulacionRegimen {
  const { UVT } = CONSTANTES_2025
  const uvtAnual = ingresoAnual / UVT

  // RÉGIMEN SIMPLE: Tarifa única sobre ingresos brutos
  let tarifaSimple = 0
  if (uvtAnual <= 1400) {
    tarifaSimple = 0.015 // 1.5%
  } else if (uvtAnual <= 3500) {
    tarifaSimple = 0.03 // 3%
  } else if (uvtAnual <= 7000) {
    tarifaSimple = 0.06 // 6%
  } else if (uvtAnual <= 14000) {
    tarifaSimple = 0.09 // 9%
  } else if (uvtAnual <= 80000) {
    tarifaSimple = 0.135 // 13.5%
  } else {
    // Fuera del umbral
    tarifaSimple = 0
  }

  const impuestoSimple = ingresoAnual * tarifaSimple
  const netoSimple = ingresoAnual - impuestoSimple

  // RÉGIMEN ORDINARIO: Tarifa progresiva sobre renta líquida
  const rentaLiquida = ingresoAnual - gastosDeducibles
  const uvtRentaLiquida = rentaLiquida / UVT

  let tarifaOrdinario = 0
  let impuestoOrdinario = 0

  if (uvtRentaLiquida <= 1090) {
    tarifaOrdinario = 0
    impuestoOrdinario = 0
  } else if (uvtRentaLiquida <= 1700) {
    tarifaOrdinario = 0.19
    impuestoOrdinario = (uvtRentaLiquida - 1090) * UVT * 0.19
  } else if (uvtRentaLiquida <= 4100) {
    impuestoOrdinario = (1700 - 1090) * UVT * 0.19
    impuestoOrdinario += (uvtRentaLiquida - 1700) * UVT * 0.28
    tarifaOrdinario = impuestoOrdinario / rentaLiquida
  } else if (uvtRentaLiquida <= 8670) {
    impuestoOrdinario = (1700 - 1090) * UVT * 0.19
    impuestoOrdinario += (4100 - 1700) * UVT * 0.28
    impuestoOrdinario += (uvtRentaLiquida - 4100) * UVT * 0.33
    tarifaOrdinario = impuestoOrdinario / rentaLiquida
  } else if (uvtRentaLiquida <= 18970) {
    impuestoOrdinario = (1700 - 1090) * UVT * 0.19
    impuestoOrdinario += (4100 - 1700) * UVT * 0.28
    impuestoOrdinario += (8670 - 4100) * UVT * 0.33
    impuestoOrdinario += (uvtRentaLiquida - 8670) * UVT * 0.35
    tarifaOrdinario = impuestoOrdinario / rentaLiquida
  } else {
    impuestoOrdinario = (1700 - 1090) * UVT * 0.19
    impuestoOrdinario += (4100 - 1700) * UVT * 0.28
    impuestoOrdinario += (8670 - 4100) * UVT * 0.33
    impuestoOrdinario += (18970 - 8670) * UVT * 0.35
    impuestoOrdinario += (uvtRentaLiquida - 18970) * UVT * 0.37
    tarifaOrdinario = impuestoOrdinario / rentaLiquida
  }

  const netoOrdinario = ingresoAnual - impuestoOrdinario

  // Comparación
  const diferencia = impuestoSimple - impuestoOrdinario
  const regimenMasConveniente = diferencia > 0 ? 'ORDINARIO' : 'SIMPLE'

  let recomendacion = ''
  if (uvtAnual > 80000) {
    recomendacion =
      'Estás fuera del umbral del Régimen Simple. Debes usar Régimen Ordinario.'
  } else if (gastosDeducibles > ingresoAnual * 0.3) {
    recomendacion =
      'Con gastos altos, el Régimen Ordinario es más conveniente porque permite deducciones.'
  } else if (diferencia < 0) {
    recomendacion = `El Régimen Simple te ahorra ${Math.abs(
      diferencia
    ).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} al año.`
  } else {
    recomendacion = `El Régimen Ordinario te ahorra ${diferencia.toLocaleString(
      'es-CO',
      { style: 'currency', currency: 'COP' }
    )} al año.`
  }

  return {
    ingresoAnual,
    gastosDeducibles,
    regimenSimple: {
      tarifa: tarifaSimple,
      impuesto: impuestoSimple,
      ingresoNeto: netoSimple,
    },
    regimenOrdinario: {
      rentaLiquida,
      tarifa: tarifaOrdinario,
      impuesto: impuestoOrdinario,
      ingresoNeto: netoOrdinario,
    },
    diferencia,
    regimenMasConveniente,
    recomendacion,
  }
}

/**
 * 5. CONVERSOR UVT ↔ COP
 */
export interface ConversionUVT {
  uvt: number
  cop: number
  uvtValor: number
}

export function convertirUVTaCOP(uvt: number): ConversionUVT {
  const { UVT } = CONSTANTES_2025
  const cop = uvt * UVT

  return {
    uvt,
    cop,
    uvtValor: UVT,
  }
}

export function convertirCOPaUVT(cop: number): ConversionUVT {
  const { UVT } = CONSTANTES_2025
  const uvt = cop / UVT

  return {
    uvt,
    cop,
    uvtValor: UVT,
  }
}
