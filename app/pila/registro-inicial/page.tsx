/**
 * ULE - REGISTRO INICIAL EN SEGURIDAD SOCIAL
 * Wizard para usuarios sin afiliación previa
 * Subfase 2.7
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface EntidadInfo {
  nombre: string;
  cobertura: string;
  tarifa: string;
  beneficios: string[];
  telefono: string;
  web: string;
}

interface FormData {
  eps: string;
  pension: string;
  arl: string;
  tipoContrato: string;
  ingresosMensuales: string;
  actividadEconomica: string;
  nivel_riesgo: string;
}

const EPS_OPTIONS: Record<string, EntidadInfo> = {
  Sanitas: {
    nombre: 'Sanitas EPS',
    cobertura: 'Plan Complementario de Salud + Red amplia',
    tarifa: '12.5% del IBC',
    beneficios: ['Atención 24/7', 'Telemedicina', 'Red internacional'],
    telefono: '601 651 6666',
    web: 'www.sanitas.co',
  },
  Compensar: {
    nombre: 'Compensar EPS',
    cobertura: 'Red propia + Caja de compensación',
    tarifa: '12.5% del IBC',
    beneficios: ['Subsidios familiares', 'Recreación', 'Créditos'],
    telefono: '601 444 4444',
    web: 'www.compensar.com',
  },
  Sura: {
    nombre: 'Sura EPS',
    cobertura: 'Red nacional completa',
    tarifa: '12.5% del IBC',
    beneficios: ['App móvil', 'Programas preventivos', 'Especialistas'],
    telefono: '601 437 7000',
    web: 'www.epssura.com',
  },
  'Nueva EPS': {
    nombre: 'Nueva EPS',
    cobertura: 'Mayor red del país',
    tarifa: '12.5% del IBC',
    beneficios: ['Cobertura nacional', 'Atención domiciliaria', 'Urgencias'],
    telefono: '601 307 7002',
    web: 'www.nuevaeps.com.co',
  },
  'Salud Total': {
    nombre: 'Salud Total',
    cobertura: 'Red integral de servicios',
    tarifa: '12.5% del IBC',
    beneficios: ['Medicina prepagada opcional', 'Centros propios', 'Laboratorios'],
    telefono: '601 307 6666',
    web: 'www.saludtotal.com.co',
  },
};

const PENSION_OPTIONS: Record<string, EntidadInfo> = {
  Porvenir: {
    nombre: 'Porvenir',
    cobertura: 'Régimen de ahorro individual',
    tarifa: '16% del IBC',
    beneficios: ['Retiros parciales', 'Rentabilidad histórica 8%', 'App móvil'],
    telefono: '601 307 5060',
    web: 'www.porvenir.com.co',
  },
  Protección: {
    nombre: 'Protección',
    cobertura: 'Fondos moderados y conservadores',
    tarifa: '16% del IBC',
    beneficios: ['Asesoría personalizada', 'Multifondos', 'Seguros adicionales'],
    telefono: '601 307 7777',
    web: 'www.proteccion.com',
  },
  Colfondos: {
    nombre: 'Colfondos',
    cobertura: 'Gestión profesional de inversiones',
    tarifa: '16% del IBC',
    beneficios: ['Portafolio diversificado', 'Extraprimas voluntarias', 'App móvil'],
    telefono: '601 756 3000',
    web: 'www.colfondos.com.co',
  },
  'Old Mutual': {
    nombre: 'Old Mutual',
    cobertura: 'Experiencia internacional',
    tarifa: '16% del IBC',
    beneficios: ['Gestión activa', 'Fondos especializados', 'Atención digital'],
    telefono: '601 307 1919',
    web: 'www.oldmutual.com.co',
  },
  Colpensiones: {
    nombre: 'Colpensiones',
    cobertura: 'Régimen de prima media (público)',
    tarifa: '16% del IBC',
    beneficios: ['Pensión vitalicia', 'Garantía estatal', 'No depende del mercado'],
    telefono: '601 307 7000',
    web: 'www.colpensiones.gov.co',
  },
};

const ARL_OPTIONS: Record<string, EntidadInfo> = {
  Sura: {
    nombre: 'Sura ARL',
    cobertura: 'Prevención y protección laboral',
    tarifa: '0.522% - 6.96% según riesgo',
    beneficios: ['Asesoría SST', 'Capacitaciones', 'Accidentes de trabajo'],
    telefono: '601 437 7000',
    web: 'www.arlsura.com',
  },
  Positiva: {
    nombre: 'Positiva',
    cobertura: 'Seguridad y salud en el trabajo',
    tarifa: '0.522% - 6.96% según riesgo',
    beneficios: ['Plataforma digital', 'Inspecciones', 'Rehabilitación'],
    telefono: '601 756 3000',
    web: 'www.positiva.gov.co',
  },
  Liberty: {
    nombre: 'Liberty Seguros',
    cobertura: 'Gestión integral de riesgos',
    tarifa: '0.522% - 6.96% según riesgo',
    beneficios: ['Respaldo internacional', 'Asesoría legal', 'Atención 24/7'],
    telefono: '601 307 1919',
    web: 'www.libertyseguros.co',
  },
  Bolívar: {
    nombre: 'Seguros Bolívar',
    cobertura: 'Protección y prevención',
    tarifa: '0.522% - 6.96% según riesgo',
    beneficios: ['Red médica propia', 'Capacitación virtual', 'Indemnizaciones'],
    telefono: '601 307 7000',
    web: 'www.segurosbolivar.com',
  },
  Colmena: {
    nombre: 'Colmena Seguros',
    cobertura: 'Experiencia en riesgos laborales',
    tarifa: '0.522% - 6.96% según riesgo',
    beneficios: ['Exámenes médicos', 'Planes de emergencia', 'App móvil'],
    telefono: '601 756 6060',
    web: 'www.colmenaseguros.com',
  },
};

const FAQS = [
  {
    pregunta: '¿Es obligatorio afiliarme a todas las entidades?',
    respuesta:
      'Sí, como trabajador independiente debes estar afiliado a EPS (salud), Fondo de Pensión y ARL (riesgos laborales). Es un requisito legal para poder cotizar mensualmente.',
  },
  {
    pregunta: '¿Puedo cambiar de entidad después?',
    respuesta:
      'Sí, puedes realizar traslados: EPS (cada año), Pensión (cada 6 meses), y ARL (cada año). Los traslados son gratuitos.',
  },
  {
    pregunta: '¿Cuánto tiempo tarda el proceso de afiliación?',
    respuesta:
      'El proceso de afiliación toma entre 3 y 15 días hábiles. Una vez afiliado, recibirás tu número de afiliado por correo electrónico.',
  },
  {
    pregunta: '¿Qué documentos necesito?',
    respuesta:
      'Necesitas: Documento de identidad (cédula), RUT actualizado, y certificación de ingresos o declaración de renta si aplica.',
  },
  {
    pregunta: '¿Cuál es la diferencia entre régimen público y privado en pensiones?',
    respuesta:
      'Régimen público (Colpensiones): pensión vitalicia con garantía estatal. Régimen privado (fondos): ahorro individual que genera rentabilidad.',
  },
];

export default function RegistroInicialPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    eps: '',
    pension: '',
    arl: '',
    tipoContrato: '',
    ingresosMensuales: '',
    actividadEconomica: '',
    nivel_riesgo: '1',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/actualizar-entidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eps: formData.eps,
          fondoPension: formData.pension,
          arl: formData.arl,
          tipoContrato: formData.tipoContrato,
          actividadEconomica: formData.actividadEconomica,
          nivelRiesgo: parseInt(formData.nivel_riesgo),
        }),
      });

      if (response.ok) {
        toast.success('Perfil actualizado correctamente');

        // Generar PDF con instrucciones
        await generarPDFInstrucciones();

        // Redirigir al dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const generarPDFInstrucciones = async () => {
    try {
      // TODO: Implementar generación real de PDF
      // Por ahora, creamos un documento HTML que se puede imprimir
      const epsInfo = EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS];
      const pensionInfo = PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS];
      const arlInfo = ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS];

      if (!epsInfo || !pensionInfo || !arlInfo) {
        toast.error('Error: Información de entidades incompleta');
        return;
      }

      const contenidoPDF = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Instrucciones de Afiliación - Ule</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #14B8A6; }
            h2 { color: #0F766E; margin-top: 30px; }
            .entidad { background: #F0FDFA; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .requisitos { background: #FEF3C7; padding: 15px; border-radius: 8px; }
            ul { line-height: 1.8; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #14B8A6; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h1>📋 Instrucciones de Afiliación</h1>
          <p><strong>Usuario:</strong> ${session?.user?.name || 'Usuario'}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>

          <div class="requisitos">
            <h3>📌 Documentos Necesarios</h3>
            <ul>
              <li>Cédula de ciudadanía (original y copia)</li>
              <li>RUT actualizado</li>
              <li>Certificación de ingresos o declaración de renta</li>
              <li>Formulario de afiliación (lo proporciona cada entidad)</li>
            </ul>
          </div>

          <h2>1. EPS - Salud</h2>
          <div class="entidad">
            <h3>${epsInfo.nombre}</h3>
            <p><strong>Cobertura:</strong> ${epsInfo.cobertura}</p>
            <p><strong>Tarifa:</strong> ${epsInfo.tarifa}</p>
            <p><strong>Teléfono:</strong> ${epsInfo.telefono}</p>
            <p><strong>Web:</strong> ${epsInfo.web}</p>
            <p><strong>Beneficios:</strong></p>
            <ul>
              ${epsInfo.beneficios.map((b) => `<li>${b}</li>`).join('')}
            </ul>
          </div>

          <h2>2. Fondo de Pensión</h2>
          <div class="entidad">
            <h3>${pensionInfo.nombre}</h3>
            <p><strong>Cobertura:</strong> ${pensionInfo.cobertura}</p>
            <p><strong>Tarifa:</strong> ${pensionInfo.tarifa}</p>
            <p><strong>Teléfono:</strong> ${pensionInfo.telefono}</p>
            <p><strong>Web:</strong> ${pensionInfo.web}</p>
            <p><strong>Beneficios:</strong></p>
            <ul>
              ${pensionInfo.beneficios.map((b) => `<li>${b}</li>`).join('')}
            </ul>
          </div>

          <h2>3. ARL - Riesgos Laborales</h2>
          <div class="entidad">
            <h3>${arlInfo.nombre}</h3>
            <p><strong>Cobertura:</strong> ${arlInfo.cobertura}</p>
            <p><strong>Tarifa:</strong> ${arlInfo.tarifa}</p>
            <p><strong>Teléfono:</strong> ${arlInfo.telefono}</p>
            <p><strong>Web:</strong> ${arlInfo.web}</p>
            <p><strong>Beneficios:</strong></p>
            <ul>
              ${arlInfo.beneficios.map((b) => `<li>${b}</li>`).join('')}
            </ul>
          </div>

          <div class="footer">
            <p>Generado por Ule - Tu plataforma de gestión de seguridad social</p>
            <p>Para más información, visita www.ule.co</p>
          </div>
        </body>
        </html>
      `;

      // Abrir en nueva ventana para imprimir
      const ventana = window.open('', '_blank');
      if (ventana) {
        ventana.document.write(contenidoPDF);
        ventana.document.close();
        ventana.print();
      }

      toast.success('PDF de instrucciones generado');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro Inicial en Seguridad Social
          </h1>
          <p className="text-gray-600">
            Te ayudaremos a afiliarte por primera vez al sistema
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    paso >= num
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      paso > num ? 'bg-teal-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium text-gray-700">
            <span>Selección</span>
            <span>Datos</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* PASO 1: Selección de entidades */}
        {paso === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              Paso 1: Selecciona tus entidades
            </h2>

            {/* EPS */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entidad Promotora de Salud (EPS) *
              </label>
              <select
                value={formData.eps}
                onChange={(e) =>
                  setFormData({ ...formData, eps: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecciona una EPS</option>
                {Object.keys(EPS_OPTIONS).map((key) => (
                  <option key={key} value={key}>
                    {EPS_OPTIONS[key as keyof typeof EPS_OPTIONS]?.nombre}
                  </option>
                ))}
              </select>

              {formData.eps && EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS] && (
                <div className="mt-3 p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Cobertura:</strong>{' '}
                    {EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS]?.cobertura}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Beneficios:</strong>{' '}
                    {EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS]?.beneficios.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Pensión */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fondo de Pensión *
              </label>
              <select
                value={formData.pension}
                onChange={(e) =>
                  setFormData({ ...formData, pension: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecciona un fondo</option>
                {Object.keys(PENSION_OPTIONS).map((key) => (
                  <option key={key} value={key}>
                    {PENSION_OPTIONS[key as keyof typeof PENSION_OPTIONS]?.nombre}
                  </option>
                ))}
              </select>

              {formData.pension && PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS] && (
                <div className="mt-3 p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Tipo:</strong>{' '}
                    {PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS]?.cobertura}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Beneficios:</strong>{' '}
                    {PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS]?.beneficios.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* ARL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ARL (Administradora de Riesgos Laborales) *
              </label>
              <select
                value={formData.arl}
                onChange={(e) =>
                  setFormData({ ...formData, arl: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecciona una ARL</option>
                {Object.keys(ARL_OPTIONS).map((key) => (
                  <option key={key} value={key}>
                    {ARL_OPTIONS[key as keyof typeof ARL_OPTIONS]?.nombre}
                  </option>
                ))}
              </select>

              {formData.arl && ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS] && (
                <div className="mt-3 p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Cobertura:</strong>{' '}
                    {ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS]?.cobertura}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Tarifa:</strong> {ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS]?.tarifa}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPaso(2)}
                disabled={!formData.eps || !formData.pension || !formData.arl}
                className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Datos personales y actividad */}
        {paso === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              Paso 2: Información adicional
            </h2>

            {/* Tipo de contrato */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de contrato *
              </label>
              <select
                value={formData.tipoContrato}
                onChange={(e) =>
                  setFormData({ ...formData, tipoContrato: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecciona el tipo</option>
                <option value="INDEPENDIENTE">Trabajador independiente</option>
                <option value="PRESTACION_SERVICIOS">
                  Prestación de servicios
                </option>
                <option value="CUENTA_PROPIA">Cuenta propia</option>
              </select>
            </div>

            {/* Ingresos mensuales */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresos mensuales estimados (COP) *
              </label>
              <input
                type="number"
                value={formData.ingresosMensuales}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ingresosMensuales: e.target.value,
                  })
                }
                placeholder="Ej: 2500000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Esto nos ayuda a calcular tu cotización mensual
              </p>
            </div>

            {/* Actividad económica */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actividad económica *
              </label>
              <select
                value={formData.actividadEconomica}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actividadEconomica: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Selecciona tu actividad</option>
                <option value="TECNOLOGIA">
                  Tecnología y desarrollo de software
                </option>
                <option value="CONSULTORIA">Consultoría y asesoría</option>
                <option value="DISEÑO">Diseño gráfico y creativo</option>
                <option value="COMERCIO">Comercio y ventas</option>
                <option value="EDUCACION">Educación y formación</option>
                <option value="SALUD">Salud y bienestar</option>
                <option value="CONSTRUCCION">Construcción y obras</option>
                <option value="TRANSPORTE">Transporte y logística</option>
                <option value="OTRO">Otra actividad</option>
              </select>
            </div>

            {/* Nivel de riesgo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de riesgo laboral
              </label>
              <select
                value={formData.nivel_riesgo}
                onChange={(e) =>
                  setFormData({ ...formData, nivel_riesgo: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="1">Nivel 1 - Riesgo mínimo (oficina)</option>
                <option value="2">Nivel 2 - Riesgo bajo</option>
                <option value="3">Nivel 3 - Riesgo medio</option>
                <option value="4">Nivel 4 - Riesgo alto</option>
                <option value="5">
                  Nivel 5 - Riesgo máximo (construcción, minería)
                </option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Esto afecta el porcentaje de cotización a la ARL
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPaso(1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaso(3)}
                disabled={
                  !formData.tipoContrato ||
                  !formData.ingresosMensuales ||
                  !formData.actividadEconomica
                }
                className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Confirmación */}
        {paso === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              Paso 3: Confirmación
            </h2>

            <div className="space-y-6">
              {/* Resumen EPS */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-teal-600">🏥</span>
                  EPS - Salud
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>{EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS]?.nombre}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS]?.cobertura}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Teléfono: {EPS_OPTIONS[formData.eps as keyof typeof EPS_OPTIONS]?.telefono}
                </p>
              </div>

              {/* Resumen Pensión */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-teal-600">💰</span>
                  Fondo de Pensión
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>{PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS]?.nombre}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS]?.cobertura}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Teléfono: {PENSION_OPTIONS[formData.pension as keyof typeof PENSION_OPTIONS]?.telefono}
                </p>
              </div>

              {/* Resumen ARL */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-teal-600">🛡️</span>
                  ARL - Riesgos Laborales
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>{ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS]?.nombre}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS]?.cobertura}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Teléfono: {ARL_OPTIONS[formData.arl as keyof typeof ARL_OPTIONS]?.telefono}
                </p>
              </div>

              {/* Información adicional */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Información adicional
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tipo de contrato:</p>
                    <p className="font-medium text-gray-900">
                      {formData.tipoContrato}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ingresos mensuales:</p>
                    <p className="font-medium text-gray-900">
                      $
                      {parseInt(formData.ingresosMensuales).toLocaleString(
                        'es-CO'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Actividad económica:</p>
                    <p className="font-medium text-gray-900">
                      {formData.actividadEconomica}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Nivel de riesgo:</p>
                    <p className="font-medium text-gray-900">
                      Nivel {formData.nivel_riesgo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Importante:</strong> Al confirmar, guardaremos estas
                entidades en tu perfil y generaremos un documento PDF con
                instrucciones detalladas para completar tu afiliación con cada
                entidad.
              </p>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setPaso(2)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Confirmar y Generar Documento'
                )}
              </button>
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <details key={index} className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">
                    {faq.pregunta}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-500 transform group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-4 py-3 text-gray-600 text-sm">
                  {faq.respuesta}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Nota importante:</strong> Este proceso es orientativo y
            te ayuda a seleccionar tus entidades. Para completar tu afiliación
            real, deberás contactar directamente con las entidades seleccionadas
            utilizando el documento de instrucciones que generaremos.
          </p>
        </div>
      </div>
    </div>
  );
}
