/**
 * ULE - SERVICIO DE GESTIÓN DE DOCUMENTOS
 * Centraliza la gestión de archivos en la biblioteca unificada
 */

import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// ============================================
// INTERFACES
// ============================================

export interface CrearDocumentoParams {
  userId: string
  tipo: string
  categoria: string
  nombre: string
  nombreAlmacenado: string
  rutaArchivo: string
  tipoMIME: string
  tamanoBytes: number
  periodo?: string
  mes?: number
  anio?: number
  etiquetas?: string[]
  descripcion?: string
  aporteId?: string
  facturaId?: string
}

export interface FiltrosDocumentos {
  tipo?: string
  categoria?: string
  categorias?: string[] // Múltiples categorías
  anio?: number
  mes?: number
  etiquetas?: string[]
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Crea un registro de documento en la base de datos
 */
export async function crearDocumento(params: CrearDocumentoParams) {
  return await prisma.documento.create({
    data: {
      userId: params.userId,
      tipo: params.tipo as any,
      categoria: params.categoria as any,
      nombre: params.nombre,
      nombreAlmacenado: params.nombreAlmacenado,
      rutaArchivo: params.rutaArchivo,
      tipoMIME: params.tipoMIME,
      tamanoBytes: params.tamanoBytes,
      periodo: params.periodo,
      mes: params.mes,
      anio: params.anio,
      etiquetas: params.etiquetas || [],
      descripcion: params.descripcion,
      aporteId: params.aporteId,
      facturaId: params.facturaId,
    },
  })
}

/**
 * Guarda automáticamente un comprobante PILA tras el pago
 * @param userId ID del usuario
 * @param aporteId ID del aporte
 * @param pdfBuffer Buffer del PDF generado
 * @param mes Mes del aporte (1-12)
 * @param anio Año del aporte
 * @returns Documento creado
 */
export async function guardarComprobantePILA(
  userId: string,
  aporteId: string,
  pdfBuffer: Buffer,
  mes: number,
  anio: number
) {
  // Crear directorio si no existe
  const directorioBase = path.join(
    process.cwd(),
    'public',
    'documentos',
    userId,
    'pila'
  )
  await fs.mkdir(directorioBase, { recursive: true })

  // Generar nombre de archivo único
  const nombreArchivo = `comprobante-pila-${anio}-${mes.toString().padStart(2, '0')}-${Date.now()}.pdf`
  const rutaCompleta = path.join(directorioBase, nombreArchivo)
  const rutaPublica = `/documentos/${userId}/pila/${nombreArchivo}`

  // Guardar archivo físico
  await fs.writeFile(rutaCompleta, pdfBuffer)

  // Crear periodo en formato "YYYY-MM"
  const periodo = `${anio}-${mes.toString().padStart(2, '0')}`

  // Crear registro en base de datos
  const documento = await crearDocumento({
    userId,
    tipo: 'COMPROBANTE_PILA',
    categoria: 'SEGURIDAD_SOCIAL',
    nombre: `Comprobante PILA ${periodo}`,
    nombreAlmacenado: nombreArchivo,
    rutaArchivo: rutaPublica,
    tipoMIME: 'application/pdf',
    tamanoBytes: pdfBuffer.length,
    periodo,
    mes,
    anio,
    etiquetas: ['pila', 'seguridad-social', 'comprobante'],
    aporteId,
  })

  console.log(`✅ [Documentos] Comprobante PILA guardado: ${documento.id}`)

  return documento
}

/**
 * Guarda automáticamente una factura emitida
 * @param userId ID del usuario
 * @param facturaId ID de la factura
 * @param pdfBuffer Buffer del PDF generado
 * @param numeroFactura Número de la factura
 * @param fechaEmision Fecha de emisión de la factura
 * @returns Documento creado
 */
export async function guardarFacturaEmitida(
  userId: string,
  facturaId: string,
  pdfBuffer: Buffer,
  numeroFactura: string,
  fechaEmision: Date
) {
  // Crear directorio si no existe
  const directorioBase = path.join(
    process.cwd(),
    'public',
    'documentos',
    userId,
    'facturas'
  )
  await fs.mkdir(directorioBase, { recursive: true })

  // Generar nombre de archivo único
  const nombreArchivo = `factura-${numeroFactura}-${Date.now()}.pdf`
  const rutaCompleta = path.join(directorioBase, nombreArchivo)
  const rutaPublica = `/documentos/${userId}/facturas/${nombreArchivo}`

  // Guardar archivo físico
  await fs.writeFile(rutaCompleta, pdfBuffer)

  // Extraer mes y año
  const mes = fechaEmision.getMonth() + 1
  const anio = fechaEmision.getFullYear()
  const periodo = `${anio}-${mes.toString().padStart(2, '0')}`

  // Crear registro en base de datos
  const documento = await crearDocumento({
    userId,
    tipo: 'FACTURA_EMITIDA',
    categoria: 'FACTURACION',
    nombre: `Factura ${numeroFactura}`,
    nombreAlmacenado: nombreArchivo,
    rutaArchivo: rutaPublica,
    tipoMIME: 'application/pdf',
    tamanoBytes: pdfBuffer.length,
    periodo,
    mes,
    anio,
    etiquetas: ['factura', 'emitida', 'ingresos'],
    facturaId,
  })

  console.log(`✅ [Documentos] Factura emitida guardada: ${documento.id}`)

  return documento
}

/**
 * Elimina un documento (archivo físico + registro DB)
 * @param documentoId ID del documento a eliminar
 */
export async function eliminarDocumento(documentoId: string) {
  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
  })

  if (!documento) {
    throw new Error('Documento no encontrado')
  }

  // Eliminar archivo físico
  const rutaCompleta = path.join(process.cwd(), 'public', documento.rutaArchivo)
  try {
    await fs.unlink(rutaCompleta)
    console.log(`🗑️ [Documentos] Archivo eliminado: ${documento.rutaArchivo}`)
  } catch (error) {
    console.error('⚠️ [Documentos] Error al eliminar archivo físico:', error)
    // Continuar con la eliminación del registro aunque falle el archivo
  }

  // Eliminar registro de base de datos (hard delete)
  await prisma.documento.delete({
    where: { id: documentoId },
  })

  console.log(`✅ [Documentos] Documento eliminado: ${documentoId}`)
}

