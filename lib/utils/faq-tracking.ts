/**
 * ULE - FAQ TRACKING UTILITIES
 * Utilidades para tracking de consultas de FAQs
 */

/**
 * Registrar consulta de FAQ
 * @param faqId - ID de la FAQ consultada
 * @param conversacionId - ID de conversación (opcional)
 */
export async function consultarFAQ(
  faqId: string,
  conversacionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/asesoria/faqs/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faqId, conversacionId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Error al registrar consulta' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error al registrar consulta FAQ:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtener FAQs por categoría
 * @param categoria - Categoría a filtrar
 * @param busqueda - Término de búsqueda (opcional)
 */
export async function obtenerFAQs(
  categoria?: string,
  busqueda?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const params = new URLSearchParams()
    if (categoria && categoria !== 'TODAS') {
      params.append('categoria', categoria)
    }
    if (busqueda) {
      params.append('busqueda', busqueda)
    }

    const response = await fetch(`/api/asesoria/faqs?${params}`)

    if (!response.ok) {
      return { success: false, error: 'Error al obtener FAQs' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error al obtener FAQs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtener analytics de FAQs
 */
export async function obtenerAnalyticsFAQs(): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await fetch('/api/asesoria/faqs/analytics')

    if (!response.ok) {
      return { success: false, error: 'Error al obtener analytics' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error al obtener analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Construir URL de chat con pregunta precargada
 * @param pregunta - Pregunta a precargar en el chat
 */
export function construirURLChat(pregunta: string): string {
  const params = new URLSearchParams({ pregunta })
  return `/asesoria?${params}`
}
