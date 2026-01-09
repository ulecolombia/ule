/**
 * CONSTANTES LEGALES COLOMBIA
 * Valores actualizados para 2026
 * Fuente: Gobierno de Colombia, DANE, Ministerio de Hacienda
 *
 * Referencias:
 * - UVT 2026: Resolución DIAN 238 de noviembre 2025
 * - SMMLV 2026: Decreto del Ministerio de Trabajo
 */

export const CONSTANTES_2026 = {
  // Salario y valores tributarios
  SMMLV: 1_750_905,
  UVT: 52_374,

  // Límites IBC para seguridad social
  IBC_MINIMO: 1_750_905, // 1 SMMLV
  IBC_MAXIMO: 43_772_625, // 25 SMMLV

  // Porcentajes de aportes seguridad social (OPS/Independientes)
  PORCENTAJE_SALUD: 12.5, // 100% lo paga el contratista
  PORCENTAJE_PENSION: 16.0, // 100% lo paga el contratista

  // Pensiones - Régimen de Prima Media (RPM)
  TOPE_IBL_SMMLV: 25, // Máximo IBL en SMMLV
  PENSION_MINIMA_SMMLV: 1, // Mínimo en SMMLV
  SEMANAS_MINIMAS: 1_300, // 25 años aprox
  PORCENTAJE_BASE_PENSION: 65, // Con 1,300 semanas
  PORCENTAJE_ADICIONAL_POR_50_SEMANAS: 1.5,
  PORCENTAJE_MAXIMO_PENSION: 80,
  SEMANAS_PARA_MAXIMO_PORCENTAJE: 2_000, // ~38.5 años

  // Edades de pensión (Ley 100 de 1993)
  EDAD_PENSION_HOMBRES: 62,
  EDAD_PENSION_MUJERES: 57,

  // Expectativa de vida después de pensión (DANE 2025)
  EXPECTATIVA_VIDA_PENSION_HOMBRES: 18, // años a los 62
  EXPECTATIVA_VIDA_PENSION_MUJERES: 22, // años a los 57

  // Pensiones - Régimen de Ahorro Individual (RAIS)
  TASA_COTIZACION_RAIS: 0.16, // 16% total
  TASA_AHORRO_RAIS: 0.115, // 11.5% va al fondo individual
  TASA_ADMINISTRACION_RAIS: 0.03, // 3% comisión promedio
  TASA_SEGURO_RAIS: 0.015, // 1.5% seguro

  // Rentabilidades históricas promedio (referencia)
  RENTABILIDAD_CONSERVADORA: 0.04, // 4% anual
  RENTABILIDAD_MODERADA: 0.05, // 5% anual
  RENTABILIDAD_AGRESIVA: 0.07, // 7% anual

  // IVA
  IVA_GENERAL: 0.19,
  IVA_REDUCIDO: 0.05,

  // Tarifas ARL por nivel de riesgo
  TARIFAS_ARL: {
    I: 0.522,
    II: 1.044,
    III: 2.436,
    IV: 4.35,
    V: 6.96,
  },
}

/** @deprecated Usar CONSTANTES_2026 - Mantenido para compatibilidad */
export const CONSTANTES_2025 = CONSTANTES_2026

export type ConstantesAnio = typeof CONSTANTES_2026

/**
 * Obtiene las constantes para el año actual
 */
export function getConstantesActuales(): ConstantesAnio {
  const añoActual = new Date().getFullYear()

  // 2026 es el año vigente
  if (añoActual >= 2026) {
    return CONSTANTES_2026
  }

  // Fallback a 2026
  return CONSTANTES_2026
}

/**
 * Obtiene el año fiscal actual
 */
export function getAñoFiscal(): number {
  return new Date().getFullYear()
}
