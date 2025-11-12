import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

/**
 * GET /api/notificaciones
 * Obtiene las notificaciones del usuario CON PAGINACIÓN
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 20, max: 50)
 * - unreadOnly: solo no leídas (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 30 req/min para notificaciones (permite polling)
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit(`notifications:${ip}`, RATE_LIMITS.NOTIFICATIONS);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
        { status: 429 }
      );
    }

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

    // Parsear parámetros
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Construir filtros
    const where = {
      userId: user.id,
      tipo: 'IN_APP' as const,
      ...(unreadOnly && { leido: false }),
    };

    // Query con paginación + count en paralelo
    const [notificaciones, total, unreadCount] = await Promise.all([
      prisma.recordatorio.findMany({
        where,
        include: {
          aporte: {
            select: {
              id: true,
              periodo: true,
            },
          },
        },
        orderBy: {
          fechaEnvio: 'desc',
        },
        take: limit,
        skip,
      }),
      prisma.recordatorio.count({ where }),
      prisma.recordatorio.count({
        where: {
          userId: user.id,
          tipo: 'IN_APP',
          leido: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      notificaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: skip + notificaciones.length < total,
        hasPrevious: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { message: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}
