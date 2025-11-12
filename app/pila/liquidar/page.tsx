'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  calcularTotalAportes,
  formatearMoneda,
  formatearPeriodo,
  SMMLV_2025,
  NivelRiesgoARL,
  CalculoAportes,
} from '@/lib/calculadora-pila';

interface Aporte {
  id: string;
  periodo: string;
  ibc: number;
  total: number;
  estado: string;
  fechaLimite: Date;
}

export default function LiquidarPilaPage() {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [historico, setHistorico] = useState<Aporte[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    ingresoMensual: '',
    nivelRiesgo: 'I' as NivelRiesgoARL,
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
  });

  // Resultado del cálculo
  const [resultado, setResultado] = useState<CalculoAportes | null>(null);

  // Cargar histórico al montar
  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      const response = await fetch('/api/pila/liquidacion');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHistorico(data.aportes || []);
    } catch (error) {
      console.error('Error al cargar histórico:', error);
      // No mostrar toast en carga inicial silenciosa
    }
  };

  // Manejar cambio en inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setShowResults(false);
  };

  // Calcular aportes
  const handleCalcular = () => {
    try {
      const ingreso = parseFloat(formData.ingresoMensual);

      if (!ingreso || ingreso <= 0) {
        toast.error('Ingreso inválido', {
          description: 'Por favor ingresa un valor mayor a cero',
        });
        return;
      }

      const calculo = calcularTotalAportes(ingreso, formData.nivelRiesgo);
      setResultado(calculo);
      setShowResults(true);
      toast.success('Aportes calculados correctamente');
    } catch (error) {
      console.error('Error al calcular:', error);
      toast.error('Error al calcular aportes', {
        description: 'Por favor verifica los datos ingresados',
      });
    }
  };

  // Guardar liquidación
  const handleGuardar = async () => {
    if (!resultado) return;

    setLoading(true);
    try {
      const response = await fetch('/api/pila/liquidacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingresoBase: parseFloat(formData.ingresoMensual),
          ibc: resultado.ibc,
          salud: resultado.salud,
          pension: resultado.pension,
          arl: resultado.arl,
          total: resultado.total,
          mes: formData.mes,
          anio: formData.anio,
          nivelRiesgo: formData.nivelRiesgo,
        }),
      });

      if (response.ok) {
        toast.success('Liquidación guardada exitosamente', {
          description: `Período: ${formatearPeriodo(formData.mes, formData.anio)}`,
        });
        setShowResults(false);
        setFormData((prev) => ({ ...prev, ingresoMensual: '' }));
        fetchHistorico(); // Recargar histórico
      } else {
        const errorData = await response.json();
        toast.error('Error al guardar', {
          description: errorData.message || 'No se pudo guardar la liquidación',
          action: {
            label: 'Reintentar',
            onClick: () => handleGuardar(),
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
        action: {
          label: 'Reintentar',
          onClick: () => handleGuardar(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Ir a pagar
  const handleIrAPagar = async (aporteId: string) => {
    try {
      const response = await fetch('/api/pila/generar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aporteId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Abrir link de pago en nueva ventana
        window.open(data.url, '_blank');
        toast.success('Redirigiendo a pasarela de pago');
      } else {
        const errorData = await response.json();
        toast.error('Error al generar link de pago', {
          description: errorData.message || 'Intenta nuevamente',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo procesar la solicitud',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-dark tracking-tight flex items-center gap-3">
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
        <div className="bg-white rounded-lg border-2 border-light-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-dark mb-6">
            Información de Cotización
          </h2>

          {/* Ingreso Mensual */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-dark mb-2">
              Ingreso Mensual
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-dark-100">$</span>
              <input
                type="number"
                name="ingresoMensual"
                value={formData.ingresoMensual}
                onChange={handleInputChange}
                className="w-full pl-8 pr-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-dark-100 mt-1">
              Mínimo: {formatearMoneda(SMMLV_2025)} (1 SMMLV)
            </p>
          </div>

          {/* Nivel de Riesgo ARL */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-dark mb-2">
              Nivel de Riesgo ARL
            </label>
            <select
              name="nivelRiesgo"
              value={formData.nivelRiesgo}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
            >
              <option value="I">Nivel I - Riesgo Mínimo (0.522%)</option>
              <option value="II">Nivel II - Riesgo Bajo (1.044%)</option>
              <option value="III">Nivel III - Riesgo Medio (2.436%)</option>
              <option value="IV">Nivel IV - Riesgo Alto (4.350%)</option>
              <option value="V">Nivel V - Riesgo Máximo (6.960%)</option>
            </select>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Mes
              </label>
              <select
                name="mes"
                value={formData.mes}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {formatearPeriodo(m, 2025).split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Año
              </label>
              <select
                name="anio"
                value={formData.anio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border-2 border-light-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Botón Calcular */}
          <button
            onClick={handleCalcular}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Calcular Aportes
          </button>
        </div>

        {/* Resultados */}
        {showResults && resultado && (
          <div className="space-y-6">
            {/* IBC */}
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-5">
              <h3 className="font-bold text-dark mb-2">
                Ingreso Base de Cotización (IBC)
              </h3>
              <p className="text-3xl font-bold text-primary">
                {formatearMoneda(resultado.ibc)}
              </p>
            </div>

            {/* Desglose de Aportes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Salud */}
              <div className="bg-white rounded-lg border-2 border-light-200 p-5 hover:border-success/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-dark">Salud</span>
                  <span className="text-xs bg-success-light text-success-text-light px-2 py-1 rounded-full font-medium">
                    {resultado.desglose.salud.porcentaje}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-dark">
                  {formatearMoneda(resultado.salud)}
                </p>
              </div>

              {/* Pensión */}
              <div className="bg-white rounded-lg border-2 border-light-200 p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-dark">Pensión</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {resultado.desglose.pension.porcentaje}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-dark">
                  {formatearMoneda(resultado.pension)}
                </p>
              </div>

              {/* ARL */}
              <div className="bg-white rounded-lg border-2 border-light-200 p-5 hover:border-warning/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-dark">ARL</span>
                  <span className="text-xs bg-warning-light text-warning-text-light px-2 py-1 rounded-full font-medium">
                    {resultado.desglose.arl.porcentaje}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-dark">
                  {formatearMoneda(resultado.arl)}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-dark mb-1">
                    Total a Pagar
                  </h3>
                  <p className="text-sm text-dark-100 font-medium">
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
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Liquidación'}
            </button>
          </div>
        )}

        {/* Información Adicional */}
        <div className="mt-8 bg-primary/5 border-2 border-primary/20 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">
              info
            </span>
            <div className="flex-1">
              <h3 className="font-bold text-dark mb-3">
                Información Importante
              </h3>
              <ul className="text-sm text-dark-100 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>El IBC mínimo es 1 SMMLV ({formatearMoneda(SMMLV_2025)})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>El IBC máximo es 25 SMMLV ({formatearMoneda(SMMLV_2025 * 25)})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>La fecha límite de pago es el día 10 del mes siguiente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Los porcentajes corresponden a la normativa vigente 2025</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Histórico de Liquidaciones */}
        {historico.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-dark mb-6 tracking-tight">
              Histórico de Liquidaciones
            </h2>
            <div className="bg-white rounded-lg border-2 border-light-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-light-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      Período
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      IBC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      Fecha Límite
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-dark uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-200">
                  {historico.map((aporte) => (
                    <tr key={aporte.id} className="hover:bg-light-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-dark">{aporte.periodo}</td>
                      <td className="px-4 py-3 text-sm text-dark-100">
                        {formatearMoneda(aporte.ibc)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-dark">
                        {formatearMoneda(aporte.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
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
                      <td className="px-4 py-3 text-sm text-dark-100">
                        {new Date(aporte.fechaLimite).toLocaleDateString(
                          'es-CO'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {aporte.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleIrAPagar(aporte.id)}
                            className="text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
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
  );
}
