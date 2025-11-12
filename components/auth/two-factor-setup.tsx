/**
 * COMPONENTE: CONFIGURACIÓN DE 2FA (Autenticación de Dos Factores)
 *
 * Dialog de 3 pasos para configurar 2FA:
 * 1. Introducción y explicación
 * 2. Escanear QR y guardar códigos de respaldo
 * 3. Verificar código TOTP
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'

export function TwoFactorSetup() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'init' | 'scan' | 'verify'>('init')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnable2FA = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'x-user-id': localStorage.getItem('userId') || '', // TODO: Usar autenticación real
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al configurar 2FA')
        return
      }

      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setStep('scan')
    } catch (error) {
      console.error('Error:', error)
      setError('Error al configurar 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || '',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código incorrecto')
        return
      }

      setIsOpen(false)
      setStep('init')
      alert('2FA habilitado exitosamente')
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      setError('Error al verificar código')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const text = `CÓDIGOS DE RESPALDO - ULE

IMPORTANTE: Guarda estos códigos en un lugar seguro.
Cada código solo se puede usar una vez.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Generado: ${new Date().toLocaleString('es-CO')}`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes-2fa.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Habilitar 2FA
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Autenticación de Dos Factores</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {step === 'init' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  ¿Qué es 2FA?
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  La autenticación de dos factores (2FA) agrega una capa extra de seguridad 
                  a tu cuenta. Además de tu contraseña, necesitarás un código de 6 dígitos 
                  generado por una app en tu teléfono.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Necesitarás:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Una app de autenticación (Google Authenticator, Authy, Microsoft Authenticator)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Tu teléfono a la mano para escanear un código QR</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Un lugar seguro para guardar los códigos de respaldo</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleEnable2FA} className="w-full" disabled={isLoading}>
                {isLoading ? 'Generando...' : 'Comenzar Configuración'}
              </Button>
            </div>
          )}

          {step === 'scan' && qrCode && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold mb-3">Paso 1: Escanea el código QR</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Abre tu app de autenticación y escanea este código:
                </p>

                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <Image
                      src={qrCode}
                      alt="QR Code 2FA"
                      width={200}
                      height={200}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    O ingresa este código manualmente:
                  </p>
                  <code className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1 rounded">
                    {secret}
                  </code>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Paso 2: Guarda tus códigos de respaldo</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Estos códigos te permitirán acceder si pierdes tu teléfono:
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm">
                        {index + 1}. {code}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="w-full mb-4"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar Códigos
                </Button>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Guarda estos códigos en un lugar seguro. No podrás verlos de nuevo.
                  </p>
                </div>
              </div>

              <Button onClick={() => setStep('verify')} className="w-full">
                Continuar a Verificación
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Paso 3: Verifica tu configuración</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ingresa el código de 6 dígitos de tu app de autenticación:
                </p>
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ''))
                  }
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? 'Verificando...' : 'Verificar y Activar 2FA'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('scan')}
                className="w-full"
              >
                Volver
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
