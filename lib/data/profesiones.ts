/**
 * ULE - PROFESIONES COMUNES
 * Lista de profesiones más comunes en Colombia
 */

export const PROFESIONES_COMUNES = [
  'Abogado/a',
  'Administrador/a de Empresas',
  'Arquitecto/a',
  'Contador/a Público/a',
  'Desarrollador/a de Software',
  'Diseñador/a Gráfico/a',
  'Enfermero/a',
  'Ingeniero/a Civil',
  'Ingeniero/a de Sistemas',
  'Médico/a',
  'Periodista',
  'Psicólogo/a',
  'Trabajador/a Social',
  'Consultor/a',
  'Freelancer',
  'Otra (especificar)',
] as const

export type Profesion = (typeof PROFESIONES_COMUNES)[number]
