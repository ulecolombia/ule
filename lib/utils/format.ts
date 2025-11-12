/**
 * Utilidades de formateo
 */

/**
 * Formatea un valor numérico como moneda colombiana (COP)
 */
export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

// Alias para compatibilidad
export const formatCurrency = formatearMoneda;

/**
 * Formatea una fecha a formato colombiano
 */
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Alias para compatibilidad
export const formatDate = formatearFecha;

/**
 * Formatea una fecha con hora
 */
export function formatearFechaHora(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea tipo de documento
 */
export function formatTipoDocumento(tipo: string | null | undefined): string {
  if (!tipo) return 'N/A';
  const tipos: Record<string, string> = {
    CC: 'Cédula de Ciudadanía',
    CE: 'Cédula de Extranjería',
    NIT: 'NIT',
    PASAPORTE: 'Pasaporte',
    TI: 'Tarjeta de Identidad',
  };
  return tipos[tipo] || tipo;
}

/**
 * Formatea número de teléfono
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  return phone;
}

/**
 * Formatea tipo de contrato
 */
export function formatTipoContrato(tipo: string | null | undefined): string {
  if (!tipo) return 'N/A';
  const tipos: Record<string, string> = {
    PRESTACION_SERVICIOS: 'Prestación de Servicios',
    INDEFINIDO: 'Término Indefinido',
    FIJO: 'Término Fijo',
    OBRA_LABOR: 'Obra o Labor',
  };
  return tipos[tipo] || tipo;
}

/**
 * Formatea estado civil
 */
export function formatEstadoCivil(estado: string | null | undefined): string {
  if (!estado) return 'N/A';
  const estados: Record<string, string> = {
    SOLTERO: 'Soltero(a)',
    CASADO: 'Casado(a)',
    UNION_LIBRE: 'Unión Libre',
    DIVORCIADO: 'Divorciado(a)',
    VIUDO: 'Viudo(a)',
  };
  return estados[estado] || estado;
}
