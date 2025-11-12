import { Card } from '@/components/ui/card'

export default function TerminosAsesoriaPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Términos y Condiciones - Servicio de Asesoría con IA
      </h1>

      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            1. Naturaleza del Servicio
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            El servicio de Asesoría con IA es una herramienta automatizada que proporciona
            información educativa sobre tributación, contabilidad y seguridad social en Colombia.
            Utiliza inteligencia artificial para generar respuestas basadas en normativa vigente
            y mejores prácticas del sector.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            2. Limitaciones del Servicio
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>2.1.</strong> Este servicio NO constituye asesoría profesional certificada
              en materia tributaria, contable o legal.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>2.2.</strong> Las respuestas son generadas automáticamente y pueden contener
              errores, omisiones o información desactualizada.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>2.3.</strong> El servicio no sustituye el análisis profesional personalizado
              de un contador público, abogado tributarista u otro profesional certificado.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>2.4.</strong> Las respuestas tienen carácter general y educativo, no
              constituyen recomendaciones específicas para casos particulares.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            3. Responsabilidades del Usuario
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>3.1.</strong> El usuario es exclusivamente responsable de las decisiones
              tributarias, contables y legales que tome.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>3.2.</strong> El usuario debe verificar información crítica con fuentes
              oficiales o profesionales certificados antes de tomar decisiones importantes.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>3.3.</strong> El usuario acepta que el uso de este servicio es bajo su
              propio riesgo.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            4. Limitación de Responsabilidad
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            La plataforma, sus operadores y desarrolladores no serán responsables por:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
            <li>Decisiones tomadas basadas en información del servicio</li>
            <li>Errores u omisiones en las respuestas generadas</li>
            <li>Pérdidas económicas derivadas del uso del servicio</li>
            <li>Sanciones o multas por incumplimiento de obligaciones tributarias</li>
            <li>Cualquier daño directo, indirecto o consecuencial</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            5. Uso Apropiado
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            El servicio debe usarse exclusivamente para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
            <li>Fines educativos e informativos</li>
            <li>Orientación general sobre temas tributarios y contables</li>
            <li>Punto de partida para investigación adicional</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            6. Recomendaciones
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Para situaciones que involucren:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mt-2">
            <li>Montos significativos de dinero</li>
            <li>Procesos ante entidades oficiales (DIAN, UGPP, etc.)</li>
            <li>Casos complejos o particulares</li>
            <li>Decisiones con consecuencias legales importantes</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            <strong>Siempre consulte con un profesional certificado.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            7. Modificaciones
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entrarán en vigor inmediatamente después de su publicación.
            El uso continuado del servicio constituye aceptación de los términos modificados.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            8. Contacto
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Para preguntas sobre estos términos o para solicitar asesoría profesional certificada,
            contacta con nosotros a través de nuestra{' '}
            <a href="/contacto" className="text-primary hover:underline">
              página de contacto
            </a>.
          </p>
        </section>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Última actualización:</strong> Noviembre 2024<br />
            <strong>Versión:</strong> 1.0
          </p>
        </div>
      </Card>
    </div>
  )
}
