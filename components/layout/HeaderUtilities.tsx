/**
 * ULE - HEADER UTILITIES
 * Utilidades del header: notificaciones y perfil
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { NotificacionesBell } from '@/components/NotificacionesBell'

interface HeaderUtilitiesProps {
  userName?: string | null
  userEmail?: string | null
}

export function HeaderUtilities({ userName, userEmail }: HeaderUtilitiesProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {/* Notificaciones Funcionales */}
      <NotificacionesBell />

      {/* Separador */}
      <div className="mx-2 h-6 w-px bg-gray-300"></div>

      {/* Perfil */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="material-symbols-outlined text-gray-600">
            {isProfileMenuOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {/* Profile Dropdown */}
        {isProfileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsProfileMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-xl animate-slideDown">
              {/* Header */}
              <div className="border-b border-gray-200 px-4 py-3">
                <p className="font-semibold text-gray-900">
                  {userName || 'Usuario'}
                </p>
                <p className="text-sm text-gray-600">
                  {userEmail}
                </p>
              </div>

              {/* Options */}
              <div className="p-2">
                <Link
                  href="/perfil"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-primary">
                    person
                  </span>
                  <span>Ver perfil</span>
                </Link>

                <Link
                  href="/perfil?tab=configuracion"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-gray-600">
                    settings
                  </span>
                  <span>Configuración</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