/**
 * Obtiene documentos con filtros opcionales
 * @param userId ID del usuario
 * @param filtros Filtros opcionales (tipo, categoría, año, mes, etiquetas)
 * @returns Lista de documentos con relaciones
 */
export async function obtenerDocumentos(
  userId: string,
  filtros?: FiltrosDocumentos
) {
  const where: any = { userId, deletedAt: null }

  if (filtros?.tipo) where.tipo = filtros.tipo

  // Manejar múltiples categorías
  if (filtros?.categorias && filtros.categorias.length > 0) {
    where.categoria = { in: filtros.categorias }
  } else if (filtros?.categoria) {
    where.categoria = filtros.categoria
  }

  if (filtros?.anio) where.anio = filtros.anio
  if (filtros?.mes) where.mes = filtros.mes
  if (filtros?.etiquetas && filtros.etiquetas.length > 0) {
    where.etiquetas = { hasSome: filtros.etiquetas }
  }

  return await prisma.documento.findMany({
    where,
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { createdAt: 'desc' }],
  })
}

/**
 * Obtiene estadísticas de documentos del usuario
 * @param userId ID del usuario
 * @param anio Año opcional para filtrar estadísticas
 * @returns Estadísticas agregadas
 */
export async function obtenerEstadisticas(userId: string, anio?: number) {
  const where: any = { userId, deletedAt: null }
  if (anio) where.anio = anio

  const [total, porTipo, porCategoria, tamanioTotal] = await Promise.all([
    prisma.documento.count({ where }),
    prisma.documento.groupBy({
      by: ['tipo'],
      where,
      _count: true,
    }),
    prisma.documento.groupBy({
      by: ['categoria'],
      where,
      _count: true,
    }),
    prisma.documento.aggregate({
      where,
      _sum: { tamanoBytes: true },
    }),
  ])

  return {
    total,
    porTipo,
    porCategoria,
    tamanioTotal: tamanioTotal._sum.tamanoBytes || 0,
  }
}

/**
 * Busca documentos por texto (búsqueda en nombre, descripción y etiquetas)
 * @param userId ID del usuario
 * @param query Texto de búsqueda
 * @returns Documentos que coinciden con la búsqueda
 */
export async function buscarDocumentos(userId: string, query: string) {
  const queryLower = query.toLowerCase()

  return await prisma.documento.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { nombre: { contains: queryLower, mode: 'insensitive' } },
        { descripcion: { contains: queryLower, mode: 'insensitive' } },
        { etiquetas: { has: queryLower } },
      ],
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

/**
 * Actualiza metadata de un documento
 * @param documentoId ID del documento
 * @param data Datos a actualizar (nombre, descripción, etiquetas)
 */
export async function actualizarDocumento(
  documentoId: string,
  data: {
    nombre?: string
    descripcion?: string
    etiquetas?: string[]
  }
) {
  return await prisma.documento.update({
    where: { id: documentoId },
    data,
  })
}
