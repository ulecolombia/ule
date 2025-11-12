import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Política de Cookies | ULE',
  description: 'Política de Cookies - Información sobre el uso de cookies en nuestra plataforma',
}

export default function PoliticaCookiesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Política de Cookies</h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          {/* Introducción */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              1. ¿Qué son las Cookies?
            </h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en su navegador cuando visita
              nuestra plataforma. Nos permiten reconocer su navegador y recordar sus preferencias para
              mejorar su experiencia de uso.
            </p>
          </section>

          {/* Tipos de Cookies */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              2. Tipos de Cookies que Utilizamos
            </h2>

            <div className="space-y-4">
              {/* Esenciales */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs mr-2">
                    OBLIGATORIAS
                  </span>
                  2.1. Cookies Estrictamente Necesarias
                </h3>
                <p className="text-sm mb-2">
                  Estas cookies son esenciales para el funcionamiento de la plataforma. Sin ellas, no
                  podríamos proporcionarle nuestros servicios.
                </p>
                <p className="text-sm font-semibold mb-1">Ejemplos:</p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Cookies de autenticación (mantienen su sesión activa)</li>
                  <li>Cookies de seguridad (protegen contra ataques CSRF)</li>
                  <li>Cookies de carga balanceada (distribuyen la carga del servidor)</li>
                  <li>Cookies de funcionalidad básica (recordar idioma, tema oscuro/claro)</li>
                </ul>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  <strong>Duración:</strong> Sesión o hasta 1 año | <strong>Base legal:</strong> Necesidad técnica
                </p>
              </div>

              {/* Analíticas */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs mr-2">
                    OPCIONALES
                  </span>
                  2.2. Cookies Analíticas
                </h3>
                <p className="text-sm mb-2">
                  Nos ayudan a entender cómo los usuarios interactúan con la plataforma para mejorar
                  la experiencia general.
                </p>
                <p className="text-sm font-semibold mb-1">Ejemplos:</p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Páginas visitadas y tiempo de permanencia</li>
                  <li>Errores encontrados durante el uso</li>
                  <li>Funcionalidades más utilizadas</li>
                  <li>Flujos de navegación</li>
                </ul>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  <strong>Duración:</strong> Hasta 2 años | <strong>Base legal:</strong> Consentimiento del usuario
                </p>
              </div>

              {/* Marketing */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs mr-2">
                    OPCIONALES
                  </span>
                  2.3. Cookies de Marketing
                </h3>
                <p className="text-sm mb-2">
                  Se utilizan para mostrar anuncios relevantes y medir la efectividad de nuestras
                  campañas publicitarias.
                </p>
                <p className="text-sm font-semibold mb-1">Ejemplos:</p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Seguimiento de conversiones de anuncios</li>
                  <li>Remarketing (mostrar anuncios personalizados)</li>
                  <li>Análisis de efectividad de campañas</li>
                </ul>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  <strong>Duración:</strong> Hasta 2 años | <strong>Base legal:</strong> Consentimiento del usuario
                </p>
              </div>

              {/* Personalización */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs mr-2">
                    OPCIONALES
                  </span>
                  2.4. Cookies de Personalización
                </h3>
                <p className="text-sm mb-2">
                  Permiten recordar sus preferencias para ofrecerle una experiencia más personalizada.
                </p>
                <p className="text-sm font-semibold mb-1">Ejemplos:</p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Preferencias de visualización (vista compacta/expandida)</li>
                  <li>Filtros guardados en tablas</li>
                  <li>Configuraciones de notificaciones</li>
                  <li>Orden de columnas personalizadas</li>
                </ul>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  <strong>Duración:</strong> Hasta 1 año | <strong>Base legal:</strong> Consentimiento del usuario
                </p>
              </div>
            </div>
          </section>

          {/* Cookies de Terceros */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              3. Cookies de Terceros
            </h2>
            <p className="mb-3">
              Algunas cookies son instaladas por servicios de terceros que utilizamos:
            </p>
            <div className="space-y-2">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-semibold">Google Analytics</p>
                <p className="text-sm">Análisis de tráfico y comportamiento del usuario (solo con su consentimiento)</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <p className="font-semibold">Vercel Analytics</p>
                <p className="text-sm">Métricas de rendimiento y disponibilidad de la plataforma</p>
              </div>
            </div>
          </section>

          {/* Gestión */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              4. Cómo Gestionar sus Preferencias de Cookies
            </h2>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">4.1. Desde Nuestra Plataforma</h4>
                <p className="text-sm">
                  Puede cambiar sus preferencias en cualquier momento haciendo clic en el botón
                  de cookies que aparece en la parte inferior de la página, o visitando:
                </p>
                <div className="mt-2 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <a href="/perfil#privacidad" className="text-primary hover:underline font-medium">
                    Configuración de Privacidad →
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">4.2. Desde su Navegador</h4>
                <p className="text-sm mb-2">
                  Puede bloquear o eliminar cookies desde la configuración de su navegador:
                </p>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>
                    <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
                  </li>
                  <li>
                    <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web
                  </li>
                  <li>
                    <strong>Edge:</strong> Configuración → Privacidad, búsqueda y servicios → Cookies
                  </li>
                </ul>
                <p className="text-xs mt-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 p-2 rounded">
                  ⚠️ <strong>Importante:</strong> Bloquear todas las cookies puede afectar el funcionamiento de la plataforma.
                </p>
              </div>
            </div>
          </section>

          {/* Impacto de Rechazar */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              5. Impacto de Rechazar Cookies Opcionales
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <ul className="list-disc pl-6 text-sm space-y-2">
                <li>
                  <strong>Sin cookies analíticas:</strong> No podremos mejorar la plataforma basándonos
                  en datos de uso reales.
                </li>
                <li>
                  <strong>Sin cookies de marketing:</strong> Verá anuncios menos relevantes para sus intereses.
                </li>
                <li>
                  <strong>Sin cookies de personalización:</strong> Sus preferencias de interfaz no se
                  recordarán entre sesiones.
                </li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Las funcionalidades principales de la plataforma seguirán disponibles.</strong>
              </p>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              6. Seguridad de las Cookies
            </h2>
            <p className="mb-2">
              Implementamos las siguientes medidas de seguridad:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>HttpOnly:</strong> Las cookies de sesión no son accesibles desde JavaScript (previene XSS)</li>
              <li><strong>Secure:</strong> Las cookies solo se transmiten por HTTPS</li>
              <li><strong>SameSite:</strong> Protección contra ataques CSRF</li>
              <li><strong>Encriptación:</strong> Datos sensibles en cookies están encriptados</li>
            </ul>
          </section>

          {/* Actualizaciones */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              7. Actualizaciones de esta Política
            </h2>
            <p>
              Esta política puede actualizarse ocasionalmente. Los cambios significativos se notificarán
              mediante un banner en la plataforma.
            </p>
            <p className="mt-2">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p><strong>Versión:</strong> 1.0</p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              8. Contacto
            </h2>
            <p className="mb-3">
              Si tiene preguntas sobre nuestra política de cookies:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Email:</strong> privacidad@ule.com.co</p>
              <p><strong>Asunto:</strong> Consulta sobre Cookies</p>
            </div>
          </section>

          {/* Más Información */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              9. Más Información
            </h2>
            <p className="mb-2">
              Para conocer cómo protegemos sus datos personales, consulte nuestra:
            </p>
            <a
              href="/politica-privacidad"
              className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
            >
              Política de Privacidad →
            </a>
          </section>
        </div>
      </Card>
    </div>
  )
}
