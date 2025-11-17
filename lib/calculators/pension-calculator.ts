/**
 * CALCULADORA PENSIONAL COLOMBIA
 * Cálculos basados en Ley 100 de 1993
 * Régimen de Prima Media (RPM) y Régimen de Ahorro Individual con Solidaridad (RAIS)
 *
 * VERSIÓN: 2.0.0 (Corregida - Auditoría Técnica)
 * ÚLTIMA ACTUALIZACIÓN: 2025-01-13
 */

import { getConstantesActuales } from '@/lib/config/constantes-colombia'

const CONSTANTES = getConstantesActuales()

export interface DatosPensionales {
  edadActual: number
  genero: 'M' | 'F'
  ingresoMensual: number
  semanasActuales: number
  regimen: 'RPM' | 'RAIS'
  fondoPension?: string
  rentabilidadEsperada?: number // % anual (solo RAIS)
  saldoAcumulado?: number // Solo para RAIS
}

export interface ResultadoPension {
  // Información general
  edadPension: number
  semanasRequeridas: number
  semanasFaltantes: number
  añosFaltantes: number
  puedesPensionarte: boolean

  // Cálculos RPM
  ibl?: number // Ingreso Base de Liquidación
  porcentajePension?: number
  pensionMensualRPM?: number

  // Cálculos RAIS
  saldoProyectado?: number
  pensionMensualRAIS?: number
  rentabilidadAcumulada?: number

  // Comparativa
  diferenciaMensual?: number
  regimenRecomendado?: 'RPM' | 'RAIS'

  // Mensajes
  recomendaciones: string[]
  advertencias: string[]
}

export interface ProyeccionAnual {
  año: number
  edad: number
  semanas: number
  aporteAnual: number
  saldoAcumulado: number
  pensionProyectadaRPM: number
  pensionProyectadaRAIS: number
}

/**
 * Calcula el IBL (Ingreso Base de Liquidación)
 *
 * IMPORTANTE: Esta es una SIMPLIFICACIÓN. El IBL real es el promedio de los salarios
 * de los últimos 10 años ajustados por IPC. Esta función asume ingreso constante.
 *
 * @param ingresoMensual - Ingreso mensual actual
 * @returns IBL calculado (limitado a 25 SMMLV)
 */
export function calcularIBL(ingresoMensual: number): number {
  // NOTA: Simplificación - en producción debería recibir historial de salarios
  return Math.min(ingresoMensual, CONSTANTES.SMMLV * CONSTANTES.TOPE_IBL_SMMLV)
}

/**
 * Calcula el porcentaje de pensión según semanas cotizadas
 *
 * Fórmula Ley 100:
 * - Base: 65% con 1,300 semanas
 * - Adicional: 1.5% por cada 50 semanas adicionales
 * - Máximo: 80%
 *
 * @param semanas - Semanas cotizadas
 * @returns Porcentaje de pensión (0-80)
 */
export function calcularPorcentajePension(semanas: number): number {
  if (semanas < CONSTANTES.SEMANAS_MINIMAS) {
    return 0
  }

  const semanasBase = CONSTANTES.SEMANAS_MINIMAS
  const semanasAdicionales = semanas - semanasBase
  const gruposAdicionales = Math.floor(semanasAdicionales / 50)

  const porcentajeBase = CONSTANTES.PORCENTAJE_BASE_PENSION
  const porcentajeAdicional =
    gruposAdicionales * CONSTANTES.PORCENTAJE_ADICIONAL_POR_50_SEMANAS

  return Math.min(
    porcentajeBase + porcentajeAdicional,
    CONSTANTES.PORCENTAJE_MAXIMO_PENSION
  )
}

/**
 * Calcula la pensión en Régimen de Prima Media (Colpensiones)
 */
export function calcularPensionPrimaMedia(datos: DatosPensionales): {
  ibl: number
  porcentaje: number
  pensionMensual: number
  pensionMinima: number
  pensionMaxima: number
} {
  const ibl = calcularIBL(datos.ingresoMensual)
  const porcentaje = calcularPorcentajePension(datos.semanasActuales)

  const pensionCalculada = (ibl * porcentaje) / 100
  const pensionMinima = CONSTANTES.SMMLV * CONSTANTES.PENSION_MINIMA_SMMLV
  const pensionMaxima = CONSTANTES.SMMLV * CONSTANTES.TOPE_IBL_SMMLV

  // La pensión RPM SÍ garantiza mínimo de 1 SMMLV (si cumple requisitos)
  const pensionMensual = Math.max(
    pensionMinima,
    Math.min(pensionCalculada, pensionMaxima)
  )

  return {
    ibl,
    porcentaje,
    pensionMensual,
    pensionMinima,
    pensionMaxima,
  }
}

