/**
 * COMPONENTES PESADOS CON LAZY LOADING
 * Optimización de carga mediante code splitting
 */

import { lazy } from 'react'

/**
 * Calculadoras tributarias
 * Se cargan solo cuando el usuario navega a /herramientas
 */
export const CalculadoraRetencion = lazy(() =>
  import('@/components/calculadoras/calculadora-retencion').then((module) => ({
    default: module.CalculadoraRetencion,
  }))
)

export const CalculadoraIVA = lazy(() =>
  import('@/components/calculadoras/calculadora-iva').then((module) => ({
    default: module.CalculadoraIVA,
  }))
)

export const CalculadoraPILA = lazy(() =>
  import('@/components/calculadoras/calculadora-pila').then((module) => ({
    default: module.CalculadoraPILA,
  }))
)

export const SimuladorRegimen = lazy(() =>
  import('@/components/calculadoras/simulador-regimen').then((module) => ({
    default: module.SimuladorRegimen,
  }))
)

export const ConversorUVT = lazy(() =>
  import('@/components/calculadoras/conversor-uvt').then((module) => ({
    default: module.ConversorUVT,
  }))
)

export const HistorialCalculos = lazy(() =>
  import('@/components/calculadoras/historial-calculos').then((module) => ({
    default: module.HistorialCalculos,
  }))
)

/**
 * Componentes de ayuda
 * Widget y tours se cargan bajo demanda
 */
export const WidgetAyuda = lazy(() =>
  import('@/components/ayuda/widget-ayuda').then((module) => ({
    default: module.WidgetAyuda,
  }))
)

export const TourWrapper = lazy(() =>
  import('@/components/ayuda/tour-wrapper').then((module) => ({
    default: module.TourWrapper,
  }))
)

/**
 * Indicador de progreso
 * Se carga solo si el progreso < 100%
 */
export const IndicadorProgreso = lazy(() =>
  import('@/components/dashboard/indicador-progreso').then((module) => ({
    default: module.IndicadorProgreso,
  }))
)
