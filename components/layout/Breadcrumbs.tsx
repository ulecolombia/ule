/**
 * Breadcrumbs - Navegación jerárquica
 * Auto-genera breadcrumbs desde el pathname actual
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href: string
}

/**
 * Mapeo de rutas a nombres legibles
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  perfil: 'Perfil',
  pila: 'PILA',
  liquidar: 'Liquidar',
  historial: 'Historial',
  facturacion: 'Facturación',
  nueva: 'Nueva Factura',
  clientes: 'Clientes',
  asesoria: 'Asesoría IA',
  analisis: 'Análisis Tributario',
  consulta: 'Consulta',
  faqs: 'Preguntas Frecuentes',
  biblioteca: 'Biblioteca',
  notificaciones: 'Notificaciones',
  onboarding: 'Bienvenida',
  configuracion: 'Configuración',
  ayuda: 'Ayuda',
  'mock-payment': 'Pago',
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // No mostrar breadcrumbs en páginas de autenticación o homepage
  if (!pathname || pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/registro')) {
    return null
  }

  const segments = pathname.split('/').filter(Boolean)

  // No mostrar breadcrumbs si solo estamos en el dashboard principal
  if (segments.length === 1 && segments[0] === 'dashboard') {
    return null
  }

  // Construir breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = ROUTE_LABELS[segment] || formatSegment(segment)

    return { label, href }
  })

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {/* Home link */}
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-dark-100 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-lg">home</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={item.href} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-dark-100 text-sm">
                chevron_right
              </span>

              {isLast ? (
                <span className="font-medium text-dark" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-dark-100 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Formatea un segmento de URL a título legible
 * Ej: "nueva-factura" -> "Nueva Factura"
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