/**
 * Calcula la tasa de interés mensual efectiva desde la tasa anual
 *
 * CORRECCIÓN: No es simplemente anual/12, sino (1+r)^(1/12)-1
 *
 * @param tasaAnual - Tasa anual decimal (ej: 0.05 para 5%)
 * @returns Tasa mensual efectiva
 */
function calcularTasaMensualEfectiva(tasaAnual: number): number {
  return Math.pow(1 + tasaAnual, 1 / 12) - 1
}

/**
 * Calcula la pensión en Régimen de Ahorro Individual con Solidaridad
 *
 * CORRECCIÓN v2.0:
 * - Capitalización mensual (no anual)
 * - Tasa mensual efectiva correcta
 * - Expectativa de vida por género
 * - NO garantiza pensión mínima (solo RPM la garantiza)
 */
export function calcularPensionAhorroIndividual(datos: DatosPensionales): {
  saldoProyectado: number
  pensionMensual: number
  rentabilidadTotal: number
  aporteTotal: number
} {
  const edadPension =
    datos.genero === 'M'
      ? CONSTANTES.EDAD_PENSION_HOMBRES
      : CONSTANTES.EDAD_PENSION_MUJERES

  const añosFaltantes = Math.max(0, edadPension - datos.edadActual)
  const mesesFaltantes = añosFaltantes * 12

  const rentabilidadAnual =
    (datos.rentabilidadEsperada || CONSTANTES.RENTABILIDAD_MODERADA * 100) / 100
  const tasaMensualEfectiva = calcularTasaMensualEfectiva(rentabilidadAnual)

  // Aporte mensual al fondo individual
  const aporteMensual = datos.ingresoMensual * CONSTANTES.TASA_AHORRO_RAIS

  // Saldo actual o 0 si no se proporciona
  let saldoProyectado = datos.saldoAcumulado || 0

  // CORRECCIÓN: Capitalización MENSUAL (no anual)
  for (let mes = 0; mes < mesesFaltantes; mes++) {
    saldoProyectado =
      saldoProyectado * (1 + tasaMensualEfectiva) + aporteMensual
  }

  // Expectativa de vida después de pensión según género
  const expectativaVida =
    datos.genero === 'M'
      ? CONSTANTES.EXPECTATIVA_VIDA_PENSION_HOMBRES
      : CONSTANTES.EXPECTATIVA_VIDA_PENSION_MUJERES

  const mesesPension = expectativaVida * 12

  // Cálculo de anualidad (cuota fija durante expectativa de vida)
  // Fórmula: P = V * [r(1+r)^n] / [(1+r)^n - 1]
  const numerador =
    tasaMensualEfectiva * Math.pow(1 + tasaMensualEfectiva, mesesPension)
  const denominador = Math.pow(1 + tasaMensualEfectiva, mesesPension) - 1

  let pensionMensual = 0
  if (denominador !== 0) {
    pensionMensual = saldoProyectado * (numerador / denominador)
  }

  // Cálculo aproximado de aportes totales
  // NOTA: Asume salario constante - en realidad debería usar historial
  const mesesPasados = Math.floor(datos.semanasActuales / 4.33)
  const aporteTotal = (mesesPasados + mesesFaltantes) * aporteMensual
  const rentabilidadTotal = saldoProyectado - aporteTotal

  return {
    saldoProyectado,
    // CORRECCIÓN: RAIS NO garantiza pensión mínima
    pensionMensual: pensionMensual,
    rentabilidadTotal,
    aporteTotal,
  }
}

/**
 * Calcula la proyección completa de pensión
 *
 * CORRECCIÓN v2.0: Comparación equitativa (ambos usan semanas proyectadas)
 */
