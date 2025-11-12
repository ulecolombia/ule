/**
 * ULE - API ENDPOINT PARA CONSULTAS A LA IA
 * POST /api/ia/consultar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  consultarIA,
  validarAlcancePregunta,
  verificarLimiteConsultas,
  generarTituloConversacion,
} from '@/lib/services/ia-service'
import { apiLogger } from '@/lib/utils/logger'
import { isValidCUID } from '@/lib/utils/security'
import type { MensajeIA } from '@/lib/types/ia'

// ==============================================
// VALIDACIÓN DE INPUT
// ==============================================

const consultarIASchema = z.object({
  pregunta: z
    .string()
    .min(5, 'La pregunta debe tener al menos 5 caracteres')
    .max(1000, 'La pregunta no puede exceder 1000 caracteres'),
  conversacionId: z.string().cuid().optional(),
})

// ==============================================
// POST - CONSULTAR IA
// ==============================================

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      apiLogger.warn('Intento de consultar IA sin autenticación')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      apiLogger.warn('Usuario no encontrado en consulta IA', {
        email: session.user.email,
      })
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Parsear y validar body
    const body = await req.json()
    const { pregunta, conversacionId } = consultarIASchema.parse(body)

    apiLogger.info('Recibida consulta a IA', {
      userId: user.id,
      conversacionId,
      preguntaLength: pregunta.length,
    })

    // Validar CUID si se proporciona conversacionId
    if (conversacionId && !isValidCUID(conversacionId)) {
      apiLogger.warn('ConversacionId inválido', { conversacionId })
      return NextResponse.json(
        { error: 'ID de conversación inválido' },
        { status: 400 }
      )
    }

    // Validar alcance de la pregunta
    const validacion = validarAlcancePregunta(pregunta)
    if (!validacion.valida) {
      apiLogger.warn('Pregunta fuera de alcance', {
        userId: user.id,
        pregunta: pregunta.substring(0, 50),
      })
      return NextResponse.json(
        { error: 'Pregunta fuera de alcance', razon: validacion.razon },
        { status: 400 }
      )
    }

    // Verificar límite de consultas
    const consultasRealizadas = await db.mensaje.count({
      where: {
        conversacion: {
          userId: user.id,
        },
        rol: 'USER',
      },
    })

    const limiteVerificacion = verificarLimiteConsultas(
      consultasRealizadas,
      'BASIC' // Por ahora todos son BASIC, implementar planes después
    )

    if (!limiteVerificacion.permitido) {
      apiLogger.warn('Límite de consultas alcanzado', {
        userId: user.id,
        consultasRealizadas,
      })
      return NextResponse.json(
        {
          error: 'Límite de consultas alcanzado',
          mensaje: `Has alcanzado el límite de ${limiteVerificacion.limite} consultas. Actualiza tu plan para continuar.`,
        },
        { status: 429 }
      )
    }

    // Obtener o crear conversación
    let conversacion
    let historial: MensajeIA[] = []

    if (conversacionId) {
      // Buscar conversación existente
      conversacion = await db.conversacion.findFirst({
        where: {
          id: conversacionId,
          userId: user.id,
        },
        include: {
          mensajes: {
            orderBy: { timestamp: 'asc' },
            take: 10, // Últimos 10 mensajes para contexto
          },
        },
      })

      if (!conversacion) {
        apiLogger.warn('Conversación no encontrada', {
          userId: user.id,
          conversacionId,
        })
        return NextResponse.json(
          { error: 'Conversación no encontrada' },
          { status: 404 }
        )
      }

      // Construir historial
      historial = conversacion.mensajes.map((m) => ({
        rol: m.rol.toLowerCase() as 'user' | 'assistant',
        contenido: m.contenido,
      }))

      apiLogger.debug('Historial de conversación cargado', {
        conversacionId,
        mensajesCount: historial.length,
      })
    } else {
      // Crear nueva conversación (el título se genera después)
      conversacion = await db.conversacion.create({
        data: {
          userId: user.id,
          titulo: 'Nueva conversación',
        },
      })

      apiLogger.info('Nueva conversación creada', {
        conversacionId: conversacion.id,
      })
    }

    // Consultar a la IA
    apiLogger.info('Consultando a Anthropic Claude', {
      userId: user.id,
      conversacionId: conversacion.id,
    })

    const respuestaIA = await consultarIA({
      pregunta,
      usuario: user,
      historialConversacion: historial,
    })

    apiLogger.info('Respuesta de IA recibida', {
      userId: user.id,
      tokensUsados: respuestaIA.tokensUsados,
      modelo: respuestaIA.modelo,
    })

    // Guardar pregunta del usuario
    await db.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        rol: 'USER',
        contenido: pregunta,
      },
    })

    // Guardar respuesta de la IA
    await db.mensaje.create({
      data: {
        conversacionId: conversacion.id,
        rol: 'ASSISTANT',
        contenido: respuestaIA.respuesta,
      },
    })

    apiLogger.debug('Mensajes guardados en base de datos', {
      conversacionId: conversacion.id,
    })

    // Si es la primera pregunta, generar título
    if (!conversacionId) {
      try {
        const titulo = await generarTituloConversacion(pregunta)

        await db.conversacion.update({
          where: { id: conversacion.id },
          data: { titulo },
        })

        conversacion.titulo = titulo

        apiLogger.info('Título de conversación generado', {
          conversacionId: conversacion.id,
          titulo,
        })
      } catch (error) {
        apiLogger.error(
          'Error al generar título, usando default',
          error as Error
        )
        // No fallar por esto, continuar con título default
      }
    }

    // Actualizar timestamp de la conversación
    await db.conversacion.update({
      where: { id: conversacion.id },
      data: { updatedAt: new Date() },
    })

    // Responder con resultado exitoso
    return NextResponse.json({
      success: true,
      conversacionId: conversacion.id,
      tituloConversacion: conversacion.titulo,
      respuesta: respuestaIA.respuesta,
      tokensUsados: respuestaIA.tokensUsados,
      consultasRestantes: limiteVerificacion.restantes,
    })
  } catch (error) {
    apiLogger.error('Error en POST /api/ia/consultar', error as Error)

    if (error instanceof z.ZodError) {
      apiLogger.warn('Error de validación Zod en consulta IA', {
        errors: error.errors,
      })
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Error al procesar consulta con IA' },
      { status: 500 }
    )
  }
}
