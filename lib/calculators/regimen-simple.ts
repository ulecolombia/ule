/**
 * MOTOR DE CÁLCULO - RÉGIMEN SIMPLE DE TRIBUTACIÓN (RST)
 * ULE Colombia - 2025
 *
 * Implementa el cálculo del impuesto unificado del RST
 * según Art. 908 E.T. y Sentencia C-540/2023 para profesiones liberales
 */

import {
  getValoresVigentes,
  formatCurrency,
  TARIFAS_RST_PROFESIONALES,
  ANTICIPOS_BIMESTRALES_PROFESIONALES,
  BENEFICIOS_RST,
} from '@/lib/constants/tributarios'
import type {
  DatosEntradaSimulador,
  ResultadoRegimenSimple,
  AnticipoRST,
  BeneficioRST,
  PasoCalculo,
  ActividadEconomicaRST,
} from '@/lib/types/simulador-tributario'

/**
 * Tarifas RST por tipo de actividad (actividades NO profesionales)
 * Art. 908 E.T.
 */
const TARIFAS_RST_POR_ACTIVIDAD = {
  // Numeral 1: Tiendas pequeñas, mini-mercados, micro-mercados y peluquerías
  TIENDA_PELUQUERIA: [
    { desdeUVT: 0, hastaUVT: 6000, tarifa: 0.011 },
    { desdeUVT: 6000, hastaUVT: 15000, tarifa: 0.017 },
    { desdeUVT: 15000, hastaUVT: 30000, tarifa: 0.039 },
    { desdeUVT: 30000, hastaUVT: 100000, tarifa: 0.054 },
  ],
  // Numeral 2: Actividades comerciales, industriales y de servicios
  COMERCIAL: [
    { desdeUVT: 0, hastaUVT: 6000, tarifa: 0.018 },
    { desdeUVT: 6000, hastaUVT: 15000, tarifa: 0.032 },
    { desdeUVT: 15000, hastaUVT: 30000, tarifa: 0.069 },
    { desdeUVT: 30000, hastaUVT: 100000, tarifa: 0.098 },
  ],
  SERVICIOS_TECNICOS: [
    { desdeUVT: 0, hastaUVT: 6000, tarifa: 0.018 },
    { desdeUVT: 6000, hastaUVT: 15000, tarifa: 0.032 },
    { desdeUVT: 15000, hastaUVT: 30000, tarifa: 0.069 },
    { desdeUVT: 30000, hastaUVT: 100000, tarifa: 0.098 },
  ],
  // Numeral 3: Servicios de expendio de comidas y bebidas
  RESTAURANTE: [
    { desdeUVT: 0, hastaUVT: 6000, tarifa: 0.032 },
    { desdeUVT: 6000, hastaUVT: 15000, tarifa: 0.035 },
    { desdeUVT: 15000, hastaUVT: 30000, tarifa: 0.052 },
    { desdeUVT: 30000, hastaUVT: 100000, tarifa: 0.071 },
  ],
} as const

/**
 * Fechas límite de pago anticipos bimestrales 2025
 * Según calendario tributario DIAN
 */
const FECHAS_LIMITE_ANTICIPOS_2025 = [
  '2025-03-07', // Bimestre 1 (Ene-Feb)
  '2025-05-09', // Bimestre 2 (Mar-Abr)
  '2025-07-11', // Bimestre 3 (May-Jun)
  '2025-09-05', // Bimestre 4 (Jul-Ago)
  '2025-11-07', // Bimestre 5 (Sep-Oct)
  '2026-01-09', // Bimestre 6 (Nov-Dic)
]

const MESES_POR_BIMESTRE = [
  'Enero - Febrero',
  'Marzo - Abril',
  'Mayo - Junio',
  'Julio - Agosto',
  'Septiembre - Octubre',
  'Noviembre - Diciembre',
]

/**
 * Verifica si el contribuyente es elegible para el Régimen Simple
 */
