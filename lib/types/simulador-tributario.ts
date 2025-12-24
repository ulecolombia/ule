/**
 * TIPOS PARA SIMULADOR DE RÉGIMEN TRIBUTARIO
 * ULE Colombia - 2025
 *
 * Referencias legales:
 * - Art. 908 E.T. - Tarifas RST
 * - Art. 336 E.T. - Deducciones
 * - Art. 206 E.T. - Rentas exentas
 * - Sentencia C-540/2023 - Tarifas profesionales liberales
 */

// Actividades económicas para el RST
export type ActividadEconomicaRST =
  | 'PROFESIONAL_LIBERAL' // Numeral 6 Art. 908
  | 'SERVICIOS_TECNICOS' // Numeral 2 Art. 908
  | 'COMERCIAL' // Numeral 2 Art. 908
  | 'TIENDA_PELUQUERIA' // Numeral 1 Art. 908
  | 'RESTAURANTE' // Numeral 3 Art. 908

// Datos de entrada del usuario
export interface DatosEntradaSimulador {
  // Información básica (requerida)
  ingresosBrutosAnuales: number
  actividadEconomica: ActividadEconomicaRST

  // Para régimen ordinario
  costosGastos: number

  // Deducciones personales (Art. 336 E.T.)
  dependientes: number // 0-4
  comprasFacturaElectronica: number // Valor total de compras con FE
  aportesVoluntariosPension: number
  aportesAFC: number
  interesesViviendaAnuales: number
  medicinaPrepagadaAnual: number
  aplicarRentaExenta25: boolean // Art. 206 num. 10

  // Beneficios exclusivos RST
  pagosRecibidosElectronicos: number // Tarjetas, PSE
  gmfPagadoAnual: number // 4x1000 pagado

  // Opcional
  ciudad?: string
}

// Desglose de deducciones calculadas
export interface DesgloseDeducciones {
  dependientes: {
    cantidad: number
    valorPorDependiente: number
    total: number
    esAdicionalAlLimite: boolean // true - no cuenta para el 40%
  }
  comprasFacturaElectronica: {
    valorCompras: number
    porcentajeAplicado: number
    deduccionCalculada: number
    limiteUVT: number
    deduccionFinal: number
    esAdicionalAlLimite: boolean // true - no cuenta para el 40%
  }
  medicinaPrepagada: {
    valorAnual: number
    limiteUVT: number
    deduccionFinal: number
  }
  interesesVivienda: {
    valorAnual: number
    limiteUVT: number
    deduccionFinal: number
  }
  aportesVoluntarios: {
    pension: number
    afc: number
    limiteUVT: number
    deduccionFinal: number
  }
  rentaExenta25: {
    aplica: boolean
    baseCalculo: number
    porcentaje: number
    valorCalculado: number
    limiteUVT: number
    valorFinal: number
  }
  // Totales
  subtotalSujetoALimite: number
  subtotalAdicionalAlLimite: number
  limiteGlobal40Porciento: number
  limiteGlobal1340UVT: number
  limiteAplicado: number
  totalDeduccionesOrdinario: number
  excedeLimite: boolean
  montoExcedido: number
}

// Resultado del cálculo del Régimen Ordinario
export interface ResultadoRegimenOrdinario {
  // Flujo de cálculo
  ingresosBrutos: number
  costosGastos: number
  ingresosNetos: number
  ingresosNoConstitutivos: number // Aportes obligatorios pensión
  deducciones: DesgloseDeducciones
  rentaLiquidaGravable: number
  rentaLiquidaUVT: number

  // Impuesto
  rangoTabla: string
  tarifaMarginal: number
  impuestoBruto: number

  // Retenciones (estimadas)
  retencionesEstimadas: number

  // Final
  impuestoNeto: number
  tarifaEfectiva: number

  // Detalle paso a paso
  pasosCalculo: PasoCalculo[]
}

// Resultado del cálculo del Régimen Simple
export interface ResultadoRegimenSimple {
  // Elegibilidad
  esElegible: boolean
  razonesNoElegible: string[]

  // Si es elegible
  ingresosBrutos: number
  ingresosBrutosUVT: number
  rangoAplicado: string
  tarifaConsolidada: number

