/**
 * ULE - ENTIDADES DE SEGURIDAD SOCIAL
 * EPS, Fondos de Pensión y ARL en Colombia
 */

export const EPS_COLOMBIA = [
  { value: 'NO_AFILIADO', label: 'No estoy afiliado/a', disabled: false },
  { value: 'SANITAS', label: 'EPS Sanitas', disabled: false },
  { value: 'COMPENSAR', label: 'Compensar EPS', disabled: false },
  { value: 'SURA', label: 'EPS Sura', disabled: false },
  { value: 'NUEVA_EPS', label: 'Nueva EPS', disabled: false },
  { value: 'FAMISANAR', label: 'Famisanar EPS', disabled: false },
  { value: 'SALUD_TOTAL', label: 'Salud Total EPS', disabled: false },
  { value: 'COOMEVA', label: 'Coomeva EPS', disabled: false },
  { value: 'ALIANSALUD', label: 'Aliansalud EPS', disabled: false },
  { value: 'MEDIMAS', label: 'Medimás EPS', disabled: false },
  { value: 'CAPITAL_SALUD', label: 'Capital Salud EPS', disabled: false },
  { value: 'CAFESALUD', label: 'Cafesalud EPS', disabled: false },
] as const

export const FONDOS_PENSION = [
  { value: 'NO_AFILIADO', label: 'No estoy afiliado/a', disabled: false },
  { value: 'PORVENIR', label: 'Porvenir', disabled: false },
  { value: 'PROTECCION', label: 'Protección', disabled: false },
  { value: 'COLFONDOS', label: 'Colfondos', disabled: false },
  { value: 'OLD_MUTUAL', label: 'Old Mutual', disabled: false },
  { value: 'SKANDIA', label: 'Skandia', disabled: false },
  { value: 'COLPENSIONES', label: 'Colpensiones (Régimen Público)', disabled: false },
] as const

export const ARL_COLOMBIA = [
  { value: 'NO_AFILIADO', label: 'No estoy afiliado/a', disabled: false },
  { value: 'SURA', label: 'ARL Sura', disabled: false },
  { value: 'POSITIVA', label: 'Positiva Compañía de Seguros', disabled: false },
  { value: 'LIBERTY', label: 'Liberty Seguros', disabled: false },
  { value: 'BOLIVAR', label: 'ARL Bolívar', disabled: false },
  { value: 'COLMENA', label: 'ARL Colmena', disabled: false },
  { value: 'EQUIDAD', label: 'ARL La Equidad', disabled: false },
  { value: 'MAPFRE', label: 'MAPFRE Seguros', disabled: false },
] as const

export const NIVELES_RIESGO = [
  {
    value: 'I',
    label: 'I - Riesgo Mínimo',
    description: 'Actividades de oficina, administrativas',
  },
  {
    value: 'II',
    label: 'II - Riesgo Bajo',
    description: 'Comercio, trabajo de campo',
  },
  {
    value: 'III',
    label: 'III - Riesgo Medio',
    description: 'Manufactura, procesamiento',
  },
  {
    value: 'IV',
    label: 'IV - Riesgo Alto',
    description: 'Construcción, manejo de maquinaria',
  },
  {
    value: 'V',
    label: 'V - Riesgo Máximo',
    description: 'Minería, actividades peligrosas',
  },
] as const

export const SMMLV_2025 = 1423500

export type EPS = (typeof EPS_COLOMBIA)[number]['value']
export type FondoPension = (typeof FONDOS_PENSION)[number]['value']
export type ARL = (typeof ARL_COLOMBIA)[number]['value']
export type NivelRiesgo = (typeof NIVELES_RIESGO)[number]['value']
