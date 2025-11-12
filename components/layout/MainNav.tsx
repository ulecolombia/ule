/**
 * ULE - MAIN NAVIGATION
 * Barra de navegación superior con menú hamburguesa, búsqueda y usuario
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Logo } from '@/components/ui/logo'
import { NotificacionesBell } from '@/components/NotificacionesBell'

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // No mostrar nav en páginas de auth u onboarding
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/registro') ||
    pathname?.startsWith('/onboarding')
  ) {
    return null
  }

  // No mostrar si no está autenticado
  if (status !== 'authenticated') {
    return null
  }

  const menuItems: Array<{ href: string; label: string; icon: string; disabled?: boolean }> = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/pila', label: 'PILA', icon: 'account_balance' },
    { href: '/facturacion', label: 'Facturación', icon: 'receipt_long' },
    { href: '/calendario', label: 'Calendario', icon: 'event' },
    { href: '/herramientas', label: 'Herramientas', icon: 'construction' },
    { href: '/biblioteca', label: 'Biblioteca', icon: 'folder_open' },
    { href: '/perfil', label: 'Mi Perfil', icon: 'person' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Aquí puedes implementar la lógica de búsqueda
      console.log('Buscando:', searchQuery)
    }
  }

  return (
    <>
      {/* Navbar Superior */}
      <nav className="fixed top-0 z-50 w-full border-b border-light-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Lado Izquierdo: Hamburger + Logo */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50 hover:text-dark"
              aria-label="Menú"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Centro: Barra de Búsqueda */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-dark-100">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar facturas, clientes, documentos..."
                className="w-full rounded-lg border border-light-200 bg-light-50 py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </form>
          </div>

          {/* Lado Derecho: Notificaciones + Usuario */}
          <div className="flex items-center gap-3">
            {/* Botón de búsqueda móvil */}
            <button
              type="button"
              className="md:hidden rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50 hover:text-dark"
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            {/* Notificaciones */}
            <NotificacionesBell />

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-light-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="material-symbols-outlined text-dark-100">
                  {isUserMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown del Usuario */}
              {isUserMenuOpen && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-light-200 bg-white shadow-lg z-50">
                    {/* Header del dropdown */}
                    <div className="border-b border-light-200 p-4">
                      <p className="font-semibold text-dark">
                        {session?.user?.name || 'Usuario'}
                      </p>
                      <p className="text-sm text-dark-100">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Opciones */}
                    <div className="p-2">
                      <Link
                        href="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-dark transition-colors hover:bg-light-50"
                      >
                        <span className="material-symbols-outlined text-primary">
                          person
                        </span>
                        <span>Editar Perfil</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          signOut({ callbackUrl: '/login' })
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined">logout</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Lateral */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform">
            {/* Header del Sidebar */}
            <div className="flex items-center justify-between border-b border-light-200 p-4">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Navegación del Sidebar */}
            <nav className="p-4">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  const isDisabled = item.disabled

                  if (isDisabled) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-dark-100 opacity-50 cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        <span className="ml-auto text-xs bg-warning-light text-warning-text-light px-2 py-0.5 rounded-full">
                          Próximamente
                        </span>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-dark hover:bg-light-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </aside>
        </>
      )}

      {/* Spacer para compensar la navbar fija */}
      <div className="h-16" />
    </>
  )
}
