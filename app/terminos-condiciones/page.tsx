import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Términos y Condiciones | ULE',
  description: 'Términos y Condiciones de Uso de la plataforma ULE - Sistema de Gestión PILA',
}

export default function TerminosCondicionesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Uso</h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          {/* Aceptación */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              1. Aceptación de los Términos
            </h2>
            <p>
              Al acceder y utilizar la plataforma ULE - Sistema de Gestión PILA (en adelante, &quot;la Plataforma&quot;),
              usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no
              está de acuerdo con alguno de estos términos, no debe utilizar la Plataforma.
            </p>
            <p className="mt-2">
              <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </section>

          {/* Definiciones */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              2. Definiciones
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>&quot;Usuario&quot;:</strong> Persona natural o jurídica que utiliza la Plataforma.</li>
              <li><strong>&quot;Servicios&quot;:</strong> Funcionalidades ofrecidas incluyendo liquidación PILA,
                facturación electrónica y asesoramiento con IA.</li>
              <li><strong>&quot;Contenido&quot;:</strong> Información, datos, documentos, facturas y cualquier
                material generado o almacenado en la Plataforma.</li>
              <li><strong>&quot;PILA&quot;:</strong> Planilla Integrada de Liquidación de Aportes al Sistema
                de Seguridad Social Integral colombiano.</li>
              <li><strong>&quot;DIAN&quot;:</strong> Dirección de Impuestos y Aduanas Nacionales de Colombia.</li>
            </ul>
          </section>

          {/* Descripción */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              3. Descripción del Servicio
            </h2>
            <p className="mb-3">
              ULE es una plataforma tecnológica que facilita:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Liquidación de PILA:</strong> Cálculo y gestión de aportes a seguridad
                social para prestadores de servicios independientes.</li>
              <li><strong>Facturación Electrónica:</strong> Generación de facturas electrónicas
                cumpliendo normativa DIAN.</li>
              <li><strong>Asesoramiento con IA:</strong> Orientación tributaria y contable mediante
                inteligencia artificial.</li>
              <li><strong>Gestión Documental:</strong> Almacenamiento y organización de comprobantes
                y facturas.</li>
            </ul>
            <div className="mt-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded">
              <p className="text-sm font-semibold flex items-start">
                <span className="mr-2">⚠️</span>
                <span>
                  <strong>IMPORTANTE:</strong> Esta plataforma proporciona herramientas y orientación
                  educativa. NO sustituye la asesoría profesional de un contador público, abogado o
                  asesor tributario certificado. Para decisiones importantes, consulte con un profesional.
                </span>
              </p>
            </div>
          </section>

          {/* Registro */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              4. Registro y Cuenta de Usuario
            </h2>

            <h3 className="font-semibold mt-4 mb-2">4.1. Requisitos</h3>
            <p className="mb-2">Para utilizar la Plataforma debe:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ser mayor de 18 años</li>
              <li>Tener capacidad legal para contratar</li>
              <li>Proporcionar información veraz, completa y actualizada</li>
              <li>Residir en Colombia o prestar servicios relacionados con Colombia</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">4.2. Responsabilidades del Usuario</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              <li>Actualizar su información personal cuando sea necesario</li>
              <li>No compartir su cuenta con terceros</li>
              <li>Usar autenticación de dos factores (recomendado)</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">4.3. Suspensión y Terminación</h3>
            <p>
              Nos reservamos el derecho de suspender o terminar su cuenta si:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Viola estos Términos y Condiciones</li>
              <li>Proporciona información falsa o fraudulenta</li>
              <li>Utiliza la Plataforma para actividades ilegales</li>
              <li>No cumple con sus obligaciones de pago (si aplica)</li>
            </ul>
          </section>

          {/* Uso Aceptable */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              5. Uso Aceptable
            </h2>

            <h3 className="font-semibold mt-4 mb-2">5.1. Usos Permitidos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionar sus obligaciones de seguridad social</li>
              <li>Emitir facturas electrónicas legítimas</li>
              <li>Consultar asesoramiento tributario para fines educativos</li>
              <li>Almacenar documentos relacionados con su actividad profesional</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">5.2. Usos Prohibidos</h3>
            <p className="mb-2">Está estrictamente prohibido:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar la Plataforma para fraude, evasión fiscal o lavado de activos</li>
              <li>Generar facturas falsas o con información inexacta</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios</li>
              <li>Realizar ingeniería inversa, descompilar o desensamblar el software</li>
              <li>Usar bots, scrapers o herramientas automatizadas sin autorización</li>
              <li>Sobrecargar o interferir con el funcionamiento de la Plataforma</li>
              <li>Compartir o revender acceso a la Plataforma</li>
            </ul>
          </section>

          {/* Facturación Electrónica */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              6. Facturación Electrónica
            </h2>

            <h3 className="font-semibold mt-4 mb-2">6.1. Responsabilidad del Usuario</h3>
            <p className="mb-2">Al utilizar el servicio de facturación electrónica:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usted es el único responsable de la veracidad y exactitud de la información
                incluida en las facturas</li>
              <li>Debe asegurarse de cumplir con todos los requisitos de la DIAN</li>
              <li>Es responsable de mantener actualizada su información fiscal</li>
              <li>Debe conservar las facturas según lo requiere la ley (5 años mínimo)</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">6.2. Limitaciones</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>No garantizamos la aceptación de facturas por parte de la DIAN</li>
              <li>Actuamos como facilitador tecnológico, no como responsables fiscales</li>
              <li>Las facturas rechazadas por errores del usuario no son reembolsables</li>
            </ul>
          </section>

          {/* PILA */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              7. Liquidación PILA
            </h2>

            <h3 className="font-semibold mt-4 mb-2">7.1. Cálculos Estimativos</h3>
            <p>
              Los cálculos de PILA se basan en las tarifas vigentes y la información que usted
              proporciona. Aunque nos esforzamos por mantener actualizada la información:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Los cálculos son estimativos y orientativos</li>
              <li>Debe verificar los montos antes de realizar pagos</li>
              <li>Es su responsabilidad validar con su EPS, fondo de pensión y ARL</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">7.2. Pagos</h3>
            <p>
              Facilitamos el proceso de pago mediante integración con plataformas autorizadas
              (SOI, Mi Planilla). No somos responsables de:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Errores en el procesamiento de pagos por parte de terceros</li>
              <li>Rechazos de pago por fondos insuficientes o información incorrecta</li>
              <li>Sanciones o intereses por pagos tardíos</li>
            </ul>
          </section>

          {/* IA */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              8. Asesoramiento con Inteligencia Artificial
            </h2>

            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded mb-3">
              <p className="font-semibold text-red-800 dark:text-red-200">
                ⚠️ DISCLAIMER IMPORTANTE:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                El asesoramiento proporcionado por la IA es únicamente con fines educativos e
                informativos. NO constituye asesoría profesional legal, contable o fiscal.
                Las respuestas pueden contener errores o estar desactualizadas.
              </p>
            </div>

            <h3 className="font-semibold mt-4 mb-2">8.1. Limitaciones</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>La IA puede cometer errores o proporcionar información inexacta</li>
              <li>No debe tomar decisiones financieras o fiscales importantes basándose únicamente
                en las respuestas de la IA</li>
              <li>Las respuestas se basan en información general de Colombia, pero cada caso puede
                tener particularidades</li>
              <li>La normativa tributaria cambia frecuentemente; siempre verifique la vigencia</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">8.2. Cuándo Consultar un Profesional</h3>
            <p className="mb-2">Debe consultar con un contador o abogado certificado para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Decisiones fiscales complejas o de alto impacto económico</li>
              <li>Auditorías, investigaciones o requerimientos de autoridades</li>
              <li>Constitución de empresas o cambios de régimen tributario</li>
              <li>Conflictos legales o fiscales</li>
            </ul>
          </section>

          {/* Propiedad Intelectual */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              9. Propiedad Intelectual
            </h2>

            <h3 className="font-semibold mt-4 mb-2">9.1. Nuestra Propiedad</h3>
            <p>
              Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo software,
              diseño, código, textos, gráficos, logos y marca, son propiedad de ULE o sus
              licenciantes.
            </p>

            <h3 className="font-semibold mt-4 mb-2">9.2. Su Contenido</h3>
            <p>
              Usted retiene todos los derechos sobre el contenido que crea o carga en la Plataforma
              (facturas, documentos, datos). Nos otorga una licencia limitada para:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Almacenar y procesar su contenido para proveer los Servicios</li>
              <li>Realizar copias de seguridad</li>
              <li>Generar estadísticas anónimas agregadas</li>
            </ul>
          </section>

          {/* Privacidad */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              10. Privacidad y Protección de Datos
            </h2>
            <p>
              El tratamiento de sus datos personales se rige por nuestra{' '}
              <a href="/politica-privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </a>
              , que forma parte integral de estos Términos.
            </p>
            <p className="mt-2">
              Cumplimos con la Ley 1581 de 2012 de Colombia y el Decreto 1377 de 2013.
            </p>
          </section>

          {/* Limitación Responsabilidad */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              11. Limitación de Responsabilidad
            </h2>

            <h3 className="font-semibold mt-4 mb-2">11.1. Exclusiones</h3>
            <p className="mb-2">
              En la máxima medida permitida por la ley colombiana, NO somos responsables por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Decisiones financieras, fiscales o comerciales que tome basándose en la información
                de la Plataforma</li>
              <li>Errores u omisiones en cálculos, facturas o asesoramiento de IA</li>
              <li>Pérdidas económicas derivadas del uso de la Plataforma</li>
              <li>Sanciones, multas o intereses impuestos por autoridades fiscales</li>
              <li>Interrupciones del servicio por mantenimiento, fallas técnicas o causas de fuerza mayor</li>
              <li>Acciones de terceros (hackers, ataques cibernéticos) fuera de nuestro control razonable</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">11.2. Limitación Monetaria</h3>
            <p>
              En caso de que seamos considerados responsables por algún daño, nuestra responsabilidad
              total no excederá el monto pagado por usted en los últimos 12 meses, o COP $500,000
              (quinientos mil pesos), lo que sea mayor.
            </p>
          </section>

          {/* Garantías */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              12. Garantías y Disclaimers
            </h2>

            <h3 className="font-semibold mt-4 mb-2">12.1. &quot;AS IS&quot;</h3>
            <p>
              La Plataforma se proporciona &quot;TAL CUAL&quot; y &quot;SEGÚN DISPONIBILIDAD&quot;, sin garantías
              de ningún tipo, expresas o implícitas.
            </p>

            <h3 className="font-semibold mt-4 mb-2">12.2. No Garantizamos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Funcionamiento ininterrumpido o libre de errores</li>
              <li>Exactitud, integridad o actualidad de la información</li>
              <li>Resultados específicos del uso de la Plataforma</li>
              <li>Compatibilidad con todo hardware o software</li>
            </ul>
          </section>

          {/* Indemnización */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              13. Indemnización
            </h2>
            <p>
              Usted acepta indemnizar y mantener indemne a ULE, sus directivos, empleados
              y afiliados de cualquier reclamo, pérdida, daño, responsabilidad y gasto (incluyendo
              honorarios legales) que surjan de:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Su uso de la Plataforma</li>
              <li>Violación de estos Términos</li>
              <li>Violación de derechos de terceros</li>
              <li>Información falsa o fraudulenta proporcionada</li>
            </ul>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              14. Modificaciones a los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios
              significativos serán notificados con al menos 30 días de anticipación por correo electrónico
              o mediante aviso en la Plataforma.
            </p>
            <p className="mt-2">
              El uso continuado de la Plataforma después de los cambios constituye su aceptación de
              los nuevos términos.
            </p>
          </section>

          {/* Ley Aplicable */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              15. Ley Aplicable y Jurisdicción
            </h2>
            <p>
              Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa
              se resolverá en los tribunales competentes de Colombia.
            </p>
            <p className="mt-2">
              Antes de acudir a tribunales, las partes intentarán resolver las disputas mediante
              negociación directa de buena fe.
            </p>
          </section>

          {/* Disposiciones */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              16. Disposiciones Generales
            </h2>

            <h3 className="font-semibold mt-4 mb-2">16.1. Divisibilidad</h3>
            <p>
              Si alguna disposición de estos Términos es considerada inválida o inaplicable,
              las demás disposiciones permanecerán en pleno vigor.
            </p>

            <h3 className="font-semibold mt-4 mb-2">16.2. Renuncia</h3>
            <p>
              La no exigencia de cualquier derecho bajo estos Términos no constituye una renuncia
              a dicho derecho.
            </p>

            <h3 className="font-semibold mt-4 mb-2">16.3. Cesión</h3>
            <p>
              Usted no puede ceder sus derechos u obligaciones bajo estos Términos sin nuestro
              consentimiento previo por escrito.
            </p>

            <h3 className="font-semibold mt-4 mb-2">16.4. Acuerdo Completo</h3>
            <p>
              Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo
              entre usted y nosotros respecto al uso de la Plataforma.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              17. Contacto
            </h2>
            <p className="mb-3">
              Para preguntas sobre estos Términos, contáctenos:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Email:</strong> legal@ule.com.co</p>
              <p><strong>Sitio web:</strong> https://ule.com.co</p>
            </div>
          </section>

          {/* Versión */}
          <section className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Versión:</strong> 1.0<br />
              <strong>Fecha de vigencia:</strong> {new Date().toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}
