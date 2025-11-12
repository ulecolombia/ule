'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'

export function BotonAsesoriaProfesional() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-outlined mr-2">support_agent</span>
        Asesoría Profesional
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <Card className="absolute right-0 mt-2 w-80 z-50 p-3 space-y-3">
            <div>
              <p className="font-semibold mb-1">¿Necesitas ayuda profesional?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conecta con contadores y abogados certificados
              </p>
            </div>

            <a
              href="/contacto"
              className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">
                mail
              </span>
              <div>
                <p className="font-medium text-sm">Contactar con nosotros</p>
                <p className="text-xs text-gray-500">
                  Te ayudamos a encontrar un profesional
                </p>
              </div>
            </a>

            <a
              href="https://www.contaduria.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">
                verified
              </span>
              <div>
                <p className="font-medium text-sm">Junta Central de Contadores</p>
                <p className="text-xs text-gray-500">
                  Directorio de contadores certificados
                </p>
              </div>
            </a>

            <a
              href="https://www.dian.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">
                account_balance
              </span>
              <div>
                <p className="font-medium text-sm">DIAN</p>
                <p className="text-xs text-gray-500">
                  Consultas oficiales de tributación
                </p>
              </div>
            </a>
          </Card>
        </>
      )}
    </div>
  )
}
