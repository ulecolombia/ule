import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { User } from '@prisma/client'
import { z } from 'zod'
import { pesosAUvt } from '@/lib/constants/tributarios'
import { logger } from '@/lib/logger'

const MODEL = 'claude-3-5-sonnet-20241022'

// Lazy initialization del cliente Anthropic
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (anthropicClient) {
    return anthropicClient
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY no está configurada. ' +
        'Por favor, configura esta variable de entorno en .env o .env.local'
    )
  }

  anthropicClient = new Anthropic({ apiKey })
  return anthropicClient
}

/**
 * Wrapper con timeout para promesas
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operación excedió el tiempo límite'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  )
  return Promise.race([promise, timeout])
}

/**
 * Estructura del reporte tributario
 */
export interface ReporteTributario {
  regimenRecomendado: 'SIMPLE' | 'ORDINARIO' | 'INDETERMINADO'
  confianzaRecomendacion: 'ALTA' | 'MEDIA' | 'BAJA'
  razonesLegales: string[]
  razonesEconomicas: string[]
  comparativaTabla: ComparativaRegimenes
  pasosSeguir: PasoAccion[]
  consideracionesAdicionales: string[]
  advertencias: string[]
  fechaAnalisis: Date
}

export interface ComparativaRegimenes {
  caracteristicas: CaracteristicaComparativa[]
  proyeccionEconomica: ProyeccionEconomica
}

export interface CaracteristicaComparativa {
  concepto: string
  regimenSimple: string
  regimenOrdinario: string
  ventajaPara: 'SIMPLE' | 'ORDINARIO' | 'NEUTRO'
}

export interface ProyeccionEconomica {
  ingresoAnualEstimado: number
  impuestoRegimenSimple: number
  impuestoRegimenOrdinario: number
  ahorroEstimado: number
  regimenMasEconomico: 'SIMPLE' | 'ORDINARIO'
}

export interface PasoAccion {
  numero: number
  titulo: string
  descripcion: string
  plazo?: string
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  enlaces?: { texto: string; url: string }[]
}

/**
 * Schema Zod para validación de respuesta de IA
 */
const EnlaceSchema = z.object({
  texto: z.string(),
  url: z.string(),
})

const PasoAccionSchema = z.object({
  numero: z.number(),
  titulo: z.string(),
  descripcion: z.string(),
  plazo: z.string().optional(),
  prioridad: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  enlaces: z.array(EnlaceSchema).optional(),
})

const ProyeccionEconomicaSchema = z.object({
  ingresoAnualEstimado: z.number(),
  impuestoRegimenSimple: z.number(),
  impuestoRegimenOrdinario: z.number(),
  ahorroEstimado: z.number(),
  regimenMasEconomico: z.enum(['SIMPLE', 'ORDINARIO']),
})

const CaracteristicaComparativaSchema = z.object({
  concepto: z.string(),
  regimenSimple: z.string(),
  regimenOrdinario: z.string(),
  ventajaPara: z.enum(['SIMPLE', 'ORDINARIO', 'NEUTRO']),
})

const ComparativaRegimenesSchema = z.object({
  caracteristicas: z.array(CaracteristicaComparativaSchema),
  proyeccionEconomica: ProyeccionEconomicaSchema,
})

const ReporteTributarioSchema = z.object({
  regimenRecomendado: z.enum(['SIMPLE', 'ORDINARIO', 'INDETERMINADO']),
  confianzaRecomendacion: z.enum(['ALTA', 'MEDIA', 'BAJA']),
  razonesLegales: z.array(z.string()),
  razonesEconomicas: z.array(z.string()),
  comparativaTabla: ComparativaRegimenesSchema,
  pasosSeguir: z.array(PasoAccionSchema),
  consideracionesAdicionales: z.array(z.string()),
  advertencias: z.array(z.string()),
})

/**
 * Sistema prompt especializado para análisis tributario
 */
