/**
 * SERVICIO DE CALENDARIO TRIBUTARIO
 * Gestión de eventos tributarios, notificaciones y exportación
 */

import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import * as ics from 'ics'

/**
 * Generar eventos tributarios pre-cargados para un usuario
 */
export async function generarEventosPreCargados(
  userId: string,
  año: number
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tipoContrato: true,
      ingresoMensualPromedio: true,
    },
  })

  if (!user) throw new Error('Usuario no encontrado')

  const eventos: any[] = []

  // 1. VENCIMIENTOS PILA - Día 10 de cada mes
  for (let mes = 0; mes < 12; mes++) {
    const fecha = new Date(año, mes, 10, 9, 0, 0) // Día 10 a las 9:00 AM

    eventos.push({
      userId,
      titulo: `Vencimiento PILA - ${obtenerNombreMes(mes)} ${año}`,
      descripcion: `Fecha límite para pagar aportes a seguridad social del periodo ${obtenerNombreMes(
        mes
      )} ${año}. Incluye: Salud (12.5%), Pensión (16%) y ARL.`,
      fecha,
      tipo: 'VENCIMIENTO_PILA',
      categoria: 'LABORAL',
      color: '#10B981',
      recurrente: true,
      frecuencia: 'MENSUAL',
    })
  }

  // 2. DECLARACIONES TRIBUTARIAS según régimen
  const regimenUsuario = determinarRegimen(user)

  if (regimenUsuario === 'SIMPLE') {
    // Régimen Simple: Pagos bimestrales
    const mesesBimestrales = [1, 3, 5, 7, 9, 11] // Feb, Abr, Jun, Ago, Oct, Dic

    mesesBimestrales.forEach((mes) => {
      eventos.push({
        userId,
        titulo: `Pago Régimen Simple - Periodo ${mes - 1}-${mes}`,
        descripcion: `Pago bimestral del Régimen Simple de Tributación correspondiente a los meses ${obtenerNombreMes(
          mes - 2
        )} y ${obtenerNombreMes(mes - 1)}.`,
        fecha: new Date(año, mes, 15, 9, 0, 0),
        tipo: 'PAGO_IMPUESTOS',
        categoria: 'TRIBUTARIO',
        color: '#8B5CF6',
        recurrente: true,
        frecuencia: 'BIMESTRAL',
      })
    })

    // Declaración anual
    eventos.push({
      userId,
      titulo: `Declaración Anual Régimen Simple ${año - 1}`,
      descripcion: `Declaración consolidada anual del Régimen Simple de Tributación correspondiente al año ${
        año - 1
      }.`,
      fecha: new Date(año, 2, 31, 23, 59, 0), // 31 de marzo
      tipo: 'DECLARACION_RENTA',
      categoria: 'TRIBUTARIO',
      color: '#EF4444',
    })
  } else if (regimenUsuario === 'ORDINARIO') {
    // Régimen Ordinario: Declaración de renta anual
    eventos.push({
      userId,
      titulo: `Declaración de Renta ${año - 1}`,
      descripcion: `Declaración de renta como persona natural del año gravable ${
        año - 1
      }. Verifica tu grupo según últimos dígitos del NIT.`,
      fecha: new Date(año, 3, 15, 23, 59, 0), // 15 de abril (fecha referencial)
      tipo: 'DECLARACION_RENTA',
      categoria: 'TRIBUTARIO',
      color: '#EF4444',
    })

    // Retención en la fuente (si aplica)
    eventos.push({
      userId,
      titulo: 'Declaración Retención en la Fuente',
      descripcion:
        'Declaración mensual de retención en la fuente si eres agente retenedor.',
      fecha: new Date(año, 0, 15, 23, 59, 0), // 15 de enero
      tipo: 'DECLARACION_RETEFUENTE',
      categoria: 'TRIBUTARIO',
      color: '#F59E0B',
      recurrente: true,
      frecuencia: 'MENSUAL',
    })
  }

  // 3. ACTUALIZACIÓN SMMLV - Enero
  eventos.push({
    userId,
    titulo: `Actualización Salario Mínimo ${año}`,
    descripcion: `Entra en vigencia el nuevo Salario Mínimo Legal Mensual Vigente para el año ${año}. Revisar para cálculos de PILA y declaraciones.`,
    fecha: new Date(año, 0, 1, 0, 0, 0), // 1 de enero
    tipo: 'ACTUALIZACION_SMMLV',
    categoria: 'LABORAL',
    color: '#3B82F6',
  })

  // 4. RENOVACIÓN RUT (si aplica)
  eventos.push({
    userId,
    titulo: 'Renovación RUT',
    descripcion:
      'Verifica si necesitas actualizar tu Registro Único Tributario en la DIAN.',
    fecha: new Date(año, 11, 15, 9, 0, 0), // 15 de diciembre
    tipo: 'RENOVACION_RUT',
    categoria: 'ADMINISTRATIVO',
    color: '#06B6D4',
  })

  // Crear eventos en la base de datos
  await prisma.eventoCalendario.createMany({
    data: eventos,
    skipDuplicates: true,
  })
}

