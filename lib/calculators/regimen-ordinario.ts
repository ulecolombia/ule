/**
 * MOTOR DE CÁLCULO - RÉGIMEN ORDINARIO
 * ULE Colombia - 2025
 *
 * Implementa la depuración de la renta según Art. 336 E.T.
 * y el cálculo del impuesto según tabla Art. 241 E.T.
 */

import {
  getValoresVigentes,
  uvtToCOP,
  formatCurrency,
  DEDUCCIONES,
} from '@/lib/constants/tributarios'
import type {
  DatosEntradaSimulador,
  ResultadoRegimenOrdinario,
  DesgloseDeducciones,
  PasoCalculo,
} from '@/lib/types/simulador-tributario'

/**
 * Tabla de impuesto de renta Art. 241 E.T.
 * Personas naturales residentes
 */
const TABLA_RENTA_241 = [
  { desde: 0, hasta: 1090, tarifa: 0, impuestoBaseUVT: 0 },
  { desde: 1090, hasta: 1700, tarifa: 0.19, impuestoBaseUVT: 0 },
  { desde: 1700, hasta: 4100, tarifa: 0.28, impuestoBaseUVT: 116 },
  { desde: 4100, hasta: 8670, tarifa: 0.33, impuestoBaseUVT: 788 },
  { desde: 8670, hasta: 18970, tarifa: 0.35, impuestoBaseUVT: 2296 },
  { desde: 18970, hasta: 31000, tarifa: 0.37, impuestoBaseUVT: 5901 },
  { desde: 31000, hasta: Infinity, tarifa: 0.39, impuestoBaseUVT: 10352 },
] as const

/**
 * Calcula el impuesto de renta bajo el Régimen Ordinario
 * Implementa la depuración de la renta según Art. 336 E.T.
 */
