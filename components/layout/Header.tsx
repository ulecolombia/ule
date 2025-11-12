/**
 * ULE - MAIN HEADER
 * Barra de herramientas principal con sidebar, acciones rápidas y utilidades
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { SidebarMenu } from './SidebarMenu'
import { QuickActions } from './QuickActions'
import { HeaderUtilities } from './HeaderUtilities'

interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
}

export function Header({ userName, userEmail }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Detectar si estamos en el dashboard
  const isOnDashboard = pathname === '/dashboard'

  return (
    <>
      {/* Sidebar Menu */}
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Header */}
      <header
        className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm"
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between gap-6 px-6">
          {/* Left Section: Hamburger + Logo + Home Button */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir menú"
              aria-expanded={isSidebarOpen}
              aria-controls="sidebar-menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Logo */}
            <Link
              href="/dashboard"
              className="rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Logo size="sm" />
            </Link>

            {/* Página Principal Button - Solo visible fuera del dashboard */}
            {!isOnDashboard && (
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:flex"
              >
                <span className="material-symbols-outlined text-xl">home</span>
                <span>Página Principal</span>
              </Link>
            )}
          </div>

          {/* Center Section: Quick Actions */}
          <QuickActions />

          {/* Right Section: Utilities */}
          <HeaderUtilities userName={userName} userEmail={userEmail} />
        </div>
      </header>

      {/* Spacer for sticky header */}
      <div className="h-0" aria-hidden="true" />
    </>
  )
}