export function calcularProyeccionPension(
  datos: DatosPensionales
): ResultadoPension {
  const edadPension =
    datos.genero === 'M'
      ? CONSTANTES.EDAD_PENSION_HOMBRES
      : CONSTANTES.EDAD_PENSION_MUJERES

  const añosFaltantes = Math.max(0, edadPension - datos.edadActual)
  const semanasPorAño = 52
  const semanasProyectadas =
    datos.semanasActuales + añosFaltantes * semanasPorAño
  const semanasFaltantes = Math.max(
    0,
    CONSTANTES.SEMANAS_MINIMAS - datos.semanasActuales
  )
  const puedesPensionarte =
    datos.semanasActuales >= CONSTANTES.SEMANAS_MINIMAS &&
    datos.edadActual >= edadPension

  // CORRECCIÓN: Ambos usan semanasProyectadas para comparación equitativa
  const resultadoRPM = calcularPensionPrimaMedia({
    ...datos,
    semanasActuales: semanasProyectadas,
  })

  const resultadoRAIS = calcularPensionAhorroIndividual({
    ...datos,
    semanasActuales: semanasProyectadas,
  })

  // Comparativa
  const diferenciaMensual =
    resultadoRAIS.pensionMensual - resultadoRPM.pensionMensual
  const regimenRecomendado = diferenciaMensual > 0 ? 'RAIS' : 'RPM'

  // Recomendaciones y advertencias
  const recomendaciones: string[] = []
  const advertencias: string[] = []

  // Advertencias sobre requisitos
  if (semanasFaltantes > 0) {
    advertencias.push(
      `Te faltan ${semanasFaltantes} semanas (${Math.ceil(semanasFaltantes / 52)} años aprox.) para cumplir el mínimo de cotización`
    )
  }

  if (añosFaltantes > 0) {
    advertencias.push(
      `Te faltan ${añosFaltantes} años para alcanzar la edad de pensión (${edadPension} años)`
    )
  }

  // CORRECCIÓN: Advertir si pensión RAIS es menor al SMMLV
  if (resultadoRAIS.pensionMensual < CONSTANTES.SMMLV) {
    advertencias.push(
      `⚠️ Tu pensión RAIS proyectada (${formatearMoneda(resultadoRAIS.pensionMensual)}) es menor al SMMLV. RAIS NO garantiza pensión mínima. Considera RPM.`
    )
  }

  // CORRECCIÓN: Advertir sobre simplificación de IBL
  if (datos.edadActual > 30) {
    advertencias.push(
      `📊 El IBL mostrado es una simplificación. El IBL real considera el promedio de tus últimos 10 años de salarios ajustados por inflación.`
    )
  }

  // Recomendaciones según régimen
  if (regimenRecomendado === 'RPM') {
    recomendaciones.push(
      'El Régimen de Prima Media te ofrece una mejor pensión dado tu nivel de ingresos y semanas cotizadas'
    )
    if (datos.ingresoMensual < CONSTANTES.SMMLV * 4) {
      recomendaciones.push(
        'Con ingresos menores a 4 SMMLV, RPM suele ser más favorable por la garantía de pensión mínima'
      )
    }
  } else {
    recomendaciones.push(
      'El Régimen de Ahorro Individual te ofrece una mejor proyección dado tu perfil de ingresos'
    )
    if (datos.ingresoMensual > CONSTANTES.SMMLV * 8) {
      recomendaciones.push(
        'Con ingresos altos, RAIS puede generar mejores rendimientos si la rentabilidad del fondo es buena'
      )
    }
  }

  if (
    resultadoRPM.porcentaje < CONSTANTES.PORCENTAJE_MAXIMO_PENSION &&
    datos.semanasActuales < CONSTANTES.SEMANAS_PARA_MAXIMO_PORCENTAJE
  ) {
    const añosFaltantesMax = Math.ceil(
      (CONSTANTES.SEMANAS_PARA_MAXIMO_PORCENTAJE - datos.semanasActuales) / 52
    )
    recomendaciones.push(
      `Podrías aumentar tu porcentaje de pensión hasta ${CONSTANTES.PORCENTAJE_MAXIMO_PENSION}% cotizando ${añosFaltantesMax} años más`
    )
  }

  if (datos.regimen !== regimenRecomendado) {
    recomendaciones.push(
      `Considera cambiar de régimen. Actualmente estás en ${datos.regimen} pero ${regimenRecomendado} podría ser más conveniente`
    )
  }

  return {
    edadPension,
    semanasRequeridas: CONSTANTES.SEMANAS_MINIMAS,
    semanasFaltantes,
    añosFaltantes,
    puedesPensionarte,

    // RPM
    ibl: resultadoRPM.ibl,
    porcentajePension: resultadoRPM.porcentaje,
    pensionMensualRPM: resultadoRPM.pensionMensual,

    // RAIS
    saldoProyectado: resultadoRAIS.saldoProyectado,
    pensionMensualRAIS: resultadoRAIS.pensionMensual,
    rentabilidadAcumulada: resultadoRAIS.rentabilidadTotal,

    // Comparativa
    diferenciaMensual,
    regimenRecomendado,

    recomendaciones,
    advertencias,
  }
}

