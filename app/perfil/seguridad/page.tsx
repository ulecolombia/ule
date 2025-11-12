/**
 * PÁGINA: CONFIGURACIÓN DE SEGURIDAD
 *
 * Características:
 * - Tabs para organizar configuración: Contraseña, 2FA, Sesiones
 * - Gestión de contraseña
 * - Configuración de 2FA
 * - Gestión de sesiones activas
 */

'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TwoFactorSetup } from '@/components/auth/two-factor-setup'
import { SessionManager } from '@/components/auth/session-manager'
import { Button } from '@/components/ui/button'

export default function SecuritySettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración de Seguridad</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona la seguridad de tu cuenta
        </p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="password">Contraseña</TabsTrigger>
          <TabsTrigger value="2fa">Autenticación 2FA</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
        </TabsList>

        {/* TAB: Contraseña */}
        <TabsContent value="password">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Actualiza tu contraseña regularmente para mantener tu cuenta segura
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                      Recomendaciones de seguridad
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Usa al menos 12 caracteres</li>
                      <li>• Combina mayúsculas, minúsculas, números y símbolos</li>
                      <li>• No reutilices contraseñas de otras cuentas</li>
                      <li>• Considera usar un gestor de contraseñas</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button>Cambiar Contraseña</Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Última actualización
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hace 3 meses
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: 2FA */}
        <TabsContent value="2fa">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Autenticación de Dos Factores (2FA)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Agrega una capa extra de seguridad a tu cuenta. Cuando 2FA está habilitado,
              necesitarás tu contraseña y un código de tu teléfono para iniciar sesión.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    ¿Por qué habilitar 2FA?
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Protege tu cuenta incluso si alguien obtiene tu contraseña.
                    Solo tú podrás acceder con el código de tu teléfono.
                  </p>
                </div>
              </div>
            </div>

            <TwoFactorSetup />
          </Card>
        </TabsContent>

        {/* TAB: Sesiones */}
        <TabsContent value="sessions">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Sesiones Activas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estas son las sesiones actualmente activas en tu cuenta.
                Si ves alguna actividad sospechosa, cierra esa sesión de inmediato.
              </p>
            </div>

            <SessionManager />

            <div className="mt-6 pt-6 border-t">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Consejos de seguridad
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Revisa tus sesiones activas regularmente</li>
                  <li>• Cierra sesión en dispositivos que ya no uses</li>
                  <li>• Siempre cierra sesión en dispositivos compartidos</li>
                  <li>• Si ves actividad sospechosa, cambia tu contraseña inmediatamente</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
