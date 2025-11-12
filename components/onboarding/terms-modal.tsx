/**
 * ULE - TERMS MODAL COMPONENT
 * Modal con términos y condiciones o política de privacidad
 */

'use client'

import React from 'react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'terms' | 'privacy'
}

const TERMINOS_Y_CONDICIONES = `
# Términos y Condiciones de Uso - Ule

**Última actualización:** Enero 2025

## 1. Aceptación de los Términos

Al usar Ule, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestra plataforma.

## 2. Servicios Ofrecidos

Ule es una plataforma de gestión de seguridad social y facturación electrónica para prestadores de servicios independientes en Colombia. Nuestros servicios incluyen:

- Cálculo automático de aportes a seguridad social (PILA)
- Generación de facturas electrónicas
- Gestión de clientes y contratos
- Recordatorios de pagos y obligaciones
- Consultas de IA especializadas en normativa colombiana

## 3. Uso de la Plataforma

Te comprometes a usar Ule de manera legal y responsable:

- Proporcionarás información veraz y actualizada
- No usarás la plataforma para actividades fraudulentas
- Mantendrás la confidencialidad de tu cuenta
- No compartirás tu acceso con terceros

## 4. Privacidad y Datos

Consulta nuestra Política de Privacidad para conocer cómo tratamos tus datos personales según la Ley 1581 de 2012.

## 5. Limitación de Responsabilidad

Ule es una herramienta de asistencia y no sustituye la asesoría profesional de contadores, abogados o asesores tributarios. Los cálculos y recomendaciones son orientativos.

No nos hacemos responsables por:
- Errores en la información proporcionada por el usuario
- Cambios en la normativa no reflejados inmediatamente
- Decisiones tomadas basándose únicamente en la información de la plataforma

## 6. Facturación y Pagos

Los planes de suscripción se cobrarán según la tarifa vigente. Puedes cancelar tu suscripción en cualquier momento.

## 7. Propiedad Intelectual

Todos los derechos de propiedad intelectual de Ule pertenecen a sus creadores. No puedes copiar, modificar o distribuir el contenido sin autorización.

## 8. Modificaciones

Nos reservamos el derecho de modificar estos términos. Te notificaremos de cambios importantes.

## 9. Ley Aplicable

Estos términos se rigen por las leyes de la República de Colombia.

## 10. Contacto

Para consultas sobre estos términos, contáctanos en: soporte@ule.com
`

