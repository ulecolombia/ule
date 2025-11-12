import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Política de Privacidad | ULE',
  description: 'Política de Privacidad y Tratamiento de Datos Personales conforme a la Ley 1581 de 2012',
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidad y Tratamiento de Datos Personales</h1>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          {/* Identificación */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              1. Identificación del Responsable del Tratamiento
            </h2>
            <p>
              <strong>Razón Social:</strong> ULE - Gestión de Seguridad Social<br />
              <strong>País:</strong> Colombia<br />
              <strong>Email:</strong> privacidad@ule.com.co<br />
              <strong>Sitio web:</strong> https://ule.com.co
            </p>
          </section>

          {/* Marco Legal */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              2. Marco Legal
            </h2>
            <p>
              Esta Política de Privacidad se fundamenta en:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Ley 1581 de 2012:</strong> Por la cual se dictan disposiciones generales para la protección de datos personales en Colombia.</li>
              <li><strong>Decreto 1377 de 2013:</strong> Por el cual se reglamenta parcialmente la Ley 1581 de 2012.</li>
              <li><strong>Ley 1266 de 2008:</strong> Habeas Data.</li>
              <li><strong>Sentencias de la Corte Constitucional:</strong> C-1011/08, T-729/02, entre otras.</li>
            </ul>
          </section>

          {/* Datos Recolectados */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              3. Datos Personales que Recolectamos
            </h2>

            <h3 className="font-semibold mt-4 mb-2">3.1. Datos de Identificación</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre completo</li>
              <li>Tipo y número de documento de identidad</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de residencia</li>
              <li>Ciudad y departamento</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.2. Datos Laborales y Económicos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tipo de contrato (OPS, directo, término fijo)</li>
              <li>Profesión u oficio</li>
              <li>Actividad económica (código CIIU)</li>
              <li>Ingreso mensual promedio</li>
              <li>Número de contratos activos</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.3. Datos de Seguridad Social</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Entidad de salud (EPS)</li>
              <li>Fondo de pensión</li>
              <li>Administradora de Riesgos Laborales (ARL)</li>
              <li>Fechas de afiliación</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.4. Datos de Facturación</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Información de clientes (para emisión de facturas)</li>
              <li>Registros de facturas electrónicas</li>
              <li>Historial de transacciones</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">3.5. Datos Técnicos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dirección IP</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Sistema operativo</li>
              <li>Cookies y tecnologías similares</li>
              <li>Registro de actividad en la plataforma</li>
            </ul>
          </section>

          {/* Finalidades */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              4. Finalidades del Tratamiento
            </h2>
            <p className="mb-3">
              Los datos personales recolectados serán utilizados para las siguientes finalidades:
            </p>

            <h3 className="font-semibold mt-4 mb-2">4.1. Prestación del Servicio</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestionar el registro y autenticación de usuarios</li>
              <li>Procesar liquidaciones de PILA (Planilla Integrada de Liquidación de Aportes)</li>
              <li>Generar y gestionar facturas electrónicas</li>
              <li>Proveer asesoramiento tributario y contable mediante IA</li>
              <li>Almacenar y organizar documentos y comprobantes</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">4.2. Cumplimiento Legal</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cumplir con obligaciones legales y normativas colombianas</li>
              <li>Reportar información a autoridades cuando sea requerido</li>
              <li>Mantener registros para auditorías y fiscalización</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">4.3. Mejora del Servicio</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Analizar el uso de la plataforma (con su consentimiento)</li>
              <li>Mejorar funcionalidades y experiencia de usuario</li>
              <li>Desarrollar nuevos servicios y características</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">4.4. Comunicaciones</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Enviar notificaciones importantes sobre el servicio</li>
              <li>Recordatorios de pagos y fechas límite</li>
              <li>Comunicaciones de seguridad y actualizaciones</li>
              <li>Comunicaciones comerciales (solo con su consentimiento expreso)</li>
            </ul>
          </section>

          {/* Derechos */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              5. Sus Derechos como Titular de Datos
            </h2>
            <p className="mb-3">
              Como titular de datos personales, usted tiene los siguientes derechos:
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">5.1. Derecho de Acceso</h4>
                <p className="text-sm">
                  Conocer, actualizar y rectificar sus datos personales. Puede consultar qué información
                  tenemos sobre usted en cualquier momento desde su perfil.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.2. Derecho de Rectificación</h4>
                <p className="text-sm">
                  Solicitar la corrección de datos inexactos o incompletos directamente desde su perfil
                  o contactándonos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.3. Derecho de Actualización</h4>
                <p className="text-sm">
                  Mantener sus datos actualizados. Le notificaremos periódicamente para verificar
                  la vigencia de su información.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.4. Derecho de Supresión</h4>
                <p className="text-sm">
                  Solicitar la eliminación de sus datos cuando considere que no se respetan sus derechos
                  o cuando ya no sean necesarios para las finalidades informadas.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.5. Derecho a Revocar la Autorización</h4>
                <p className="text-sm">
                  Revocar el consentimiento otorgado para el tratamiento de sus datos, salvo cuando
                  exista un deber legal o contractual de permanecer en la base de datos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.6. Derecho de Portabilidad</h4>
                <p className="text-sm">
                  Solicitar una copia de todos sus datos personales en formato estructurado y de uso común.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5.7. Derecho a Presentar Quejas</h4>
                <p className="text-sm">
                  Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones
                  a la normativa de protección de datos.
                </p>
              </div>
            </div>
          </section>

          {/* Ejercer Derechos */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              6. Cómo Ejercer sus Derechos
            </h2>
            <p className="mb-3">
              Para ejercer cualquiera de sus derechos, puede:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Desde la plataforma:</strong> Acceder a su perfil → Sección &quot;Privacidad y Datos&quot;
                donde encontrará opciones para:
                <ul className="list-circle pl-6 mt-1">
                  <li>Descargar sus datos personales</li>
                  <li>Actualizar información</li>
                  <li>Solicitar eliminación de cuenta</li>
                </ul>
              </li>
              <li>
                <strong>Por correo electrónico:</strong> Enviar solicitud a privacidad@ule.com.co
              </li>
            </ul>
            <p className="mt-3 text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded">
              <strong>Tiempo de respuesta:</strong> Responderemos su solicitud en un plazo máximo de
              15 días hábiles contados a partir de su recepción. Si requiere información adicional,
              se lo notificaremos dentro de los primeros 5 días hábiles.
            </p>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              7. Medidas de Seguridad
            </h2>
            <p className="mb-3">
              Hemos implementado medidas técnicas, humanas y administrativas para proteger sus datos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encriptación:</strong> Todos los datos sensibles se encriptan usando AES-256-GCM</li>
              <li><strong>HTTPS:</strong> Toda comunicación usa protocolos seguros TLS 1.3</li>
              <li><strong>Autenticación:</strong> Sistema de 2FA opcional para mayor seguridad</li>
              <li><strong>Acceso restringido:</strong> Solo personal autorizado accede a sus datos</li>
              <li><strong>Monitoreo:</strong> Vigilancia constante de amenazas y accesos no autorizados</li>
              <li><strong>Copias de seguridad:</strong> Backups diarios encriptados</li>
            </ul>
          </section>

          {/* Compartir Datos */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              8. Compartir Datos con Terceros
            </h2>
            <p className="mb-3">
              No vendemos ni comercializamos sus datos personales. Solo compartimos información con:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Entidades gubernamentales:</strong> DIAN, Ministerio de Salud, cuando sea
                legalmente requerido
              </li>
              <li>
                <strong>Proveedores de servicios:</strong> Partners tecnológicos que procesan datos
                en nuestro nombre (almacenamiento en la nube, servicios de email)
              </li>
              <li>
                <strong>Entidades de seguridad social:</strong> EPS, fondos de pensión, ARL para
                procesamiento de aportes
              </li>
            </ul>
            <p className="mt-3 text-sm">
              Todos nuestros terceros firman acuerdos de confidencialidad y están obligados a cumplir
              con la legislación colombiana de protección de datos.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              9. Uso de Cookies
            </h2>
            <p className="mb-3">
              Utilizamos cookies y tecnologías similares. Para más información, consulte nuestra
              <a href="/politica-cookies" className="text-primary hover:underline ml-1">
                Política de Cookies
              </a>.
            </p>
          </section>

          {/* Retención */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              10. Tiempo de Retención de Datos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Datos de cuenta activa:</strong> Mientras mantenga su cuenta activa
              </li>
              <li>
                <strong>Datos fiscales y contables:</strong> Mínimo 5 años según legislación tributaria colombiana
              </li>
              <li>
                <strong>Logs de seguridad:</strong> 1 año
              </li>
              <li>
                <strong>Después de eliminación de cuenta:</strong> Conservamos datos por 30 días
                (periodo de gracia) y luego eliminamos permanentemente
              </li>
            </ul>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              11. Menores de Edad
            </h2>
            <p>
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recolectamos
              intencionalmente información de menores de edad. Si detectamos que hemos recibido
              datos de un menor, los eliminaremos inmediatamente.
            </p>
          </section>

          {/* Cambios */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              12. Cambios a esta Política
            </h2>
            <p>
              Podemos actualizar esta política periódicamente. Los cambios significativos serán
              notificados con 10 días de anticipación por correo electrónico. La versión actual
              siempre estará disponible en esta página.
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
              13. Contacto
            </h2>
            <p className="mb-3">
              Para cualquier consulta relacionada con esta política o el tratamiento de sus datos:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Email:</strong> privacidad@ule.com.co</p>
              <p><strong>Sitio web:</strong> https://ule.com.co</p>
              <p><strong>Horario de atención:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM (COT)</p>
            </div>
          </section>

          {/* Autoridad */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              14. Autoridad de Control
            </h2>
            <p className="mb-2">
              Si considera que no se están respetando sus derechos, puede presentar una queja ante:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p><strong>Superintendencia de Industria y Comercio</strong></p>
              <p>Delegatura para la Protección de Datos Personales</p>
              <p>Carrera 13 No. 27 - 00, Pisos 1 y 3</p>
              <p>Bogotá D.C., Colombia</p>
              <p>Tel: (+57-1) 587 0000</p>
              <p>
                <a
                  href="https://www.sic.gov.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.sic.gov.co
                </a>
              </p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  )
}