const SYSTEM_PROMPT_TRIBUTARIO = `Eres un asesor tributario colombiano experto en análisis comparativo de regímenes tributarios según la normativa vigente.

CONOCIMIENTO ESPECIALIZADO:

**RÉGIMEN SIMPLE DE TRIBUTACIÓN (SIMPLE):**
Creado por Ley 2277 de 2022, reemplaza el anterior régimen SIMPLE.

Características principales:
- Aplica para personas naturales y jurídicas
- Umbral de ingresos: hasta 80.000 UVT anuales ($3.765.200.000 en 2025)
- Tarifa única progresiva según ingresos (entre 1.5% y 13.5%)
- Sustituye impuesto de renta, ICA (en algunos casos), y otros
- Declaración anual simplificada
- Menos obligaciones formales
- No permite compensación de pérdidas fiscales
- Pago bimestral de anticipos

Ventajas:
- Simplicidad administrativa
- Menor carga tributaria en muchos casos
- Menos obligaciones contables
- Tarifas competitivas para ingresos medios
- Un solo impuesto integrado

Desventajas:
- No se pueden deducir costos y gastos
- No hay compensación de pérdidas
- Puede ser más costoso en ingresos altos
- Menos planeación tributaria posible

**RÉGIMEN ORDINARIO:**
Sistema tributario tradicional de renta.

Características principales:
- Sin límite de ingresos
- Tarifa progresiva (0% a 39% para personas naturales)
- Permite deducir costos y gastos
- Compensación de pérdidas fiscales
- Obligaciones contables completas
- Mayor complejidad administrativa
- Declaración detallada de renta

Ventajas:
- Deducción de costos y gastos
- Compensación de pérdidas
- Mejor para altos ingresos con altos costos
- Mayor flexibilidad en planeación tributaria
- Descuentos tributarios disponibles

Desventajas:
- Mayor complejidad
- Más obligaciones formales
- Costos contables más altos
- Mayor tiempo invertido en cumplimiento

**UMBRALES Y TARIFAS 2025:**
- UVT 2025: $47.065
- SMMLV 2025: $1.423.500
- Umbral Régimen Simple: 80.000 UVT ($3.765.200.000)

Tarifas Régimen Simple (2025):
- 0 a 1.400 UVT: 1,5%
- 1.400 a 3.500 UVT: 3%
- 3.500 a 7.000 UVT: 6%
- 7.000 a 14.000 UVT: 9%
- 14.000 a 80.000 UVT: 13,5%

**METODOLOGÍA DE ANÁLISIS:**

1. Evaluar elegibilidad para ambos regímenes
2. Calcular carga tributaria proyectada en cada régimen
3. Considerar costos y gastos deducibles
4. Analizar complejidad administrativa
5. Evaluar flexibilidad y planeación tributaria
6. Considerar objetivos del contribuyente
7. Proyectar escenarios a 1-3 años

**FORMATO DE RESPUESTA:**

Debes responder ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:

{
  "regimenRecomendado": "SIMPLE" | "ORDINARIO" | "INDETERMINADO",
  "confianzaRecomendacion": "ALTA" | "MEDIA" | "BAJA",
  "razonesLegales": ["razón 1", "razón 2", ...],
  "razonesEconomicas": ["razón 1", "razón 2", ...],
  "comparativaTabla": {
    "caracteristicas": [
      {
        "concepto": "Concepto a comparar",
        "regimenSimple": "Descripción en Simple",
        "regimenOrdinario": "Descripción en Ordinario",
        "ventajaPara": "SIMPLE" | "ORDINARIO" | "NEUTRO"
      }
    ],
    "proyeccionEconomica": {
      "ingresoAnualEstimado": 0,
      "impuestoRegimenSimple": 0,
      "impuestoRegimenOrdinario": 0,
      "ahorroEstimado": 0,
      "regimenMasEconomico": "SIMPLE" | "ORDINARIO"
    }
  },
  "pasosSeguir": [
    {
      "numero": 1,
      "titulo": "Título del paso",
      "descripcion": "Descripción detallada",
      "plazo": "Opcional: plazo sugerido",
      "prioridad": "ALTA" | "MEDIA" | "BAJA"
    }
  ],
  "consideracionesAdicionales": ["consideración 1", "consideración 2", ...],
  "advertencias": ["advertencia 1", "advertencia 2", ...]
}

CRÍTICO: No incluyas texto adicional fuera del JSON. Solo el objeto JSON válido.

**PRINCIPIOS:**
- Base el análisis en datos concretos del usuario
- Cita artículos específicos de la Ley 2277 de 2022 cuando sea relevante
- Sé conservador: si hay duda, recomienda consulta con contador
- Considera tanto aspectos económicos como administrativos
- Proyecta escenarios realistas
- Incluye advertencias sobre situaciones que requieren asesoría profesional`