const POLITICA_PRIVACIDAD = `
# Política de Tratamiento de Datos Personales - Ule

**Según Ley 1581 de 2012 de Colombia**

## 1. Responsable del Tratamiento

**Razón Social:** Ule SAS
**Domicilio:** Colombia
**Correo electrónico:** privacidad@ule.com

## 2. Datos que Recopilamos

Recopilamos la siguiente información personal:

### Datos de Identificación
- Nombre completo
- Tipo y número de documento
- Fecha de nacimiento
- Estado civil

### Datos de Contacto
- Correo electrónico
- Teléfono
- Dirección
- Ciudad y departamento

### Información Laboral y Financiera
- Tipo de contrato
- Profesión y actividad económica
- Ingresos mensuales
- Número de contratos activos

### Datos de Seguridad Social
- EPS, fondo de pensión y ARL
- Fechas de afiliación
- Nivel de riesgo laboral

### Datos de Facturación
- Información de clientes
- Facturas emitidas
- Historial de transacciones

## 3. Finalidad del Tratamiento

Tus datos se usan para:

- **Prestación del servicio:** Cálculo de aportes, generación de facturas, recordatorios
- **Cumplimiento legal:** Reportes a DIAN, PILA y otras entidades según normativa
- **Mejora del servicio:** Análisis de uso, desarrollo de nuevas funcionalidades
- **Comunicaciones:** Notificaciones importantes, tips y actualizaciones (si autorizaste)
- **Soporte:** Atención de consultas y resolución de problemas

## 4. Tratamiento de la Información

- **Almacenamiento seguro:** Usamos encriptación y medidas de seguridad avanzadas
- **Confidencialidad:** Solo personal autorizado accede a tus datos
- **No venta de datos:** Nunca vendemos tu información a terceros
- **Compartición limitada:** Solo compartimos datos cuando es legalmente requerido

## 5. Derechos del Titular

Según la Ley 1581 de 2012, tienes derecho a:

- **Conocer:** Saber qué datos tuyos tenemos y para qué los usamos
- **Actualizar:** Corregir información inexacta o incompleta
- **Rectificar:** Modificar datos que estén desactualizados
- **Suprimir:** Solicitar la eliminación de tus datos (con excepciones legales)
- **Revocar:** Retirar la autorización de tratamiento en cualquier momento

Para ejercer estos derechos, contáctanos en: privacidad@ule.com

## 6. Seguridad de los Datos

Implementamos medidas técnicas y organizativas para proteger tu información:

- Encriptación de datos sensibles (AES-256)
- Conexiones seguras (HTTPS/TLS)
- Autenticación de dos factores
- Backups periódicos
- Auditorías de seguridad
- Acceso restringido por roles

## 7. Cookies y Tecnologías Similares

Usamos cookies para mejorar tu experiencia:

- **Cookies esenciales:** Necesarias para el funcionamiento
- **Cookies analíticas:** Para entender el uso de la plataforma
- **Cookies de preferencias:** Para recordar tus configuraciones

Puedes gestionar las cookies desde tu navegador.

## 8. Transferencias Internacionales

Algunos servicios que usamos (hosting, análisis) pueden implicar transferencia de datos fuera de Colombia. Garantizamos que estos proveedores cumplen con estándares de protección adecuados.

## 9. Retención de Datos

Conservamos tus datos mientras:
- Mantengas una cuenta activa
- Sea necesario para cumplir obligaciones legales
- Existan disputas legales pendientes

Después, anonimizamos o eliminamos los datos.

## 10. Menores de Edad

Ule no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores.

## 11. Cambios a esta Política

Podemos actualizar esta política. Te notificaremos de cambios significativos por correo electrónico o dentro de la plataforma.

## 12. Contacto

Para consultas sobre privacidad:

- **Correo:** privacidad@ule.com
- **Teléfono:** +57 (1) 234-5678
- **Dirección:** Bogotá, Colombia

**Fecha de última actualización:** Enero 2025
`

export function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  if (!isOpen) return null

  const content = type === 'terms' ? TERMINOS_Y_CONDICIONES : POLITICA_PRIVACIDAD
  const title =
    type === 'terms'
      ? 'Términos y Condiciones de Uso'
      : 'Política de Tratamiento de Datos Personales'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-light-200 p-6">
            <h2 className="text-xl font-bold text-dark">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-dark-100 transition-colors hover:bg-light-50 hover:text-dark"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((line, index) => {
                // Headers
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-2xl font-bold text-dark mb-4">
                      {line.replace('# ', '')}
                    </h1>
                  )
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-xl font-semibold text-dark mt-6 mb-3">
                      {line.replace('## ', '')}
                    </h2>
                  )
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-lg font-medium text-dark mt-4 mb-2">
                      {line.replace('### ', '')}
                    </h3>
                  )
                }
                // Bold text
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <p key={index} className="font-semibold text-dark mb-2">
                      {line.replace(/\*\*/g, '')}
                    </p>
                  )
                }
                // List items
                if (line.startsWith('- **')) {
                  const match = line.match(/- \*\*(.*?)\*\*: (.*)/)
                  if (match) {
                    return (
                      <li key={index} className="mb-2">
                        <strong>{match[1]}:</strong> {match[2]}
                      </li>
                    )
                  }
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="mb-1 text-dark-100">
                      {line.replace('- ', '')}
                    </li>
                  )
                }
                // Empty lines
                if (line.trim() === '') {
                  return <br key={index} />
                }
                // Regular paragraphs
                return (
                  <p key={index} className="mb-2 text-dark-100">
                    {line}
                  </p>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-light-200 p-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
