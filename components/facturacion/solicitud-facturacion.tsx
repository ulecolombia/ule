/**
 * ULE - SOLICITUD DE FACTURACIÓN ELECTRÓNICA
 * Componente que se muestra cuando el usuario no tiene habilitada
 * la facturación electrónica y desea solicitar el servicio.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SolicitudFacturacionProps {
  userName?: string
  userEmail?: string
  yaSolicito?: boolean
  fechaSolicitud?: Date | null
}

export function SolicitudFacturacion({
  userName,
  userEmail,
  yaSolicito = false,
  fechaSolicitud,
}: SolicitudFacturacionProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [solicitudEnviada, setSolicitudEnviada] = useState(yaSolicito)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!telefono.trim()) {
      toast.error('Por favor ingresa tu número de teléfono')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/facturacion/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, mensaje }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar solicitud')
      }

      toast.success('¡Solicitud enviada! Te contactaremos pronto.')
      setSolicitudEnviada(true)
    } catch (error) {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Beneficios del servicio
  const beneficios = [
    {
      icono: 'verified',
      titulo: 'Habilitación DIAN',
      descripcion:
        'Te ayudamos con todo el proceso de habilitación como facturador electrónico',
    },
    {
      icono: 'qr_code_2',
      titulo: 'CUFE y QR automático',
      descripcion:
        'Generación automática del código único y QR para cada factura',
    },
    {
      icono: 'picture_as_pdf',
      titulo: 'PDF y XML',
      descripcion: 'Documentos en formato estándar DIAN listos para entregar',
    },
    {
      icono: 'mail',
      titulo: 'Envío por email',
      descripcion: 'Envía las facturas directamente a tus clientes',
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <Header />

      <main className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-dark-100 mb-4 flex items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-primary"
            >
              Inicio
            </Link>
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
            <span className="text-dark">Facturación Electrónica</span>
          </div>
          <h1 className="text-dark mb-2 flex items-center text-3xl font-bold">
            <span className="material-symbols-outlined mr-3 text-4xl text-primary">
              receipt_long
            </span>
            Facturación Electrónica
          </h1>
          <p className="text-dark-100">
            Emite facturas electrónicas válidas ante la DIAN
          </p>
        </div>

        {solicitudEnviada ? (
          // ========== ESTADO: SOLICITUD ENVIADA ==========
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Card principal - Confirmación */}
            <Card className="border-light-200 border-2 lg:col-span-2">
              <CardBody className="p-8">
                <div className="py-8 text-center">
                  <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <span className="material-symbols-outlined text-5xl text-green-600">
                      check_circle
                    </span>
                  </div>
                  <h2 className="text-dark mb-3 text-2xl font-bold">
                    ¡Solicitud recibida!
                  </h2>
                  <p className="text-dark-100 mx-auto mb-2 max-w-md">
                    Hemos recibido tu solicitud de facturación electrónica.
                    Nuestro equipo te contactará pronto para iniciar el proceso
                    de habilitación.
                  </p>
                  {fechaSolicitud && (
                    <p className="text-dark-100 mb-8 text-sm">
                      Enviada el{' '}
                      {new Date(fechaSolicitud).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}

                  {/* Timeline de próximos pasos */}
                  <div className="mx-auto mt-8 max-w-sm text-left">
                    <h3 className="text-dark mb-4 font-semibold">
                      Próximos pasos:
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                          1
                        </div>
                        <div>
                          <p className="text-dark font-medium">
                            Te contactaremos
                          </p>
                          <p className="text-dark-100 text-sm">
                            En las próximas 24-48 horas hábiles
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-dark-100 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                          2
                        </div>
                        <div>
                          <p className="text-dark font-medium">
                            Verificación de datos
                          </p>
                          <p className="text-dark-100 text-sm">
                            Validaremos tu información tributaria
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="text-dark-100 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold">
                          3
                        </div>
                        <div>
                          <p className="text-dark font-medium">
                            Activación del servicio
                          </p>
                          <p className="text-dark-100 text-sm">
                            ¡Listo para facturar!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      className="flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        arrow_back
                      </span>
                      Volver al inicio
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Sidebar - Info de contacto */}
            <div className="space-y-4">
              <Card className="border-light-200 border-2">
                <CardBody className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-3">
                      <span className="material-symbols-outlined text-xl text-primary">
                        support_agent
                      </span>
                    </div>
                    <div>
                      <h3 className="text-dark mb-1 font-semibold">
                        ¿Tienes preguntas?
                      </h3>
                      <p className="text-dark-100 mb-3 text-sm">
                        Estamos aquí para ayudarte
                      </p>
                      <a
                        href="mailto:soporte@ule.com.co"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        soporte@ule.com.co
                      </a>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          // ========== ESTADO: FORMULARIO DE SOLICITUD ==========
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna izquierda - Info del servicio */}
            <div className="space-y-6 lg:col-span-2">
              {/* Banner informativo */}
              <Card className="border-light-200 overflow-hidden border-2">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white/20 p-3">
                      <span className="material-symbols-outlined text-3xl">
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <h2 className="mb-2 text-xl font-bold">
                        ¿Necesitas facturar electrónicamente?
                      </h2>
                      <p className="text-white/90">
                        La facturación electrónica es obligatoria para ciertos
                        contribuyentes. Te ayudamos con todo el proceso de
                        habilitación ante la DIAN.
                      </p>
                    </div>
                  </div>
                </div>
                <CardBody className="p-6">
                  <h3 className="text-dark mb-4 flex items-center gap-2 font-semibold">
                    <span className="material-symbols-outlined text-primary">
                      auto_awesome
                    </span>
                    ¿Qué incluye el servicio?
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {beneficios.map((beneficio, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg p-3"
                        style={{ backgroundColor: '#F8F9FA' }}
                      >
                        <div className="rounded-lg bg-primary/10 p-2">
                          <span className="material-symbols-outlined text-lg text-primary">
                            {beneficio.icono}
                          </span>
                        </div>
                        <div>
                          <p className="text-dark text-sm font-medium">
                            {beneficio.titulo}
                          </p>
                          <p className="text-dark-100 text-xs">
                            {beneficio.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Info adicional */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl text-amber-600">
                    info
                  </span>
                  <div>
                    <h4 className="text-dark mb-1 font-semibold">
                      ¿Quiénes deben facturar electrónicamente?
                    </h4>
                    <p className="text-dark-100 text-sm">
                      Si eres persona natural con ingresos brutos anuales
                      superiores a 3.500 UVT (~$165 millones en 2025) o realizas
                      ventas a empresas que lo requieran, debes emitir factura
                      electrónica.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Formulario */}
            <div>
              <Card className="border-light-200 sticky top-6 border-2">
                <CardBody className="p-6">
                  <h3 className="text-dark mb-1 text-lg font-bold">
                    Solicitar activación
                  </h3>
                  <p className="text-dark-100 mb-6 text-sm">
                    Completa el formulario y te contactaremos
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-dark mb-1.5 block text-sm font-medium">
                        Nombre
                      </label>
                      <Input
                        type="text"
                        value={userName || ''}
                        disabled
                        className="bg-light-50"
                      />
                    </div>

                    <div>
                      <label className="text-dark mb-1.5 block text-sm font-medium">
                        Correo electrónico
                      </label>
                      <Input
                        type="email"
                        value={userEmail || ''}
                        disabled
                        className="bg-light-50"
                      />
                    </div>

                    <div>
                      <label className="text-dark mb-1.5 block text-sm font-medium">
                        Teléfono de contacto{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 300 123 4567"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-dark mb-1.5 block text-sm font-medium">
                        Mensaje adicional{' '}
                        <span className="text-dark-100 font-normal">
                          (opcional)
                        </span>
                      </label>
                      <textarea
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Cuéntanos sobre tu negocio..."
                        className="border-light-200 text-dark placeholder:text-dark-100 w-full resize-none rounded-lg border bg-white
                                 px-3 py-2
                                 text-sm transition-colors focus:border-primary focus:outline-none
                                 focus:ring-2 focus:ring-primary/20"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined mr-2 animate-spin text-lg">
                            progress_activity
                          </span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2 text-lg">
                            send
                          </span>
                          Solicitar activación
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/dashboard')}
                      className="w-full"
                    >
                      Volver al inicio
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
