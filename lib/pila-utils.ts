/**
 * ULE - UTILIDADES PARA CÁLCULO DE PILA
 * Funciones para calcular fechas de vencimiento según cédula
 */

/**
 * Tabla de vencimientos PILA según últimos 2 dígitos de cédula
 * Los independientes pagan según su número de documento
 */
const TABLA_VENCIMIENTOS: { min: number; max: number; dia: number }[] = [
  { min: 0, max: 7, dia: 1 },
  { min: 8, max: 14, dia: 2 },
  { min: 15, max: 21, dia: 3 },
  { min: 22, max: 28, dia: 4 },
  { min: 29, max: 35, dia: 5 },
  { min: 36, max: 42, dia: 6 },
  { min: 43, max: 49, dia: 7 },
  { min: 50, max: 56, dia: 8 },
  { min: 57, max: 63, dia: 9 },
  { min: 64, max: 69, dia: 10 },
  { min: 70, max: 75, dia: 11 },
  { min: 76, max: 81, dia: 12 },
  { min: 82, max: 87, dia: 13 },
  { min: 88, max: 93, dia: 14 },
  { min: 94, max: 99, dia: 15 },
]

/**
 * Obtiene el día de vencimiento según los últimos 2 dígitos de la cédula
 */
export function getDiaVencimientoPorCedula(numeroDocumento: string): number {
  // Limpiar el documento (solo números)
  const soloNumeros = numeroDocumento.replace(/\D/g, '')

  if (soloNumeros.length < 2) {
    return 1 // Default al día 1 si no hay suficientes dígitos
  }

  // Obtener últimos 2 dígitos
  const ultimos2Digitos = parseInt(soloNumeros.slice(-2), 10)

  // Buscar en la tabla de vencimientos
  const rango = TABLA_VENCIMIENTOS.find(
    (r) => ultimos2Digitos >= r.min && ultimos2Digitos <= r.max
  )

  return rango?.dia ?? 1
}

/**
 * Calcula la próxima fecha de vencimiento PILA basada en el número de documento
 * El pago PILA se realiza el mes siguiente al periodo cotizado
 */
export function calcularFechaVencimientoPILA(numeroDocumento: string): Date {
  const diaVencimiento = getDiaVencimientoPorCedula(numeroDocumento)
  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const mesActual = hoy.getMonth() // 0-11

  // Crear fecha de vencimiento del mes actual
  let fechaVencimiento = new Date(anioActual, mesActual, diaVencimiento)

  // Si ya pasó la fecha de este mes, usar el próximo mes
  if (hoy > fechaVencimiento) {
    fechaVencimiento = new Date(anioActual, mesActual + 1, diaVencimiento)
  }

  return fechaVencimiento
}

/**
 * Calcula los días restantes hasta una fecha de vencimiento
 * Retorna número negativo si está vencido
 */
export function getDiasRestantes(fechaVencimiento: Date): number {
  const hoy = new Date()
  // Normalizar a medianoche para comparación exacta de días
  hoy.setHours(0, 0, 0, 0)

  const vencimiento = new Date(fechaVencimiento)
  vencimiento.setHours(0, 0, 0, 0)

  const diferencia = vencimiento.getTime() - hoy.getTime()
  const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24))

  return diasRestantes
}

/**
 * Obtiene el estado visual basado en días restantes
 */
export function getEstadoVencimiento(diasRestantes: number): {
  color: 'green' | 'yellow' | 'red'
  bgColor: string
  textColor: string
  borderColor: string
} {
  if (diasRestantes < 0) {
    // Vencido
    return {
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
    }
  } else if (diasRestantes <= 5) {
    // Próximo a vencer (5 días o menos)
    return {
      color: 'yellow',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    }
  } else {
    // Tiempo suficiente (más de 5 días)
    return {
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    }
  }
}

/**
 * Formatea la fecha de vencimiento para mostrar
 */
export function formatearFechaVencimiento(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return fecha.toLocaleDateString('es-CO', opciones)
}

/**
 * Genera el texto de días restantes
 */
export function getTextodiasRestantes(diasRestantes: number): string {
  if (diasRestantes === 0) {
    return 'Vence hoy'
  } else if (diasRestantes === 1) {
    return 'Vence mañana'
  } else if (diasRestantes > 1) {
    return `Faltan ${diasRestantes} días`
  } else if (diasRestantes === -1) {
    return 'Venció ayer'
  } else {
    return `Vencido hace ${Math.abs(diasRestantes)} días`
  }
}

/**
 * Obtiene información completa de vencimiento PILA para un usuario
 */
export function getInfoVencimientoPILA(
  numeroDocumento: string | null | undefined
): {
  fechaVencimiento: Date | null
  fechaFormateada: string
  diasRestantes: number
  textodiasRestantes: string
  estado: ReturnType<typeof getEstadoVencimiento>
  diaDelMes: number
} | null {
  if (!numeroDocumento) {
    return null
  }

  const fechaVencimiento = calcularFechaVencimientoPILA(numeroDocumento)
  const diasRestantes = getDiasRestantes(fechaVencimiento)
  const estado = getEstadoVencimiento(diasRestantes)
  const diaDelMes = getDiaVencimientoPorCedula(numeroDocumento)

  return {
    fechaVencimiento,
    fechaFormateada: formatearFechaVencimiento(fechaVencimiento),
    diasRestantes,
    textodiasRestantes: getTextodiasRestantes(diasRestantes),
    estado,
    diaDelMes,
  }
}
