/**
 * ULE - PROFILE PAGE
 * Página de perfil editable del usuario
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProfileSkeleton } from '@/components/profile/profile-skeleton'
import { ChangePasswordModal } from '@/components/profile/change-password-modal'
import { DeleteAccountModal } from '@/components/profile/delete-account-modal'
import {
  formatCurrency,
  formatPhone,
  formatTipoContrato,
  formatEstadoCivil,
  formatTipoDocumento,
} from '@/lib/utils/format'
import {
  EPS_COLOMBIA,
  FONDOS_PENSION as FONDOS_PENSION_DATA,
  ARL_COLOMBIA,
} from '@/lib/data/entidades-seguridad-social'
import { PROFESIONES_COMUNES } from '@/lib/data/profesiones'
import { CODIGOS_CIIU } from '@/lib/data/codigos-ciiu'

// Convertir arrays de objetos a arrays de strings
const EPS_LIST = EPS_COLOMBIA.map((eps) => eps.label)
const FONDOS_PENSION = FONDOS_PENSION_DATA.map((fondo) => fondo.label)
const ARL_LIST = ARL_COLOMBIA.map((arl) => arl.label)
const PROFESIONES = [...PROFESIONES_COMUNES]

// Placeholder - estos datos deberían venir de constants
const DEPARTAMENTOS_CIUDADES = [
  { departamento: 'Bogotá D.C.', ciudades: ['Bogotá'] },
  { departamento: 'Antioquia', ciudades: ['Medellín', 'Envigado'] },
  { departamento: 'Valle del Cauca', ciudades: ['Cali'] },
]

interface UserData {
  id: string
  email: string
  nombre: string
  tipoDocumento: string
  numeroDocumento: string
  telefono: string
  direccion: string
  ciudad: string
  departamento: string
  tipoContrato: string
  profesion: string
  actividadEconomica: string
  numeroContratos: number
  ingresoMensualPromedio: number
  entidadSalud: string
  fechaAfiliacionSalud: string | null
  entidadPension: string
  fechaAfiliacionPension: string | null
  arl: string | null
  nivelRiesgoARL: number | null
  fechaAfiliacionARL: string | null
  estadoCivil: string
  personasACargo: number
  suscribirNewsletter: boolean
  // Información tributaria
  nit: string | null
  razonSocial: string | null
  regimenTributario: string | null
  responsableIVA: boolean
  autorretenedor: boolean
  granContribuyente: boolean
  resolucionDIAN: string | null
  prefijoFactura: string | null
  rangoFacturacionDesde: number | null
  rangoFacturacionHasta: number | null
  fechaResolucion: string | null
  consecutivoActual: number | null
  logoEmpresaUrl: string | null
  colorPrimario: string | null
  nombreBanco: string | null
  tipoCuenta: string | null
  numeroCuenta: string | null
  emailFacturacion: string | null
  perfilCompleto: boolean
  createdAt: string
  updatedAt: string
}

type EditingSection =
  | 'personal'
  | 'laboral'
  | 'seguridad_social'
  | 'tributaria'
  | 'adicional'
  | null

export default function PerfilPage() {
  const router = useRouter()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<EditingSection>(null)
  const [sectionData, setSectionData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) throw new Error('Error al cargar perfil')

        const data = await response.json()
        setUserData(data.user)
      } catch (error) {
        console.error('[Profile] Error:', error)
        toast.error('Error al cargar tu perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleEditSection = (section: EditingSection) => {
    if (!userData) return

    setEditingSection(section)

    // Pre-llenar con datos actuales
    switch (section) {
      case 'personal':
        setSectionData({
          nombre: userData.nombre,
          telefono: userData.telefono,
          direccion: userData.direccion,
          departamento: userData.departamento,
          ciudad: userData.ciudad,
        })
        break
      case 'laboral':
        setSectionData({
          tipoContrato: userData.tipoContrato,
          profesion: userData.profesion,
          actividadEconomica: userData.actividadEconomica,
          numeroContratos: userData.numeroContratos,
          ingresoMensualPromedio: userData.ingresoMensualPromedio,
        })
        break
      case 'seguridad_social':
        setSectionData({
          entidadSalud: userData.entidadSalud,
          fechaAfiliacionSalud: userData.fechaAfiliacionSalud
            ? userData.fechaAfiliacionSalud.split('T')[0]
            : '',
          entidadPension: userData.entidadPension,
          fechaAfiliacionPension: userData.fechaAfiliacionPension
            ? userData.fechaAfiliacionPension.split('T')[0]
            : '',
          arl: userData.arl || '',
          nivelRiesgoARL: userData.nivelRiesgoARL || '',
          fechaAfiliacionARL: userData.fechaAfiliacionARL
            ? userData.fechaAfiliacionARL.split('T')[0]
            : '',
        })
        break
      case 'adicional':
        setSectionData({
          estadoCivil: userData.estadoCivil,
          personasACargo: userData.personasACargo,
          suscribirNewsletter: userData.suscribirNewsletter,
        })
        break
      case 'tributaria':
        setSectionData({
          regimenTributario: userData.regimenTributario || '',
          responsableIVA: userData.responsableIVA || false,
          razonSocial: userData.razonSocial || userData.nombre || '',
          emailFacturacion: userData.emailFacturacion || userData.email || '',
        })
        break
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setSectionData({})
  }

  const handleSaveSection = async (section: EditingSection) => {
    if (!section) return

    try {
      setIsSaving(true)

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seccion: section, data: sectionData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      const result = await response.json()

      // Actualizar estado local
      setUserData(result.user)
      setEditingSection(null)
      setSectionData({})

      toast.success('Cambios guardados exitosamente')
    } catch (error) {
      console.error('[Save Section] Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar cambios'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const updateSectionData = (field: string, value: any) => {
    setSectionData((prev) => ({ ...prev, [field]: value }))
  }

  // Get user initials
  const getInitials = (name: string): string => {
    if (!name) return 'U'
    const parts = name
      .trim()
      .split(' ')
      .filter((p) => p.length > 0)
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, Math.min(2, name.length)).toUpperCase()
  }

  if (loading) return <ProfileSkeleton />

  if (!userData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-dark-100 text-lg">Error al cargar perfil</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const ciudadesDisponibles =
    DEPARTAMENTOS_CIUDADES.find(
      (d: { departamento: string; ciudades: string[] }) =>
        d.departamento === sectionData.departamento
    )?.ciudades || []

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="text-dark-100 text-sm">
        <span
          onClick={() => router.push('/dashboard')}
          className="cursor-pointer hover:text-primary"
        >
          Inicio
        </span>
        <span className="mx-2">/</span>
        <span className="text-dark">Perfil</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-dark text-3xl font-bold">Mi Perfil</h1>
        <p className="text-dark-100 mt-1">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardBody>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              {getInitials(userData.nombre)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-dark text-2xl font-bold">
                {userData.nombre}
              </h2>
              <p className="text-dark-100 mt-1">{userData.email}</p>
              <div className="mt-2">
                <Badge variant="success">Perfil Completo</Badge>
              </div>
            </div>

            {/* Change Photo Button */}
            <Button variant="outline" disabled>
              <span className="material-symbols-outlined mr-2">
                photo_camera
              </span>
              Cambiar foto
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* SECCIÓN 1: DATOS PERSONALES */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  person
                </span>
              </div>
              <div>
                <h3 className="text-dark text-lg font-semibold">
                  Datos Personales
                </h3>
                {editingSection === 'personal' && (
                  <p className="text-sm text-primary">En modo edición</p>
                )}
              </div>
            </div>
            {editingSection !== 'personal' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection('personal')}
                disabled={editingSection !== null}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  edit
                </span>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('personal')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {editingSection === 'personal' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre completo"
                value={sectionData.nombre || ''}
                onChange={(e) => updateSectionData('nombre', e.target.value)}
                required
              />
              <Input
                label="Tipo de documento"
                value={formatTipoDocumento(userData.tipoDocumento)}
                disabled
              />
              <Input
                label="Número de documento"
                value={userData.numeroDocumento}
                disabled
              />
              <Input
                label="Teléfono"
                value={sectionData.telefono || ''}
                onChange={(e) => updateSectionData('telefono', e.target.value)}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Dirección"
                  value={sectionData.direccion || ''}
                  onChange={(e) =>
                    updateSectionData('direccion', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Departamento <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.departamento || ''}
                  onChange={(e) => {
                    updateSectionData('departamento', e.target.value)
                    updateSectionData('ciudad', '')
                  }}
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {DEPARTAMENTOS_CIUDADES.map(
                    (d: { departamento: string; ciudades: string[] }) => (
                      <option key={d.departamento} value={d.departamento}>
                        {d.departamento}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Ciudad <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.ciudad || ''}
                  onChange={(e) => updateSectionData('ciudad', e.target.value)}
                  disabled={!sectionData.departamento}
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {ciudadesDisponibles.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-dark-100 text-sm">Nombre completo</p>
                <p className="text-dark font-medium">{userData.nombre}</p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Documento</p>
                <p className="text-dark font-medium">
                  {formatTipoDocumento(userData.tipoDocumento)}{' '}
                  {userData.numeroDocumento}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Teléfono</p>
                <p className="text-dark font-medium">
                  {formatPhone(userData.telefono)}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Dirección</p>
                <p className="text-dark font-medium">{userData.direccion}</p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Departamento</p>
                <p className="text-dark font-medium">{userData.departamento}</p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Ciudad</p>
                <p className="text-dark font-medium">{userData.ciudad}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* SECCIÓN 2: INFORMACIÓN LABORAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  work
                </span>
              </div>
              <div>
                <h3 className="text-dark text-lg font-semibold">
                  Información Laboral
                </h3>
                {editingSection === 'laboral' && (
                  <p className="text-sm text-primary">En modo edición</p>
                )}
              </div>
            </div>
            {editingSection !== 'laboral' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection('laboral')}
                disabled={editingSection !== null}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  edit
                </span>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('laboral')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {editingSection === 'laboral' && (
            <div className="border-warning/30 bg-warning/10 mb-4 rounded-lg border p-3">
              <p className="text-warning-text flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">
                  info
                </span>
                Cambios en el ingreso pueden afectar tus aportes a PILA
              </p>
            </div>
          )}

          {editingSection === 'laboral' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Tipo de contrato <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.tipoContrato || ''}
                  onChange={(e) =>
                    updateSectionData('tipoContrato', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  <option value="OPS">Orden de Prestación de Servicios</option>
                  <option value="DIRECTO">Contrato Directo</option>
                  <option value="TERMINO_FIJO">Contrato a Término Fijo</option>
                  <option value="TERMINO_INDEFINIDO">
                    Contrato a Término Indefinido
                  </option>
                </select>
              </div>
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Profesión <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.profesion || ''}
                  onChange={(e) =>
                    updateSectionData('profesion', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {PROFESIONES.map((p: string) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Actividad económica (CIIU){' '}
                  <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.actividadEconomica || ''}
                  onChange={(e) =>
                    updateSectionData('actividadEconomica', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {CODIGOS_CIIU.map(
                    (c: { codigo: string; descripcion: string }) => (
                      <option key={c.codigo} value={c.codigo}>
                        {c.codigo} - {c.descripcion}
                      </option>
                    )
                  )}
                </select>
              </div>
              <Input
                label="Número de contratos activos"
                type="number"
                value={sectionData.numeroContratos || ''}
                onChange={(e) =>
                  updateSectionData('numeroContratos', parseInt(e.target.value))
                }
                required
                min={1}
                max={50}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Ingreso mensual promedio"
                  type="number"
                  value={sectionData.ingresoMensualPromedio || ''}
                  onChange={(e) =>
                    updateSectionData(
                      'ingresoMensualPromedio',
                      parseFloat(e.target.value)
                    )
                  }
                  required
                  min={1}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-dark-100 text-sm">Tipo de contrato</p>
                <p className="text-dark font-medium">
                  {formatTipoContrato(userData.tipoContrato)}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Profesión</p>
                <p className="text-dark font-medium">{userData.profesion}</p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Actividad económica</p>
                <p className="text-dark font-medium">
                  {userData.actividadEconomica} -{' '}
                  {
                    CODIGOS_CIIU.find(
                      (c) => c.codigo === userData.actividadEconomica
                    )?.descripcion
                  }
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Número de contratos</p>
                <p className="text-dark font-medium">
                  {userData.numeroContratos}{' '}
                  {userData.numeroContratos === 1 ? 'contrato' : 'contratos'}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">
                  Ingreso mensual promedio
                </p>
                <p className="text-dark font-medium">
                  {formatCurrency(userData.ingresoMensualPromedio)}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* SECCIÓN 3: SEGURIDAD SOCIAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  health_and_safety
                </span>
              </div>
              <div>
                <h3 className="text-dark text-lg font-semibold">
                  Seguridad Social
                </h3>
                {editingSection === 'seguridad_social' && (
                  <p className="text-sm text-primary">En modo edición</p>
                )}
              </div>
            </div>
            {editingSection !== 'seguridad_social' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection('seguridad_social')}
                disabled={editingSection !== null}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  edit
                </span>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('seguridad_social')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {editingSection === 'seguridad_social' && (
            <div className="border-warning/30 bg-warning/10 mb-4 rounded-lg border p-3">
              <p className="text-warning-text flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">
                  info
                </span>
                Cambios en entidades pueden requerir trámites adicionales
              </p>
            </div>
          )}

          {editingSection === 'seguridad_social' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  EPS <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.entidadSalud || ''}
                  onChange={(e) =>
                    updateSectionData('entidadSalud', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {EPS_LIST.map((eps: string) => (
                    <option key={eps} value={eps}>
                      {eps}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha afiliación EPS"
                type="date"
                value={sectionData.fechaAfiliacionSalud || ''}
                onChange={(e) =>
                  updateSectionData('fechaAfiliacionSalud', e.target.value)
                }
              />
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Fondo de pensión <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.entidadPension || ''}
                  onChange={(e) =>
                    updateSectionData('entidadPension', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {FONDOS_PENSION.map((fondo: string) => (
                    <option key={fondo} value={fondo}>
                      {fondo}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha afiliación pensión"
                type="date"
                value={sectionData.fechaAfiliacionPension || ''}
                onChange={(e) =>
                  updateSectionData('fechaAfiliacionPension', e.target.value)
                }
              />
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  ARL (opcional)
                </label>
                <select
                  value={sectionData.arl || ''}
                  onChange={(e) => updateSectionData('arl', e.target.value)}
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin ARL</option>
                  {ARL_LIST.map((arl: string) => (
                    <option key={arl} value={arl}>
                      {arl}
                    </option>
                  ))}
                </select>
              </div>
              {sectionData.arl && (
                <>
                  <div>
                    <label className="text-dark mb-2 block text-sm font-medium">
                      Nivel de riesgo
                    </label>
                    <select
                      value={sectionData.nivelRiesgoARL || ''}
                      onChange={(e) =>
                        updateSectionData(
                          'nivelRiesgoARL',
                          parseInt(e.target.value)
                        )
                      }
                      className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecciona...</option>
                      <option value="1">Nivel I - Riesgo mínimo</option>
                      <option value="2">Nivel II - Riesgo bajo</option>
                      <option value="3">Nivel III - Riesgo medio</option>
                      <option value="4">Nivel IV - Riesgo alto</option>
                      <option value="5">Nivel V - Riesgo máximo</option>
                    </select>
                  </div>
                  <Input
                    label="Fecha afiliación ARL"
                    type="date"
                    value={sectionData.fechaAfiliacionARL || ''}
                    onChange={(e) =>
                      updateSectionData('fechaAfiliacionARL', e.target.value)
                    }
                  />
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-dark-100 text-sm">EPS</p>
                <p className="text-dark font-medium">{userData.entidadSalud}</p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Fecha afiliación EPS</p>
                <p className="text-dark font-medium">
                  {userData.fechaAfiliacionSalud
                    ? new Date(
                        userData.fechaAfiliacionSalud
                      ).toLocaleDateString('es-CO')
                    : 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Fondo de pensión</p>
                <p className="text-dark font-medium">
                  {userData.entidadPension}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">
                  Fecha afiliación pensión
                </p>
                <p className="text-dark font-medium">
                  {userData.fechaAfiliacionPension
                    ? new Date(
                        userData.fechaAfiliacionPension
                      ).toLocaleDateString('es-CO')
                    : 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">ARL</p>
                <p className="text-dark font-medium">
                  {userData.arl || 'Sin ARL'}
                </p>
              </div>
              {userData.nivelRiesgoARL && (
                <div>
                  <p className="text-dark-100 text-sm">Nivel de riesgo</p>
                  <p className="text-dark font-medium">
                    Nivel {userData.nivelRiesgoARL}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* SECCIÓN 4: INFORMACIÓN ADICIONAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  info
                </span>
              </div>
              <div>
                <h3 className="text-dark text-lg font-semibold">
                  Información Adicional
                </h3>
                {editingSection === 'adicional' && (
                  <p className="text-sm text-primary">En modo edición</p>
                )}
              </div>
            </div>
            {editingSection !== 'adicional' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection('adicional')}
                disabled={editingSection !== null}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  edit
                </span>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('adicional')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {editingSection === 'adicional' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Estado civil <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.estadoCivil || ''}
                  onChange={(e) =>
                    updateSectionData('estadoCivil', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  <option value="SOLTERO">Soltero/a</option>
                  <option value="CASADO">Casado/a</option>
                  <option value="UNION_LIBRE">Unión Libre</option>
                  <option value="DIVORCIADO">Divorciado/a</option>
                  <option value="VIUDO">Viudo/a</option>
                </select>
              </div>
              <Input
                label="Personas a cargo"
                type="number"
                value={sectionData.personasACargo || ''}
                onChange={(e) =>
                  updateSectionData('personasACargo', parseInt(e.target.value))
                }
                required
                min={0}
              />
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sectionData.suscribirNewsletter || false}
                    onChange={(e) =>
                      updateSectionData('suscribirNewsletter', e.target.checked)
                    }
                    className="border-light-300 h-5 w-5 rounded text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-dark text-sm">
                    Quiero recibir tips, actualizaciones y novedades de Ule
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-dark-100 text-sm">Estado civil</p>
                <p className="text-dark font-medium">
                  {formatEstadoCivil(userData.estadoCivil)}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Personas a cargo</p>
                <p className="text-dark font-medium">
                  {userData.personasACargo}{' '}
                  {userData.personasACargo === 1 ? 'persona' : 'personas'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-dark-100 text-sm">Newsletter</p>
                <p className="text-dark font-medium">
                  {userData.suscribirNewsletter ? 'Suscrito' : 'No suscrito'}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* SECCIÓN 5: INFORMACIÓN TRIBUTARIA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
              </div>
              <div>
                <h3 className="text-dark text-lg font-semibold">
                  Información Tributaria
                </h3>
                <p className="text-dark-100 text-sm">
                  Datos para emisión de facturas electrónicas
                </p>
                {editingSection === 'tributaria' && (
                  <p className="text-sm text-primary">En modo edición</p>
                )}
              </div>
            </div>
            {editingSection !== 'tributaria' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection('tributaria')}
                disabled={editingSection !== null}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  edit
                </span>
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveSection('tributaria')}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {/* Banner informativo */}
          <div className="border-info/30 bg-info/10 mb-4 rounded-lg border p-3">
            <p className="text-dark flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base text-primary">
                info
              </span>
              Esta información se usa para generar tus facturas electrónicas.
              Asegúrate de que coincida con tu registro en DIAN. Ule no valida
              ni asesora sobre aspectos tributarios.
            </p>
          </div>

          {editingSection === 'tributaria' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Régimen Tributario */}
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  Régimen Tributario <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.regimenTributario || ''}
                  onChange={(e) =>
                    updateSectionData('regimenTributario', e.target.value)
                  }
                  className="border-light-300 text-dark w-full rounded-lg border bg-white px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona tu régimen...</option>
                  <option value="SIMPLE">Régimen Simple de Tributación</option>
                  <option value="ORDINARIO">Régimen Ordinario (Común)</option>
                  <option value="ESPECIAL">Régimen Especial</option>
                  <option value="NO_DECLARANTE">No Declarante</option>
                </select>
                <p className="text-dark-100 mt-1 text-xs">
                  Selecciona tu régimen tributario según tu inscripción en DIAN
                </p>
              </div>

              {/* Responsable de IVA */}
              <div>
                <label className="text-dark mb-2 block text-sm font-medium">
                  ¿Responsable de IVA? <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="responsableIVA"
                      checked={sectionData.responsableIVA === true}
                      onChange={() => updateSectionData('responsableIVA', true)}
                      className="border-light-300 h-4 w-4 text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-dark text-sm">Sí</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="responsableIVA"
                      checked={sectionData.responsableIVA === false}
                      onChange={() =>
                        updateSectionData('responsableIVA', false)
                      }
                      className="border-light-300 h-4 w-4 text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-dark text-sm">No</span>
                  </label>
                </div>
                <p className="text-dark-100 mt-1 text-xs">
                  Marca SÍ si la DIAN te inscribió como responsable de IVA
                </p>
              </div>

              {/* Razón Social */}
              <div>
                <Input
                  label="Razón Social para Facturar"
                  value={sectionData.razonSocial || ''}
                  onChange={(e) =>
                    updateSectionData('razonSocial', e.target.value)
                  }
                  placeholder="Nombre completo o razón social"
                />
                <p className="text-dark-100 mt-1 text-xs">
                  Nombre que aparecerá en tus facturas
                </p>
              </div>

              {/* Email de Facturación */}
              <div>
                <Input
                  label="Email de Facturación"
                  type="email"
                  value={sectionData.emailFacturacion || ''}
                  onChange={(e) =>
                    updateSectionData('emailFacturacion', e.target.value)
                  }
                  placeholder="correo@ejemplo.com"
                />
                <p className="text-dark-100 mt-1 text-xs">
                  Email específico para facturas (opcional)
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-dark-100 text-sm">Régimen Tributario</p>
                <p className="text-dark font-medium">
                  {userData.regimenTributario
                    ? userData.regimenTributario === 'SIMPLE'
                      ? 'Régimen Simple de Tributación'
                      : userData.regimenTributario === 'ORDINARIO'
                        ? 'Régimen Ordinario (Común)'
                        : userData.regimenTributario === 'ESPECIAL'
                          ? 'Régimen Especial'
                          : 'No Declarante'
                    : 'No configurado'}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Responsable de IVA</p>
                <p className="text-dark font-medium">
                  {userData.responsableIVA ? (
                    <Badge variant="default">Sí</Badge>
                  ) : (
                    <Badge variant="default">No</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Razón Social</p>
                <p className="text-dark font-medium">
                  {userData.razonSocial || 'No configurado'}
                </p>
              </div>
              <div>
                <p className="text-dark-100 text-sm">Email de Facturación</p>
                <p className="text-dark font-medium">
                  {userData.emailFacturacion || userData.email}
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* SECCIÓN: SEGURIDAD DE LA CUENTA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">
                lock
              </span>
            </div>
            <h3 className="text-dark text-lg font-semibold">
              Seguridad de la Cuenta
            </h3>
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-4">
            {/* Cambiar Contraseña */}
            <div className="border-light-200 flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="text-dark font-medium">Contraseña</h4>
                <p className="text-dark-100 text-sm">
                  Actualiza tu contraseña regularmente para mayor seguridad
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setPasswordModalOpen(true)}
              >
                Cambiar contraseña
              </Button>
            </div>

            {/* 2FA */}
            <div className="border-light-200 flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-dark font-medium">
                    Autenticación de Dos Factores
                  </h4>
                  <Badge variant="default">Desactivado</Badge>
                </div>
                <p className="text-dark-100 text-sm">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <Button variant="outline" disabled>
                Próximamente
              </Button>
            </div>

            {/* Sesiones */}
            <div className="border-light-200 rounded-lg border p-4">
              <h4 className="text-dark mb-2 font-medium">Sesiones Activas</h4>
              <div className="bg-light-50 flex items-center justify-between rounded p-3">
                <div>
                  <p className="text-dark text-sm font-medium">
                    Esta sesión (actual)
                  </p>
                  <p className="text-dark-100 text-xs">
                    Última actividad: Ahora
                  </p>
                </div>
                <Badge variant="success">Activa</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="mt-3 w-full"
              >
                Cerrar otras sesiones
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* SECCIÓN: ZONA DE PELIGRO */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">
              warning
            </span>
            <h3 className="text-lg font-semibold text-red-900">
              Zona de Peligro
            </h3>
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            <p className="text-sm text-red-800">
              Una vez elimines tu cuenta, no hay vuelta atrás. Se borrarán todos
              tus datos permanentemente.
            </p>
            <Button
              onClick={() => setDeleteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <span className="material-symbols-outlined mr-2">
                delete_forever
              </span>
              Eliminar cuenta
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
