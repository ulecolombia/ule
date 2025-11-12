/**
 * ULE - CALCULADORA DE APORTES PILA PARA COLOMBIA
 * Normativa vigente 2025
 *
 * Sistema de cálculo de aportes a seguridad social según normativa colombiana
 * para trabajadores independientes y por prestación de servicios (OPS).
 */

import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// CONSTANTES OFICIALES 2025
// ============================================

/** Salario Mínimo Legal Mensual Vigente 2025 */
export const SMMLV_2025 = 1423500;

/** Ingreso Base de Cotización Mínimo (1 SMMLV) */
export const IBC_MINIMO = SMMLV_2025;

/** Ingreso Base de Cotización Máximo (25 SMMLV) */
export const IBC_MAXIMO = SMMLV_2025 * 25;

// ============================================
// PORCENTAJES DE COTIZACIÓN
// ============================================

/** Porcentaje de cotización a salud (EPS) */
export const PORCENTAJE_SALUD = 12.5;

/** Porcentaje de cotización a pensión */
export const PORCENTAJE_PENSION = 16.0;

/**
 * Tabla de porcentajes ARL según nivel de riesgo
 * Resolución 2388 de 2016 - Ministerio de Trabajo
 */
export const PORCENTAJES_ARL = {
  I: 0.522,   // Riesgo mínimo - Actividades administrativas, oficina
  II: 1.044,  // Riesgo bajo - Comercio, servicios
  III: 2.436, // Riesgo medio - Manufactura, transporte
  IV: 4.350,  // Riesgo alto - Procesos industriales, mecánicos
  V: 6.960,   // Riesgo máximo - Minería, construcción, alturas
} as const;

// ============================================
// TIPOS
// ============================================

/** Niveles de riesgo ARL según clasificación colombiana */
export type NivelRiesgoARL = keyof typeof PORCENTAJES_ARL;

/**
 * Resultado del cálculo de IBC
 */
export interface CalculoIBC {
  /** Ingreso reportado por el usuario */
  ingresoReportado: number;
  /** IBC calculado (puede estar ajustado a límites) */
  ibc: number;
  /** Indica si se aplicó ajuste al mínimo o máximo */
  ajustado: boolean;
  /** Motivo del ajuste si aplica */
  motivoAjuste?: 'MINIMO' | 'MAXIMO';
}

/**
 * Desglose completo de aportes calculados
 */