export function verificarElegibilidadRST(
  datos: DatosEntradaSimulador,
  año: number = 2025
): {
  esElegible: boolean
  razones: string[]
} {
  const valores = getValoresVigentes(año)
  const UVT = valores.UVT
  const razones: string[] = []

  // Verificar límite de ingresos (100.000 UVT para todas las actividades desde Sentencia C-540/2023)
  const limiteUVT = valores.UMBRAL_RST_UVT || 100000
  const limiteCOP = limiteUVT * UVT

  if (datos.ingresosBrutosAnuales > limiteCOP) {
    razones.push(
      `Ingresos superan el límite de ${limiteUVT.toLocaleString()} UVT (${formatCurrency(limiteCOP)})`
    )
  }

  // Verificaciones adicionales de elegibilidad
  // (En la práctica hay más requisitos, pero estos son los principales)

  return {
    esElegible: razones.length === 0,
    razones,
  }
}

/**
 * Obtiene las tarifas según el tipo de actividad
 */
function obtenerTarifasActividad(
  actividad: ActividadEconomicaRST,
  año: number = 2025
) {
  if (actividad === 'PROFESIONAL_LIBERAL') {
    return (
      TARIFAS_RST_PROFESIONALES[
        año as keyof typeof TARIFAS_RST_PROFESIONALES
      ] || TARIFAS_RST_PROFESIONALES[2025]
    )
  }

  return (
    TARIFAS_RST_POR_ACTIVIDAD[actividad] || TARIFAS_RST_POR_ACTIVIDAD.COMERCIAL
  )
}

/**
 * Obtiene las tarifas de anticipo según actividad
 */
function obtenerTarifasAnticipo(
  actividad: ActividadEconomicaRST,
  año: number = 2025
) {
  if (actividad === 'PROFESIONAL_LIBERAL') {
    return (
      ANTICIPOS_BIMESTRALES_PROFESIONALES[
        año as keyof typeof ANTICIPOS_BIMESTRALES_PROFESIONALES
      ] || ANTICIPOS_BIMESTRALES_PROFESIONALES[2025]
    )
  }

  // Para otras actividades, usar ~50% de la tarifa consolidada como anticipo
  const tarifas = obtenerTarifasActividad(actividad, año)
  return tarifas.map((t) => ({
    desdeUVT: 'desdeUVT' in t ? t.desdeUVT : 0,
    hastaUVT: 'hastaUVT' in t ? t.hastaUVT : 100000,
    tarifaAnticipo:
      ('tarifaConsolidada' in t ? t.tarifaConsolidada : t.tarifa) * 0.5,
  }))
}

/**
 * Calcula el impuesto bajo el Régimen Simple de Tributación
 */
