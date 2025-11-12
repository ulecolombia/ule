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
import { EPS_COLOMBIA, FONDOS_PENSION as FONDOS_PENSION_DATA, ARL_COLOMBIA } from '@/lib/data/entidades-seguridad-social'
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
  perfilCompleto: boolean
  createdAt: string
  updatedAt: string
}

type EditingSection =
  | 'personal'
  | 'laboral'
  | 'seguridad_social'
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
    const parts = name.trim().split(' ').filter(p => p.length > 0)
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
          <p className="text-lg text-dark-100">Error al cargar perfil</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const ciudadesDisponibles =
    DEPARTAMENTOS_CIUDADES.find(
      (d: { departamento: string; ciudades: string[] }) => d.departamento === sectionData.departamento
    )?.ciudades || []

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-dark-100">
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
        <h1 className="text-3xl font-bold text-dark">Mi Perfil</h1>
        <p className="mt-1 text-dark-100">
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
              <h2 className="text-2xl font-bold text-dark">{userData.nombre}</h2>
              <p className="mt-1 text-dark-100">{userData.email}</p>
              <div className="mt-2">
                <Badge variant="success">Perfil Completo</Badge>
              </div>
            </div>

            {/* Change Photo Button */}
            <Button variant="outline" disabled>
              <span className="material-symbols-outlined mr-2">photo_camera</span>
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
                <h3 className="text-lg font-semibold text-dark">
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  Departamento <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.departamento || ''}
                  onChange={(e) => {
                    updateSectionData('departamento', e.target.value)
                    updateSectionData('ciudad', '')
                  }}
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {DEPARTAMENTOS_CIUDADES.map((d: { departamento: string; ciudades: string[] }) => (
                    <option key={d.departamento} value={d.departamento}>
                      {d.departamento}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  Ciudad <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.ciudad || ''}
                  onChange={(e) => updateSectionData('ciudad', e.target.value)}
                  disabled={!sectionData.departamento}
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                <p className="text-sm text-dark-100">Nombre completo</p>
                <p className="font-medium text-dark">{userData.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Documento</p>
                <p className="font-medium text-dark">
                  {formatTipoDocumento(userData.tipoDocumento)}{' '}
                  {userData.numeroDocumento}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Teléfono</p>
                <p className="font-medium text-dark">
                  {formatPhone(userData.telefono)}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Dirección</p>
                <p className="font-medium text-dark">{userData.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Departamento</p>
                <p className="font-medium text-dark">{userData.departamento}</p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Ciudad</p>
                <p className="font-medium text-dark">{userData.ciudad}</p>
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
                <h3 className="text-lg font-semibold text-dark">
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
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="flex items-center gap-2 text-sm text-warning-text">
                <span className="material-symbols-outlined text-base">info</span>
                Cambios en el ingreso pueden afectar tus aportes a PILA
              </p>
            </div>
          )}

          {editingSection === 'laboral' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  Tipo de contrato <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.tipoContrato || ''}
                  onChange={(e) =>
                    updateSectionData('tipoContrato', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  Profesión <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.profesion || ''}
                  onChange={(e) =>
                    updateSectionData('profesion', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  Actividad económica (CIIU){' '}
                  <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.actividadEconomica || ''}
                  onChange={(e) =>
                    updateSectionData('actividadEconomica', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecciona...</option>
                  {CODIGOS_CIIU.map((c: { codigo: string; descripcion: string }) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.codigo} - {c.descripcion}
                    </option>
                  ))}
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
                <p className="text-sm text-dark-100">Tipo de contrato</p>
                <p className="font-medium text-dark">
                  {formatTipoContrato(userData.tipoContrato)}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Profesión</p>
                <p className="font-medium text-dark">{userData.profesion}</p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Actividad económica</p>
                <p className="font-medium text-dark">
                  {userData.actividadEconomica} -{' '}
                  {
                    CODIGOS_CIIU.find(
                      (c) => c.codigo === userData.actividadEconomica
                    )?.descripcion
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Número de contratos</p>
                <p className="font-medium text-dark">
                  {userData.numeroContratos}{' '}
                  {userData.numeroContratos === 1 ? 'contrato' : 'contratos'}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Ingreso mensual promedio</p>
                <p className="font-medium text-dark">
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
                <h3 className="text-lg font-semibold text-dark">
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
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="flex items-center gap-2 text-sm text-warning-text">
                <span className="material-symbols-outlined text-base">info</span>
                Cambios en entidades pueden requerir trámites adicionales
              </p>
            </div>
          )}

          {editingSection === 'seguridad_social' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  EPS <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.entidadSalud || ''}
                  onChange={(e) =>
                    updateSectionData('entidadSalud', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  Fondo de pensión <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.entidadPension || ''}
                  onChange={(e) =>
                    updateSectionData('entidadPension', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  ARL (opcional)
                </label>
                <select
                  value={sectionData.arl || ''}
                  onChange={(e) => updateSectionData('arl', e.target.value)}
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <label className="mb-2 block text-sm font-medium text-dark">
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
                      className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <p className="text-sm text-dark-100">EPS</p>
                <p className="font-medium text-dark">{userData.entidadSalud}</p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Fecha afiliación EPS</p>
                <p className="font-medium text-dark">
                  {userData.fechaAfiliacionSalud
                    ? new Date(
                        userData.fechaAfiliacionSalud
                      ).toLocaleDateString('es-CO')
                    : 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Fondo de pensión</p>
                <p className="font-medium text-dark">
                  {userData.entidadPension}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Fecha afiliación pensión</p>
                <p className="font-medium text-dark">
                  {userData.fechaAfiliacionPension
                    ? new Date(
                        userData.fechaAfiliacionPension
                      ).toLocaleDateString('es-CO')
                    : 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">ARL</p>
                <p className="font-medium text-dark">
                  {userData.arl || 'Sin ARL'}
                </p>
              </div>
              {userData.nivelRiesgoARL && (
                <div>
                  <p className="text-sm text-dark-100">Nivel de riesgo</p>
                  <p className="font-medium text-dark">
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
                <h3 className="text-lg font-semibold text-dark">
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
                <label className="mb-2 block text-sm font-medium text-dark">
                  Estado civil <span className="text-error">*</span>
                </label>
                <select
                  value={sectionData.estadoCivil || ''}
                  onChange={(e) =>
                    updateSectionData('estadoCivil', e.target.value)
                  }
                  className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-dark transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sectionData.suscribirNewsletter || false}
                    onChange={(e) =>
                      updateSectionData('suscribirNewsletter', e.target.checked)
                    }
                    className="h-5 w-5 rounded border-light-300 text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-dark">
                    Quiero recibir tips, actualizaciones y novedades de Ule
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-dark-100">Estado civil</p>
                <p className="font-medium text-dark">
                  {formatEstadoCivil(userData.estadoCivil)}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-100">Personas a cargo</p>
                <p className="font-medium text-dark">
                  {userData.personasACargo}{' '}
                  {userData.personasACargo === 1 ? 'persona' : 'personas'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-dark-100">Newsletter</p>
                <p className="font-medium text-dark">
                  {userData.suscribirNewsletter ? 'Suscrito' : 'No suscrito'}
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
            <h3 className="text-lg font-semibold text-dark">
              Seguridad de la Cuenta
            </h3>
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-4">
            {/* Cambiar Contraseña */}
            <div className="flex items-center justify-between rounded-lg border border-light-200 p-4">
              <div>
                <h4 className="font-medium text-dark">Contraseña</h4>
                <p className="text-sm text-dark-100">
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
            <div className="flex items-center justify-between rounded-lg border border-light-200 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-dark">
                    Autenticación de Dos Factores
                  </h4>
                  <Badge variant="default">Desactivado</Badge>
                </div>
                <p className="text-sm text-dark-100">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <Button variant="outline" disabled>
                Próximamente
              </Button>
            </div>

            {/* Sesiones */}
            <div className="rounded-lg border border-light-200 p-4">
              <h4 className="font-medium text-dark mb-2">Sesiones Activas</h4>
              <div className="flex items-center justify-between rounded bg-light-50 p-3">
                <div>
                  <p className="text-sm font-medium text-dark">
                    Esta sesión (actual)
                  </p>
                  <p className="text-xs text-dark-100">Última actividad: Ahora</p>
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
            <h3 className="text-lg font-semibold text-red-900">Zona de Peligro</h3>
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
