/**
 * COMPONENTE: INDICADOR DE FORTALEZA DE CONTRASEÑA
 *
 * Muestra la fortaleza de la contraseña en tiempo real con:
 * - Barra de progreso colorizada
 * - Label de nivel (Muy débil a Muy fuerte)
 * - Feedback de mejoras
 * - Lista de requisitos cumplidos
 */

'use client'

import { useMemo } from 'react'
import { validatePassword } from '@/lib/security/password-validator'

interface PasswordStrengthIndicatorProps {
  password: string
  userInfo?: {
    email?: string
    name?: string
    numeroDocumento?: string
  }
}

export function PasswordStrengthIndicator({
  password,
  userInfo,
}: PasswordStrengthIndicatorProps) {
  const validation = useMemo(() => {
    if (!password) return null
    return validatePassword(password, userInfo)
  }, [password, userInfo])

  if (!validation) return null

  const getColor = () => {
    if (validation.strength === 'muy_debil') return 'bg-red-500'
    if (validation.strength === 'debil') return 'bg-orange-500'
    if (validation.strength === 'media') return 'bg-yellow-500'
    if (validation.strength === 'fuerte') return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (validation.strength === 'muy_debil') return 'text-red-500'
    if (validation.strength === 'debil') return 'text-orange-500'
    if (validation.strength === 'media') return 'text-yellow-500'
    if (validation.strength === 'fuerte') return 'text-blue-500'
    return 'text-green-500'
  }

  const getLabel = () => {
    if (validation.strength === 'muy_debil') return 'Muy débil'
    if (validation.strength === 'debil') return 'Débil'
    if (validation.strength === 'media') return 'Media'
    if (validation.strength === 'fuerte') return 'Fuerte'
    return 'Muy fuerte'
  }

  return (
    <div className="space-y-2 mt-2">
      {/* Barra de progreso */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-300`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {getLabel()}
        </span>
      </div>

      {/* Errores */}
      {validation.errors.length > 0 && (
        <div className="text-xs space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-red-600 dark:text-red-400 flex items-start">
              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Sugerencias */}
      {validation.suggestions.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {validation.suggestions.map((suggestion, index) => (
            <p key={index} className="flex items-start">
              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {suggestion}
            </p>
          ))}
        </div>
      )}

      {/* Requisitos */}
      <div className="text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          Requisitos:
        </p>
        <ul className="space-y-1">
          <li
            className={
              password.length >= 8 ? 'text-green-600' : 'text-gray-500'
            }
          >
            <span className="inline-flex items-center">
              {password.length >= 8 ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              Mínimo 8 caracteres
            </span>
          </li>
          <li
            className={
              /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'
            }
          >
            <span className="inline-flex items-center">
              {/[A-Z]/.test(password) ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              Una letra mayúscula
            </span>
          </li>
          <li
            className={
              /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'
            }
          >
            <span className="inline-flex items-center">
              {/[a-z]/.test(password) ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              Una letra minúscula
            </span>
          </li>
          <li
            className={
              /[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'
            }
          >
            <span className="inline-flex items-center">
              {/[0-9]/.test(password) ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              Un número
            </span>
          </li>
          <li
            className={
              /[^a-zA-Z0-9]/.test(password)
                ? 'text-green-600'
                : 'text-gray-500'
            }
          >
            <span className="inline-flex items-center">
              {/[^a-zA-Z0-9]/.test(password) ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              Un carácter especial
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