/**
 * Resultado del análisis tributario incluyendo análisis anterior para comparación
 */
export interface ResultadoAnalisisTributario {
  reporte: ReporteTributario
  analisisAnterior: {
    regimenRecomendado: string
    confianza: string
  } | null
}

/**
 * Función principal para analizar perfil tributario
 */
export async function analizarPerfilTributario(
  userId: string
): Promise<ResultadoAnalisisTributario> {
  try {
    // Obtener datos completos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Validar que tenga información mínima necesaria
    if (!user.ingresoMensualPromedio) {
      throw new Error('Se requiere información de ingresos para el análisis')
    }

    // Construir contexto del usuario para la IA
    const contextoUsuario = construirContextoTributario(user)

    // Prompt especializado para análisis
    const promptAnalisis = `Analiza el siguiente perfil tributario y recomienda el régimen más conveniente:

${contextoUsuario}

Realiza un análisis completo considerando:
1. Elegibilidad para cada régimen según ingresos
2. Proyección de carga tributaria en cada régimen
3. Complejidad administrativa y costos asociados
4. Beneficios y desventajas específicas para este perfil
5. Pasos concretos para implementar la recomendación

Responde SOLO con el objeto JSON estructurado según las instrucciones.`

    // Llamar a la IA con timeout de 30 segundos
    const respuesta = await withTimeout(
      getAnthropicClient().messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT_TRIBUTARIO,
        messages: [
          {
            role: 'user',
            content: promptAnalisis,
          },
        ],
      }),
      30000,
      'El análisis tributario excedió el tiempo límite. Por favor intenta nuevamente.'
    )

    // Extraer y parsear respuesta
    const contenido = respuesta.content[0]
    if (!contenido || contenido.type !== 'text') {
      throw new Error('Tipo de respuesta inesperado')
    }

    // Limpiar respuesta (remover markdown si existe)
    let jsonText = contenido.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    // Parsear JSON con try-catch
    let analisisJSON
    try {
      analisisJSON = JSON.parse(jsonText)
    } catch (parseError) {
      throw new Error(
        'La IA generó una respuesta inválida. Por favor intenta nuevamente.'
      )
    }

    // Validar con Zod
    const validationResult = ReporteTributarioSchema.safeParse(analisisJSON)

    if (!validationResult.success) {
      logger.error('Error de validación en análisis tributario', {
        userId,
        errors: validationResult.error.errors,
      })
      throw new Error(
        'El análisis generado tiene un formato inválido. ' +
          'Por favor intenta nuevamente o contacta soporte.'
      )
    }

    // Construir reporte final (Zod garantiza que tiene todos los campos requeridos)
    const reporte: ReporteTributario = {
      regimenRecomendado: validationResult.data.regimenRecomendado,
      confianzaRecomendacion: validationResult.data.confianzaRecomendacion,
      razonesLegales: validationResult.data.razonesLegales,
      razonesEconomicas: validationResult.data.razonesEconomicas,
      comparativaTabla: validationResult.data.comparativaTabla,
      pasosSeguir: validationResult.data.pasosSeguir,
      consideracionesAdicionales:
        validationResult.data.consideracionesAdicionales,
      advertencias: validationResult.data.advertencias,
      fechaAnalisis: new Date(),
    }

    // Obtener análisis anterior ANTES de guardar el nuevo (evita race condition)
    const analisisAnterior = await prisma.analisisTributario.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Guardar análisis en DB para historial
    await prisma.analisisTributario.create({
      data: {
        userId,
        regimenRecomendado: reporte.regimenRecomendado,
        confianza: reporte.confianzaRecomendacion,
        reporteCompleto: JSON.parse(JSON.stringify(reporte)),
        ingresoAnalizado: user.ingresoMensualPromedio,
      },
    })

    return { reporte, analisisAnterior }
  } catch (error) {
    logger.error(
      'Error al analizar perfil tributario',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    )

    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error(
        'Error al procesar análisis. La IA no generó un formato válido.'
      )
    }

    throw error
  }
}

