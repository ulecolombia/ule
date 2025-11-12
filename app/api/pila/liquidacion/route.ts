import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calcularFechaLimite,
  formatearPeriodo,
} from '@/lib/calculadora-pila';
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/pila/liquidacion
 * Crea una nueva liquidación de aportes PILA
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 req/min para operaciones PILA
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit(`pila:${ip}`, RATE_LIMITS.PILA);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
        { status: 429 }
      );
    }

    // Autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Parsear datos
    const data = await request.json();
    const {
      ingresoBase,
      ibc,
      salud,
      pension,
      arl,
      total,
      mes,
      anio,
      nivelRiesgo,
    } = data;

    // Validaciones
    if (
      !ingresoBase ||
      !ibc ||
      !salud ||
      !pension ||
      !arl ||
      !total ||
      !mes ||
      !anio
    ) {
      return NextResponse.json(
        { message: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Calcular fecha límite
    const fechaLimite = calcularFechaLimite(parseInt(mes), parseInt(anio));

    // TRANSACCIÓN: Crear aporte y actualizar configuración atómicamente
    // Esto garantiza que ambas operaciones se completen o ninguna se ejecute
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Verificar duplicado dentro de la transacción (para evitar race conditions)
        const aporteExistente = await tx.aporte.findUnique({
          where: {
            userId_mes_anio: {
              userId: user.id,
              mes: parseInt(mes),
              anio: parseInt(anio),
            },
          },
        });

        if (aporteExistente) {
          throw new Error('Ya existe una liquidación para este período');
        }

        // 2. Crear aporte
        const aporte = await tx.aporte.create({
          data: {
            userId: user.id,
            mes: parseInt(mes),
            anio: parseInt(anio),
            periodo: formatearPeriodo(parseInt(mes), parseInt(anio)),
            ingresoBase,
            ibc,
            salud,
            pension,
            arl,
            total,
            estado: 'PENDIENTE',
            fechaLimite,
          },
        });

        // 3. Actualizar o crear configuración PILA
        await tx.configuracionPila.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            nivelRiesgoARL: nivelRiesgo || 'I',
            porcentajeARL: (arl / ibc) * 100,
          },
          update: {
            nivelRiesgoARL: nivelRiesgo || 'I',
            porcentajeARL: (arl / ibc) * 100,
            ultimaActualizacion: new Date(),
          },
        });

        return aporte;
      },
      {
        maxWait: 5000, // Máximo 5s esperando lock de base de datos
        timeout: 10000, // Timeout total de 10s
        isolationLevel: 'ReadCommitted', // Nivel de aislamiento apropiado
      }
    );

    return NextResponse.json({
      message: 'Liquidación guardada exitosamente',
      aporte: result,
    });
  } catch (error) {
    console.error('Error al guardar liquidación:', error);

    // Manejo específico de errores conocidos
    if (error instanceof Error) {
      if (error.message.includes('Ya existe una liquidación')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { message: 'Error al guardar liquidación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pila/liquidacion
 * Obtiene el histórico de liquidaciones del usuario CON PAGINACIÓN
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 10 req/min para operaciones PILA
    const ip = getClientIp(request);
    const rateLimitResult = await rateLimit(`pila:${ip}`, RATE_LIMITS.PILA);

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

    // Parsear parámetros de paginación
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Query con paginación + count en paralelo para eficiencia
    const [aportes, total] = await Promise.all([
      prisma.aporte.findMany({
        where: { userId: user.id },
        orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        take: limit,
        skip,
      }),
      prisma.aporte.count({
        where: { userId: user.id },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      aportes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: skip + aportes.length < total,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error('Error al obtener aportes:', error);
    return NextResponse.json(
      { message: 'Error al obtener aportes' },
      { status: 500 }
    );
  }
}
