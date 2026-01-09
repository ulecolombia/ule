/**
 * ULE - UTILIDADES DE CALENDARIO TRIBUTARIO
 * Calcula fechas tributarias según el número de documento
 */

/**
 * Calendario DIAN 2026 - Declaración de Renta Personas Naturales
 * Basado en los dos últimos dígitos del NIT/Cédula
 *
 * Distribución estimada (se actualiza anualmente por la DIAN):
 * Agosto: dígitos 01-33
 * Septiembre: dígitos 34-66
 * Octubre: dígitos 67-00
 */

interface FechaTributaria {
  fecha: Date
  descripcion: string
  tipo: 'DECLARACION_RENTA' | 'DECLARACION_IVA' | 'PAGO_PILA' | 'OTRO'
  diasRestantes: number
}

/**
 * Calcula la próxima fecha de declaración de renta según la cédula
 */
export function calcularProximaDeclaracionRenta(
  numeroDocumento: string
): FechaTributaria | null {
  if (!numeroDocumento) return null

  // Obtener los dos últimos dígitos
  const ultimosDosDigitos = parseInt(numeroDocumento.slice(-2))

  if (isNaN(ultimosDosDigitos)) return null

  const añoActual = new Date().getFullYear()
  let mes: number
  let dia: number

  // Calendario DIAN 2026 (estimado - se ajusta cuando DIAN publica oficial)
  // Distribución entre Agosto (mes 7), Septiembre (mes 8), Octubre (mes 9)

  if (ultimosDosDigitos >= 1 && ultimosDosDigitos <= 10) {
    mes = 7 // Agosto
    dia = 9 + Math.floor((ultimosDosDigitos - 1) / 2)
  } else if (ultimosDosDigitos >= 11 && ultimosDosDigitos <= 20) {
    mes = 7 // Agosto
    dia = 14 + Math.floor((ultimosDosDigitos - 11) / 2)
  } else if (ultimosDosDigitos >= 21 && ultimosDosDigitos <= 33) {
    mes = 7 // Agosto
    dia = 19 + Math.floor((ultimosDosDigitos - 21) / 3)
  } else if (ultimosDosDigitos >= 34 && ultimosDosDigitos <= 50) {
    mes = 8 // Septiembre
    dia = 9 + Math.floor((ultimosDosDigitos - 34) / 3)
  } else if (ultimosDosDigitos >= 51 && ultimosDosDigitos <= 66) {
    mes = 8 // Septiembre
    dia = 15 + Math.floor((ultimosDosDigitos - 51) / 3)
  } else if (ultimosDosDigitos >= 67 && ultimosDosDigitos <= 83) {
    mes = 9 // Octubre
    dia = 9 + Math.floor((ultimosDosDigitos - 67) / 3)
  } else if (ultimosDosDigitos >= 84 && ultimosDosDigitos <= 99) {
    mes = 9 // Octubre
    dia = 15 + Math.floor((ultimosDosDigitos - 84) / 3)
  } else {
    // ultimosDosDigitos === 0 || 100
    mes = 9 // Octubre
    dia = 21
  }

  const fechaDeclaracion = new Date(añoActual, mes, dia)
  const hoy = new Date()

  // Si la fecha ya pasó este año, calcular para el próximo año
  if (fechaDeclaracion < hoy) {
    fechaDeclaracion.setFullYear(añoActual + 1)
  }

  const diasRestantes = Math.ceil(
    (fechaDeclaracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    fecha: fechaDeclaracion,
    descripcion: 'Declaración de Renta',
    tipo: 'DECLARACION_RENTA',
    diasRestantes,
  }
}

/**
 * Formatea una fecha para mostrar en el dashboard
 */
export function formatearFechaTributaria(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Obtiene el mensaje de días restantes
 */
export function getMensajeDiasRestantes(diasRestantes: number): string {
  if (diasRestantes < 0) {
    return 'Vencida'
  } else if (diasRestantes === 0) {
    return 'Hoy'
  } else if (diasRestantes === 1) {
    return 'Mañana'
  } else if (diasRestantes <= 7) {
    return `En ${diasRestantes} días`
  } else if (diasRestantes <= 30) {
    const semanas = Math.floor(diasRestantes / 7)
    return `En ${semanas} semana${semanas > 1 ? 's' : ''}`
  } else if (diasRestantes <= 365) {
    const meses = Math.floor(diasRestantes / 30)
    return `En ${meses} mes${meses > 1 ? 'es' : ''}`
  } else {
    return `Próximo año`
  }
}