export function calcularImpuestoSimple(
  datos: DatosEntradaSimulador,
  año: number = 2025
): ResultadoRegimenSimple {
  const valores = getValoresVigentes(año)
  const UVT = valores.UVT
  const beneficiosRST = valores.BENEFICIOS_RST || BENEFICIOS_RST[2025]
  const pasosCalculo: PasoCalculo[] = []
  let orden = 1

  // Verificar elegibilidad
  const { esElegible, razones } = verificarElegibilidadRST(datos, año)

  const ingresosBrutos = datos.ingresosBrutosAnuales
  const ingresosBrutosUVT = ingresosBrutos / UVT

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Ingresos brutos anuales',
    operacion: 'igual',
    valor: ingresosBrutos,
    valorFormateado: formatCurrency(ingresosBrutos),
    detalle: `${ingresosBrutosUVT.toFixed(2)} UVT`,
  })

  // Obtener tarifas según actividad
  const tarifas = obtenerTarifasActividad(datos.actividadEconomica, año)

  // Determinar tarifa según rango
  let rango = tarifas.find((r) => {
    const desde = 'desdeUVT' in r ? r.desdeUVT : 0
    const hasta = 'hastaUVT' in r ? r.hastaUVT : 100000
    return ingresosBrutosUVT >= desde && ingresosBrutosUVT < hasta
  })

  // Fallback al último rango si no se encuentra
  if (!rango) {
    rango = tarifas[tarifas.length - 1]
  }

  // Garantizar que tenemos un rango válido
  const rangoFinal = rango || {
    desdeUVT: 0,
    hastaUVT: 100000,
    tarifaConsolidada: 0.059,
    tarifa: 0.059,
  }

  const tarifaConsolidada =
    'tarifaConsolidada' in rangoFinal
      ? rangoFinal.tarifaConsolidada
      : rangoFinal.tarifa
  const desdeUVT = 'desdeUVT' in rangoFinal ? rangoFinal.desdeUVT : 0
  const hastaUVT = 'hastaUVT' in rangoFinal ? rangoFinal.hastaUVT : 100000
  const rangoAplicado = `${desdeUVT.toLocaleString()} - ${hastaUVT.toLocaleString()} UVT`

  const esProfesional = datos.actividadEconomica === 'PROFESIONAL_LIBERAL'
  const referenciaNormativa = esProfesional
    ? 'Art. 908 num. 6 E.T. (Sentencia C-540/2023)'
    : `Art. 908 E.T.`

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Tarifa consolidada Régimen Simple',
    operacion: 'info',
    valor: tarifaConsolidada,
    valorFormateado: `${(tarifaConsolidada * 100).toFixed(1)}%`,
    detalle: `Rango: ${rangoAplicado} - ${datos.actividadEconomica.replace('_', ' ')}`,
    referenciaNormativa,
  })

  // Calcular impuesto base
  const impuestoSimpleBase = ingresosBrutos * tarifaConsolidada

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Impuesto Simple base',
    operacion: 'multiplicacion',
    valor: impuestoSimpleBase,
    valorFormateado: formatCurrency(impuestoSimpleBase),
    detalle: `${formatCurrency(ingresosBrutos)} × ${(tarifaConsolidada * 100).toFixed(1)}%`,
  })

  // Calcular descuentos
  // 1. Descuento por pagos electrónicos (0.5%)
  const descuentoPagosElectronicos =
    datos.pagosRecibidosElectronicos *
    beneficiosRST.DESCUENTO_PAGOS_ELECTRONICOS

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Descuento pagos electrónicos (0.5%)',
    operacion: 'resta',
    valor: descuentoPagosElectronicos,
    valorFormateado: formatCurrency(descuentoPagosElectronicos),
    detalle: `${formatCurrency(datos.pagosRecibidosElectronicos)} × 0.5%`,
    referenciaNormativa: 'Art. 912 E.T.',
  })

  // 2. Descuento GMF (100% del 4x1000 pagado)
  const descuentoGMF = datos.gmfPagadoAnual * beneficiosRST.GMF_DESCONTABLE

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Descuento GMF (4x1000 pagado)',
    operacion: 'resta',
    valor: descuentoGMF,
    valorFormateado: formatCurrency(descuentoGMF),
    referenciaNormativa: 'Parágrafo 1 Art. 912 E.T.',
  })

  const totalDescuentos = descuentoPagosElectronicos + descuentoGMF

  // Impuesto neto
  const impuestoSimpleNeto = Math.max(impuestoSimpleBase - totalDescuentos, 0)
  const tarifaEfectiva =
    ingresosBrutos > 0 ? impuestoSimpleNeto / ingresosBrutos : 0

  pasosCalculo.push({
    orden: orden++,
    concepto: 'Impuesto Simple neto a pagar',
    operacion: 'igual',
    valor: impuestoSimpleNeto,
    valorFormateado: formatCurrency(impuestoSimpleNeto),
    detalle: `Tarifa efectiva: ${(tarifaEfectiva * 100).toFixed(2)}%`,
  })

  // Calcular anticipos bimestrales
  const exentoAnticipos =
    ingresosBrutosUVT < beneficiosRST.UMBRAL_EXENCION_ANTICIPOS_UVT
  const tarifasAnticipo = obtenerTarifasAnticipo(datos.actividadEconomica, año)
  const anticiposBimestrales = calcularAnticipos(
    ingresosBrutos,
    ingresosBrutosUVT,
    tarifasAnticipo,
    exentoAnticipos
  )

  // Calcular beneficios adicionales
  const beneficiosAdicionales = calcularBeneficiosAdicionales(
    datos,
    ingresosBrutos
  )

  return {
    esElegible,
    razonesNoElegible: razones,
    ingresosBrutos,
    ingresosBrutosUVT,
    rangoAplicado,
    tarifaConsolidada,
    impuestoSimpleBase,
    descuentos: {
      pagosElectronicos: {
        baseCalculo: datos.pagosRecibidosElectronicos,
        porcentaje: beneficiosRST.DESCUENTO_PAGOS_ELECTRONICOS,
        valor: descuentoPagosElectronicos,
      },
      gmf: {
        valorPagado: datos.gmfPagadoAnual,
        porcentajeDescontable: beneficiosRST.GMF_DESCONTABLE,
        valor: descuentoGMF,
      },
      totalDescuentos,
    },
    impuestoSimpleNeto,
    tarifaEfectiva,
    anticipos: {
      exentoAnticipos,
      razonExencion: exentoAnticipos
        ? `Ingresos menores a ${beneficiosRST.UMBRAL_EXENCION_ANTICIPOS_UVT.toLocaleString()} UVT - Solo declaración anual`
        : undefined,
      anticiposBimestrales,
      totalAnualAnticipos: anticiposBimestrales.reduce(
        (sum, a) => sum + a.valorAnticipo,
        0
      ),
    },
    beneficiosAdicionales,
    pasosCalculo,
  }
}