export interface CalculoAportes {
  /** Ingreso Base de Cotización */
  ibc: number;
  /** Aporte a salud (12.5%) */
  salud: number;
  /** Aporte a pensión (16%) */
  pension: number;
  /** Aporte a ARL (según nivel de riesgo) */
  arl: number;
  /** Total a pagar */
  total: number;
  /** Desglose detallado de cada componente */
  desglose: {
    salud: {
      base: number;
      porcentaje: number;
      valor: number;
    };
    pension: {
      base: number;
      porcentaje: number;
      valor: number;
    };
    arl: {
      base: number;
      porcentaje: number;
      valor: number;
      nivelRiesgo: NivelRiesgoARL;
    };
  };
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

/**
 * Calcula el Ingreso Base de Cotización (IBC)
 *
 * Aplica límites mínimos y máximos según normativa:
 * - Mínimo: 1 SMMLV ($1,423,500)
 * - Máximo: 25 SMMLV ($35,587,500)
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
  let ibc = ingresoMensual;
  let ajustado = false;
  let motivoAjuste: 'MINIMO' | 'MAXIMO' | undefined;

  // Validación de ingreso
  if (ingresoMensual <= 0) {
    throw new Error('El ingreso mensual debe ser mayor a cero');
  }

  // Aplicar límite mínimo (1 SMMLV)
  if (ibc < IBC_MINIMO) {
    ibc = IBC_MINIMO;
    ajustado = true;
    motivoAjuste = 'MINIMO';
  }

  // Aplicar límite máximo (25 SMMLV)
  if (ibc > IBC_MAXIMO) {
    ibc = IBC_MAXIMO;
    ajustado = true;
    motivoAjuste = 'MAXIMO';
  }

  return {
    ingresoReportado: ingresoMensual,
    ibc: Math.round(ibc),
    ajustado,
    motivoAjuste,
  };
}

/**
 * Calcula el aporte de salud (12.5% del IBC)
 *
 * Según Ley 1122 de 2007 y normativa vigente
 * Utiliza aritmética decimal para precisión exacta
 *
 * @param ibc - Ingreso Base de Cotización
 * @returns Valor del aporte a salud
 * @throws Error si el IBC es menor o igual a cero
 *
 * @example
 * ```typescript
 * const salud = calcularSalud(3000000);
 * console.log(salud); // 375000
 * ```
 */
export function calcularSalud(ibc: number): number {
  if (ibc <= 0) {
    throw new Error('IBC debe ser mayor a cero');
  }

  // Usar Decimal para precisión exacta (sin pérdida de centavos)
  const ibcDecimal = new Decimal(ibc);
  const porcentaje = new Decimal(PORCENTAJE_SALUD).div(100);
  const resultado = ibcDecimal.mul(porcentaje);

  // Redondear usando estrategia bancaria (round half to even)
  // Esto minimiza el sesgo acumulativo en múltiples cálculos
  return resultado.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber();
}

/**
 * Calcula el aporte de pensión (16% del IBC)
 *
 * Según Ley 100 de 1993 y modificaciones
 * Utiliza aritmética decimal para precisión exacta
 *
 * @param ibc - Ingreso Base de Cotización
 * @returns Valor del aporte a pensión
 * @throws Error si el IBC es menor o igual a cero
 *
 * @example
 * ```typescript
 * const pension = calcularPension(3000000);
 * console.log(pension); // 480000
 * ```
 */
export function calcularPension(ibc: number): number {
  if (ibc <= 0) {
    throw new Error('IBC debe ser mayor a cero');
  }

  // Usar Decimal para precisión exacta (sin pérdida de centavos)
  const ibcDecimal = new Decimal(ibc);
  const porcentaje = new Decimal(PORCENTAJE_PENSION).div(100);
  const resultado = ibcDecimal.mul(porcentaje);

  // Redondear usando estrategia bancaria (round half to even)
  return resultado.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber();
}

/**
 * Calcula el aporte de ARL según nivel de riesgo
 *
 * Según Decreto 1772 de 1994 y Resolución 2388 de 2016
 * Utiliza aritmética decimal para precisión exacta
 *
 * @param ibc - Ingreso Base de Cotización
 * @param nivelRiesgo - Nivel de riesgo (I, II, III, IV, V)
 * @returns Valor del aporte a ARL
 * @throws Error si el IBC es menor o igual a cero o nivel de riesgo inválido
 *
 * @example
 * ```typescript
 * const arl = calcularARL(3000000, 'I');
 * console.log(arl); // 15660
 * ```
 */
export function calcularARL(ibc: number, nivelRiesgo: NivelRiesgoARL): number {
  if (ibc <= 0) {
    throw new Error('IBC debe ser mayor a cero');
  }

  const porcentaje = PORCENTAJES_ARL[nivelRiesgo];
  if (!porcentaje) {
    throw new Error(`Nivel de riesgo inválido: ${nivelRiesgo}`);
  }

  // Usar Decimal para precisión exacta (sin pérdida de centavos)
  const ibcDecimal = new Decimal(ibc);
  const porcentajeDecimal = new Decimal(porcentaje).div(100);
  const resultado = ibcDecimal.mul(porcentajeDecimal);

  // Redondear usando estrategia bancaria (round half to even)
  return resultado.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN).toNumber();
}

/**
 * Calcula todos los aportes de seguridad social
 *
 * Realiza el cálculo completo de:
 * - Ingreso Base de Cotización (IBC)
 * - Aporte a Salud (12.5%)
 * - Aporte a Pensión (16%)
 * - Aporte a ARL (según nivel de riesgo)
 * - Total a pagar
 *
 * @param ingresoMensual - Ingreso mensual reportado
 * @param nivelRiesgo - Nivel de riesgo ARL (por defecto: 'I')
 * @returns Objeto con todos los valores calculados y desglose
 *
 * @example
 * ```typescript
 * const aportes = calcularTotalAportes(3000000, 'I');
 * console.log(aportes.total); // 870660
 * console.log(aportes.desglose.salud.valor); // 375000
 * ```
 */
export function calcularTotalAportes(
  ingresoMensual: number,
  nivelRiesgo: NivelRiesgoARL = 'I'
): CalculoAportes {
  // Calcular IBC
  const { ibc } = calcularIBC(ingresoMensual);

  // Calcular cada componente
  const salud = calcularSalud(ibc);
  const pension = calcularPension(ibc);
  const arl = calcularARL(ibc, nivelRiesgo);
  const total = salud + pension + arl;

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
        porcentaje: PORCENTAJES_ARL[nivelRiesgo],
        valor: arl,
        nivelRiesgo,
      },
    },
  };
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
    throw new Error('El mes debe estar entre 1 y 12');
  }
  if (anio < 2020) {
    throw new Error('Año inválido');
  }

  // Calcular mes y año siguiente
  let mesLimite = mes + 1;
  let anioLimite = anio;

  if (mesLimite > 12) {
    mesLimite = 1;
    anioLimite += 1;
  }

  // Día 10 del mes siguiente a las 23:59:59
  return new Date(anioLimite, mesLimite - 1, 10, 23, 59, 59);
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
  ];

  if (mes < 1 || mes > 12) {
    throw new Error('El mes debe estar entre 1 y 12');
  }

  return `${meses[mes - 1]} ${anio}`;
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
  }).format(valor);
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
  return ibc >= IBC_MINIMO && ibc <= IBC_MAXIMO;
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
  return PORCENTAJES_ARL[nivelRiesgo];
}
