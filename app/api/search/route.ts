import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Páginas/rutas disponibles para búsqueda
 */
const PAGINAS_APP = [
  { titulo: 'Dashboard', descripcion: 'Tu centro de control financiero', ruta: '/dashboard', icono: 'dashboard' },
  { titulo: 'Perfil', descripcion: 'Gestionar tu información personal', ruta: '/perfil', icono: 'person' },
  { titulo: 'Liquidar PILA', descripcion: 'Calcular aportes a seguridad social', ruta: '/pila', icono: 'calculate' },
  { titulo: 'Mis Aportes PILA', descripcion: 'Ver historial de aportes', ruta: '/pila/historial', icono: 'history' },
  { titulo: 'Facturación', descripcion: 'Gestionar facturas', ruta: '/facturacion', icono: 'receipt_long' },
  { titulo: 'Nueva Factura', descripcion: 'Crear una nueva factura', ruta: '/facturacion/nueva', icono: 'add' },
  { titulo: 'Clientes', descripcion: 'Gestionar clientes', ruta: '/facturacion/clientes', icono: 'group' },
  { titulo: 'Asesoría IA', descripcion: 'Consultar con asistente tributario', ruta: '/asesoria', icono: 'psychology' },
  { titulo: 'Biblioteca', descripcion: 'Documentos y archivos', ruta: '/biblioteca', icono: 'folder_open' },
  { titulo: 'Notificaciones', descripcion: 'Ver todas las notificaciones', ruta: '/notificaciones', icono: 'notifications' },
]

/**
 * GET /api/search?q=término
 * Búsqueda global multi-tabla
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() || ''

    if (query.length < 2) {
      return NextResponse.json({
        resultados: [],
        mensaje: 'Ingresa al menos 2 caracteres para buscar',
      })
    }

    // Sanitizar query
    const queryLower = query.toLowerCase()

    // Búsquedas en paralelo
    const [facturas, clientes, aportes, paginas] = await Promise.all([
      // Búsqueda en facturas
      prisma.factura.findMany({
        where: {
          userId: user.id,
          OR: [
            { numeroFactura: { contains: query, mode: 'insensitive' } },
            { clienteNombre: { contains: query, mode: 'insensitive' } },
            { clienteDocumento: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          numeroFactura: true,
          clienteNombre: true,
          total: true,
          fecha: true,
          estado: true,
        },
      }),

      // Búsqueda en clientes
      prisma.cliente.findMany({
        where: {
          userId: user.id,
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { numeroDocumento: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          numeroDocumento: true,
          email: true,
          tipoDocumento: true,
        },
      }),

      // Búsqueda en aportes PILA
      prisma.aporte.findMany({
        where: {
          userId: user.id,
          OR: [
            { periodo: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          periodo: true,
          total: true,
          estado: true,
          fechaLimite: true,
        },
      }),

      // Búsqueda en páginas
      Promise.resolve(
        PAGINAS_APP.filter(
          (pagina) =>
            pagina.titulo.toLowerCase().includes(queryLower) ||
            pagina.descripcion.toLowerCase().includes(queryLower)
        )
      ),
    ])

    // Formatear resultados
    const resultados = {
      facturas: facturas.map((f) => ({
        id: f.id,
        tipo: 'factura' as const,
        titulo: `Factura ${f.numeroFactura}`,
        descripcion: `${f.clienteNombre} - $${Number(f.total).toLocaleString('es-CO')}`,
        ruta: `/facturacion/${f.id}`,
        icono: 'receipt_long',
        metadata: {
          fecha: f.fecha.toISOString(),
          estado: f.estado,
        },
      })),

      clientes: clientes.map((c) => ({
        id: c.id,
        tipo: 'cliente' as const,
        titulo: c.nombre,
        descripcion: `${c.tipoDocumento} ${c.numeroDocumento}`,
        ruta: `/facturacion/clientes/${c.id}`,
        icono: 'person',
        metadata: {
          email: c.email,
        },
      })),

      aportes: aportes.map((a) => ({
        id: a.id,
        tipo: 'pila' as const,
        titulo: `PILA ${a.periodo}`,
        descripcion: `$${Number(a.total).toLocaleString('es-CO')} - ${a.estado}`,
        ruta: `/pila/historial/${a.id}`,
        icono: 'account_balance',
        metadata: {
          fechaLimite: a.fechaLimite.toISOString(),
          estado: a.estado,
        },
      })),

      paginas: paginas.map((p) => ({
        id: p.ruta,
        tipo: 'pagina' as const,
        titulo: p.titulo,
        descripcion: p.descripcion,
        ruta: p.ruta,
        icono: p.icono,
        metadata: {},
      })),
    }

    const totalResultados =
      resultados.facturas.length +
      resultados.clientes.length +
      resultados.aportes.length +
      resultados.paginas.length

    return NextResponse.json({
      resultados,
      totalResultados,
      query,
    })
  } catch (error) {
    logger.error(
      'Error en búsqueda global',
      error instanceof Error ? error : new Error(String(error))
    )

    return NextResponse.json(
      { error: 'Error al realizar la búsqueda' },
      { status: 500 }
    )
  }
}
