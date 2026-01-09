/**
 * ULE - CALCULADORA DE APORTES PILA PARA COLOMBIA
 * Normativa vigente 2026
 *
 * Sistema de cálculo de aportes a seguridad social según normativa colombiana
 * para trabajadores independientes y por prestación de servicios (OPS).
 *
 * IMPORTANTE - Decreto 1990 de 2016:
 * - El IBC deberá aproximarse al peso superior más cercano (Math.ceil)
 * - El valor de la cotización deberá redondearse al múltiplo de 100 superior más cercano
 */

import { memoize } from '@/lib/cache/memoize'

// ============================================
// CONSTANTES OFICIALES 2026
// ============================================

/** Salario Mínimo Legal Mensual Vigente 2026 */
export const SMMLV_2026 = 1750905

/** @deprecated Usar SMMLV_2026 - Mantenido para compatibilidad */
export const SMMLV_2025 = SMMLV_2026

/** Ingreso Base de Cotización Mínimo (1 SMMLV) */
export const IBC_MINIMO = SMMLV_2026

/** Ingreso Base de Cotización Máximo (25 SMMLV) */
export const IBC_MAXIMO = SMMLV_2026 * 25 // $43,772,625

// ============================================
// PORCENTAJES DE COTIZACIÓN
// ============================================

/** Porcentaje de cotización a salud (EPS) */
export const PORCENTAJE_SALUD = 12.5

/** Porcentaje de cotización a pensión */
export const PORCENTAJE_PENSION = 16.0

/**
 * Tabla de porcentajes ARL según nivel de riesgo
 * Resolución 2388 de 2016 - Ministerio de Trabajo
 */
export const PORCENTAJES_ARL = {
  I: 0.522, // Riesgo mínimo - Actividades administrativas, oficina
  II: 1.044, // Riesgo bajo - Comercio, servicios
  III: 2.436, // Riesgo medio - Manufactura, transporte
  IV: 4.35, // Riesgo alto - Procesos industriales, mecánicos
  V: 6.96, // Riesgo máximo - Minería, construcción, alturas
} as const

// ============================================
// REDONDEO DECRETO 1990 DE 2016
// ============================================

/**
 * Redondea el IBC al peso superior más cercano
 * Según Decreto 1990 de 2016, Art. 2.2.1.1.1.7
 *
 * @param valor - Valor del IBC a redondear
 * @returns IBC redondeado al peso superior
 */
export function redondearIBCPesoSuperior(valor: number): number {
  return Math.ceil(valor)
}

/**
 * Redondea el valor de cotización al múltiplo de 100 superior más cercano
 * Según Decreto 1990 de 2016, Art. 2.2.1.1.1.7
 *
 * @param valor - Valor de la cotización a redondear
 * @returns Cotización redondeada al múltiplo de 100 superior
 *
 * @example
 * ```typescript
 * redondearCotizacionMultiplo100(218863.125) // 218900
 * redondearCotizacionMultiplo100(280144.8) // 280200
 * ```
 */
export function redondearCotizacionMultiplo100(valor: number): number {
  return Math.ceil(valor / 100) * 100
}

// ============================================
// TIPOS
// ============================================

/** Niveles de riesgo ARL según clasificación colombiana */
export type NivelRiesgoARL = keyof typeof PORCENTAJES_ARL

/**
 * Resultado del cálculo de IBC
 */
export interface CalculoIBC {
  /** Ingreso reportado por el usuario */
  ingresoReportado: number
  /** IBC calculado (puede estar ajustado a límites) */
  ibc: number
  /** Indica si se aplicó ajuste al mínimo o máximo */
  ajustado: boolean
  /** Motivo del ajuste si aplica */
  motivoAjuste?: 'MINIMO' | 'MAXIMO'
}

/**
 * Desglose completo de aportes calculados
 */
