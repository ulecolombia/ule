import { PrismaClient, CategoriaFAQ } from '@prisma/client'

const prisma = new PrismaClient()

const faqs = [
  // SEGURIDAD SOCIAL
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Cómo calculo mis aportes a PILA?',
    descripcionCorta: 'Aprende a calcular salud, pensión y ARL según tu ingreso',
    tags: ['pila', 'aportes', 'calculo', 'ibc'],
    orden: 1,
  },
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Qué pasa si no pago la PILA a tiempo?',
    descripcionCorta: 'Conoce las consecuencias y sanciones por mora en aportes',
    tags: ['pila', 'mora', 'sanciones', 'multas'],
    orden: 2,
  },
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Cuál es la diferencia entre contrato OPS y término fijo?',
    descripcionCorta: 'Entiende las diferencias en aportes y obligaciones',
    tags: ['contrato', 'ops', 'termino fijo', 'diferencias'],
    orden: 3,
  },
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Qué es el IBC y cómo se calcula?',
    descripcionCorta: 'Ingreso Base de Cotización: concepto y cálculo',
    tags: ['ibc', 'cotizacion', 'calculo'],
    orden: 4,
  },
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Puedo tener múltiples contratos y cómo afecta mi PILA?',
    descripcionCorta: 'Gestión de aportes con múltiples fuentes de ingreso',
    tags: ['multiples contratos', 'pila', 'aportes'],
    orden: 5,
  },
  {
    categoria: 'SEGURIDAD_SOCIAL' as CategoriaFAQ,
    pregunta: '¿Cómo me afilio por primera vez a seguridad social?',
    descripcionCorta: 'Pasos para afiliarte a EPS, pensión y ARL',
    tags: ['afiliacion', 'eps', 'pension', 'arl'],
    orden: 6,
  },

  // FACTURACIÓN ELECTRÓNICA
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Cuándo debo facturar electrónicamente?',
    descripcionCorta: 'Obligaciones y plazos según la DIAN',
    tags: ['facturacion', 'electronica', 'obligacion', 'dian'],
    orden: 1,
  },
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Qué es el CUFE y para qué sirve?',
    descripcionCorta: 'Código Único de Factura Electrónica explicado',
    tags: ['cufe', 'codigo', 'factura'],
    orden: 2,
  },
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Cómo emito mi primera factura electrónica?',
    descripcionCorta: 'Guía paso a paso para empezar a facturar',
    tags: ['primera factura', 'emitir', 'tutorial'],
    orden: 3,
  },
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Qué es un proveedor tecnológico y necesito uno?',
    descripcionCorta: 'Proveedores autorizados por DIAN para facturación',
    tags: ['proveedor tecnologico', 'dian', 'autorizacion'],
    orden: 4,
  },
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Puedo anular una factura electrónica?',
    descripcionCorta: 'Proceso y requisitos para anular facturas',
    tags: ['anular', 'factura', 'cancelar'],
    orden: 5,
  },
  {
    categoria: 'FACTURACION_ELECTRONICA' as CategoriaFAQ,
    pregunta: '¿Qué sanciones hay por no facturar electrónicamente?',
    descripcionCorta: 'Multas y consecuencias del incumplimiento',
    tags: ['sanciones', 'multas', 'incumplimiento'],
    orden: 6,
  },

  // RÉGIMEN TRIBUTARIO
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Cómo sé si debo estar en régimen simple o ordinario?',
    descripcionCorta: 'Criterios para elegir el régimen más conveniente',
    tags: ['regimen simple', 'ordinario', 'eleccion'],
    orden: 1,
  },
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Qué ventajas tiene el Régimen Simple de Tributación?',
    descripcionCorta: 'Beneficios del régimen creado por Ley 2277 de 2022',
    tags: ['regimen simple', 'ventajas', 'beneficios'],
    orden: 2,
  },
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Cuáles son las tarifas del Régimen Simple en 2025?',
    descripcionCorta: 'Tabla de tarifas según nivel de ingresos',
    tags: ['tarifas', 'regimen simple', '2025'],
    orden: 3,
  },
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Cuándo debo declarar renta como persona natural?',
    descripcionCorta: 'Requisitos y plazos para declaración de renta',
    tags: ['declaracion renta', 'plazos', 'requisitos'],
    orden: 4,
  },
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Qué es la retención en la fuente y cómo funciona?',
    descripcionCorta: 'Sistema de retención anticipada de impuestos',
    tags: ['retencion fuente', 'impuestos'],
    orden: 5,
  },
  {
    categoria: 'REGIMEN_TRIBUTARIO' as CategoriaFAQ,
    pregunta: '¿Puedo cambiar de régimen tributario?',
    descripcionCorta: 'Proceso y requisitos para cambio de régimen',
    tags: ['cambio regimen', 'proceso'],
    orden: 6,
  },

  // OBLIGACIONES CONTABLES
  {
    categoria: 'OBLIGACIONES_CONTABLES' as CategoriaFAQ,
    pregunta: '¿Qué libros contables debo llevar?',
    descripcionCorta: 'Libros obligatorios según tu tipo de actividad',
    tags: ['libros contables', 'obligaciones'],
    orden: 1,
  },
  {
    categoria: 'OBLIGACIONES_CONTABLES' as CategoriaFAQ,
    pregunta: '¿Cuánto tiempo debo guardar mis documentos contables?',
    descripcionCorta: 'Plazos de conservación según normativa',
    tags: ['conservacion', 'documentos', 'plazos'],
    orden: 2,
  },
  {
    categoria: 'OBLIGACIONES_CONTABLES' as CategoriaFAQ,
    pregunta: '¿Necesito un contador si soy independiente?',
    descripcionCorta: 'Cuándo es obligatorio tener contador público',
    tags: ['contador', 'obligacion', 'independiente'],
    orden: 3,
  },
  {
    categoria: 'OBLIGACIONES_CONTABLES' as CategoriaFAQ,
    pregunta: '¿Qué es el RUT y cómo lo actualizo?',
    descripcionCorta: 'Registro Único Tributario: qué es y cómo gestionarlo',
    tags: ['rut', 'actualizacion', 'registro'],
    orden: 4,
  },

  // CONSTITUCIÓN DE EMPRESA
  {
    categoria: 'CONSTITUCION_EMPRESA' as CategoriaFAQ,
    pregunta: '¿Debo crear una empresa o puedo trabajar como persona natural?',
    descripcionCorta: 'Diferencias entre persona natural y jurídica',
    tags: ['persona natural', 'empresa', 'constitucion'],
    orden: 1,
  },
  {
    categoria: 'CONSTITUCION_EMPRESA' as CategoriaFAQ,
    pregunta: '¿Qué tipo de sociedad es mejor para mi negocio?',
    descripcionCorta: 'SAS, LTDA, y otras formas societarias',
    tags: ['tipo sociedad', 'sas', 'ltda'],
    orden: 2,
  },
  {
    categoria: 'CONSTITUCION_EMPRESA' as CategoriaFAQ,
    pregunta: '¿Cuánto cuesta crear una empresa en Colombia?',
    descripcionCorta: 'Costos de constitución y registro',
    tags: ['costos', 'crear empresa', 'tramites'],
    orden: 3,
  },
  {
    categoria: 'CONSTITUCION_EMPRESA' as CategoriaFAQ,
    pregunta: '¿Qué pasos debo seguir para constituir una SAS?',
    descripcionCorta: 'Proceso completo de constitución de SAS',
    tags: ['sas', 'constitucion', 'pasos'],
    orden: 4,
  },

  // GENERAL
  {
    categoria: 'GENERAL' as CategoriaFAQ,
    pregunta: '¿Cómo funciona Ule y qué servicios ofrece?',
    descripcionCorta: 'Conoce todas las funcionalidades de la plataforma',
    tags: ['ule', 'funcionalidades', 'servicios'],
    orden: 1,
  },
  {
    categoria: 'GENERAL' as CategoriaFAQ,
    pregunta: '¿Cómo puedo cambiar mi información de perfil?',
    descripcionCorta: 'Actualiza tus datos personales y laborales',
    tags: ['perfil', 'actualizar', 'datos'],
    orden: 2,
  },
]

async function seedFAQs() {
  console.log('🌱 Iniciando seed de FAQs...')

  // Limpiar FAQs existentes (opcional)
  await prisma.fAQ.deleteMany()
  console.log('🗑️  FAQs existentes eliminadas')

  // Crear FAQs
  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: faq,
    })
  }

  console.log(`✅ ${faqs.length} FAQs creadas exitosamente`)

  // Mostrar resumen por categoría
  const conteo = await prisma.fAQ.groupBy({
    by: ['categoria'],
    _count: true,
  })

  console.log('\n📊 Resumen por categoría:')
  conteo.forEach(cat => {
    console.log(`   ${cat.categoria}: ${cat._count} preguntas`)
  })
}

seedFAQs()
  .catch((e) => {
    console.error('❌ Error en seed de FAQs:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
