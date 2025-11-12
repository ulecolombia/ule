'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PasoAccion } from '@/lib/services/analisis-tributario-service'

interface PasosImplementacionProps {
  pasos: PasoAccion[]
}

export function PasosImplementacion({ pasos }: PasosImplementacionProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center">
        <span className="material-symbols-outlined text-primary mr-2">
          checklist
        </span>
        Pasos para Implementar
      </h3>

      <div className="space-y-4">
        {pasos.map((paso) => (
          <div
            key={paso.numero}
            className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              {paso.numero}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold">{paso.titulo}</h4>
                <Badge
                  variant={
                    paso.prioridad === 'ALTA'
                      ? 'destructive'
                      : paso.prioridad === 'MEDIA'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {paso.prioridad}
                </Badge>
                {paso.plazo && (
                  <Badge variant="outline">
                    <span className="material-symbols-outlined text-xs mr-1">schedule</span>
                    {paso.plazo}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {paso.descripcion}
              </p>
              {paso.enlaces && paso.enlaces.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {paso.enlaces.map((enlace, index) => (
                    <a
                      key={index}
                      href={enlace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">
                        link
                      </span>
                      {enlace.texto}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