export interface CalculoAportes {
  /** Ingreso Base de Cotización */
  ibc: number
  /** Aporte a salud (12.5%) */
  salud: number
  /** Aporte a pensión (16%) */
  pension: number
  /** Aporte a ARL (según nivel de riesgo) */
  arl: number
  /** Total a pagar */
  total: number
  /** Desglose detallado de cada componente */
  desglose: {
    salud: {
      base: number
      porcentaje: number
      valor: number
    }
    pension: {
      base: number
      porcentaje: number
      valor: number
    }
    arl: {
      base: number
      porcentaje: number
      valor: number
      nivelRiesgo: NivelRiesgoARL
    }
  }
}

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * 🛡️ Valida que un valor sea un número positivo válido
 *
 * Esta función proporciona validación robusta contra:
 * - null/undefined
 * - NaN (Not a Number)
 * - Infinity/-Infinity
 * - Tipos incorrectos (strings, arrays, objects, etc.)
 * - Números negativos o cero
 *
 * @param valor - Valor a validar
 * @param nombreCampo - Nombre descriptivo del campo (para mensajes de error)
 * @returns El valor validado como número
 * @throws TypeError si el valor no es un número
 * @throws Error si el valor es NaN, Infinity, o no positivo
 *
 * @example
 * ```typescript
 * validarNumeroPositivo(1000000, 'Ingreso mensual')  // ✅ OK
 * validarNumeroPositivo(undefined, 'IBC')  // ❌ TypeError
 * validarNumeroPositivo(NaN, 'Salud')  // ❌ Error
 * validarNumeroPositivo(-500, 'Pensión')  // ❌ Error
 * ```
 */
