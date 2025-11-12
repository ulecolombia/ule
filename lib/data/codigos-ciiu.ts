/**
 * ULE - CÓDIGOS CIIU
 * Clasificación Industrial Internacional Uniforme
 * Lista de códigos CIIU más comunes para prestadores de servicios en Colombia
 */

export interface CodigoCIIU {
  codigo: string
  descripcion: string
  categoria: string
}

export const CODIGOS_CIIU: CodigoCIIU[] = [
  // Tecnología e Informática
  { codigo: '6201', descripcion: 'Desarrollo de software y consultoría informática', categoria: 'Tecnología' },
  { codigo: '6202', descripcion: 'Consultoría informática y gestión de instalaciones', categoria: 'Tecnología' },
  { codigo: '6209', descripcion: 'Otras actividades de tecnología de la información', categoria: 'Tecnología' },
  { codigo: '6311', descripcion: 'Procesamiento de datos y hospedaje web', categoria: 'Tecnología' },
  { codigo: '6312', descripcion: 'Portales web', categoria: 'Tecnología' },

  // Consultoría y Servicios Empresariales
  { codigo: '7020', descripcion: 'Consultoría de gestión empresarial', categoria: 'Consultoría' },
  { codigo: '7111', descripcion: 'Servicios de arquitectura', categoria: 'Consultoría' },
  { codigo: '7112', descripcion: 'Servicios de ingeniería y consultoría técnica', categoria: 'Consultoría' },
  { codigo: '7220', descripcion: 'Investigación y desarrollo experimental', categoria: 'Consultoría' },
  { codigo: '7490', descripcion: 'Otras actividades profesionales, científicas y técnicas', categoria: 'Consultoría' },

  // Servicios Profesionales
  { codigo: '6910', descripcion: 'Servicios jurídicos', categoria: 'Servicios Profesionales' },
  { codigo: '6920', descripcion: 'Servicios de contabilidad, auditoría y consultoría fiscal', categoria: 'Servicios Profesionales' },
  { codigo: '7010', descripcion: 'Actividades de oficinas principales', categoria: 'Servicios Profesionales' },
  { codigo: '8299', descripcion: 'Otras actividades de servicio de apoyo a las empresas', categoria: 'Servicios Profesionales' },

  // Publicidad, Marketing y Diseño
  { codigo: '7310', descripcion: 'Publicidad', categoria: 'Creatividad' },
  { codigo: '7320', descripcion: 'Estudios de mercado y encuestas de opinión pública', categoria: 'Creatividad' },
  { codigo: '7410', descripcion: 'Diseño especializado', categoria: 'Creatividad' },
  { codigo: '7420', descripcion: 'Fotografía', categoria: 'Creatividad' },
  { codigo: '9003', descripcion: 'Creación artística', categoria: 'Creatividad' },
  { codigo: '9004', descripcion: 'Gestión de salas de exhibición', categoria: 'Creatividad' },

  // Educación
  { codigo: '8511', descripcion: 'Educación preescolar', categoria: 'Educación' },
  { codigo: '8512', descripcion: 'Educación básica primaria', categoria: 'Educación' },
  { codigo: '8513', descripcion: 'Educación básica secundaria', categoria: 'Educación' },
  { codigo: '8521', descripcion: 'Educación técnica profesional', categoria: 'Educación' },
  { codigo: '8522', descripcion: 'Educación tecnológica', categoria: 'Educación' },
  { codigo: '8530', descripcion: 'Establecimientos que combinan diferentes niveles de educación', categoria: 'Educación' },
  { codigo: '8541', descripcion: 'Educación superior universitaria', categoria: 'Educación' },
  { codigo: '8542', descripcion: 'Educación superior no universitaria', categoria: 'Educación' },
  { codigo: '8551', descripcion: 'Formación académica no formal', categoria: 'Educación' },
  { codigo: '8552', descripcion: 'Enseñanza deportiva y recreativa', categoria: 'Educación' },
  { codigo: '8553', descripcion: 'Enseñanza cultural', categoria: 'Educación' },
  { codigo: '8559', descripcion: 'Otros tipos de educación', categoria: 'Educación' },
  { codigo: '8560', descripcion: 'Actividades de apoyo a la educación', categoria: 'Educación' },

  // Salud y Servicios Sociales
  { codigo: '8610', descripcion: 'Actividades de hospitales y clínicas', categoria: 'Salud' },
  { codigo: '8621', descripcion: 'Actividades de la práctica médica', categoria: 'Salud' },
  { codigo: '8622', descripcion: 'Actividades de la práctica odontológica', categoria: 'Salud' },
  { codigo: '8691', descripcion: 'Actividades de apoyo diagnóstico', categoria: 'Salud' },
  { codigo: '8692', descripcion: 'Actividades de apoyo terapéutico', categoria: 'Salud' },
  { codigo: '8699', descripcion: 'Otras actividades de atención de salud humana', categoria: 'Salud' },
  { codigo: '8710', descripcion: 'Actividades de atención residencial medicalizada', categoria: 'Salud' },
  { codigo: '8720', descripcion: 'Actividades de atención residencial para personas con discapacidad', categoria: 'Salud' },
  { codigo: '8730', descripcion: 'Actividades de atención en instituciones para adultos mayores', categoria: 'Salud' },
  { codigo: '8790', descripcion: 'Otras actividades de atención en instituciones', categoria: 'Salud' },
  { codigo: '8810', descripcion: 'Actividades de asistencia social sin alojamiento para adultos mayores', categoria: 'Salud' },

  // Construcción
  { codigo: '4111', descripcion: 'Construcción de edificios residenciales', categoria: 'Construcción' },
  { codigo: '4112', descripcion: 'Construcción de edificios no residenciales', categoria: 'Construcción' },
  { codigo: '4210', descripcion: 'Construcción de carreteras y vías de ferrocarril', categoria: 'Construcción' },
  { codigo: '4290', descripcion: 'Construcción de otras obras de ingeniería civil', categoria: 'Construcción' },
  { codigo: '4321', descripcion: 'Instalaciones eléctricas', categoria: 'Construcción' },
  { codigo: '4322', descripcion: 'Instalaciones de fontanería y desagües', categoria: 'Construcción' },

  // Transporte y Logística
  { codigo: '4923', descripcion: 'Transporte de carga por carretera', categoria: 'Transporte' },
  { codigo: '5221', descripcion: 'Actividades de estaciones y terminales de transporte', categoria: 'Transporte' },
  { codigo: '5229', descripcion: 'Otras actividades complementarias al transporte', categoria: 'Transporte' },
  { codigo: '5310', descripcion: 'Actividades postales nacionales', categoria: 'Transporte' },
  { codigo: '5320', descripcion: 'Actividades de mensajería', categoria: 'Transporte' },

  // Comercio
  { codigo: '4690', descripcion: 'Comercio al por mayor no especializado', categoria: 'Comercio' },
  { codigo: '4711', descripcion: 'Comercio al por menor en establecimientos no especializados', categoria: 'Comercio' },
  { codigo: '4791', descripcion: 'Comercio al por menor por correo y por internet', categoria: 'Comercio' },

  // Servicios Administrativos
  { codigo: '8211', descripcion: 'Actividades combinadas de servicios administrativos', categoria: 'Administrativo' },
  { codigo: '8219', descripcion: 'Fotocopiado y preparación de documentos', categoria: 'Administrativo' },
  { codigo: '8220', descripcion: 'Actividades de centros de llamadas', categoria: 'Administrativo' },
  { codigo: '8230', descripcion: 'Organización de convenciones y eventos comerciales', categoria: 'Administrativo' },

  // Servicios de Alojamiento y Alimentación
  { codigo: '5511', descripcion: 'Alojamiento en hoteles', categoria: 'Turismo' },
  { codigo: '5611', descripcion: 'Expendio a la mesa de comidas preparadas', categoria: 'Turismo' },
  { codigo: '5619', descripcion: 'Otros tipos de expendio de comidas preparadas', categoria: 'Turismo' },

  // Entretenimiento y Recreación
  { codigo: '9001', descripcion: 'Creación e interpretación de obras de teatro', categoria: 'Entretenimiento' },
  { codigo: '9002', descripcion: 'Actividades de apoyo a la creación artística', categoria: 'Entretenimiento' },
  { codigo: '9319', descripcion: 'Otras actividades deportivas', categoria: 'Entretenimiento' },
  { codigo: '9321', descripcion: 'Actividades de parques de atracciones', categoria: 'Entretenimiento' },
]

export const CATEGORIAS_CIIU = [
  'Tecnología',
  'Consultoría',
  'Servicios Profesionales',
  'Creatividad',
  'Educación',
  'Salud',
  'Construcción',
  'Transporte',
  'Comercio',
  'Administrativo',
  'Turismo',
  'Entretenimiento',
] as const

export type CategoriaCIIU = (typeof CATEGORIAS_CIIU)[number]

/**
 * Busca códigos CIIU por texto (código o descripción)
 */
export function buscarCodigosCIIU(query: string): CodigoCIIU[] {
  const queryLower = query.toLowerCase().trim()

  if (!queryLower) return CODIGOS_CIIU

  return CODIGOS_CIIU.filter(
    (item) =>
      item.codigo.includes(queryLower) ||
      item.descripcion.toLowerCase().includes(queryLower) ||
      item.categoria.toLowerCase().includes(queryLower)
  )
}

/**
 * Obtiene códigos CIIU por categoría
 */
export function getCodigosPorCategoria(categoria: CategoriaCIIU): CodigoCIIU[] {
  return CODIGOS_CIIU.filter((item) => item.categoria === categoria)
}