/**
 * Genera proyección año por año hasta la pensión
 *
 * CORRECCIÓN v2.0: Cacheo de IBL para optimización
 */
export function generarProyeccionAnual(
  datos: DatosPensionales
): ProyeccionAnual[] {
  const edadPension =
    datos.genero === 'M'
      ? CONSTANTES.EDAD_PENSION_HOMBRES
      : CONSTANTES.EDAD_PENSION_MUJERES

  const añosFaltantes = Math.max(0, edadPension - datos.edadActual)
  const proyeccion: ProyeccionAnual[] = []

  const rentabilidadAnual =
    (datos.rentabilidadEsperada || CONSTANTES.RENTABILIDAD_MODERADA * 100) / 100
  const tasaMensualEfectiva = calcularTasaMensualEfectiva(rentabilidadAnual)
  const aporteMensual = datos.ingresoMensual * CONSTANTES.TASA_AHORRO_RAIS
  const aporteAnual = aporteMensual * 12

  let saldoAcumulado = datos.saldoAcumulado || 0
  let semanasAcumuladas = datos.semanasActuales

  // OPTIMIZACIÓN: Cachear IBL (no cambia en proyección)
  const iblCacheado = calcularIBL(datos.ingresoMensual)

  for (let i = 0; i <= añosFaltantes; i++) {
    const edad = datos.edadActual + i

    if (i > 0) {
      // Capitalización mensual durante el año
      for (let mes = 0; mes < 12; mes++) {
        saldoAcumulado =
          saldoAcumulado * (1 + tasaMensualEfectiva) + aporteMensual
      }
      semanasAcumuladas += 52
    }

    // Calcular pensión RPM (usando IBL cacheado)
    const porcentaje = calcularPorcentajePension(semanasAcumuladas)
    const pensionCalculadaRPM = (iblCacheado * porcentaje) / 100
    const pensionMinimaRPM = CONSTANTES.SMMLV * CONSTANTES.PENSION_MINIMA_SMMLV
    const pensionMaximaRPM = CONSTANTES.SMMLV * CONSTANTES.TOPE_IBL_SMMLV
    const pensionProyectadaRPM = Math.max(
      pensionMinimaRPM,
      Math.min(pensionCalculadaRPM, pensionMaximaRPM)
    )

    // Calcular pensión RAIS proyectada
    const expectativaVida =
      datos.genero === 'M'
        ? CONSTANTES.EXPECTATIVA_VIDA_PENSION_HOMBRES
        : CONSTANTES.EXPECTATIVA_VIDA_PENSION_MUJERES
    const mesesPension = expectativaVida * 12

    const numerador =
      tasaMensualEfectiva * Math.pow(1 + tasaMensualEfectiva, mesesPension)
    const denominador = Math.pow(1 + tasaMensualEfectiva, mesesPension) - 1
    const pensionProyectadaRAIS =
      denominador !== 0 ? saldoAcumulado * (numerador / denominador) : 0

    proyeccion.push({
      año: new Date().getFullYear() + i,
      edad,
      semanas: semanasAcumuladas,
      aporteAnual,
      saldoAcumulado,
      pensionProyectadaRPM,
      pensionProyectadaRAIS,
    })
  }

  return proyeccion
}

/**
 * Formatea moneda colombiana
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
 * Formatea porcentaje
 */
export function formatearPorcentaje(valor: number): string {
  return `${valor.toFixed(1)}%`
}

/**
 * Calcula semanas desde años
 */
export function añosAsSemanas(años: number): number {
  return Math.floor(años * 52)
}

/**
 * Calcula años desde semanas
 */
export function semanasAsAños(semanas: number): number {
  return Math.floor(semanas / 52)
}
