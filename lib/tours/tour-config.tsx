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
        <h2 className="text-xl font-bold mb-2">¡Bienvenido a tu plataforma tributaria! 🎉</h2>
        <p>Te guiaremos en un recorrido rápido de 2 minutos para que conozcas las funciones principales.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="menu-pila"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">💰 Liquidación de PILA</h3>
        <p>Aquí calculas y pagas tus aportes mensuales a seguridad social (Salud, Pensión, ARL).</p>
        <p className="text-sm text-gray-500 mt-2">
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
        <h3 className="font-bold mb-2">📄 Facturación Electrónica</h3>
        <p>Emite facturas electrónicas válidas ante la DIAN con CUFE y firma digital.</p>
        <p className="text-sm text-gray-500 mt-2">
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
        <h3 className="font-bold mb-2">🤖 Asesor con IA</h3>
        <p>Pregunta sobre tributación, PILA, facturación o régimen fiscal. La IA te responde al instante.</p>
        <p className="text-sm text-yellow-600 mt-2">
          <strong>Recuerda:</strong> Es orientación educativa, no reemplaza a un contador certificado.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="alertas"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">⚠️ Alertas Importantes</h3>
        <p>Aquí verás recordatorios de pagos próximos a vencer y acciones pendientes.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="acciones-rapidas"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">⚡ Acciones Rápidas</h3>
        <p>Accede directamente a las funciones más usadas desde el dashboard.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="perfil"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">👤 Tu Perfil</h3>
        <p>Aquí puedes editar tu información personal, entidades de seguridad social y configuración.</p>
        <p className="text-sm text-blue-600 mt-2">
          <strong>Recomendación:</strong> Completa tu perfil al 100% para cálculos más precisos.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 className="text-xl font-bold mb-2">🎓 ¡Tour Completado!</h2>
        <p className="mb-3">Ya conoces lo básico. Ahora completa estos pasos:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Completa tu perfil (tipo de contrato, ingresos, entidades)</li>
          <li>Calcula tu primera PILA</li>
          <li>Emite tu primera factura electrónica</li>
        </ol>
        <p className="text-sm text-gray-500 mt-3">
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
        <h3 className="font-bold mb-2">Ingreso Mensual</h3>
        <p>Ingresa tu ingreso del mes. Este es el valor ANTES de descuentos.</p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Ejemplo:</strong> Si te pagan $5.000.000, ingresa ese valor completo.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="pila-nivel-riesgo"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Nivel de Riesgo ARL</h3>
        <p>Selecciona según tu actividad económica:</p>
        <ul className="text-sm mt-2 space-y-1">
          <li>• <strong>Nivel I:</strong> Oficina (diseñador, programador) - 0.522%</li>
          <li>• <strong>Nivel II:</strong> Comercial - 1.044%</li>
          <li>• <strong>Nivel III:</strong> Industrial - 2.436%</li>
        </ul>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="pila-calcular"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Calcular</h3>
        <p>Haz clic para ver el desglose completo: IBC, Salud (12.5%), Pensión (16%) y ARL.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="pila-resultados"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">📊 Desglose de Aportes</h3>
        <p>Aquí verás cuánto pagas por cada concepto y el total mensual.</p>
        <p className="text-sm text-blue-600 mt-2">
          El IBC (Ingreso Base de Cotización) es mínimo 1 SMMLV y máximo 25 SMMLV.
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
        <h3 className="font-bold mb-2">Seleccionar Cliente</h3>
        <p>Elige un cliente existente o crea uno nuevo con el botón "+".</p>
        <p className="text-sm text-gray-500 mt-2">
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
        <h3 className="font-bold mb-2">Items de la Factura</h3>
        <p>Agrega los productos/servicios que estás facturando.</p>
        <p className="text-sm text-gray-500 mt-2">
          Para cada item: descripción, cantidad, valor unitario e IVA (si aplica).
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="factura-totales"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Totales Calculados</h3>
        <p>El sistema calcula automáticamente: Subtotal, IVA y Total.</p>
        <p className="text-sm text-blue-600 mt-2">
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
        <h3 className="font-bold mb-2">Emitir Factura</h3>
        <p>Al emitir, la factura se envía a la DIAN y recibe un CUFE (código único).</p>
        <p className="text-sm text-yellow-600 mt-2">
          <strong>Importante:</strong> Verifica los datos antes de emitir. Las facturas emitidas no se pueden modificar.
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
        <h3 className="font-bold mb-2">Pregunta lo que quieras</h3>
        <p>Ejemplos de preguntas:</p>
        <ul className="text-sm mt-2 space-y-1">
          <li>• "¿Cómo sé si debo estar en régimen simple?"</li>
          <li>• "¿Qué pasa si no pago PILA a tiempo?"</li>
          <li>• "¿Cuándo debo facturar electrónicamente?"</li>
        </ul>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="chat-contexto"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Contexto de tu Perfil</h3>
        <p>La IA conoce tu información (ingresos, tipo de contrato) para darte respuestas personalizadas.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="chat-faqs"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">Preguntas Frecuentes</h3>
        <p>Haz clic en cualquier pregunta pre-definida para obtener una respuesta rápida.</p>
      </div>
    ),
    placement: 'left',
  },
]
