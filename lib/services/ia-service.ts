/**
 * ULE - SERVICIO DE IA CON ANTHROPIC CLAUDE
 * Sistema de asesoramiento tributario y contable colombiano
 */

import Anthropic from '@anthropic-ai/sdk'
import { User } from '@prisma/client'
import { emailLogger } from '@/lib/utils/logger'
import type {
  ConsultarIAParams,
  RespuestaIA,
  PlanUsuario,
  LimiteConsultas,
  ValidacionAlcance,
} from '@/lib/types/ia'

// ==============================================
// CONFIGURACIÓN
// ==============================================

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Modelo a usar (Claude 3.5 Sonnet recomendado para contexto latinoamericano)
const MODEL = 'claude-3-5-sonnet-20241022'

// Límites de tokens
const MAX_TOKENS = 4000

// ==============================================
// SYSTEM PROMPT ESPECIALIZADO
// ==============================================

const SYSTEM_PROMPT = `Eres un asesor tributario y contable colombiano especializado con amplio conocimiento en:

1. SEGURIDAD SOCIAL EN COLOMBIA:
   - Sistema PILA (Planilla Integrada de Liquidación de Aportes)
   - Cálculo de IBC (Ingreso Base de Cotización)
   - Aportes a salud (12.5%), pensión (16%), ARL (según nivel de riesgo)
   - Diferencias entre tipos de contrato: OPS, término fijo, indefinido
   - Normativa vigente: Ley 100 de 1993, Decreto 1273 de 2018
   - Salario Mínimo Legal Vigente 2025: $1.423.500

2. FACTURACIÓN ELECTRÓNICA:
   - Resolución DIAN 000042 de 2020
   - CUFE (Código Único de Factura Electrónica)
   - Obligados a facturar electrónicamente
   - Formatos UBL 2.1
   - Proveedores tecnológicos habilitados
   - Plazos y sanciones por incumplimiento

3. REGÍMENES TRIBUTARIOS:
   - Régimen Simple de Tributación (Ley 2277 de 2022)
   - Régimen Ordinario
   - No responsables de IVA
   - Umbrales de ingresos para cada régimen
   - Declaración de renta personas naturales
   - Retención en la fuente

4. OBLIGACIONES CONTABLES:
   - Libros contables obligatorios
   - Conservación de documentos
   - Facturación y comprobantes

PRINCIPIOS DE ASESORAMIENTO:

✅ DEBES:
- Proporcionar información educativa clara y precisa
- Citar normativa colombiana cuando sea relevante (leyes, decretos, resoluciones)
- Adaptar respuestas al contexto específico del usuario
- Explicar conceptos complejos de manera sencilla
- Usar ejemplos prácticos con cifras colombianas (COP)
- Recomendar consultar con profesionales certificados para casos complejos
- Mencionar plazos y fechas importantes
- Advertir sobre sanciones por incumplimiento
- Ser objetivo y educativo

❌ NO DEBES:
- Sustituir asesoría profesional certificada (contador, abogado)
- Proporcionar asesoría fiscal específica sin advertencias
- Garantizar resultados o exenciones tributarias
- Interpretar casos particulares sin disclaimers
- Recomendar evasión o elusión fiscal
- Dar fechas exactas de vencimientos sin verificar (pueden cambiar)
- Asumir situaciones sin preguntar detalles importantes

FORMATO DE RESPUESTA:

1. Responde de manera estructurada y clara
2. Usa listas y bullets para mejor legibilidad
3. Incluye ejemplos numéricos cuando sea apropiado
4. Cita normativa relevante con número de ley/decreto/resolución
5. Termina con un disclaimer cuando sea necesario
6. Si la pregunta está fuera de tu alcance, recomienda consultar un profesional

DISCLAIMER ESTÁNDAR (usar cuando sea apropiado):
"⚠️ Esta información es de carácter educativo y general. Para tu caso específico, te recomiendo consultar con un contador público o abogado tributarista certificado que pueda analizar tu situación particular."

TONO:
- Profesional pero accesible
- Educativo y orientador
- Empático y comprensivo
- Confiable pero con humildad (admitir cuando algo requiere asesoría profesional)

Recuerda: Tu objetivo es educar e informar, no tomar decisiones por el usuario.`

