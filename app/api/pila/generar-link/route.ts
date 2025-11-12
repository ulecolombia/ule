import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generarLinkPago } from '@/lib/pago-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const { aporteId } = await request.json();

    if (!aporteId) {
      return NextResponse.json(
        { message: 'ID de aporte requerido' },
        { status: 400 }
      );
    }

    // Verificar que el aporte existe y pertenece al usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const aporte = await prisma.aporte.findFirst({
      where: {
        id: aporteId,
        userId: user?.id,
      },
    });

    if (!aporte) {
      return NextResponse.json(
        { message: 'Aporte no encontrado' },
        { status: 404 }
      );
    }

    if (aporte.estado === 'PAGADO') {
      return NextResponse.json(
        { message: 'Este aporte ya está pagado' },
        { status: 400 }
      );
    }

    // Generar link de pago
    const linkPago = await generarLinkPago(aporteId);

    return NextResponse.json(linkPago);
  } catch (error) {
    console.error('Error al generar link de pago:', error);
    return NextResponse.json(
      { message: 'Error al generar link de pago' },
      { status: 500 }
    );
  }
}
