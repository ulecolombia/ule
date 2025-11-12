/**
 * API: GET /api/ayuda/buscar
 * Búsqueda en artículos de ayuda
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

interface ArticuloAyuda {
  titulo: string
  descripcion: string
  url: string
  categoria: string
  keywords: string[]
}

// Base de conocimiento de artículos
const ARTICULOS: ArticuloAyuda[] = [
  {
    titulo: '¿Cómo liquidar mi PILA?',
    descripcion: 'Guía paso a paso para calcular y liquidar tus aportes a seguridad social',
    url: '/ayuda#guia-pila',
    categoria: 'PILA',
    keywords: ['pila', 'liquidar', 'aportes', 'seguridad social', 'salud', 'pension'],
  },
  {
    titulo: '¿Qué es el IBC?',
    descripcion: 'El Ingreso Base de Cotización es el valor sobre el cual se calculan tus aportes',
    url: '/ayuda#glosario',
    categoria: 'Glosario',
    keywords: ['ibc', 'ingreso base', 'cotizacion', 'calculo'],
  },
  {
    titulo: 'Emitir mi primera factura electrónica',
    descripcion: 'Paso a paso para crear y emitir facturas válidas ante la DIAN',
    url: '/ayuda#guia-facturacion',
    categoria: 'Facturación',
    keywords: ['factura', 'emitir', 'dian', 'electronica', 'cufe'],
  },
  {
    titulo: '¿Cuándo debo declarar renta?',
    descripcion: 'Fechas y requisitos para declaración de renta según tu situación',
    url: '/ayuda#tributario',
    categoria: 'Tributario',
    keywords: ['renta', 'declarar', 'dian', 'impuestos', 'fechas'],
  },
  {
    titulo: '¿Qué es el régimen simple?',
    descripcion: 'Régimen tributario simplificado para pequeños contribuyentes',
    url: '/ayuda#glosario',
    categoria: 'Tributario',
    keywords: ['regimen simple', 'tributario', 'impuestos', 'dian'],
  },
  {
    titulo: 'Niveles de riesgo ARL',
    descripcion: 'Clasificación de riesgos laborales y porcentajes de cotización',
    url: '/ayuda#glosario',
    categoria: 'PILA',
    keywords: ['arl', 'riesgo', 'nivel', 'cotizacion', 'laboral'],
  },
]

export async function GET(req: NextRequest) {
  try {
    // ✅ Rate limiting: 30 búsquedas por minuto por IP
    const limiter = await rateLimit(req, { max: 30, window: 60000 })

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': limiter.remaining.toString(),
            'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
          },
        }
      )
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.toLowerCase().trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        resultados: [],
        mensaje: 'Ingresa al menos 2 caracteres para buscar',
      })
    }

    const resultados = ARTICULOS.filter((articulo) => {
      const tituloMatch = articulo.titulo.toLowerCase().includes(query)
      const descripcionMatch = articulo.descripcion.toLowerCase().includes(query)
      const keywordsMatch = articulo.keywords.some((k) =>
        k.toLowerCase().includes(query)
      )
      return tituloMatch || descripcionMatch || keywordsMatch
    })

    const resultadosOrdenados = resultados.sort((a, b) => {
      const aScore =
        (a.titulo.toLowerCase().includes(query) ? 3 : 0) +
        (a.keywords.some((k) => k.toLowerCase().includes(query)) ? 2 : 0) +
        (a.descripcion.toLowerCase().includes(query) ? 1 : 0)

      const bScore =
        (b.titulo.toLowerCase().includes(query) ? 3 : 0) +
        (b.keywords.some((k) => k.toLowerCase().includes(query)) ? 2 : 0) +
        (b.descripcion.toLowerCase().includes(query) ? 1 : 0)

      return bScore - aScore
    })

    return NextResponse.json({
      resultados: resultadosOrdenados.slice(0, 10),
      total: resultadosOrdenados.length,
    })
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al buscar artículos' },
      { status: 500 }
    )
  }
}