/**
 * Construir contexto del usuario para análisis
 */
function construirContextoTributario(user: Partial<User>): string {
  const partes: string[] = []

  // Información personal
  if (user.nombre) partes.push(`Nombre: ${user.nombre}`)
  if (user.profesion) partes.push(`Profesión: ${user.profesion}`)

  // Información laboral
  if (user.tipoContrato) {
    partes.push(`Tipo de contrato: ${user.tipoContrato}`)
  }

  if (user.ingresoMensualPromedio) {
    const ingresoMensual = user.ingresoMensualPromedio.toNumber()
    const ingresoAnual = ingresoMensual * 12
    const ingresoEnUVT = pesosAUvt(ingresoAnual)

    partes.push(
      `Ingreso mensual promedio: ${ingresoMensual.toLocaleString('es-CO')}`
    )
    partes.push(
      `Ingreso anual proyectado: ${ingresoAnual.toLocaleString('es-CO')}`
    )
    partes.push(
      `Ingreso anual en UVT: ${ingresoEnUVT.toLocaleString('es-CO')} UVT`
    )
  }

  if (user.numeroContratos) {
    partes.push(`Número de contratos activos: ${user.numeroContratos}`)
  }

  if (user.actividadEconomica) {
    partes.push(`Actividad económica (CIIU): ${user.actividadEconomica}`)
  }

  // Seguridad social
  const seguridadSocial: string[] = []
  if (user.entidadSalud) seguridadSocial.push(`EPS: ${user.entidadSalud}`)
  if (user.entidadPension)
    seguridadSocial.push(`Pensión: ${user.entidadPension}`)
  if (user.arl) seguridadSocial.push(`ARL: ${user.arl}`)

  if (seguridadSocial.length > 0) {
    partes.push(`Seguridad Social: ${seguridadSocial.join(', ')}`)
  }

  // Información adicional
  if (user.estadoCivil) partes.push(`Estado civil: ${user.estadoCivil}`)
  if (user.personasACargo && user.personasACargo > 0) {
    partes.push(`Personas a cargo: ${user.personasACargo}`)
  }

  return partes.join('\n')
}

/**
 * Obtener historial de análisis del usuario
 */
export async function obtenerHistorialAnalisis(userId: string, limit = 10) {
  const historial = await prisma.analisisTributario.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return historial
}

/**
 * Comparar análisis actual con anterior
 */
export function compararAnalisis(
  analisisAnterior: { regimenRecomendado: string; confianza: string } | null,
  reporteActual: ReporteTributario
): {
  huboCambio: boolean
  cambiosDetectados: string[]
} | null {
  if (!analisisAnterior) {
    return null
  }

  const cambios: string[] = []

  if (
    analisisAnterior.regimenRecomendado !== reporteActual.regimenRecomendado
  ) {
    cambios.push(
      `La recomendación cambió de ${analisisAnterior.regimenRecomendado} a ${reporteActual.regimenRecomendado}`
    )
  }

  if (analisisAnterior.confianza !== reporteActual.confianzaRecomendacion) {
    cambios.push(
      `El nivel de confianza cambió de ${analisisAnterior.confianza} a ${reporteActual.confianzaRecomendacion}`
    )
  }

  return {
    huboCambio: cambios.length > 0,
    cambiosDetectados: cambios,
  }
}
