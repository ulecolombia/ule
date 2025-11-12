/**
 * Servicio Mock de Pago PILA
 * Simula integración con SOI/Mi Planilla
 * En producción, reemplazar con APIs reales
 */

export interface LinkPagoResponse {
  url: string;
  referencia: string;
  expiraEn: Date;
  aporteId: string;
}

export interface EstadoPagoResponse {
  aporteId: string;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'APROBADO' | 'RECHAZADO';
  numeroComprobante?: string;
  fechaPago?: Date;
  mensaje?: string;
}

/**
 * Genera un link de pago simulado
 */
export async function generarLinkPago(
  aporteId: string
): Promise<LinkPagoResponse> {
  // Simular delay de API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generar referencia única
  const referencia = `PILA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  // URL ficticia de pago (en producción sería la URL real de SOI/Mi Planilla)
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mock-payment?ref=${referencia}&aporte=${aporteId}`;

  // Expira en 24 horas
  const expiraEn = new Date();
  expiraEn.setHours(expiraEn.getHours() + 24);

  return {
    url,
    referencia,
    expiraEn,
    aporteId,
  };
}

/**
 * Verifica el estado de un pago
 */
export async function verificarEstadoPago(
  aporteId: string
): Promise<EstadoPagoResponse> {
  // Simular delay de API
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simular diferentes estados (80% aprobado para testing)
  const random = Math.random();

  if (random > 0.8) {
    return {
      aporteId,
      estado: 'RECHAZADO',
      mensaje: 'Pago rechazado por entidad bancaria',
    };
  }

  if (random > 0.6) {
    return {
      aporteId,
      estado: 'PROCESANDO',
      mensaje: 'Pago en proceso de validación',
    };
  }

  // Pago aprobado (caso más común)
  return {
    aporteId,
    estado: 'APROBADO',
    numeroComprobante: `COMP-${Date.now()}`,
    fechaPago: new Date(),
    mensaje: 'Pago procesado exitosamente',
  };
}

/**
 * Simula el procesamiento completo de un pago
 * (usado por el webhook mock)
 */
export async function procesarPagoMock(
  aporteId: string,
  _referencia: string
): Promise<EstadoPagoResponse> {
  // Simular procesamiento
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    aporteId,
    estado: 'APROBADO',
    numeroComprobante: `COMP-${Date.now()}`,
    fechaPago: new Date(),
    mensaje: 'Pago procesado exitosamente',
  };
}