/**
 * Determinar régimen tributario del usuario
 */
function determinarRegimen(
  user: any
): 'SIMPLE' | 'ORDINARIO' | 'INDETERMINADO' {
  if (!user.ingresoMensualPromedio) return 'INDETERMINADO'

  const ingresoAnual = user.ingresoMensualPromedio.toNumber() * 12
  const uvt2025 = 47065
  const uvtAnual = ingresoAnual / uvt2025

  // Si está dentro del umbral del Régimen Simple (80.000 UVT)
  if (uvtAnual <= 80000) {
    return 'SIMPLE'
  }

  return 'ORDINARIO'
}

/**
 * Obtener nombre del mes en español
 */
function obtenerNombreMes(mes: number): string {
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
  return meses[mes]
}

/**
 * Generar archivo ICS para exportar
 */
export async function generarICS(
  userId: string,
  eventoIds?: string[]
): Promise<string> {
  const where: any = { userId }
  if (eventoIds && eventoIds.length > 0) {
    where.id = { in: eventoIds }
  }

  const eventos = await prisma.eventoCalendario.findMany({
    where,
    orderBy: { fecha: 'asc' },
  })

  const eventosICS = eventos.map((evento) => {
    const start: ics.DateArray = [
      evento.fecha.getFullYear(),
      evento.fecha.getMonth() + 1,
      evento.fecha.getDate(),
      evento.fecha.getHours(),
      evento.fecha.getMinutes(),
    ]

    return {
      start,
      duration: { hours: 1 },
      title: evento.titulo,
      description: evento.descripcion || '',
      status: 'CONFIRMED' as ics.EventStatus,
      busyStatus: 'BUSY' as ics.BusyStatus,
      organizer: { name: 'Ule', email: 'noreply@ule.app' },
      alarms: [
        {
          action: 'display' as const,
          trigger: { days: 7, before: true },
          description: `Recordatorio: ${evento.titulo}`,
        },
        {
          action: 'display' as const,
          trigger: { days: 3, before: true },
          description: `Recordatorio: ${evento.titulo}`,
        },
        {
          action: 'display' as const,
          trigger: { days: 1, before: true },
          description: `Recordatorio: ${evento.titulo}`,
        },
      ],
    }
  })

  const { error, value } = ics.createEvents(eventosICS)

  if (error) {
    throw new Error('Error al generar ICS: ' + error.message)
  }

  return value || ''
}

/**
 * Verificar y enviar recordatorios pendientes
 */
export async function procesarRecordatorios(): Promise<void> {
  const hoy = new Date()
  const en7Dias = addDays(hoy, 7)
  const en3Dias = addDays(hoy, 3)
  const mañana = addDays(hoy, 1)

  // Eventos que necesitan recordatorio de 7 días
  const eventos7Dias = await prisma.eventoCalendario.findMany({
    where: {
      notificar: true,
      notificado7: false,
      fecha: {
        gte: en7Dias,
        lte: addDays(en7Dias, 1),
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })

  // Enviar notificaciones de 7 días
  for (const evento of eventos7Dias) {
    await enviarNotificacion(evento, 7)
    await prisma.eventoCalendario.update({
      where: { id: evento.id },
      data: { notificado7: true },
    })
  }

  // Eventos que necesitan recordatorio de 3 días
  const eventos3Dias = await prisma.eventoCalendario.findMany({
    where: {
      notificar: true,
      notificado3: false,
      fecha: {
        gte: en3Dias,
        lte: addDays(en3Dias, 1),
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })

  // Enviar notificaciones de 3 días
  for (const evento of eventos3Dias) {
    await enviarNotificacion(evento, 3)
    await prisma.eventoCalendario.update({
      where: { id: evento.id },
      data: { notificado3: true },
    })
  }

  // Eventos que necesitan recordatorio de 1 día
  const eventos1Dia = await prisma.eventoCalendario.findMany({
    where: {
      notificar: true,
      notificado1: false,
      fecha: {
        gte: mañana,
        lte: addDays(mañana, 1),
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })

  // Enviar notificaciones de 1 día
  for (const evento of eventos1Dia) {
    await enviarNotificacion(evento, 1)
    await prisma.eventoCalendario.update({
      where: { id: evento.id },
      data: { notificado1: true },
    })
  }
}

/**
 * Enviar notificación
 */
async function enviarNotificacion(
  evento: any,
  diasAntes: number
): Promise<void> {
  // Crear notificación in-app
  await prisma.recordatorio.create({
    data: {
      userId: evento.userId,
      tipo: 'IN_APP',
      titulo: `Recordatorio: ${evento.titulo}`,
      mensaje: `Este evento ocurrirá en ${diasAntes} día${
        diasAntes > 1 ? 's' : ''
      }. ${evento.descripcion || ''}`,
      fechaEnvio: new Date(),
      enviado: true,
      fechaEnviado: new Date(),
    },
  })

  console.log(
    `[Calendario] Notificación enviada a usuario ${evento.userId} para evento "${evento.titulo}" (${diasAntes} días antes)`
  )
}
