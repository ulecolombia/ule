import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/pila/comprobantes
 * Obtiene comprobantes con paginación y filtros MEJORADO
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 50, max: 100)
 * - anio: filtrar por año (opcional)
 * - estado: filtrar por estado (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener parámetros de query con validación
    const { searchParams } = new URL(request.url);
    const anio = searchParams.get('anio');
    const estado = searchParams.get('estado');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Construir filtros de manera type-safe
    type EstadoAporte = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
    const estadosValidos = ['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO'];

    const where: {
      userId: string;
      anio?: number;
      estado?: EstadoAporte;
    } = { userId: user.id };

    if (anio && anio !== '0') {
      const anioNum = parseInt(anio);
      if (!isNaN(anioNum)) {
        where.anio = anioNum;
      }
    }

    if (estado && estado !== 'TODOS' && estadosValidos.includes(estado)) {
      where.estado = estado as EstadoAporte;
    }

    // Obtener comprobantes con paginación en paralelo
    const [comprobantes, total] = await Promise.all([
      prisma.aporte.findMany({
        where,
        orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.aporte.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comprobantes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: skip + comprobantes.length < total,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    return NextResponse.json(
      { message: 'Error al obtener comprobantes' },
      { status: 500 }
    );
  }
}