export function calcularImpuestoOrdinario(
  datos: DatosEntradaSimulador,
  año: number = 2025
): ResultadoRegimenOrdinario {
  const valores = getValoresVigentes(año)
  const UVT = valores.UVT
  const deducciones2025 = valores.DEDUCCIONES || DEDUCCIONES[2025]
  const pasosCalculo: PasoCalculo[] = []
  let orden = 1

  // PASO 1: Ingresos brutos
  const ingresosBrutos = datos.ingresosBrutosAnuales
  pasosCalculo.push({
    orden: orden++,
    concepto: 'Ingresos brutos anuales',
    operacion: 'igual',
    valor: ingresosBrutos,
    valorFormateado: formatCurrency(ingresosBrutos),
  })

  // PASO 2: Restar costos y gastos
  const costosGastos = datos.costosGastos || 0
  const ingresosNetos = ingresosBrutos - costosGastos
  pasosCalculo.push({
    orden: orden++,
    concepto: 'Costos y gastos deducibles',
    operacion: 'resta',
    valor: costosGastos,
    valorFormateado: formatCurrency(costosGastos),
  })

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Ingresos netos',
    operacion: 'igual',
    valor: ingresosNetos,
    valorFormateado: formatCurrency(ingresosNetos),
  })

  // PASO 3: Ingresos no constitutivos de renta (aportes obligatorios pensión)
  // Aproximadamente 16% del ingreso base cotización
  const limiteAportesObligatorios = uvtToCOP(2500, año)
  const ingresosNoConstitutivos = Math.min(
    ingresosBrutos * deducciones2025.APORTE_OBLIGATORIO_PENSION,
    limiteAportesObligatorios
  )
  pasosCalculo.push({
    orden: orden++,
    concepto:
      'Ingresos no constitutivos de renta (aportes obligatorios pensión)',
    operacion: 'resta',
    valor: ingresosNoConstitutivos,
    valorFormateado: formatCurrency(ingresosNoConstitutivos),
    referenciaNormativa: 'Art. 55 E.T.',
    detalle: `16% del ingreso, máximo ${formatCurrency(limiteAportesObligatorios)}`,
  })

  // PASO 4: Base para deducciones
  const baseParaDeducciones = ingresosNetos - ingresosNoConstitutivos
  pasosCalculo.push({
    orden: orden++,
    concepto: 'Base para deducciones',
    operacion: 'igual',
    valor: baseParaDeducciones,
    valorFormateado: formatCurrency(baseParaDeducciones),
  })

  // PASO 5: Calcular deducciones detalladas
  const deduccionesCalculadas = calcularDeducciones(
    datos,
    baseParaDeducciones,
    UVT,
    deducciones2025
  )

  // Agregar pasos de deducciones
  pasosCalculo.push({
    orden: orden++,
    concepto: 'Total deducciones y rentas exentas',
    operacion: 'resta',
    valor: deduccionesCalculadas.totalDeduccionesOrdinario,
    valorFormateado: formatCurrency(
      deduccionesCalculadas.totalDeduccionesOrdinario
    ),
    detalle: deduccionesCalculadas.excedeLimite
      ? `Límite aplicado: ${formatCurrency(deduccionesCalculadas.limiteAplicado)} (excede por ${formatCurrency(deduccionesCalculadas.montoExcedido)})`
      : 'Dentro del límite del 40% / 1.340 UVT',
    referenciaNormativa: 'Art. 336 E.T.',
  })

  // PASO 6: Renta líquida gravable
  const rentaLiquidaGravable = Math.max(
    baseParaDeducciones - deduccionesCalculadas.totalDeduccionesOrdinario,
    0
  )
  const rentaLiquidaUVT = rentaLiquidaGravable / UVT

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Renta líquida gravable',
    operacion: 'igual',
    valor: rentaLiquidaGravable,
    valorFormateado: formatCurrency(rentaLiquidaGravable),
    detalle: `${rentaLiquidaUVT.toFixed(2)} UVT`,
  })

  // PASO 7: Calcular impuesto según tabla Art. 241
  const { impuesto, rangoTabla, tarifaMarginal } = calcularImpuestoTabla241(
    rentaLiquidaUVT,
    UVT
  )

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Impuesto de renta (Art. 241 E.T.)',
    operacion: 'igual',
    valor: impuesto,
    valorFormateado: formatCurrency(impuesto),
    detalle: `Rango: ${rangoTabla} - Tarifa marginal: ${(tarifaMarginal * 100).toFixed(0)}%`,
    referenciaNormativa: 'Art. 241 E.T.',
  })

  // PASO 8: Estimar retenciones (aproximación)
  const retencionesEstimadas = estimarRetenciones(
    ingresosBrutos,
    datos.actividadEconomica
  )

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Retenciones en la fuente estimadas',
    operacion: 'resta',
    valor: retencionesEstimadas,
    valorFormateado: formatCurrency(retencionesEstimadas),
    detalle: 'Estimación basada en retención promedio',
  })

  // PASO 9: Impuesto neto
  const impuestoNeto = Math.max(impuesto - retencionesEstimadas, 0)
  const tarifaEfectiva = ingresosBrutos > 0 ? impuesto / ingresosBrutos : 0

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Impuesto neto a pagar',
    operacion: 'igual',
    valor: impuestoNeto,
    valorFormateado: formatCurrency(impuestoNeto),
    detalle: `Tarifa efectiva: ${(tarifaEfectiva * 100).toFixed(2)}%`,
  })

  return {
    ingresosBrutos,
    costosGastos,
    ingresosNetos,
    ingresosNoConstitutivos,
    deducciones: deduccionesCalculadas,
    rentaLiquidaGravable,
    rentaLiquidaUVT,
    rangoTabla,
    tarifaMarginal,
    impuestoBruto: impuesto,
    retencionesEstimadas,
    impuestoNeto,
    tarifaEfectiva,
    pasosCalculo,
  }
}

/**
 * Calcula el desglose de deducciones según Art. 336 E.T.
 */