// ==============================================
// CONSTRUCCIÓN DE CONTEXTO DE USUARIO
// ==============================================

/**
 * Construye contexto del usuario para incluir en consultas
 */
function construirContextoUsuario(usuario: Partial<User>): string {
  const partes: string[] = []

  if (usuario.nombre) {
    partes.push(`Nombre: ${usuario.nombre}`)
  }

  if (usuario.tipoContrato) {
    const tiposContrato: Record<string, string> = {
      OPS: 'Orden de Prestación de Servicios (sin vínculo laboral)',
      DIRECTO: 'Contrato directo con vínculo laboral',
      TERMINO_FIJO: 'Contrato a término fijo',
      TERMINO_INDEFINIDO: 'Contrato a término indefinido',
    }
    partes.push(
      `Tipo de contrato: ${tiposContrato[usuario.tipoContrato] || usuario.tipoContrato}`
    )
  }

  if (usuario.profesion) {
    partes.push(`Profesión: ${usuario.profesion}`)
  }

  if (usuario.actividadEconomica) {
    partes.push(`Actividad económica: CIIU ${usuario.actividadEconomica}`)
  }

  if (usuario.ingresoMensualPromedio) {
    const smmlv = 1423500
    const ingreso =
      typeof usuario.ingresoMensualPromedio === 'number'
        ? usuario.ingresoMensualPromedio
        : usuario.ingresoMensualPromedio.toNumber()
    const smmlvs = (ingreso / smmlv).toFixed(2)
    partes.push(
      `Ingreso mensual promedio: ${ingreso.toLocaleString('es-CO')} COP (${smmlvs} SMMLV)`
    )
  }

  if (usuario.numeroContratos) {
    partes.push(`Número de contratos activos: ${usuario.numeroContratos}`)
  }

  if (usuario.entidadSalud) {
    partes.push(`EPS: ${usuario.entidadSalud}`)
  }

  if (usuario.entidadPension) {
    partes.push(`Fondo de Pensión: ${usuario.entidadPension}`)
  }

  if (usuario.arl) {
    partes.push(`ARL: ${usuario.arl}`)
  }

  if (usuario.estadoCivil) {
    partes.push(`Estado civil: ${usuario.estadoCivil}`)
  }

  if (
    usuario.personasACargo !== undefined &&
    usuario.personasACargo !== null &&
    usuario.personasACargo > 0
  ) {
    partes.push(`Personas a cargo: ${usuario.personasACargo}`)
  }

  return partes.length > 0
    ? `\n\n<contexto_usuario>\n${partes.join('\n')}\n</contexto_usuario>`
    : ''
}

// ==============================================
// FUNCIÓN PRINCIPAL: CONSULTAR IA
// ==============================================

/**
 * Función principal para consultar a la IA
 *
 * @param params Parámetros de la consulta
 * @returns Respuesta de la IA con metadata
 */