function validarNumeroPositivo(valor: any, nombreCampo: string): number {
  // 🚨 Validar que NO sea null/undefined
  if (valor === null || valor === undefined) {
    throw new TypeError(`${nombreCampo} es requerido (recibido: ${valor})`)
  }

  // 🚨 Validar que SEA un número (no string, array, object, etc.)
  if (typeof valor !== 'number') {
    throw new TypeError(
      `${nombreCampo} debe ser un número, recibido tipo: ${typeof valor}`
    )
  }

  // 🚨 Validar que NO sea NaN
  if (isNaN(valor)) {
    throw new Error(`${nombreCampo} no es un número válido (NaN)`)
  }

  // 🚨 Validar que NO sea Infinity
  if (!isFinite(valor)) {
    throw new Error(
      `${nombreCampo} debe ser un número finito (recibido: ${valor})`
    )
  }

  // 🚨 Validar que sea POSITIVO
  if (valor <= 0) {
    throw new Error(`${nombreCampo} debe ser mayor a cero (recibido: ${valor})`)
  }

  return valor
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula el Ingreso Base de Cotización (IBC)
 *
 * Aplica límites mínimos y máximos según normativa:
 * - Mínimo: 1 SMMLV ($1,750,905)
 * - Máximo: 25 SMMLV ($43,772,625)
 *
 * IMPORTANTE - Decreto 1990 de 2016:
 * El IBC se redondea al peso superior más cercano (Math.ceil)
 *
 * @param ingresoMensual - Ingreso mensual reportado
 * @returns Objeto con IBC calculado e información de ajustes
 * @throws Error si el ingreso es menor o igual a cero
 *
 * @example
 * ```typescript
 * const resultado = calcularIBC(3000000);
 * console.log(resultado.ibc); // 3000000
 * console.log(resultado.ajustado); // false
 * ```
 */
export function calcularIBC(ingresoMensual: number): CalculoIBC {
  // 🛡️ Validación robusta de entrada
  const ingresoValidado = validarNumeroPositivo(
    ingresoMensual,
    'Ingreso mensual'
  )

  let ibc = ingresoValidado
  let ajustado = false
  let motivoAjuste: 'MINIMO' | 'MAXIMO' | undefined

  // Aplicar límite mínimo (1 SMMLV)
  if (ibc < IBC_MINIMO) {
    ibc = IBC_MINIMO
    ajustado = true
    motivoAjuste = 'MINIMO'
  }

  // Aplicar límite máximo (25 SMMLV)
  if (ibc > IBC_MAXIMO) {
    ibc = IBC_MAXIMO
    ajustado = true
    motivoAjuste = 'MAXIMO'
  }

  // Decreto 1990/2016: Redondear IBC al peso superior
  return {
    ingresoReportado: ingresoValidado,
    ibc: redondearIBCPesoSuperior(ibc),
    ajustado,
    motivoAjuste,
  }
}

/**
 * Calcula el aporte de salud (12.5% del IBC)
 *
 * Según Ley 1122 de 2007 y normativa vigente
 *
 * IMPORTANTE - Decreto 1990 de 2016:
 * El valor de la cotización se redondea al múltiplo de 100 superior
 *
 * @param ibc - Ingreso Base de Cotización
 * @returns Valor del aporte a salud
 * @throws Error si el IBC es menor o igual a cero
 *
 * @example
 * ```typescript
 * const salud = calcularSalud(1750905);
 * console.log(salud); // 218900 (218863.125 redondeado a múltiplo de 100 superior)
 * ```
 */
export function calcularSalud(ibc: number): number {
  // 🛡️ Validación robusta de entrada
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  // Calcular porcentaje
  const resultado = ibcValidado * (PORCENTAJE_SALUD / 100)

  // Decreto 1990/2016: Redondear al múltiplo de 100 superior
  return redondearCotizacionMultiplo100(resultado)
}

/**
 * Calcula el aporte de pensión (16% del IBC)
 *
 * Según Ley 100 de 1993 y modificaciones
 *
 * IMPORTANTE - Decreto 1990 de 2016:
 * El valor de la cotización se redondea al múltiplo de 100 superior
 *
 * @param ibc - Ingreso Base de Cotización
 * @returns Valor del aporte a pensión
 * @throws Error si el IBC es menor o igual a cero
 *
 * @example
 * ```typescript
 * const pension = calcularPension(1750905);
 * console.log(pension); // 280200 (280144.8 redondeado a múltiplo de 100 superior)
 * ```
 */
export function calcularPension(ibc: number): number {
  // 🛡️ Validación robusta de entrada
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  // Calcular porcentaje
  const resultado = ibcValidado * (PORCENTAJE_PENSION / 100)

  // Decreto 1990/2016: Redondear al múltiplo de 100 superior
  return redondearCotizacionMultiplo100(resultado)
}

/**
 * Calcula el aporte de ARL según nivel de riesgo
 *
 * Según Decreto 1772 de 1994 y Resolución 2388 de 2016
 *
 * IMPORTANTE - Decreto 1990 de 2016:
 * El valor de la cotización se redondea al múltiplo de 100 superior
 *
 * @param ibc - Ingreso Base de Cotización
 * @param nivelRiesgo - Nivel de riesgo (I, II, III, IV, V)
 * @returns Valor del aporte a ARL
 * @throws Error si el IBC es menor o igual a cero o nivel de riesgo inválido
 *
 * @example
 * ```typescript
 * const arl = calcularARL(1750905, 'I');
 * console.log(arl); // 9200 (9139.7261 redondeado a múltiplo de 100 superior)
 * ```
 */
export function calcularARL(ibc: number, nivelRiesgo: NivelRiesgoARL): number {
  // 🛡️ Validación robusta de entrada
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  const porcentaje = PORCENTAJES_ARL[nivelRiesgo]
  if (!porcentaje) {
    throw new Error(`Nivel de riesgo inválido: ${nivelRiesgo}`)
  }

  // Calcular porcentaje
  const resultado = ibcValidado * (porcentaje / 100)

  // Decreto 1990/2016: Redondear al múltiplo de 100 superior
  return redondearCotizacionMultiplo100(resultado)
}

/**
 * Calcula todos los aportes de seguridad social
 *
 * Realiza el cálculo completo de:
 * - Ingreso Base de Cotización (IBC)
 * - Aporte a Salud (12.5%)
 * - Aporte a Pensión (16%)
 * - Aporte a ARL (según nivel de riesgo) - OPCIONAL para independientes
 * - Total a pagar
 *
 * NOTA: Los independientes NO están obligados a cotizar ARL a menos que:
 * - Tengan contrato de prestación de servicios que lo exija
 * - Realicen actividades de alto riesgo
 *
 * @param ingresoMensual - Ingreso mensual reportado
 * @param nivelRiesgo - Nivel de riesgo ARL (por defecto: 'I')
 * @param incluirARL - Si se debe incluir ARL en el cálculo (por defecto: true)
 * @returns Objeto con todos los valores calculados y desglose
 *
 * @example
 * ```typescript
 * // Con ARL (contrato que lo exige)
 * const aportes = calcularTotalAportes(3000000, 'I', true);
 *
 * // Sin ARL (independiente sin obligación)
 * const aportesSinARL = calcularTotalAportes(3000000, 'I', false);
 * ```
 */
export function calcularTotalAportes(
  ingresoMensual: number,
  nivelRiesgo: NivelRiesgoARL = 'I',
  incluirARL: boolean = true
): CalculoAportes {
  // Calcular IBC
  const { ibc } = calcularIBC(ingresoMensual)

  // Calcular cada componente
  const salud = calcularSalud(ibc)
  const pension = calcularPension(ibc)
  const arl = incluirARL ? calcularARL(ibc, nivelRiesgo) : 0
  const total = salud + pension + arl

  return {
    ibc,
    salud,
    pension,
    arl,
    total,
    desglose: {
      salud: {
        base: ibc,
        porcentaje: PORCENTAJE_SALUD,
        valor: salud,
      },
      pension: {
        base: ibc,
        porcentaje: PORCENTAJE_PENSION,
        valor: pension,
      },
      arl: {
        base: ibc,
        porcentaje: incluirARL ? PORCENTAJES_ARL[nivelRiesgo] : 0,
        valor: arl,
        nivelRiesgo,
      },
    },
  }
}

/**
 * Calcula la fecha límite de pago de PILA
 *
 * Según normativa, el plazo es hasta el día 10 del mes siguiente
 * al período de cotización.
 *
 * @param mes - Mes del período (1-12)
 * @param anio - Año del período
 * @returns Fecha límite (día 10 del mes siguiente a las 23:59:59)
 * @throws Error si mes o año son inválidos
 *
 * @example
 * ```typescript
 * const fecha = calcularFechaLimite(11, 2025); // Noviembre 2025
 * console.log(fecha); // 2025-12-10 23:59:59
 * ```
 */
export function calcularFechaLimite(mes: number, anio: number): Date {
  // Validaciones
  if (mes < 1 || mes > 12) {
    throw new Error('El mes debe estar entre 1 y 12')
  }
  if (anio < 2020) {
    throw new Error('Año inválido')
  }

  // Calcular mes y año siguiente
  let mesLimite = mes + 1
  let anioLimite = anio

  if (mesLimite > 12) {
    mesLimite = 1
    anioLimite += 1
  }

  // Día 10 del mes siguiente a las 23:59:59
  return new Date(anioLimite, mesLimite - 1, 10, 23, 59, 59)
}

/**
 * Formatea un período en texto legible
 *
 * @param mes - Mes (1-12)
 * @param anio - Año
 * @returns Texto formateado (ej: "Enero 2025")
 *
 * @example
 * ```typescript
 * const periodo = formatearPeriodo(1, 2025);
 * console.log(periodo); // "Enero 2025"
 * ```
 */
export function formatearPeriodo(mes: number, anio: number): string {
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]

  if (mes < 1 || mes > 12) {
    throw new Error('El mes debe estar entre 1 y 12')
  }

  return `${meses[mes - 1]} ${anio}`
}

