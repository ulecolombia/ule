/**
 * ULE - SIDEBAR MENU
 * Menú lateral desplegable con navegación jerárquica
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'

interface MenuItem {
  label: string
  icon: string
  href?: string
  subItems?: {
    label: string
    href: string
  }[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/dashboard',
  },
  {
    label: 'PILA',
    icon: 'account_balance',
    subItems: [
      { label: 'Liquidar PILA', href: '/pila/liquidar' },
      { label: 'Comprobantes', href: '/pila/comprobantes' },
      { label: 'Configuración', href: '/pila/configuracion' },
    ],
  },
  {
    label: 'Facturación Electrónica',
    icon: 'receipt_long',
    subItems: [
      { label: 'Nueva Factura', href: '/facturacion/nueva' },
      { label: 'Mis Facturas', href: '/facturacion/facturas' },
      { label: 'Clientes', href: '/facturacion/clientes' },
    ],
  },
  {
    label: 'Calendario Tributario',
    icon: 'event',
    href: '/calendario',
  },
  {
    label: 'Herramientas',
    icon: 'construction',
    subItems: [
      { label: 'Calculadoras', href: '/herramientas/calculadoras' },
      { label: 'Simuladores', href: '/herramientas/simuladores' },
    ],
  },
  {
    label: 'Consulta Educativa con IA',
    icon: 'school',
    subItems: [
      { label: 'Chat Educativo', href: '/asesoria/chat' },
      { label: 'Régimen Tributario', href: '/asesoria/regimen' },
      { label: 'Preguntas Frecuentes', href: '/asesoria/faqs' },
    ],
  },
  {
    label: 'Biblioteca de Archivos',
    icon: 'folder_open',
    href: '/biblioteca',
  },
  {
    label: 'Perfil',
    icon: 'person',
    href: '/perfil',
  },
  {
    label: 'Ayuda',
    icon: 'help',
    href: '/ayuda',
  },
]

interface SidebarMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Auto-expand current section
  useEffect(() => {
    const itemsToExpand: string[] = []
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(
          (sub) => pathname.startsWith(sub.href)
        )
        if (hasActiveChild) {
          itemsToExpand.push(item.label)
        }
      }
    })

    // Only update if there are new items to expand
    if (itemsToExpand.length > 0) {
      setExpandedItems((prev) => {
        const newItems = itemsToExpand.filter((label) => !prev.includes(label))
        return newItems.length > 0 ? [...prev, ...newItems] : prev
      })
    }
  }, [pathname])

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-fadeIn"
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 h-full w-[280px] bg-white shadow-2xl overflow-y-auto animate-slideRight">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4" role="navigation" aria-label="Menú principal">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expandedItems.includes(item.label)
              const itemIsActive = item.href ? isActive(item.href) : false

              return (
                <li key={item.label}>
                  {hasSubItems ? (
                    <>
                      {/* Item with submenu */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.label)}
                        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                          isExpanded
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-xl">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-xl transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        >
                          chevron_right
                        </span>
                      </button>

                      {/* Submenu */}
                      {isExpanded && (
                        <ul className="ml-4 mt-1 space-y-1 overflow-hidden border-l-2 border-gray-200 pl-4 animate-expandHeight">
                          {item.subItems?.map((subItem) => (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                onClick={onClose}
                                className={`block rounded-lg px-4 py-2 text-sm transition-all ${
                                  isActive(subItem.href)
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    /* Simple item */
                    <Link
                      href={item.href!}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        itemIsActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
