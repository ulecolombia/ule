'use client'

import { useState, useEffect, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  calcularTotalAportes,
  formatearMoneda,
  formatearPeriodo,
  SMMLV_2026,
  NivelRiesgoARL,
  CalculoAportes,
} from '@/lib/calculadora-pila'
import { Header } from '@/components/layout/Header'

interface Aporte {
  id: string
  periodo: string
  ibc: number
  total: number
  estado: string
  fechaLimite: Date
}

export default function LiquidarPilaPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [historico, setHistorico] = useState<Aporte[]>([])

  // Estado del formulario
  const [formData, setFormData] = useState({
    ingresoMensual: '',
    nivelRiesgo: 'I' as NivelRiesgoARL,
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  })

  // Resultado del cálculo
  const [resultado, setResultado] = useState<CalculoAportes | null>(null)

  // Cargar histórico al montar
  useEffect(() => {
    fetchHistorico()
  }, [])

  const fetchHistorico = async () => {
    try {
      const response = await fetch('/api/pila/liquidacion')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setHistorico(data.aportes || [])
    } catch (error) {
      console.error('Error al cargar histórico:', error)
      // No mostrar toast en carga inicial silenciosa
    }
  }

  // Formatear número con puntos de miles
  const formatearNumero = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Manejar cambio en inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    if (name === 'ingresoMensual') {
      const formateado = formatearNumero(value)
      setFormData((prev) => ({ ...prev, [name]: formateado }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    setShowResults(false)
  }

  // Calcular aportes
  const handleCalcular = () => {
    try {
      const ingresoLimpio = formData.ingresoMensual.replace(/\./g, '')
      const ingreso = parseFloat(ingresoLimpio)

      if (!ingreso || ingreso <= 0) {
        toast.error('Ingreso inválido', {
          description: 'Por favor ingresa un valor mayor a cero',
        })
        return
      }

      const calculo = calcularTotalAportes(ingreso, formData.nivelRiesgo)
      setResultado(calculo)
      setShowResults(true)
      toast.success('Aportes calculados correctamente')
    } catch (error) {
      console.error('Error al calcular:', error)
      toast.error('Error al calcular aportes', {
        description: 'Por favor verifica los datos ingresados',
      })
    }
  }

  // Guardar liquidación
  const handleGuardar = async () => {
    if (!resultado) return

    setLoading(true)
    try {
      const ingresoLimpio = formData.ingresoMensual.replace(/\./g, '')
      const response = await fetch('/api/pila/liquidacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingresoBase: parseFloat(ingresoLimpio),
          ibc: resultado.ibc,
          salud: resultado.salud,
          pension: resultado.pension,
          arl: resultado.arl,
          total: resultado.total,
          mes: formData.mes,
          anio: formData.anio,
          nivelRiesgo: formData.nivelRiesgo,
        }),
      })

      if (response.ok) {
        toast.success('Liquidación guardada exitosamente', {
          description: `Período: ${formatearPeriodo(formData.mes, formData.anio)}`,
        })
        setShowResults(false)
        setFormData((prev) => ({ ...prev, ingresoMensual: '' }))
        fetchHistorico() // Recargar histórico
      } else {
        const errorData = await response.json()
        toast.error('Error al guardar', {
          description: errorData.message || 'No se pudo guardar la liquidación',
          action: {
            label: 'Reintentar',
            onClick: () => handleGuardar(),
          },
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
        action: {
          label: 'Reintentar',
          onClick: () => handleGuardar(),
        },
      })
    } finally {
      setLoading(false)
    }
  }

  // Ir a pagar
  const handleIrAPagar = async (aporteId: string) => {
    try {
      const response = await fetch('/api/pila/generar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aporteId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Abrir link de pago en nueva ventana
        window.open(data.url, '_blank')
        toast.success('Redirigiendo a pasarela de pago')
      } else {
        const errorData = await response.json()
        toast.error('Error al generar link de pago', {
          description: errorData.message || 'Intenta nuevamente',
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión', {
        description: 'No se pudo procesar la solicitud',
      })
    }
  }

  return (
    <Fragment>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-dark mb-3 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <span className="material-symbols-outlined text-4xl text-primary">
                calculate
              </span>
              Liquidar PILA
            </h1>
            <p className="text-dark-100 font-medium">
              Calcula y liquida tus aportes mensuales a seguridad social
            </p>
          </div>

          {/* Formulario */}
          <div className="border-light-200 mb-6 rounded-lg border-2 bg-white p-6">
            <h2 className="text-dark mb-6 text-xl font-bold">
              Información de Cotización
            </h2>

            {/* Ingreso Mensual */}
            <div className="mb-4">
              <label className="text-dark mb-2 block text-sm font-semibold">
                Ingreso Mensual
              </label>
              <div className="relative">
                <span className="text-dark-100 absolute left-3 top-3">$</span>
                <input
                  type="text"
                  name="ingresoMensual"
                  value={formData.ingresoMensual}
                  onChange={handleInputChange}
                  className="border-light-200 w-full rounded-lg border-2 py-2 pl-8 pr-4 transition-colors focus:border-primary focus:outline-none"
                  placeholder="1.750.905"
                />
              </div>
              <p className="text-dark-100 mt-1 text-xs">
                Mínimo: {formatearMoneda(SMMLV_2026)} (1 SMMLV)
              </p>
            </div>

            {/* Nivel de Riesgo ARL */}
            <div className="mb-4">
              <label className="text-dark mb-2 block text-sm font-semibold">
                Nivel de Riesgo ARL
              </label>
              <select
                name="nivelRiesgo"
                value={formData.nivelRiesgo}
                onChange={handleInputChange}
                className="border-light-200 w-full rounded-lg border-2 px-4 py-2 transition-colors focus:border-primary focus:outline-none"
              >
                <option value="I">Nivel I - Riesgo Mínimo (0.522%)</option>
                <option value="II">Nivel II - Riesgo Bajo (1.044%)</option>
                <option value="III">Nivel III - Riesgo Medio (2.436%)</option>
                <option value="IV">Nivel IV - Riesgo Alto (4.350%)</option>
                <option value="V">Nivel V - Riesgo Máximo (6.960%)</option>
              </select>
            </div>

            {/* Período */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-dark mb-2 block text-sm font-semibold">
                  Mes
                </label>
                <select
                  name="mes"
                  value={formData.mes}
                  onChange={handleInputChange}
                  className="border-light-200 w-full rounded-lg border-2 px-4 py-2 transition-colors focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {formatearPeriodo(m, 2026).split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-dark mb-2 block text-sm font-semibold">
                  Año
                </label>
                <select
                  name="anio"
                  value={formData.anio}
                  onChange={handleInputChange}
                  className="border-light-200 w-full rounded-lg border-2 px-4 py-2 transition-colors focus:border-primary focus:outline-none"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Botón Calcular */}
            <button
              onClick={handleCalcular}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Calcular Aportes
            </button>
          </div>

          {/* Resultados */}
          {showResults && resultado && (
            <div className="space-y-6">
              {/* IBC */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-5">
                <h3 className="text-dark mb-2 font-bold">
                  Ingreso Base de Cotización (IBC)
                </h3>
                <p className="text-3xl font-bold text-primary">
                  {formatearMoneda(resultado.ibc)}
                </p>
              </div>

              {/* Desglose de Aportes */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Salud */}
                <div className="border-light-200 hover:border-success/50 rounded-lg border-2 bg-white p-5 transition-colors">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-dark text-sm font-semibold">
                      Salud
                    </span>
                    <span className="rounded-full bg-success-light px-2 py-1 text-xs font-medium text-success-text-light">
                      {resultado.desglose.salud.porcentaje}%
                    </span>
                  </div>
                  <p className="text-dark text-2xl font-bold">
                    {formatearMoneda(resultado.salud)}
                  </p>
                </div>

                {/* Pensión */}
                <div className="border-light-200 rounded-lg border-2 bg-white p-5 transition-colors hover:border-primary/50">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-dark text-sm font-semibold">
                      Pensión
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {resultado.desglose.pension.porcentaje}%
                    </span>
                  </div>
                  <p className="text-dark text-2xl font-bold">
                    {formatearMoneda(resultado.pension)}
                  </p>
                </div>

                {/* ARL */}
                <div className="border-light-200 hover:border-warning/50 rounded-lg border-2 bg-white p-5 transition-colors">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-dark text-sm font-semibold">ARL</span>
                    <span className="rounded-full bg-warning-light px-2 py-1 text-xs font-medium text-warning-text-light">
                      {resultado.desglose.arl.porcentaje}%
                    </span>
                  </div>
                  <p className="text-dark text-2xl font-bold">
                    {formatearMoneda(resultado.arl)}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="rounded-lg border-2 border-primary bg-primary/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-dark mb-1 text-lg font-bold">
                      Total a Pagar
                    </h3>
                    <p className="text-dark-100 text-sm font-medium">
                      Período: {formatearPeriodo(formData.mes, formData.anio)}
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-primary">
                    {formatearMoneda(resultado.total)}
                  </p>
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Liquidación'}
              </button>
            </div>
          )}

          {/* Información Adicional */}
          <div className="mt-8 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-primary">
                info
              </span>
              <div className="flex-1">
                <h3 className="text-dark mb-3 font-bold">
                  Información Importante
                </h3>
                <ul className="text-dark-100 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      El IBC mínimo es 1 SMMLV ({formatearMoneda(SMMLV_2026)})
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      El IBC máximo es 25 SMMLV (
                      {formatearMoneda(SMMLV_2026 * 25)})
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      La fecha límite de pago es el día 10 del mes siguiente
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      Los porcentajes corresponden a la normativa vigente 2026
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Histórico de Liquidaciones */}
          {historico.length > 0 && (
            <div className="mt-8">
              <h2 className="text-dark mb-6 text-2xl font-bold tracking-tight">
                Histórico de Liquidaciones
              </h2>
              <div className="border-light-200 overflow-hidden rounded-lg border-2 bg-white">
                <table className="w-full">
                  <thead className="bg-light-50">
                    <tr>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Período
                      </th>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        IBC
                      </th>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Total
                      </th>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Estado
                      </th>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Fecha Límite
                      </th>
                      <th className="text-dark px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-light-200 divide-y">
                    {historico.map((aporte) => (
                      <tr
                        key={aporte.id}
                        className="hover:bg-light-50 transition-colors"
                      >
                        <td className="text-dark px-4 py-3 text-sm font-medium">
                          {aporte.periodo}
                        </td>
                        <td className="text-dark-100 px-4 py-3 text-sm">
                          {formatearMoneda(aporte.ibc)}
                        </td>
                        <td className="text-dark px-4 py-3 text-sm font-bold">
                          {formatearMoneda(aporte.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              aporte.estado === 'PAGADO'
                                ? 'bg-success-light text-success-text-light'
                                : aporte.estado === 'VENCIDO'
                                  ? 'bg-error-light text-error-text-light'
                                  : 'bg-warning-light text-warning-text-light'
                            }`}
                          >
                            {aporte.estado}
                          </span>
                        </td>
                        <td className="text-dark-100 px-4 py-3 text-sm">
                          {new Date(aporte.fechaLimite).toLocaleDateString(
                            'es-CO'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {aporte.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleIrAPagar(aporte.id)}
                              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                            >
                              Ir a pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  )
}
