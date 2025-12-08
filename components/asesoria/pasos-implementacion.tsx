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
      <h3 className="mb-6 flex items-center text-xl font-semibold">
        <span className="material-symbols-outlined mr-2 text-primary">
          checklist
        </span>
        Pasos para Implementar
      </h3>

      <div className="space-y-4">
        {pasos.map((paso) => (
          <div
            key={paso.numero}
            className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
              {paso.numero}
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <h4 className="font-semibold">{paso.titulo}</h4>
                <Badge
                  variant={
                    paso.prioridad === 'ALTA'
                      ? 'danger'
                      : paso.prioridad === 'MEDIA'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {paso.prioridad}
                </Badge>
                {paso.plazo && (
                  <Badge variant="outline">
                    <span className="material-symbols-outlined mr-1 text-xs">
                      schedule
                    </span>
                    {paso.plazo}
                  </Badge>
                )}
              </div>
              <p className="mb-2 text-gray-600 dark:text-gray-400">
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
                      className="flex items-center text-sm text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm">
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
