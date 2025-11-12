/**
 * ULE - CHANGE PASSWORD MODAL
 * Modal para cambio de contraseña con validación
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const cambioPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe tener al menos una minúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ChangePasswordFormData = z.infer<typeof cambioPasswordSchema>

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(cambioPasswordSchema),
  })

  const newPassword = watch('newPassword')

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (password: string): {
    score: number
    label: string
    color: string
  } => {
    if (!password) return { score: 0, label: '', color: '' }

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2)
      return { score, label: 'Débil', color: 'bg-error text-error' }
    if (score <= 4)
      return { score, label: 'Media', color: 'bg-warning text-warning' }
    return { score, label: 'Fuerte', color: 'bg-success text-success' }
  }

  const passwordStrength = getPasswordStrength(newPassword || '')

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cambiar contraseña')
      }

      toast.success('Contraseña actualizada exitosamente')
      reset()
      onClose()
    } catch (error) {
      console.error('[Change Password] Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al cambiar contraseña'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-light-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  lock
                </span>
              </div>
              <h2 className="text-xl font-bold text-dark">
                Cambiar Contraseña
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50 hover:text-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-4">
              {/* Contraseña Actual */}
              <Input
                label="Contraseña actual"
                type="password"
                {...register('currentPassword')}
                error={errors.currentPassword?.message}
                required
                autoComplete="current-password"
              />

              {/* Nueva Contraseña */}
              <div>
                <Input
                  label="Nueva contraseña"
                  type="password"
                  {...register('newPassword')}
                  error={errors.newPassword?.message}
                  required
                  autoComplete="new-password"
                />

                {/* Indicador de fortaleza */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-100">Fortaleza:</span>
                      <span
                        className={`font-medium ${passwordStrength.color.split(' ')[1]}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-light-200">
                      <div
                        className={`h-full transition-all ${passwordStrength.color.split(' ')[0]}`}
                        style={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Requisitos */}
                <ul className="mt-2 space-y-1 text-xs text-dark-100">
                  <li
                    className={
                      newPassword && newPassword.length >= 8
                        ? 'text-success'
                        : ''
                    }
                  >
                    • Mínimo 8 caracteres
                  </li>
                  <li
                    className={
                      newPassword && /[A-Z]/.test(newPassword)
                        ? 'text-success'
                        : ''
                    }
                  >
                    • Una letra mayúscula
                  </li>
                  <li
                    className={
                      newPassword && /[a-z]/.test(newPassword)
                        ? 'text-success'
                        : ''
                    }
                  >
                    • Una letra minúscula
                  </li>
                  <li
                    className={
                      newPassword && /[0-9]/.test(newPassword)
                        ? 'text-success'
                        : ''
                    }
                  >
                    • Un número
                  </li>
                </ul>
              </div>

              {/* Confirmar Contraseña */}
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined mr-2 animate-spin">
                      sync
                    </span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">
                      check
                    </span>
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
