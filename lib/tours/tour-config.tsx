/**
 * CONFIGURACIÓN DE TOURS GUIADOS
 * Tours interactivos para onboarding de usuarios
 */

import { Step } from 'react-joyride'

/**
 * Tour del Dashboard (primer login)
 */
export const tourDashboard: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2 className="mb-2 text-xl font-bold">
          ¡Bienvenido a tu plataforma tributaria! 🎉
        </h2>
        <p>
          Te guiaremos en un recorrido rápido de 2 minutos para que conozcas las
          funciones principales.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="menu-pila"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">💰 Liquidación de PILA</h3>
        <p>
          Aquí calculas y pagas tus aportes mensuales a seguridad social (Salud,
          Pensión, ARL).
        </p>
        <p className="mt-2 text-sm text-gray-500">
          <strong>Importante:</strong> Debes pagar antes del día 10 de cada mes.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="menu-facturacion"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">📄 Facturación Electrónica</h3>
        <p>
          Emite facturas electrónicas válidas ante la DIAN con CUFE y firma
          digital.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Gestiona tus clientes y mantén un histórico organizado.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="menu-asesoria"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">🤖 Asesor con IA</h3>
        <p>
          Pregunta sobre tributación, PILA, facturación o régimen fiscal. La IA
          te responde al instante.
        </p>
        <p className="mt-2 text-sm text-yellow-600">
          <strong>Recuerda:</strong> Es orientación educativa, no reemplaza a un
          contador certificado.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="alertas"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">⚠️ Alertas Importantes</h3>
        <p>
          Aquí verás recordatorios de pagos próximos a vencer y acciones
          pendientes.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="acciones-rapidas"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">⚡ Acciones Rápidas</h3>
        <p>
          Accede directamente a las funciones más usadas desde el dashboard.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="perfil"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">👤 Tu Perfil</h3>
        <p>
          Aquí puedes editar tu información personal, entidades de seguridad
          social y configuración.
        </p>
        <p className="mt-2 text-sm text-blue-600">
          <strong>Recomendación:</strong> Completa tu perfil al 100% para
          cálculos más precisos.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 className="mb-2 text-xl font-bold">🎓 ¡Tour Completado!</h2>
        <p className="mb-3">
          Ya conoces lo básico. Ahora completa estos pasos:
        </p>
        <ol className="list-inside list-decimal space-y-1 text-sm">
          <li>Completa tu perfil (tipo de contrato, ingresos, entidades)</li>
          <li>Calcula tu primera PILA</li>
          <li>Emite tu primera factura electrónica</li>
        </ol>
        <p className="mt-3 text-sm text-gray-500">
          💡 Puedes reactivar este tour desde el menú de Ayuda.
        </p>
      </div>
    ),
    placement: 'center',
  },
]

/**
 * Tour de PILA
 */
export const tourPILA: Step[] = [
  {
    target: '[data-tour="pila-ingreso"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Ingreso Mensual</h3>
        <p>Ingresa tu ingreso del mes. Este es el valor ANTES de descuentos.</p>
        <p className="mt-2 text-sm text-gray-500">
          <strong>Ejemplo:</strong> Si te pagan $5.000.000, ingresa ese valor
          completo.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="pila-nivel-riesgo"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Nivel de Riesgo ARL</h3>
        <p>Selecciona según tu actividad económica:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            • <strong>Nivel I:</strong> Oficina (diseñador, programador) -
            0.522%
          </li>
          <li>
            • <strong>Nivel II:</strong> Comercial - 1.044%
          </li>
          <li>
            • <strong>Nivel III:</strong> Industrial - 2.436%
          </li>
        </ul>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="pila-calcular"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Calcular</h3>
        <p>
          Haz clic para ver el desglose completo: IBC, Salud (12.5%), Pensión
          (16%) y ARL.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="pila-resultados"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">📊 Desglose de Aportes</h3>
        <p>Aquí verás cuánto pagas por cada concepto y el total mensual.</p>
        <p className="mt-2 text-sm text-blue-600">
          El IBC (Ingreso Base de Cotización) es mínimo 1 SMMLV y máximo 25
          SMMLV.
        </p>
      </div>
    ),
    placement: 'left',
  },
]

/**
 * Tour de Facturación
 */
export const tourFacturacion: Step[] = [
  {
    target: '[data-tour="factura-cliente"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Seleccionar Cliente</h3>
        <p>
          Elige un cliente existente o crea uno nuevo con el botón
          &quot;+&quot;.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Necesitas: Nombre, tipo de documento (CC/NIT), número, email.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="factura-items"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Items de la Factura</h3>
        <p>Agrega los productos/servicios que estás facturando.</p>
        <p className="mt-2 text-sm text-gray-500">
          Para cada item: descripción, cantidad, valor unitario e IVA (si
          aplica).
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="factura-totales"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Totales Calculados</h3>
        <p>El sistema calcula automáticamente: Subtotal, IVA y Total.</p>
        <p className="mt-2 text-sm text-blue-600">
          <strong>IVA General:</strong> 19% para servicios gravados.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="factura-emitir"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Emitir Factura</h3>
        <p>
          Al emitir, la factura se envía a la DIAN y recibe un CUFE (código
          único).
        </p>
        <p className="mt-2 text-sm text-yellow-600">
          <strong>Importante:</strong> Verifica los datos antes de emitir. Las
          facturas emitidas no se pueden modificar.
        </p>
      </div>
    ),
    placement: 'top',
  },
]

/**
 * Tour de Asesoría IA
 */
export const tourAsesoria: Step[] = [
  {
    target: '[data-tour="chat-input"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Pregunta lo que quieras</h3>
        <p>Ejemplos de preguntas:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• &quot;¿Cómo sé si debo estar en régimen simple?&quot;</li>
          <li>• &quot;¿Qué pasa si no pago PILA a tiempo?&quot;</li>
          <li>• &quot;¿Cuándo debo facturar electrónicamente?&quot;</li>
        </ul>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="chat-contexto"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Contexto de tu Perfil</h3>
        <p>
          La IA conoce tu información (ingresos, tipo de contrato) para darte
          respuestas personalizadas.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="chat-faqs"]',
    content: (
      <div>
        <h3 className="mb-2 font-bold">Preguntas Frecuentes</h3>
        <p>
          Haz clic en cualquier pregunta pre-definida para obtener una respuesta
          rápida.
        </p>
      </div>
    ),
    placement: 'left',
  },
]
