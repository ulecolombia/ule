/**
 * CONSTANTES LEGALES COLOMBIA
 * Valores actualizados para 2025
 * Fuente: Gobierno de Colombia, DANE, Ministerio de Hacienda
 */

export const CONSTANTES_2025 = {
  // Salario y valores tributarios
  SMMLV: 1_423_500,
  UVT: 47_065,

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

  // Expectativa de vida después de pensión (DANE 2024)
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
}

export type ConstantesAnio = typeof CONSTANTES_2025

/**
 * Obtiene las constantes para el año actual
 * TODO: En el futuro, detectar año automáticamente
 */
export function getConstantesActuales(): ConstantesAnio {
  const añoActual = new Date().getFullYear()

  // Por ahora solo tenemos 2025
  if (añoActual >= 2025) {
    return CONSTANTES_2025
  }

  // Fallback a 2025
  return CONSTANTES_2025
}

/**
 * Obtiene el año fiscal actual
 */
export function getAñoFiscal(): number {
  return new Date().getFullYear()
}
