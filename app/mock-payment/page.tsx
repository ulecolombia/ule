'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(false);

  const referencia = searchParams.get('ref');
  const aporteId = searchParams.get('aporte');

  const handlePagar = async () => {
    setProcessing(true);

    // Simular procesamiento de pago
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Llamar al webhook
    try {
      const response = await fetch('/api/pila/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aporteId,
          referencia,
          estado: 'APROBADO',
        }),
      });

      if (response.ok) {
        alert('¡Pago procesado exitosamente!');
        window.close(); // Cerrar ventana de pago
      } else {
        alert('Error al procesar pago');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error en el proceso de pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pago PILA - Simulador
          </h1>
          <p className="text-gray-600 text-sm">
            Plataforma de prueba para desarrollo
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Referencia:</span>
              <span className="font-mono text-gray-900">{referencia}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Aporte ID:</span>
              <span className="font-mono text-gray-900">{aporteId}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handlePagar}
            disabled={processing}
            className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Procesando pago...' : 'Simular Pago Exitoso'}
          </button>

          <button
            onClick={() => window.close()}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Modo de prueba:</strong> Esta es una simulación de
            pasarela de pago. En producción, aquí se integraría SOI o Mi
            Planilla.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <MockPaymentContent />
    </Suspense>
  );
}
