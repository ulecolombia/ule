import { jsPDF } from 'jspdf';
import { formatearMoneda } from './calculadora-pila';

export interface DatosComprobante {
  numeroComprobante: string;
  periodo: string;
  fechaPago: Date;
  usuario: {
    nombre: string;
    documento: string;
    tipoDocumento: string;
  };
  entidades: {
    eps: string;
    pension: string;
    arl: string;
  };
  aportes: {
    ibc: number;
    salud: number;
    pension: number;
    arl: number;
    total: number;
  };
}

/**
 * Genera un PDF del comprobante de pago PILA
 */
export function generarComprobantePDF(datos: DatosComprobante): jsPDF {
  const doc = new jsPDF();

  // Configuración
  const margen = 20;
  let y = margen;
  const lineHeight = 7;

  // Header - Logo y título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 184, 166); // Color Ule
  doc.text('ULE', margen, y);
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Comprobante de Pago PILA', margen, y);
  y += 15;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margen, y, 190, y);
  y += 10;

  // Información del comprobante
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL COMPROBANTE', margen, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Comprobante: ${datos.numeroComprobante}`, margen, y);
  y += lineHeight;
  doc.text(`Período: ${datos.periodo}`, margen, y);
  y += lineHeight;
  doc.text(
    `Fecha de Pago: ${datos.fechaPago.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    margen,
    y
  );
  y += lineHeight + 5;

  // Información del cotizante
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL COTIZANTE', margen, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${datos.usuario.nombre}`, margen, y);
  y += lineHeight;
  doc.text(
    `${datos.usuario.tipoDocumento}: ${datos.usuario.documento}`,
    margen,
    y
  );
  y += lineHeight + 5;

  // Entidades
  doc.setFont('helvetica', 'bold');
  doc.text('ENTIDADES DE SEGURIDAD SOCIAL', margen, y);
  y += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`EPS: ${datos.entidades.eps}`, margen, y);
  y += lineHeight;
  doc.text(`Fondo de Pensión: ${datos.entidades.pension}`, margen, y);
  y += lineHeight;
  doc.text(`ARL: ${datos.entidades.arl}`, margen, y);
  y += lineHeight + 5;

  // Desglose de aportes
  doc.setFont('helvetica', 'bold');
  doc.text('DESGLOSE DE APORTES', margen, y);
  y += lineHeight;

  // Headers de tabla
  doc.setFillColor(240, 240, 240);
  doc.rect(margen, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Concepto', margen + 2, y + 5);
  doc.text('Base', margen + 70, y + 5);
  doc.text('Valor', margen + 120, y + 5);
  y += 8;

  // Datos de tabla
  doc.setFont('helvetica', 'normal');

  // IBC
  doc.text('Ingreso Base de Cotización', margen + 2, y + 5);
  doc.text(formatearMoneda(datos.aportes.ibc), margen + 70, y + 5);
  doc.text('-', margen + 120, y + 5);
  y += 7;

  // Salud
  doc.text('Salud (12.5%)', margen + 2, y + 5);
  doc.text(formatearMoneda(datos.aportes.ibc), margen + 70, y + 5);
  doc.text(formatearMoneda(datos.aportes.salud), margen + 120, y + 5);
  y += 7;

  // Pensión
  doc.text('Pensión (16%)', margen + 2, y + 5);
  doc.text(formatearMoneda(datos.aportes.ibc), margen + 70, y + 5);
  doc.text(formatearMoneda(datos.aportes.pension), margen + 120, y + 5);
  y += 7;

  // ARL
  doc.text('ARL', margen + 2, y + 5);
  doc.text(formatearMoneda(datos.aportes.ibc), margen + 70, y + 5);
  doc.text(formatearMoneda(datos.aportes.arl), margen + 120, y + 5);
  y += 7;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margen, y + 2, 190, y + 2);
  y += 5;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL PAGADO:', margen + 2, y + 5);
  doc.setTextColor(20, 184, 166);
  doc.text(formatearMoneda(datos.aportes.total), margen + 120, y + 5);
  y += 15;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este comprobante ha sido generado electrónicamente por Ule.',
    margen,
    y
  );
  y += 4;
  doc.text(
    'Para cualquier verificación o consulta, conserve este documento.',
    margen,
    y
  );
  y += 10;

  // Código QR simulado (en producción usar biblioteca qrcode)
  doc.setFillColor(0, 0, 0);
  doc.rect(margen, y, 30, 30, 'F');
  doc.setFontSize(6);
  doc.text(`Ref: ${datos.numeroComprobante}`, margen, y + 32);

  return doc;
}

/**
 * Guarda el PDF en el sistema de archivos (servidor)
 */
export async function guardarComprobantePDF(
  _doc: jsPDF,
  aporteId: string
): Promise<string> {
  // En servidor (API route)
  // TODO: En producción, usar _doc.output('arraybuffer') y guardar en S3, etc.
  const filename = `comprobante-${aporteId}-${Date.now()}.pdf`;
  const filepath = `/comprobantes/${filename}`;

  // Por ahora, simular que se guardó

  return filepath;
}