function calcularDeducciones(
  datos: DatosEntradaSimulador,
  baseCalculo: number,
  UVT: number,
  deducciones2025: (typeof DEDUCCIONES)[2025]
): DesgloseDeducciones {
  // 1. Dependientes (ADICIONAL al límite del 40%)
  const cantidadDependientes = Math.min(
    datos.dependientes,
    deducciones2025.MAX_DEPENDIENTES
  )
  const valorPorDependiente = deducciones2025.DEPENDIENTE_UVT * UVT
  const totalDependientes = cantidadDependientes * valorPorDependiente

  const dependientes = {
    cantidad: cantidadDependientes,
    valorPorDependiente,
    total: totalDependientes,
    esAdicionalAlLimite: true,
  }

  // 2. 1% compras factura electrónica (ADICIONAL al límite del 40%)
  const comprasCalculado =
    datos.comprasFacturaElectronica * deducciones2025.COMPRAS_FE_PORCENTAJE
  const comprasLimite = deducciones2025.COMPRAS_FE_LIMITE_UVT * UVT

  const comprasFacturaElectronica = {
    valorCompras: datos.comprasFacturaElectronica,
    porcentajeAplicado: deducciones2025.COMPRAS_FE_PORCENTAJE,
    deduccionCalculada: comprasCalculado,
    limiteUVT: deducciones2025.COMPRAS_FE_LIMITE_UVT,
    deduccionFinal: Math.min(comprasCalculado, comprasLimite),
    esAdicionalAlLimite: true,
  }

  // 3. Medicina prepagada (sujeta al límite del 40%)
  const medicinaLimite = deducciones2025.MEDICINA_PREPAGADA_ANUAL_UVT * UVT

  const medicinaPrepagada = {
    valorAnual: datos.medicinaPrepagadaAnual,
    limiteUVT: deducciones2025.MEDICINA_PREPAGADA_ANUAL_UVT,
    deduccionFinal: Math.min(datos.medicinaPrepagadaAnual, medicinaLimite),
  }

  // 4. Intereses vivienda (sujeta al límite del 40%)
  const interesesLimite = deducciones2025.INTERESES_VIVIENDA_LIMITE_UVT * UVT

  const interesesVivienda = {
    valorAnual: datos.interesesViviendaAnuales,
    limiteUVT: deducciones2025.INTERESES_VIVIENDA_LIMITE_UVT,
    deduccionFinal: Math.min(datos.interesesViviendaAnuales, interesesLimite),
  }

  // 5. Aportes voluntarios AFC y pensión (sujeta al límite del 40%)
  const aportesTotal = datos.aportesAFC + datos.aportesVoluntariosPension
  const aportesLimite = deducciones2025.AFC_PENSION_LIMITE_UVT * UVT

  const aportesVoluntarios = {
    pension: datos.aportesVoluntariosPension,
    afc: datos.aportesAFC,
    limiteUVT: deducciones2025.AFC_PENSION_LIMITE_UVT,
    deduccionFinal: Math.min(aportesTotal, aportesLimite),
  }

  // 6. Renta exenta 25% (sujeta al límite del 40%)
  // Solo aplica si NO imputa costos y gastos (independientes que optan por el 25%)
  const aplicaRentaExenta =
    datos.aplicarRentaExenta25 && datos.costosGastos === 0
  const rentaExentaLimite = deducciones2025.RENTA_EXENTA_25_LIMITE_UVT * UVT

  // Base para renta exenta: después de otras deducciones sujetas al límite
  const baseRentaExenta =
    baseCalculo -
    medicinaPrepagada.deduccionFinal -
    interesesVivienda.deduccionFinal -
    aportesVoluntarios.deduccionFinal

  const rentaExentaCalculada = aplicaRentaExenta
    ? Math.max(baseRentaExenta, 0) * 0.25
    : 0

  const rentaExenta25 = {
    aplica: aplicaRentaExenta,
    baseCalculo: Math.max(baseRentaExenta, 0),
    porcentaje: 0.25,
    valorCalculado: rentaExentaCalculada,
    limiteUVT: deducciones2025.RENTA_EXENTA_25_LIMITE_UVT,
    valorFinal: Math.min(rentaExentaCalculada, rentaExentaLimite),
  }

  // CALCULAR LÍMITES GLOBALES
  // Deducciones sujetas al límite del 40%
  const subtotalSujetoALimite =
    medicinaPrepagada.deduccionFinal +
    interesesVivienda.deduccionFinal +
    aportesVoluntarios.deduccionFinal +
    rentaExenta25.valorFinal

  // Deducciones ADICIONALES (no cuentan para el límite)
  const subtotalAdicionalAlLimite =
    dependientes.total + comprasFacturaElectronica.deduccionFinal

  // Calcular límites
  const limiteGlobal40Porciento =
    baseCalculo * deducciones2025.LIMITE_PORCENTUAL
  const limiteGlobal1340UVT = deducciones2025.LIMITE_UVT * UVT
  const limiteAplicado = Math.min(limiteGlobal40Porciento, limiteGlobal1340UVT)

  // Aplicar límite a las deducciones sujetas
  const deduccionesSujetasLimitadas = Math.min(
    subtotalSujetoALimite,
    limiteAplicado
  )

  // Total final = sujetas (limitadas) + adicionales
  const totalDeduccionesOrdinario =
    deduccionesSujetasLimitadas + subtotalAdicionalAlLimite

  const excedeLimite = subtotalSujetoALimite > limiteAplicado
  const montoExcedido = excedeLimite
    ? subtotalSujetoALimite - limiteAplicado
    : 0

  return {
    dependientes,
    comprasFacturaElectronica,
    medicinaPrepagada,
    interesesVivienda,
    aportesVoluntarios,
    rentaExenta25,
    subtotalSujetoALimite,
    subtotalAdicionalAlLimite,
    limiteGlobal40Porciento,
    limiteGlobal1340UVT,
    limiteAplicado,
    totalDeduccionesOrdinario,
    excedeLimite,
    montoExcedido,
  }
}