/**
 * Calcula los anticipos bimestrales del RST
 */
function calcularAnticipos(
  ingresosBrutos: number,
  ingresosBrutosUVT: number,
  tablaTarifas: ReadonlyArray<{
    desdeUVT: number
    hastaUVT: number
    tarifaAnticipo: number
  }>,
  exento: boolean
): AnticipoRST[] {
  if (exento) {
    return MESES_POR_BIMESTRE.map((meses, i) => ({
      bimestre: i + 1,
      meses,
      ingresoEstimado: ingresosBrutos / 6,
      tarifaAnticipo: 0,
      valorAnticipo: 0,
      fechaLimitePago: FECHAS_LIMITE_ANTICIPOS_2025[i] || '2025-12-31',
    }))
  }

  const ingresoBimestral = ingresosBrutos / 6

  // Encontrar tarifa de anticipo
  const rango = tablaTarifas.find(
    (r) => ingresosBrutosUVT >= r.desdeUVT && ingresosBrutosUVT < r.hastaUVT
  )

  // Usar la tarifa encontrada o fallback a 3%
  const tarifaAnticipo =
    rango?.tarifaAnticipo ??
    tablaTarifas[tablaTarifas.length - 1]?.tarifaAnticipo ??
    0.03

  return MESES_POR_BIMESTRE.map((meses, i) => ({
    bimestre: i + 1,
    meses,
    ingresoEstimado: ingresoBimestral,
    tarifaAnticipo,
    valorAnticipo: Math.round(ingresoBimestral * tarifaAnticipo),
    fechaLimitePago: FECHAS_LIMITE_ANTICIPOS_2025[i] || '2025-12-31',
  }))
}

/**
 * Calcula los beneficios adicionales del RST
 */
function calcularBeneficiosAdicionales(
  datos: DatosEntradaSimulador,
  ingresosBrutos: number
): BeneficioRST[] {
  const beneficios: BeneficioRST[] = []

  // 1. Exención de retención en la fuente por renta
  // Estimación basada en la actividad
  const tarifasRetencion: Record<ActividadEconomicaRST, number> = {
    PROFESIONAL_LIBERAL: 0.11,
    SERVICIOS_TECNICOS: 0.06,
    COMERCIAL: 0.035,
    TIENDA_PELUQUERIA: 0.015,
    RESTAURANTE: 0.035,
  }
  const tarifaRetencion = tarifasRetencion[datos.actividadEconomica] || 0.04
  const retencionEstimada = ingresosBrutos * 0.7 * tarifaRetencion // ~70% de ingresos con retención

  beneficios.push({
    tipo: 'EXENCION_RETENCION',
    titulo: 'Sin retención en la fuente',
    descripcion:
      'Los pagos que recibe no están sujetos a retención por renta ni ICA, mejorando su flujo de caja.',
    valorEstimado: retencionEstimada,
    aplica: true,
  })

  // 2. Exención de ICA (incluido en tarifa consolidada)
  const icaEstimado = ingresosBrutos * 0.01 // Aproximadamente 1% ICA en la mayoría de ciudades
  beneficios.push({
    tipo: 'EXENCION_ICA',
    titulo: 'ICA incluido en tarifa',
    descripcion:
      'El impuesto de industria y comercio está incluido en la tarifa consolidada. No paga ICA adicional.',
    valorEstimado: icaEstimado,
    aplica: true,
  })

  // 3. Simplificación administrativa
  beneficios.push({
    tipo: 'SIMPLIFICACION',
    titulo: 'Declaración unificada',
    descripcion:
      'Una sola declaración anual que incluye renta e ICA, en lugar de múltiples formularios y declaraciones.',
    aplica: true,
  })

  // 4. Mejor flujo de caja
  beneficios.push({
    tipo: 'FLUJO_CAJA',
    titulo: 'Mejor flujo de caja',
    descripcion:
      'Paga anticipos bimestrales predecibles en lugar de retenciones variables en cada pago que recibe.',
    aplica: true,
  })

  // 5. Simplificación parafiscales (para empleadores)
  // Solo aplica si es empleador, pero lo mostramos como información
  beneficios.push({
    tipo: 'PARAFISCALES',
    titulo: 'Posible simplificación parafiscales',
    descripcion:
      'Si tiene empleados, puede simplificar el pago de aportes parafiscales según el número de trabajadores.',
    aplica: false, // No calculamos el valor porque depende de empleados
  })

  return beneficios
}

