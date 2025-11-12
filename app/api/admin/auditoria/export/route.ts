import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * GET - Exportar logs a Excel
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // ✅ MEDIO #18: Type safety con Prisma types
    const searchParams = req.nextUrl.searchParams
    const where: Prisma.LogAuditoriaWhereInput = {}

    const userId = searchParams.get('userId')
    const accion = searchParams.get('accion')
    const categoria = searchParams.get('categoria')
    const nivelRiesgo = searchParams.get('nivelRiesgo')

    if (userId) where.userId = userId
    if (accion) where.accion = accion as any // AccionAuditoria enum
    if (categoria) where.categoria = categoria as any // CategoriaAuditoria enum
    if (nivelRiesgo) where.nivelRiesgo = nivelRiesgo as any // NivelRiesgo enum

    if (searchParams.get('fechaInicio') || searchParams.get('fechaFin')) {
      where.timestamp = {}
      if (searchParams.get('fechaInicio')) {
        where.timestamp.gte = new Date(searchParams.get('fechaInicio')!)
      }
      if (searchParams.get('fechaFin')) {
        where.timestamp.lte = new Date(searchParams.get('fechaFin')!)
      }
    }

    // Obtener logs (máximo 10,000 para performance)
    const logs = await db.logAuditoria.findMany({
      where,
      take: 10000,
      orderBy: { timestamp: 'desc' },
    })

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Logs de Auditoría')

    // Configurar columnas
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Fecha/Hora', key: 'timestamp', width: 20 },
      { header: 'Usuario', key: 'userEmail', width: 30 },
      { header: 'Nombre', key: 'userName', width: 25 },
      { header: 'Acción', key: 'accion', width: 25 },
      { header: 'Recurso', key: 'recurso', width: 20 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Nivel Riesgo', key: 'nivelRiesgo', width: 15 },
      { header: 'Exitoso', key: 'exitoso', width: 10 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'Ubicación', key: 'ubicacion', width: 25 },
      { header: 'Dispositivo', key: 'dispositivo', width: 15 },
      { header: 'Navegador', key: 'navegador', width: 15 },
      { header: 'Código Error', key: 'codigoError', width: 15 },
      { header: 'Mensaje Error', key: 'mensajeError', width: 40 },
    ]

    // Estilo del header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF14B8A6' },
    }

    // Agregar datos
    logs.forEach((log) => {
      worksheet.addRow({
        id: log.id,
        timestamp: format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        userEmail: log.userEmail || 'Sistema',
        userName: log.userName || 'N/A',
        accion: log.accion,
        recurso: log.recurso || '',
        categoria: log.categoria,
        nivelRiesgo: log.nivelRiesgo,
        exitoso: log.exitoso ? 'Sí' : 'No',
        ip: log.ip,
        ubicacion: log.ipGeo ? `${(log.ipGeo as any).city}, ${(log.ipGeo as any).country}` : '',
        dispositivo: log.dispositivo || '',
        navegador: log.navegador || '',
        codigoError: log.codigoError || '',
        mensajeError: log.mensajeError || '',
      })
    })

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Retornar archivo
    const filename = `logs-auditoria-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exportando logs:', error)
    return NextResponse.json(
      { error: 'Error al exportar logs' },
      { status: 500 }
    )
  }
}
