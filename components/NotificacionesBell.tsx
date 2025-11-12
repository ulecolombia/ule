'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  fechaEnvio: string;
  leido: boolean;
  enviado: boolean;
  aporte?: {
    id: string;
    periodo: string;
  };
}

export function NotificacionesBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const response = await fetch('/api/notificaciones');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setNotificaciones(data.notificaciones || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      // Silencioso en carga inicial, solo log
    }
  };

  const marcarComoLeidas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notificaciones/marcar-leidas', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Actualizar estado local
      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, leido: true, enviado: true }))
      );
      toast.success('Notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar notificaciones:', error);
      toast.error('Error al marcar notificaciones', {
        description: 'No se pudieron marcar como leídas',
      });
    } finally {
      setLoading(false);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  return (
    <div className="relative">
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {mostrar && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMostrar(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {noLeidas > 0 && (
                <button
                  onClick={marcarComoLeidas}
                  disabled={loading}
                  className="text-sm text-teal-600 hover:text-teal-700 disabled:opacity-50"
                >
                  Marcar todas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="overflow-y-auto max-h-80">
              {notificaciones.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <Link
                    key={notif.id}
                    href={
                      notif.aporte
                        ? `/pila/liquidar?aporte=${notif.aporte.id}`
                        : '/pila/comprobantes'
                    }
                    className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notif.leido ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setMostrar(false)}
                  >
                    <p className="text-sm text-gray-900 mb-1">
                      {notif.mensaje}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notif.fechaEnvio).toLocaleDateString('es-CO')}
                    </p>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            {notificaciones.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <Link
                  href="/notificaciones"
                  className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                  onClick={() => setMostrar(false)}
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
