/**
 * ULE - API: Actualizar Entidades de Seguridad Social
 * Endpoint para guardar las entidades seleccionadas durante el registro inicial
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      eps,
      fondoPension,
      arl,
      tipoContrato,
      actividadEconomica,
      nivelRiesgo,
    } = body;

    // Validar que se proporcionen los campos requeridos
    if (!eps || !fondoPension || !arl) {
      return NextResponse.json(
        { message: 'Faltan campos requeridos: eps, fondoPension, arl' },
        { status: 400 }
      );
    }

    // Actualizar el perfil del usuario con las entidades
    const fechaActual = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        entidadSalud: eps,
        entidadPension: fondoPension,
        arl: arl,
        fechaAfiliacionSalud: fechaActual,
        fechaAfiliacionPension: fechaActual,
        fechaAfiliacionARL: fechaActual,
        nivelRiesgoARL: nivelRiesgo || 1,
        tipoContrato: tipoContrato || 'INDEPENDIENTE',
        actividadEconomica: actividadEconomica || '',
      },
    });

    // Crear o actualizar configuración PILA si no existe
    const configuracionExistente = await prisma.configuracionPila.findUnique({
      where: { userId: user.id },
    });

    if (!configuracionExistente) {
      await prisma.configuracionPila.create({
        data: {
          userId: user.id,
          recordatoriosActivos: true,
          diasAnticipacionRecordatorio: 5,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Entidades actualizadas correctamente',
      data: {
        eps,
        fondoPension,
        arl,
        nivelRiesgo,
      },
    });
  } catch (error) {
    console.error('Error al actualizar entidades:', error);
    return NextResponse.json(
      { message: 'Error al actualizar las entidades' },
      { status: 500 }
    );
  }
}