/**
 * Formatea valores monetarios en pesos colombianos (COP)
 *
 * @param valor - Valor numérico a formatear
 * @returns String formateado con símbolo de peso colombiano
 *
 * @example
 * ```typescript
 * const texto = formatearMoneda(3000000);
 * console.log(texto); // "$3.000.000"
 * ```
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
 * Valida que un IBC esté dentro de los límites legales
 *
 * @param ibc - Ingreso Base de Cotización a validar
 * @returns true si es válido, false si no
 *
 * @example
 * ```typescript
 * console.log(validarIBC(3000000)); // true
 * console.log(validarIBC(500000)); // false (menor a 1 SMMLV)
 * ```
 */
export function validarIBC(ibc: number): boolean {
  return ibc >= IBC_MINIMO && ibc <= IBC_MAXIMO
}

/**
 * Obtiene el porcentaje ARL según el nivel de riesgo
 *
 * @param nivelRiesgo - Nivel de riesgo (I-V)
 * @returns Porcentaje correspondiente
 *
 * @example
 * ```typescript
 * const porcentaje = obtenerPorcentajeARL('III');
 * console.log(porcentaje); // 2.436
 * ```
 */
export function obtenerPorcentajeARL(nivelRiesgo: NivelRiesgoARL): number {
  return PORCENTAJES_ARL[nivelRiesgo]
}

// ============================================
// EXPORT ALIASES
// ============================================

/**
 * Alias para calcularTotalAportes
 * Mantenido para compatibilidad con código existente
 */
export { calcularTotalAportes as calcularAportes }

// ============================================
// VERSIONES MEMOIZADAS (OPTIMIZACIÓN)
// ============================================

/**
 * Versión memoizada de calcularIBC
 * Cache: 200 entradas, TTL 10 minutos
 *
 * Uso recomendado para interfaces donde el usuario puede recalcular
 * múltiples veces con el mismo ingreso
 */
export const calcularIBCMemoized = memoize(calcularIBC, {
  maxSize: 200,
  ttl: 10 * 60 * 1000, // 10 minutos
  keyGenerator: (ingreso) => String(ingreso),
})

/**
 * Versión memoizada de calcularTotalAportes
 * Cache: 200 entradas, TTL 10 minutos
 *
 * Mejora significativa cuando el usuario calcula múltiples veces
 * con los mismos parámetros
 */
export const calcularTotalAportesMemoized = memoize(calcularTotalAportes, {
  maxSize: 200,
  ttl: 10 * 60 * 1000, // 10 minutos
  keyGenerator: (ingreso, nivel, incluirARL = true) =>
    `${ingreso}-${nivel}-${incluirARL}`,
})

/**
 * Alias memoizado
 */
export const calcularAportesMemoized = calcularTotalAportesMemoized
