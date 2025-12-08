/**
 * ULE - PANEL DE CONTEXTO DE USUARIO
 * Muestra información del perfil del usuario para contexto de IA
 */

'use client'

import { useEffect, useState } from 'react'
import { Session } from 'next-auth'
import {
  User,
  Briefcase,
  DollarSign,
  Shield,
  Users,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ContextPanelProps {
  session: Session
}

interface UserProfile {
  nombre: string | null
  email: string
  tipoContrato: string | null
  profesion: string | null
  actividadEconomica: string | null
  ingresoMensualPromedio: number | null
  numeroContratos: number | null
  entidadSalud: string | null
  entidadPension: string | null
  arl: string | null
  estadoCivil: string | null
  personasACargo: number | null
}

/**
 * Panel de contexto del usuario
 */
export function ContextPanel({ session: _session }: ContextPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar perfil del usuario
  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile')

      if (!response.ok) {
        throw new Error('Error al cargar perfil')
      }

      const data = await response.json()
      setProfile(data.user)
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      toast.error('Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  // Mapping de tipos de contrato
  const tiposContrato: Record<string, string> = {
    OPS: 'Orden de Prestación de Servicios',
    DIRECTO: 'Contrato directo',
    TERMINO_FIJO: 'Término fijo',
    TERMINO_INDEFINIDO: 'Término indefinido',
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900">Tu Contexto</h2>
        <p className="mt-1 text-xs text-gray-500">
          Información que usa la IA para asesorarte
        </p>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : profile ? (
        <div className="space-y-6 p-4">
          {/* Información básica */}
          <Section
            title="Información básica"
            icon={<User className="h-4 w-4" />}
          >
            <InfoItem label="Nombre" value={profile.nombre} />
            <InfoItem label="Email" value={profile.email} />
          </Section>

          {/* Información laboral */}
          <Section
            title="Información laboral"
            icon={<Briefcase className="h-4 w-4" />}
          >
            <InfoItem
              label="Tipo de contrato"
              value={
                profile.tipoContrato
                  ? (tiposContrato[profile.tipoContrato] ?? null)
                  : null
              }
            />
            <InfoItem label="Profesión" value={profile.profesion} />
            <InfoItem
              label="Actividad económica"
              value={
                profile.actividadEconomica
                  ? `CIIU ${profile.actividadEconomica}`
                  : null
              }
            />
            <InfoItem
              label="Número de contratos"
              value={profile.numeroContratos?.toString() ?? null}
            />
          </Section>

          {/* Información financiera */}
          <Section
            title="Información financiera"
            icon={<DollarSign className="h-4 w-4" />}
          >
            <InfoItem
              label="Ingreso mensual promedio"
              value={
                profile.ingresoMensualPromedio
                  ? `$${profile.ingresoMensualPromedio.toLocaleString('es-CO')} COP`
                  : null
              }
            />
            {profile.ingresoMensualPromedio && (
              <InfoItem
                label="En SMMLV 2025"
                value={`${(profile.ingresoMensualPromedio / 1423500).toFixed(2)} SMMLV`}
              />
            )}
          </Section>

          {/* Seguridad social */}
          <Section
            title="Seguridad social"
            icon={<Shield className="h-4 w-4" />}
          >
            <InfoItem label="EPS" value={profile.entidadSalud} />
            <InfoItem label="Fondo de pensión" value={profile.entidadPension} />
            <InfoItem label="ARL" value={profile.arl} />
          </Section>

          {/* Información personal */}
          <Section
            title="Información personal"
            icon={<Users className="h-4 w-4" />}
          >
            <InfoItem label="Estado civil" value={profile.estadoCivil} />
            <InfoItem
              label="Personas a cargo"
              value={profile.personasACargo?.toString() ?? null}
            />
          </Section>

          {/* CTA para completar perfil */}
          {!profile.tipoContrato ||
          !profile.profesion ||
          !profile.ingresoMensualPromedio ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-xs text-amber-800">
                <strong>💡 Completa tu perfil</strong>
              </p>
              <p className="mb-3 text-xs text-amber-700">
                Con más información, puedo darte respuestas más precisas y
                personalizadas.
              </p>
              <a
                href="/perfil"
                className="inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Ir a mi perfil →
              </a>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">No se pudo cargar el perfil</p>
        </div>
      )}
    </div>
  )
}

/**
 * Sección con título e ícono
 */
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center space-x-2">
        <div className="text-indigo-600">{icon}</div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

/**
 * Item de información
 */
function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between text-xs">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="ml-2 text-right text-gray-900">
        {value || <span className="italic text-gray-400">No especificado</span>}
      </span>
    </div>
  )
}
