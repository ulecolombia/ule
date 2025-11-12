'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatearMoneda, formatearPeriodo } from '@/lib/calculadora-pila';
import Link from 'next/link';

interface Aporte {
  id: string;
  mes: number;
  anio: number;
  periodo: string;
  ibc: number;
  salud: number;
  pension: number;
  arl: number;
  total: number;
  estado: string;
  fechaPago: string | null;
  numeroComprobante: string | null;
  comprobantePDF: string | null;
  createdAt: string;
}

interface ComprobantesPorMes {
  [key: string]: Aporte[];
}

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<Aporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAnio, setFiltroAnio] = useState<number>(
    new Date().getFullYear()
  );
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [mesAbierto, setMesAbierto] = useState<string | null>(null);

  useEffect(() => {
    fetchComprobantes();
  }, []);

  const fetchComprobantes = async () => {
    try {
      const response = await fetch('/api/pila/comprobantes');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setComprobantes(data.comprobantes || []);
    } catch (error) {
      console.error('Error al cargar comprobantes:', error);
      toast.error('Error al cargar comprobantes', {
        description: 'No se pudieron cargar los comprobantes',
        action: {
          label: 'Reintentar',
          onClick: () => {
            setLoading(true);
            fetchComprobantes();
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comprobantes
  const comprobantesFiltrados = comprobantes.filter((c) => {
    const cumpleAnio = filtroAnio === 0 || c.anio === filtroAnio;
    const cumpleEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado;
    return cumpleAnio && cumpleEstado;
  });

  // Agrupar por mes/año
  const comprobantesPorMes = comprobantesFiltrados.reduce((acc, comp) => {
    const key = `${comp.anio}-${comp.mes.toString().padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(comp);
    return acc;
  }, {} as ComprobantesPorMes);

  // Ordenar meses (más reciente primero)
  const mesesOrdenados = Object.keys(comprobantesPorMes).sort((a, b) =>
    b.localeCompare(a)
  );

  // Calcular estadísticas
  const comprobantesPagados = comprobantes.filter(
    (c) => c.estado === 'PAGADO'
  );
  const totalPagadoAnio = comprobantesPagados
    .filter((c) => c.anio === filtroAnio)
    .reduce((sum, c) => sum + parseFloat(c.total.toString()), 0);
  const promedioMensual =
    totalPagadoAnio /
    (comprobantesPagados.filter((c) => c.anio === filtroAnio).length || 1);

  // Años disponibles
  const aniosDisponibles = Array.from(
    new Set(comprobantes.map((c) => c.anio))
  ).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comprobantes PILA
        </h1>
        <p className="text-gray-600">
          Gestiona y consulta tus comprobantes de pago
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Total Pagado {filtroAnio}
            </span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">
            {formatearMoneda(totalPagadoAnio)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Promedio Mensual</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatearMoneda(promedioMensual)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Comprobantes</span>
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {comprobantesPagados.filter((c) => c.anio === filtroAnio).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value={0}>Todos los años</option>
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchComprobantes}
              className="w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de comprobantes por mes */}
      {mesesOrdenados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay comprobantes
          </h3>
          <p className="text-gray-600 mb-6">
            Aún no tienes comprobantes de pago registrados
          </p>
          <Link
            href="/pila/liquidar"
            className="inline-block bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Realizar Primera Liquidación
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mesesOrdenados.map((mesKey) => {
            const [anio, mes] = mesKey.split('-');
            const comprobantesDelMes = comprobantesPorMes[mesKey] || [];
            const isAbierto = mesAbierto === mesKey;

            return (
              <div
                key={mesKey}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Header del acordeón */}
                <button
                  onClick={() => setMesAbierto(isAbierto ? null : mesKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">📁</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">
                        {formatearPeriodo(
                          parseInt(mes || '1'),
                          parseInt(anio || '2025')
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {comprobantesDelMes.length} comprobante(s)
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 transition-transform ${
                      isAbierto ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Contenido del acordeón */}
                {isAbierto && (
                  <div className="border-t border-gray-200">
                    {comprobantesDelMes.map((comp) => (
                      <div
                        key={comp.id}
                        className="px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {comp.periodo}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  comp.estado === 'PAGADO'
                                    ? 'bg-green-100 text-green-700'
                                    : comp.estado === 'VENCIDO'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {comp.estado}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">IBC:</span>
                                <p className="font-semibold">
                                  {formatearMoneda(comp.ibc)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Salud:</span>
                                <p className="font-semibold">
                                  {formatearMoneda(comp.salud)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Pensión:</span>
                                <p className="font-semibold">
                                  {formatearMoneda(comp.pension)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <p className="font-semibold text-teal-600">
                                  {formatearMoneda(comp.total)}
                                </p>
                              </div>
                            </div>

                            {comp.fechaPago && (
                              <p className="text-xs text-gray-500 mt-2">
                                Pagado el{' '}
                                {new Date(comp.fechaPago).toLocaleDateString(
                                  'es-CO'
                                )}
                              </p>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex space-x-2 ml-4">
                            {comp.estado === 'PAGADO' && comp.comprobantePDF && (
                              <>
                                <button
                                  onClick={() =>
                                    window.open(comp.comprobantePDF!, '_blank')
                                  }
                                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Ver PDF"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = comp.comprobantePDF!;
                                    link.download = `comprobante-${comp.periodo}.pdf`;
                                    link.click();
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Descargar PDF"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                            {comp.estado === 'PENDIENTE' && (
                              <Link
                                href={`/pila/liquidar?aporte=${comp.id}`}
                                className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
                              >
                                Ir a pagar
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
