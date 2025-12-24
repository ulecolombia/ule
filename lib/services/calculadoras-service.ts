/**
 * SERVICIO DE CALCULADORAS TRIBUTARIAS
 * Cálculos según normativa colombiana 2025
 */

import { calcularImpuestoOrdinario } from '@/lib/calculators/regimen-ordinario'
import { calcularImpuestoSimple } from '@/lib/calculators/regimen-simple'
import type {
  DatosEntradaSimulador,
  ComparacionRegimenes,
  OportunidadAhorro,
  ResultadoRegimenOrdinario,
  ResultadoRegimenSimple,
} from '@/lib/types/simulador-tributario'

/**
 * Constantes tributarias Colombia 2025
 * UVT: Resolución DIAN 000193 de diciembre 4 de 2024
 */
export const CONSTANTES_2025 = {
  UVT: 49799, // CORREGIDO - Resolución DIAN 000193 de 2024
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

/**
 * Simulador de regímenes - Versión básica (compatibilidad)
 * @deprecated Usar simularRegimenesCompleto para acceso a todas las funcionalidades
 */
export function simularRegimenes(
  ingresoAnual: number,
  gastosDeducibles: number = 0
): SimulacionRegimen {
  // Crear datos básicos para el nuevo motor
  const datosBasicos: DatosEntradaSimulador = {
    ingresosBrutosAnuales: ingresoAnual,
    actividadEconomica: 'PROFESIONAL_LIBERAL',
    costosGastos: gastosDeducibles,
    dependientes: 0,
    comprasFacturaElectronica: 0,
    aportesVoluntariosPension: 0,
    aportesAFC: 0,
    interesesViviendaAnuales: 0,
    medicinaPrepagadaAnual: 0,
    aplicarRentaExenta25: gastosDeducibles === 0, // Solo si no tiene gastos
    pagosRecibidosElectronicos: 0,
    gmfPagadoAnual: 0,
  }

  // Calcular con nuevos motores
  const ordinario = calcularImpuestoOrdinario(datosBasicos)
  const simple = calcularImpuestoSimple(datosBasicos)

  // Convertir al formato anterior para compatibilidad
  const diferencia = simple.impuestoSimpleNeto - ordinario.impuestoNeto
  const regimenMasConveniente = diferencia > 0 ? 'ORDINARIO' : 'SIMPLE'

  let recomendacion = ''
  if (!simple.esElegible) {
    recomendacion =
      'No eres elegible para el Régimen Simple. ' +
      simple.razonesNoElegible.join(' ')
  } else if (gastosDeducibles > ingresoAnual * 0.3) {
    recomendacion =
      'Con gastos altos, el Régimen Ordinario es más conveniente porque permite deducciones.'
  } else if (diferencia < 0) {
    recomendacion = `El Régimen Simple te ahorra ${formatearMoneda(Math.abs(diferencia))} al año.`
  } else {
    recomendacion = `El Régimen Ordinario te ahorra ${formatearMoneda(diferencia)} al año.`
  }

  return {
    ingresoAnual,
    gastosDeducibles,
    regimenSimple: {
      tarifa: simple.tarifaConsolidada,
      impuesto: simple.impuestoSimpleNeto,
      ingresoNeto: ingresoAnual - simple.impuestoSimpleNeto,
    },
    regimenOrdinario: {
      rentaLiquida: ordinario.rentaLiquidaGravable,
      tarifa: ordinario.tarifaEfectiva,
      impuesto: ordinario.impuestoNeto,
      ingresoNeto: ingresoAnual - ordinario.impuestoNeto,
    },
    diferencia,
    regimenMasConveniente,
    recomendacion,
  }
}

/**
 * Simulador de regímenes - Versión completa con todas las deducciones
 */
export function simularRegimenesCompleto(
  datos: DatosEntradaSimulador
): ComparacionRegimenes {
  const ordinario = calcularImpuestoOrdinario(datos)
  const simple = calcularImpuestoSimple(datos)

  // Calcular diferencia (positivo = RST ahorra)
  const diferencia = ordinario.impuestoNeto - simple.impuestoSimpleNeto
  const mayorImpuesto = Math.max(
    ordinario.impuestoNeto,
    simple.impuestoSimpleNeto
  )
  const porcentajeAhorro =
    mayorImpuesto > 0 ? (Math.abs(diferencia) / mayorImpuesto) * 100 : 0

  // Determinar régimen recomendado
  let regimenRecomendado: 'ORDINARIO' | 'SIMPLE' =
    diferencia > 0 ? 'SIMPLE' : 'ORDINARIO'

  // Si no es elegible para RST, forzar ordinario
  if (!simple.esElegible) {
    regimenRecomendado = 'ORDINARIO'
  }

  // Generar razones de recomendación
  const razonesRecomendacion = generarRazonesRecomendacion(
    datos,
    ordinario,
    simple,
    diferencia
  )

  // Identificar oportunidades de ahorro
  const oportunidadesAhorro = identificarOportunidadesAhorro(datos, ordinario)

  // Generar advertencias
  const advertencias = generarAdvertencias(datos, simple)

  return {
    datosEntrada: datos,
    fechaSimulacion: new Date(),
    regimenOrdinario: ordinario,
    regimenSimple: simple,
    diferencia,
    porcentajeAhorro,
    regimenRecomendado,
    razonesRecomendacion,
    oportunidadesAhorro,
    advertencias,
  }
}

/**
 * Genera razones explicativas de la recomendación
 */
function generarRazonesRecomendacion(
  datos: DatosEntradaSimulador,
  ordinario: ResultadoRegimenOrdinario,
  simple: ResultadoRegimenSimple,
  diferencia: number
): string[] {
  const razones: string[] = []

  if (!simple.esElegible) {
    razones.push(
      ...simple.razonesNoElegible.map((r: string) => `No elegible: ${r}`)
    )
    return razones
  }

  if (diferencia > 0) {
    razones.push(
      `El Régimen Simple te ahorra ${formatearMoneda(diferencia)} al año`
    )

    if (simple.anticipos.exentoAnticipos) {
      razones.push('No pagas anticipos bimestrales (ingresos < 3.500 UVT)')
    }

    razones.push('No te practican retención en la fuente en cada pago')
    razones.push('Declaración unificada más simple')
  } else {
    razones.push(
      `El Régimen Ordinario te ahorra ${formatearMoneda(Math.abs(diferencia))} al año`
    )

    if (datos.costosGastos > datos.ingresosBrutosAnuales * 0.2) {
      razones.push(
        'Tus gastos deducibles reducen significativamente la base gravable'
      )
    }

    if (ordinario.deducciones.totalDeduccionesOrdinario > 0) {
      razones.push(
        'Aprovechas deducciones personales (dependientes, vivienda, etc.)'
      )
    }
  }

  return razones
}

/**
 * Identifica oportunidades de ahorro no aprovechadas
 */
function identificarOportunidadesAhorro(
  datos: DatosEntradaSimulador,
  _ordinario: ResultadoRegimenOrdinario
): OportunidadAhorro[] {
  const oportunidades: OportunidadAhorro[] = []
  const UVT = CONSTANTES_2025.UVT

  // 1. Dependientes
  if (datos.dependientes < 4) {
    const ahorroEstimado = (4 - datos.dependientes) * 72 * UVT * 0.25 // Aprox 25% marginal
    oportunidades.push({
      tipo: 'DEPENDIENTES',
      titulo: 'Deducción por dependientes',
      descripcion: `Puedes deducir ${(72 * UVT).toLocaleString()} por cada dependiente (máx. 4)`,
      ahorroEstimado,
      comoAprovechar:
        'Registra tus dependientes (hijos, cónyuge sin ingresos, padres mayores) en tu declaración',
      porcentajeAprovechado: (datos.dependientes / 4) * 100,
      limiteMaximo: 4 * 72 * UVT,
    })
  }

  // 2. Compras con factura electrónica
  if (datos.comprasFacturaElectronica === 0) {
    const limiteDeduccion = 240 * UVT
    oportunidades.push({
      tipo: 'COMPRAS_FE',
      titulo: '1% de compras con factura electrónica',
      descripcion: `Deduce el 1% de tus compras personales hasta ${formatearMoneda(limiteDeduccion)}`,
      ahorroEstimado: limiteDeduccion * 0.25, // Aprox 25% marginal
      comoAprovechar:
        'Pide factura electrónica en todas tus compras personales (supermercados, restaurantes, etc.)',
      porcentajeAprovechado: 0,
      limiteMaximo: limiteDeduccion,
    })
  }

  // 3. AFC/Pensión voluntaria
  if (datos.aportesAFC + datos.aportesVoluntariosPension === 0) {
    const limite = 2500 * UVT
    oportunidades.push({
      tipo: 'AFC',
      titulo: 'Aportes AFC o pensión voluntaria',
      descripcion: `Ahorra impuestos aportando a AFC o pensión voluntaria (hasta ${formatearMoneda(limite)})`,
      ahorroEstimado: limite * 0.15 * 0.25, // 15% de aporte típico al 25% marginal
      comoAprovechar:
        'Abre una cuenta AFC en tu banco o haz aportes voluntarios a tu fondo de pensiones',
      porcentajeAprovechado: 0,
      limiteMaximo: limite,
    })
  }

  // 4. Pagos electrónicos (para RST)
  if (
    datos.pagosRecibidosElectronicos === 0 &&
    datos.ingresosBrutosAnuales > 0
  ) {
    const descuentoPotencial = datos.ingresosBrutosAnuales * 0.5 * 0.005 // 50% de ingresos por tarjeta
    oportunidades.push({
      tipo: 'PAGOS_ELECTRONICOS',
      titulo: 'Descuento por pagos electrónicos (RST)',
      descripcion:
        'En Régimen Simple, obtén 0.5% de descuento por pagos recibidos con tarjeta o PSE',
      ahorroEstimado: descuentoPotencial,
      comoAprovechar:
        'Acepta pagos con tarjeta de crédito/débito o transferencias bancarias',
      porcentajeAprovechado: 0,
      limiteMaximo: datos.ingresosBrutosAnuales * 0.005,
    })
  }

  return oportunidades
}

/**
 * Genera advertencias importantes
 */
function generarAdvertencias(
  datos: DatosEntradaSimulador,
  _simple: ResultadoRegimenSimple
): string[] {
  const advertencias: string[] = []
  const UVT = CONSTANTES_2025.UVT

  // Cerca del límite de RST
  const umbralRST = 100000 * UVT
  if (
    datos.ingresosBrutosAnuales > umbralRST * 0.8 &&
    datos.ingresosBrutosAnuales < umbralRST
  ) {
    advertencias.push(
      'Tus ingresos están cerca del límite del Régimen Simple. Si crecen, podrías perder elegibilidad.'
    )
  }

  return advertencias
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

/**
 * Helper para formatear valores como moneda colombiana
 */
function formatearMoneda(valor: number): string {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Re-exportar tipos y funciones de los nuevos calculadores para conveniencia
export { calcularImpuestoOrdinario } from '@/lib/calculators/regimen-ordinario'
export {
  calcularImpuestoSimple,
  verificarElegibilidadRST,
  getCalendarioAnticiposRST,
  getResumenTarifasRST,
} from '@/lib/calculators/regimen-simple'
export type {
  DatosEntradaSimulador,
  ComparacionRegimenes,
  ResultadoRegimenOrdinario,
  ResultadoRegimenSimple,
  OportunidadAhorro,
  ActividadEconomicaRST,
} from '@/lib/types/simulador-tributario'