/**
 * Obtiene el calendario de anticipos RST para un año
 */
export function getCalendarioAnticiposRST(_año: number = 2025): {
  bimestre: number
  meses: string
  fechaLimite: string
}[] {
  // Fechas varían según el último dígito del NIT
  // Estas son las fechas base (último dígito 0)
  // TODO: Implementar calendario por año cuando se dispongan fechas de otros años
  return MESES_POR_BIMESTRE.map((meses, i) => ({
    bimestre: i + 1,
    meses,
    fechaLimite: FECHAS_LIMITE_ANTICIPOS_2025[i] || '2025-12-31',
  }))
}

/**
 * Obtiene resumen comparativo de tarifas RST por actividad
 */
export function getResumenTarifasRST(año: number = 2025) {
  const valores = getValoresVigentes(año)
  const UVT = valores.UVT

  return {
    profesionalLiberal: {
      actividad: 'Profesiones Liberales',
      referencia: 'Art. 908 num. 6 E.T.',
      tarifas: TARIFAS_RST_PROFESIONALES[2025].map((t) => ({
        rango: `${t.desdeUVT.toLocaleString()} - ${t.hastaUVT.toLocaleString()} UVT`,
        rangoPesos: `${formatCurrency(t.desdeUVT * UVT)} - ${formatCurrency(t.hastaUVT * UVT)}`,
        tarifa: `${(t.tarifaConsolidada * 100).toFixed(1)}%`,
      })),
    },
    comercial: {
      actividad: 'Comercial / Servicios',
      referencia: 'Art. 908 num. 2 E.T.',
      tarifas: TARIFAS_RST_POR_ACTIVIDAD.COMERCIAL.map((t) => ({
        rango: `${t.desdeUVT.toLocaleString()} - ${t.hastaUVT.toLocaleString()} UVT`,
        rangoPesos: `${formatCurrency(t.desdeUVT * UVT)} - ${formatCurrency(t.hastaUVT * UVT)}`,
        tarifa: `${(t.tarifa * 100).toFixed(1)}%`,
      })),
    },
    tienda: {
      actividad: 'Tiendas / Peluquerías',
      referencia: 'Art. 908 num. 1 E.T.',
      tarifas: TARIFAS_RST_POR_ACTIVIDAD.TIENDA_PELUQUERIA.map((t) => ({
        rango: `${t.desdeUVT.toLocaleString()} - ${t.hastaUVT.toLocaleString()} UVT`,
        rangoPesos: `${formatCurrency(t.desdeUVT * UVT)} - ${formatCurrency(t.hastaUVT * UVT)}`,
        tarifa: `${(t.tarifa * 100).toFixed(1)}%`,
      })),
    },
    restaurante: {
      actividad: 'Restaurantes / Comidas',
      referencia: 'Art. 908 num. 3 E.T.',
      tarifas: TARIFAS_RST_POR_ACTIVIDAD.RESTAURANTE.map((t) => ({
        rango: `${t.desdeUVT.toLocaleString()} - ${t.hastaUVT.toLocaleString()} UVT`,
        rangoPesos: `${formatCurrency(t.desdeUVT * UVT)} - ${formatCurrency(t.hastaUVT * UVT)}`,
        tarifa: `${(t.tarifa * 100).toFixed(1)}%`,
      })),
    },
  }
}
