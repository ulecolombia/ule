/**
 * FINANCIAL TERM TOOLTIPS
 *
 * Componente para mostrar tooltips con explicaciones de términos financieros
 * Mejora la UX al proporcionar ayuda contextual inline
 */

'use client'

import { InfoTooltip } from '@/components/ui/tooltip'

// Diccionario de términos financieros con sus explicaciones
export const FINANCIAL_TERMS = {
  // Términos Pensionales
  IBL: 'Ingreso Base de Liquidación: Es el promedio de tus ingresos de los últimos 10 años cotizados, ajustados por inflación. Se usa para calcular tu pensión en el régimen de Prima Media (Colpensiones).',
  RPM: 'Régimen de Prima Media (Colpensiones): Sistema público de pensiones donde tu pensión se calcula como un porcentaje de tu IBL. Requiere mínimo 1,300 semanas cotizadas.',
  RAIS: 'Régimen de Ahorro Individual con Solidaridad: Sistema privado donde tu pensión depende del saldo acumulado en tu fondo. No tiene requisito mínimo de semanas.',
  'Semanas Cotizadas':
    'Son las semanas que has aportado al sistema pensional. Necesitas mínimo 1,300 semanas (25 años) para pensionarte en RPM.',
  Rentabilidad:
    'Tasa de rendimiento anual esperada de tu fondo de pensiones privado (RAIS). Históricamente ha estado entre 4% y 8% real.',

  // Términos PILA
  IBC: 'Ingreso Base de Cotización: Es el salario sobre el cual se calculan los aportes a seguridad social. Debe estar entre 1 y 25 salarios mínimos.',
  'Nivel de Riesgo ARL':
    'Clasificación del riesgo laboral de tu actividad económica. Va de I (mínimo riesgo) a V (máximo riesgo). Determina el porcentaje de aporte a riesgos laborales.',

  // Términos Tributarios
  'Régimen Simple':
    'Sistema simplificado de impuestos para pequeñas empresas. Tarifa única sobre ingresos brutos, sin deducciones.',
  'Régimen Ordinario':
    'Sistema tradicional de impuesto de renta. Permite deducciones y tiene tarifas progresivas según la renta líquida.',
  'Base Gravable':
    'Valor sobre el cual se aplica el impuesto. En Régimen Simple son los ingresos totales. En Ordinario es la renta líquida (ingresos - deducciones).',
  'Gastos Deducibles':
    'Gastos que puedes restar de tus ingresos en Régimen Ordinario para reducir tu base gravable (ej: nómina, arriendos, servicios).',

  // Términos de IVA
  IVA: 'Impuesto al Valor Agregado: Impuesto indirecto sobre el consumo. Tarifa general del 19% en Colombia.',
  'Base Gravable IVA':
    'Valor sin IVA sobre el cual se calcula el impuesto. Si tienes el total con IVA, la base es: Total / 1.19',
  UVT: 'Unidad de Valor Tributario: Unidad de medida usada en temas tributarios. Se actualiza cada año. Para 2025 es de $47,065 COP.',

  // Términos de Retención en la Fuente
  'Retención en la Fuente':
    'Anticipo del impuesto de renta que se descuenta al momento del pago. Tarifa general del 11% para servicios.',
  'Base de Retención':
    'Valor sobre el cual se aplica la retención. Generalmente es el valor del servicio o compra.',
} as const

export type FinancialTerm = keyof typeof FINANCIAL_TERMS

interface FinancialTermTooltipProps {
  term: FinancialTerm
  side?: 'top' | 'right' | 'bottom' | 'left'
  children?: React.ReactNode
}

/**
 * Componente para mostrar tooltip de un término financiero
 *
 * @example
 * <FinancialTermTooltip term="IBL">
 *   IBL
 * </FinancialTermTooltip>
 *
 * @example
 * <label>
 *   Ingreso Base de Liquidación
 *   <FinancialTermTooltip term="IBL" />
 * </label>
 */
export function FinancialTermTooltip({
  term,
  side = 'top',
  children,
}: FinancialTermTooltipProps) {
  const content = FINANCIAL_TERMS[term]

  if (children) {
    // Si hay children, renderizar como wrapper con texto subrayado
    return (
      <span className="inline-flex items-center gap-1">
        <span className="cursor-help underline decoration-primary/50 decoration-dotted">
          {children}
        </span>
        <InfoTooltip content={content} side={side} />
      </span>
    )
  }

  // Si no hay children, solo renderizar el ícono de info
  return <InfoTooltip content={content} side={side} />
}

/**
 * Componente para término con tooltip integrado
 * Útil para inline en medio de texto
 *
 * @example
 * <p>
 *   Tu <FinancialTerm term="IBL" /> proyectado es de...
 * </p>
 */
export function FinancialTerm({
  term,
  side = 'top',
}: Omit<FinancialTermTooltipProps, 'children'>) {
  return (
    <FinancialTermTooltip term={term} side={side}>
      {term}
    </FinancialTermTooltip>
  )
}