  // Impuesto base
  impuestoSimpleBase: number

  // Descuentos
  descuentos: {
    pagosElectronicos: {
      baseCalculo: number
      porcentaje: number
      valor: number
    }
    gmf: {
      valorPagado: number
      porcentajeDescontable: number
      valor: number
    }
    totalDescuentos: number
  }

  // Final
  impuestoSimpleNeto: number
  tarifaEfectiva: number

  // Anticipos
  anticipos: {
    exentoAnticipos: boolean
    razonExencion?: string
    anticiposBimestrales: AnticipoRST[]
    totalAnualAnticipos: number
  }

  // Beneficios adicionales
  beneficiosAdicionales: BeneficioRST[]

  // Detalle
  pasosCalculo: PasoCalculo[]
}

// Anticipo bimestral RST
export interface AnticipoRST {
  bimestre: number // 1-6
  meses: string // "Ene-Feb", "Mar-Abr", etc.
  ingresoEstimado: number
  tarifaAnticipo: number
  valorAnticipo: number
  fechaLimitePago: string
}

// Beneficio adicional del RST
export interface BeneficioRST {
  tipo:
    | 'EXENCION_RETENCION'
    | 'EXENCION_ICA'
    | 'SIMPLIFICACION'
    | 'FLUJO_CAJA'
    | 'PARAFISCALES'
  titulo: string
  descripcion: string
  valorEstimado?: number
  aplica: boolean
}

// Paso individual del cálculo
export interface PasoCalculo {
  orden: number
  concepto: string
  operacion: 'suma' | 'resta' | 'igual' | 'multiplicacion' | 'info'
  valor: number
  valorFormateado: string
  detalle?: string
  referenciaNormativa?: string
}

// Resultado de la comparación
export interface ComparacionRegimenes {
  datosEntrada: DatosEntradaSimulador
  fechaSimulacion: Date

  // Resultados individuales
  regimenOrdinario: ResultadoRegimenOrdinario
  regimenSimple: ResultadoRegimenSimple

  // Comparación
  diferencia: number // Positivo = RST ahorra
  porcentajeAhorro: number
  regimenRecomendado: 'ORDINARIO' | 'SIMPLE'
  razonesRecomendacion: string[]

  // Análisis adicional
  oportunidadesAhorro: OportunidadAhorro[]
  advertencias: string[]
  proyeccion3Anos?: Proyeccion[]
}

// Oportunidad de ahorro identificada
export interface OportunidadAhorro {
  tipo:
    | 'DEPENDIENTES'
    | 'COMPRAS_FE'
    | 'AFC'
    | 'PENSION_VOLUNTARIA'
    | 'VIVIENDA'
    | 'MEDICINA'
    | 'PAGOS_ELECTRONICOS'
    | 'GMF'
  titulo: string
  descripcion: string
  ahorroEstimado: number
  comoAprovechar: string
  porcentajeAprovechado: number // 0-100
  limiteMaximo: number
}

// Proyección a futuro
export interface Proyeccion {
  año: number
  ingresoProyectado: number
  impuestoOrdinario: number
  impuestoSimple: number
  regimenConveniente: 'ORDINARIO' | 'SIMPLE'
  ahorro: number
}

// Tabla de impuesto de renta personas naturales (Art. 241 E.T.)
export interface RangoTablaRenta {
  desdeUVT: number
  hastaUVT: number
  tarifaMarginal: number
  impuestoBaseUVT: number
}

// Configuración del simulador
export interface ConfiguracionSimulador {
  año: number
  uvt: number
  mostrarDetalles: boolean
  incluirProyeccion: boolean
  incluirOportunidades: boolean
}

// Estado del formulario del simulador
export interface EstadoFormularioSimulador {
  paso: number
  datosCompletos: boolean
  errores: Record<string, string>
  tocado: Record<string, boolean>
}

// Resumen ejecutivo para mostrar al usuario
export interface ResumenEjecutivo {
  regimenActual: 'ORDINARIO' | 'SIMPLE' | 'NO_DECLARANTE'
  regimenRecomendado: 'ORDINARIO' | 'SIMPLE'
  ahorroAnual: number
  ahorroMensual: number
  acciones: string[]
  proximosPasos: string[]
}
