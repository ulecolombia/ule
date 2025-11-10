/**
 * ULE - MAIN NAVIGATION
 * Navegación principal de la aplicación
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LogOut, Home, FileText, DollarSign, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MainNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // No mostrar nav en páginas de auth
  if (pathname?.startsWith('/login') || pathname?.startsWith('/registro')) {
    return null
  }

  // No mostrar si no está autenticado
  if (status !== 'authenticated') {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/facturacion', label: 'Facturación', icon: FileText },
    { href: '/pila', label: 'PILA', icon: DollarSign },
    { href: '/perfil', label: 'Perfil', icon: User },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-white">U</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Ule</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {/* User Menu */}
            <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
