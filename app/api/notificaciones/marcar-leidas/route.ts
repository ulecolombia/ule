import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 req/min para notificaciones
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

    await prisma.recordatorio.updateMany({
      where: {
        userId: user.id,
        tipo: 'IN_APP',
        leido: false,
      },
      data: {
        leido: true,
        enviado: true,
        fechaEnviado: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    return NextResponse.json(
      { message: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}
