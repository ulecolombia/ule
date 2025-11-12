/**
 * ULE - API ENDPOINT PARA STREAMING DE IA
 * POST /api/ia/consultar-stream
 * Streaming de respuestas para mejor UX
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { consultarIAStream } from '@/lib/services/ia-service'
import { apiLogger } from '@/lib/utils/logger'
import type { MensajeIA } from '@/lib/types/ia'

// ==============================================
// VALIDACIÓN DE INPUT
// ==============================================

const consultarStreamSchema = z.object({
  pregunta: z
    .string()
    .min(5, 'La pregunta debe tener al menos 5 caracteres')
    .max(1000, 'La pregunta no puede exceder 1000 caracteres'),
  conversacionId: z.string().cuid().optional(),
})

// ==============================================
// POST - STREAMING DE CONSULTA
// ==============================================

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return new Response('No autenticado', { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new Response('Usuario no encontrado', { status: 404 })
    }

    // Parsear body
    const body = await req.json()
    const validation = consultarStreamSchema.safeParse(body)

    if (!validation.success) {
      return new Response('Datos inválidos', { status: 400 })
    }

    const { pregunta, conversacionId } = validation.data

    apiLogger.info('Iniciando streaming de IA', {
      userId: user.id,
      conversacionId,
    })

    // Configurar streaming
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Obtener historial si existe conversación
          let historial: MensajeIA[] = []
          if (conversacionId) {
            const conversacion = await db.conversacion.findFirst({
              where: { id: conversacionId, userId: user.id },
              include: {
                mensajes: {
                  orderBy: { timestamp: 'asc' },
                  take: 10,
                },
              },
            })

            if (conversacion) {
              historial = conversacion.mensajes.map((m) => ({
                rol: m.rol.toLowerCase() as 'user' | 'assistant',
                contenido: m.contenido,
              }))
            }
          }

          // Stream de respuesta
          await consultarIAStream(
            { pregunta, usuario: user, historialConversacion: historial },
            (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              )
            }
          )

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          apiLogger.info('Streaming completado', {
            userId: user.id,
            conversacionId,
          })
        } catch (error) {
          apiLogger.error('Error en streaming', error as Error, {
            userId: user.id,
          })
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    apiLogger.error('Error en POST /api/ia/consultar-stream', error as Error)
    return new Response('Error al procesar streaming', { status: 500 })
  }
}