export async function consultarIA(
  params: ConsultarIAParams
): Promise<RespuestaIA> {
  const { pregunta, usuario, historialConversacion = [] } = params

  try {
    emailLogger.info('Iniciando consulta a IA', {
      userId: usuario.id,
      preguntaLength: pregunta.length,
      historialSize: historialConversacion.length,
    })

    // Construir contexto del usuario
    const contextoUsuario = construirContextoUsuario(usuario)

    // Construir mensajes para la API
    const mensajes: Anthropic.MessageParam[] = []

    // Agregar historial de conversación (si existe)
    historialConversacion.forEach((mensaje) => {
      mensajes.push({
        role: mensaje.rol === 'user' ? 'user' : 'assistant',
        content: mensaje.contenido,
      })
    })

    // Agregar pregunta actual con contexto del usuario
    mensajes.push({
      role: 'user',
      content: `${pregunta}${contextoUsuario}`,
    })

    emailLogger.debug('Enviando request a Anthropic', {
      model: MODEL,
      messagesCount: mensajes.length,
    })

    // Llamar a la API de Anthropic
    const respuesta = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: mensajes,
    })

    // Extraer texto de la respuesta
    const contenidoRespuesta = respuesta.content[0]
    if (!contenidoRespuesta || contenidoRespuesta.type !== 'text') {
      throw new Error('Tipo de respuesta no esperado de Anthropic')
    }

    const tokensUsados =
      respuesta.usage.input_tokens + respuesta.usage.output_tokens

    emailLogger.info('Consulta IA exitosa', {
      userId: usuario.id,
      tokensUsados,
      model: respuesta.model,
      stopReason: respuesta.stop_reason,
    })

    return {
      respuesta: contenidoRespuesta.text,
      tokensUsados,
      modelo: respuesta.model,
      finishReason: respuesta.stop_reason || 'unknown',
    }
  } catch (error) {
    emailLogger.error('Error al consultar IA', error as Error, {
      userId: usuario.id,
      pregunta: pregunta.substring(0, 100),
    })

    if (error instanceof Anthropic.APIError) {
      throw new Error(`Error de API de Anthropic: ${error.message}`)
    }

    throw new Error('Error al procesar consulta con IA')
  }
}

// ==============================================
// STREAMING DE RESPUESTA
// ==============================================

/**
 * Streaming de respuesta para mejor UX en el chat
 *
 * @param params Parámetros de la consulta
 * @param onChunk Callback para cada chunk de texto
 */
export async function consultarIAStream(
  params: ConsultarIAParams,
  onChunk: (texto: string) => void
): Promise<void> {
  const { pregunta, usuario, historialConversacion = [] } = params

  try {
    emailLogger.info('Iniciando consulta IA con streaming', {
      userId: usuario.id,
    })

    const contextoUsuario = construirContextoUsuario(usuario)

    const mensajes: Anthropic.MessageParam[] = []

    historialConversacion.forEach((mensaje) => {
      mensajes.push({
        role: mensaje.rol === 'user' ? 'user' : 'assistant',
        content: mensaje.contenido,
      })
    })

    mensajes.push({
      role: 'user',
      content: `${pregunta}${contextoUsuario}`,
    })

    // Crear stream
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: mensajes,
    })

    // Procesar chunks
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }

    emailLogger.info('Streaming IA completado', { userId: usuario.id })
  } catch (error) {
    emailLogger.error('Error en streaming de IA', error as Error, {
      userId: usuario.id,
    })
    throw new Error('Error al procesar consulta con IA en streaming')
  }
}

// ==============================================
// GENERACIÓN DE TÍTULO
// ==============================================

/**
 * Generar título para conversación basado en primera pregunta
 * Versión mejorada con fallback
 *
 * @param primeraPregunta Primera pregunta de la conversación
 * @returns Título generado automáticamente
 */
export async function generarTituloConversacion(
  primeraPregunta: string
): Promise<string> {
  try {
    const respuesta = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 50,
      system: `Genera un título corto y descriptivo (máximo 6 palabras) que resuma el tema de esta pregunta sobre tributación/contabilidad colombiana.

Reglas:
- Solo el título, sin comillas ni puntos
- En español
- Descriptivo y específico
- Máximo 6 palabras

Ejemplos:
- "¿Cómo calculo PILA?" → "Cálculo de aportes PILA"
- "¿Qué régimen tributario debo elegir?" → "Elección de régimen tributario"
- "Facturación electrónica obligatoria" → "Facturación electrónica DIAN"`,
      messages: [
        {
          role: 'user',
          content: primeraPregunta,
        },
      ],
    })

    const contenido = respuesta.content[0]
    if (contenido && contenido.type === 'text') {
      const titulo = contenido.text.trim()

      // Validar longitud
      if (titulo.length > 100) {
        return titulo.substring(0, 97) + '...'
      }

      return titulo
    }

    return generarTituloPorDefecto(primeraPregunta)
  } catch (error) {
    emailLogger.error('Error al generar título', error as Error)
    return generarTituloPorDefecto(primeraPregunta)
  }
}