/**
 * Calcula el impuesto según la tabla del Art. 241 E.T.
 */
function calcularImpuestoTabla241(
  rentaLiquidaUVT: number,
  UVT: number
): {
  impuesto: number
  rangoTabla: string
  tarifaMarginal: number
} {
  if (rentaLiquidaUVT <= 0) {
    return {
      impuesto: 0,
      rangoTabla: 'Sin impuesto (0 - 1.090 UVT)',
      tarifaMarginal: 0,
    }
  }

  // Encontrar el rango - garantizado que siempre encuentra uno porque
  // la tabla tiene un rango de 0-1090 y uno hasta Infinity
  let rango = TABLA_RENTA_241.find(
    (r) => rentaLiquidaUVT > r.desde && rentaLiquidaUVT <= r.hasta
  )

  // Fallback al último rango si no se encuentra (caso extremo)
  if (!rango) {
    rango = TABLA_RENTA_241[6] // Último rango (31000+)
  }

  // Calcular impuesto
  let impuestoUVT = 0
  if (rango.tarifa > 0) {
    impuestoUVT =
      (rentaLiquidaUVT - rango.desde) * rango.tarifa + rango.impuestoBaseUVT
  }

  const impuesto = impuestoUVT * UVT
  const rangoTabla =
    rango.hasta === Infinity
      ? `${rango.desde.toLocaleString()} UVT en adelante`
      : `${rango.desde.toLocaleString()} - ${rango.hasta.toLocaleString()} UVT`

  return {
    impuesto: Math.round(impuesto),
    rangoTabla,
    tarifaMarginal: rango.tarifa,
  }
}

/**
 * Estima las retenciones en la fuente anuales
 * Basado en tarifas de retención para honorarios/servicios
 */
function estimarRetenciones(
  ingresosBrutos: number,
  actividad: DatosEntradaSimulador['actividadEconomica']
): number {
  // Tarifas de retención según actividad
  const tarifasRetencion: Record<typeof actividad, number> = {
    PROFESIONAL_LIBERAL: 0.11, // 11% honorarios
    SERVICIOS_TECNICOS: 0.06, // 6% servicios técnicos
    COMERCIAL: 0.035, // 3.5% compras
    TIENDA_PELUQUERIA: 0.015, // 1.5% servicios
    RESTAURANTE: 0.035, // 3.5% compras
  }

  const tarifaAplicable = tarifasRetencion[actividad] || 0.04

  // Asumir que ~70% de ingresos tienen retención
  return Math.round(ingresosBrutos * 0.7 * tarifaAplicable)
}

/**
 * Obtiene la tabla de impuesto Art. 241 para mostrar en la UI
 */
export function getTablaRenta241(UVT: number) {
  return TABLA_RENTA_241.map((rango) => ({
    ...rango,
    desdePesos: rango.desde * UVT,
    hastaPesos: rango.hasta === Infinity ? Infinity : rango.hasta * UVT,
    impuestoBasePesos: rango.impuestoBaseUVT * UVT,
  }))
}

/**
 * Verifica si una persona está obligada a declarar renta
 * Según umbrales del Art. 592 E.T.
 */
export function estaObligadoADeclararRenta(
  ingresosBrutos: number,
  patrimonioBruto: number,
  año: number = 2025
): {
  obligado: boolean
  razones: string[]
} {
  const valores = getValoresVigentes(año)
  const UVT = valores.UVT
  const razones: string[] = []

  // Umbral de ingresos: 1.400 UVT
  const umbralIngresos = 1400 * UVT
  if (ingresosBrutos > umbralIngresos) {
    razones.push(
      `Ingresos brutos (${formatCurrency(ingresosBrutos)}) superan ${formatCurrency(umbralIngresos)} (1.400 UVT)`
    )
  }

  // Umbral de patrimonio: 4.500 UVT
  const umbralPatrimonio = 4500 * UVT
  if (patrimonioBruto > umbralPatrimonio) {
    razones.push(
      `Patrimonio bruto (${formatCurrency(patrimonioBruto)}) supera ${formatCurrency(umbralPatrimonio)} (4.500 UVT)`
    )
  }

  return {
    obligado: razones.length > 0,
    razones,
  }
}
