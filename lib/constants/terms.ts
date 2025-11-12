/**
 * ULE - CONSTANTES DE TÉRMINOS Y CONDICIONES
 * Versiones y configuración centralizada para términos de servicio
 */

/**
 * Versión actual de los términos y condiciones
 * IMPORTANTE: Incrementar esta versión cuando se actualicen los términos
 * Esto forzará a los usuarios a aceptar nuevamente
 */
export const CURRENT_TERMS_VERSION = '1.0'

/**
 * Fecha de la última actualización de términos
 */
export const TERMS_LAST_UPDATED = '2024-11-01'

/**
 * Tipos de términos disponibles en la plataforma
 */
export const TIPOS_TERMINOS = {
  ASESORIA_IA: 'ASESORIA_IA',
  USO_PLATAFORMA: 'USO_PLATAFORMA',
  PRIVACIDAD: 'PRIVACIDAD',
  LIMITACION_RESPONSABILIDAD: 'LIMITACION_RESPONSABILIDAD',
} as const

export type TipoTermino = keyof typeof TIPOS_TERMINOS

/**
 * Configuración de términos por tipo
 */
export const TERMS_CONFIG = {
  [TIPOS_TERMINOS.ASESORIA_IA]: {
    nombre: 'Términos de Servicio - Asesoría con IA',
    version: CURRENT_TERMS_VERSION,
    ruta: '/terminos-asesoria',
    obligatorio: true,
    descripcion: 'Términos de uso del servicio de asesoría automatizada con inteligencia artificial',
  },
  [TIPOS_TERMINOS.USO_PLATAFORMA]: {
    nombre: 'Términos de Uso de la Plataforma',
    version: CURRENT_TERMS_VERSION,
    ruta: '/terminos-uso',
    obligatorio: true,
    descripcion: 'Condiciones generales de uso de la plataforma ULE',
  },
  [TIPOS_TERMINOS.PRIVACIDAD]: {
    nombre: 'Política de Privacidad',
    version: CURRENT_TERMS_VERSION,
    ruta: '/privacidad',
    obligatorio: true,
    descripcion: 'Política de tratamiento de datos personales',
  },
  [TIPOS_TERMINOS.LIMITACION_RESPONSABILIDAD]: {
    nombre: 'Limitación de Responsabilidad',
    version: CURRENT_TERMS_VERSION,
    ruta: '/limitacion-responsabilidad',
    obligatorio: true,
    descripcion: 'Alcance y limitaciones de la responsabilidad del servicio',
  },
} as const

/**
 * Historial de versiones de términos
 * Útil para auditoría y cumplimiento legal
 */
export const TERMS_VERSION_HISTORY = [
  {
    version: '1.0',
    fecha: '2024-11-01',
    cambios: [
      'Versión inicial de términos y condiciones',
      'Implementación de disclaimers para servicio de IA',
      'Definición de limitaciones de responsabilidad',
    ],
  },
  // Agregar nuevas versiones aquí al actualizar términos
] as const