/**
 * Generar título por defecto si falla la IA
 */
function generarTituloPorDefecto(pregunta: string): string {
  // Tomar primeras palabras de la pregunta
  const palabras = pregunta.split(' ').slice(0, 6)
  let titulo = palabras.join(' ')

  if (pregunta.split(' ').length > 6) {
    titulo += '...'
  }

  // Capitalizar primera letra
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1)

  return titulo || 'Nueva conversación'
}

// ==============================================
// VALIDACIONES
// ==============================================

/**
 * Validar que la pregunta esté dentro del alcance del asesor
 *
 * @param pregunta Pregunta a validar
 * @returns Resultado de la validación
 */
export function validarAlcancePregunta(pregunta: string): ValidacionAlcance {
  const preguntaLower = pregunta.toLowerCase()

  // Temas fuera de alcance
  const temasExcluidos = [
    { palabra: 'inversiones', descripcion: 'inversiones financieras' },
    { palabra: 'forex', descripcion: 'mercado de divisas' },
    { palabra: 'criptomonedas', descripcion: 'criptomonedas' },
    { palabra: 'bitcoin', descripcion: 'criptomonedas' },
    { palabra: 'ethereum', descripcion: 'criptomonedas' },
    { palabra: 'trading', descripcion: 'trading financiero' },
    { palabra: 'bolsa', descripcion: 'mercado de valores' },
    { palabra: 'acciones', descripcion: 'inversión en acciones' },
    { palabra: 'fondos de inversión', descripcion: 'fondos de inversión' },
  ]

  for (const tema of temasExcluidos) {
    if (preguntaLower.includes(tema.palabra)) {
      return {
        valida: false,
        razon: `Las consultas sobre ${tema.descripcion} están fuera del alcance de este asesor. Este sistema está especializado en tributación, seguridad social y facturación en Colombia.`,
      }
    }
  }

  return { valida: true }
}

/**
 * Limitar uso según plan del usuario
 *
 * @param consultasRealizadas Número de consultas ya realizadas
 * @param planUsuario Plan del usuario (FREE, BASIC, PREMIUM)
 * @returns Información sobre límites
 */
export function verificarLimiteConsultas(
  consultasRealizadas: number,
  planUsuario: PlanUsuario
): LimiteConsultas {
  const limites: Record<PlanUsuario, number> = {
    FREE: 10,
    BASIC: 50,
    PREMIUM: -1, // Ilimitado
  }

  const limite = limites[planUsuario]
  const permitido = limite === -1 || consultasRealizadas < limite
  const restantes =
    limite === -1 ? -1 : Math.max(0, limite - consultasRealizadas)

  return { permitido, limite, restantes }
}

// ==============================================
// VERIFICACIÓN DE CONFIGURACIÓN
// ==============================================

/**
 * Verificar que la API de Anthropic esté configurada correctamente
 */
export function verificarConfiguracionIA(): {
  configurado: boolean
  errores: string[]
} {
  const errores: string[] = []

  if (!process.env.ANTHROPIC_API_KEY) {
    errores.push('ANTHROPIC_API_KEY no está definida en variables de entorno')
  }

  if (
    process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  ) {
    errores.push('ANTHROPIC_API_KEY no tiene el formato correcto')
  }

  return {
    configurado: errores.length === 0,
    errores,
  }
}
