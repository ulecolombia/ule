/**
 * ULE - CONSULTA EDUCATIVA CON IA
 * Diseño de tres paneles: Sidebar | Chat | Context
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/asesoria/sidebar'
import { ChatPanel } from '@/components/asesoria/chat-panel'
import { ContextPanel } from '@/components/asesoria/context-panel'
import { useIAConsulta, useConversaciones } from '@/hooks/use-ia-consulta'
import { Loader2, Menu, X, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Página principal de Asesoría con IA
 */
export default function AsesoriaPage() {
  const { data: session } = useSession()

  // Estados de paneles (responsive)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [contextOpen, setContextOpen] = useState(true)

  // Hook de IA
  const iaHook = useIAConsulta()

  // Hook de conversaciones
  const conversacionesHook = useConversaciones()

  // Conversación actual seleccionada
  const [conversacionActual, setConversacionActual] = useState<string | null>(
    null
  )

  // Cargar conversaciones al montar
  useEffect(() => {
    conversacionesHook.cargarConversaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Responsive: cerrar paneles en móvil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
        setContextOpen(false)
      } else {
        setSidebarOpen(true)
        setContextOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Seleccionar conversación
  const handleSeleccionarConversacion = (conversacionId: string) => {
    setConversacionActual(conversacionId)
    iaHook.reset()

    // Cerrar sidebar en móvil
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // Nueva conversación
  const handleNuevaConversacion = () => {
    setConversacionActual(null)
    iaHook.nuevaConversacion()

    // Cerrar sidebar en móvil
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // Eliminar conversación
  const handleEliminarConversacion = async (conversacionId: string) => {
    await conversacionesHook.eliminarConversacion(conversacionId)

    // Si es la conversación actual, resetear
    if (conversacionId === conversacionActual) {
      setConversacionActual(null)
      iaHook.nuevaConversacion()
    }
  }

  // Loading state
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header userName={session?.user?.name} userEmail={session?.user?.email} />

      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* SIDEBAR - Historial de conversaciones */}
        <aside
          className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          border-light-200 fixed z-30
          h-full w-80 border-r bg-white transition-transform
          duration-300 ease-in-out lg:relative
          lg:translate-x-0
        `}
        >
          <Sidebar
            conversaciones={conversacionesHook.conversaciones}
            conversacionActual={conversacionActual}
            onSeleccionarConversacion={handleSeleccionarConversacion}
            onNuevaConversacion={handleNuevaConversacion}
            onEliminarConversacion={handleEliminarConversacion}
            isLoading={conversacionesHook.isLoading}
          />
        </aside>

        {/* PANEL CENTRAL - Chat */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Header con controles de paneles */}
          <header className="border-light-200 flex items-center justify-between border-b bg-white px-4 py-3 lg:justify-end">
            {/* Toggle sidebar (móvil) */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Toggle context panel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContextOpen(!contextOpen)}
              className="text-dark-100 hover:text-dark font-medium transition-colors"
            >
              {contextOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
              <span className="ml-2 hidden sm:inline">
                {contextOpen ? 'Ocultar contexto' : 'Mostrar contexto'}
              </span>
            </Button>
          </header>

          {/* Chat Panel */}
          <ChatPanel
            conversacionId={conversacionActual}
            iaHook={iaHook}
            onConversacionCreada={(id) => {
              setConversacionActual(id)
              conversacionesHook.cargarConversaciones()
            }}
          />
        </main>

        {/* PANEL DERECHO - Contexto del usuario */}
        <aside
          className={`
          ${contextOpen ? 'translate-x-0' : 'translate-x-full'}
          border-light-200 fixed z-20
          h-full w-80 border-l bg-white transition-transform
          duration-300 ease-in-out lg:relative
          lg:translate-x-0
          ${!contextOpen && 'lg:hidden'}
        `}
        >
          <ContextPanel session={session} />
        </aside>

        {/* Overlay para cerrar paneles en móvil */}
        {(sidebarOpen || contextOpen) && (
          <div
            className="fixed inset-0 z-10 bg-black/20 lg:hidden"
            onClick={() => {
              setSidebarOpen(false)
              setContextOpen(false)
            }}
          />
        )}
      </div>
    </>
  )
}
