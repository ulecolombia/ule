'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ComparativaRegimenes as ComparativaType } from '@/lib/services/analisis-tributario-service'
import { formatCurrency } from '@/lib/utils/format'

interface ComparativaRegimenesProps {
  comparativa: ComparativaType
}

export function ComparativaRegimenes({ comparativa }: ComparativaRegimenesProps) {
  const { caracteristicas, proyeccionEconomica } = comparativa

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center">
        <span className="material-symbols-outlined text-primary mr-2">
          compare_arrows
        </span>
        Comparativa Detallada de Regímenes
      </h3>

      {/* Tabla Comparativa */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 font-semibold">Concepto</th>
              <th className="text-left p-3 font-semibold text-primary">
                Régimen Simple
              </th>
              <th className="text-left p-3 font-semibold text-primary">
                Régimen Ordinario
              </th>
              <th className="text-center p-3 font-semibold">Ventaja</th>
            </tr>
          </thead>
          <tbody>
            {caracteristicas.map((caracteristica, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="p-3 font-medium">{caracteristica.concepto}</td>
                <td className="p-3">{caracteristica.regimenSimple}</td>
                <td className="p-3">{caracteristica.regimenOrdinario}</td>
                <td className="p-3 text-center">
                  {caracteristica.ventajaPara === 'SIMPLE' && (
                    <Badge variant="success">Simple</Badge>
                  )}
                  {caracteristica.ventajaPara === 'ORDINARIO' && (
                    <Badge variant="info">Ordinario</Badge>
                  )}
                  {caracteristica.ventajaPara === 'NEUTRO' && (
                    <Badge variant="secondary">Neutro</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proyección Económica */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
        <h4 className="font-semibold text-lg mb-4">Proyección Económica Anual</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ingreso Anual Estimado</p>
            <p className="text-2xl font-bold">
              {formatCurrency(proyeccionEconomica.ingresoAnualEstimado)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Impuesto Régimen Simple</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(proyeccionEconomica.impuestoRegimenSimple)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Impuesto Régimen Ordinario</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(proyeccionEconomica.impuestoRegimenOrdinario)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {proyeccionEconomica.ahorroEstimado > 0 ? 'Ahorro Estimado' : 'Diferencia'}
            </p>
            <p className={`text-2xl font-bold ${proyeccionEconomica.ahorroEstimado > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {proyeccionEconomica.ahorroEstimado > 0 ? '+' : ''}
              {formatCurrency(proyeccionEconomica.ahorroEstimado)}
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-sm">
            <strong>Régimen más económico:</strong>{' '}
            <Badge variant={proyeccionEconomica.regimenMasEconomico === 'SIMPLE' ? 'success' : 'info'}>
              {proyeccionEconomica.regimenMasEconomico === 'SIMPLE'
                ? 'Régimen Simple'
                : 'Régimen Ordinario'}
            </Badge>
          </p>
        </div>
      </div>
    </Card>
  )
}
