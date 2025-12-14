/**
 * ULE - PROFILE API
 * Endpoints para obtener y actualizar perfil del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  TipoDocumento,
  TipoContrato,
  EstadoCivil,
  RegimenTributario,
} from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'

// Schema completo para onboarding (POST)
const updateProfileSchema = z.object({
  // Paso 1 - Campos de nombre separados
  primerNombre: z.string().min(2, 'Mínimo 2 caracteres'),
  segundoNombre: z.string().nullable().optional(),
  primerApellido: z.string().min(2, 'Mínimo 2 caracteres'),
  segundoApellido: z.string().min(2, 'Mínimo 2 caracteres'),
  tipoDocumento: z.nativeEnum(TipoDocumento),
  numeroDocumento: z.string(),
  telefono: z.string(),
  direccion: z.string(),
  ciudad: z.string(),
  departamento: z.string(),

  // Paso 2
  tipoContrato: z.nativeEnum(TipoContrato),
  profesion: z.string(),
  actividadEconomica: z.string(),
  numeroContratos: z.number(),
  ingresoMensualPromedio: z.number(),

  // Paso 3
  entidadSalud: z.string(),
  fechaAfiliacionSalud: z.string().optional(),
  entidadPension: z.string(),
  fechaAfiliacionPension: z.string().optional(),
  arl: z.string().optional(),
  nivelRiesgoARL: z.number().optional(),
  fechaAfiliacionARL: z.string().optional(),

  // Paso 4
  estadoCivil: z.nativeEnum(EstadoCivil),
  personasACargo: z.number(),
  suscribirNewsletter: z.boolean().optional(),
})

// Schemas por sección para edición (PUT)
const datosPersonalesSchema = z.object({
  primerNombre: z.string().min(2, 'Mínimo 2 caracteres'),
  segundoNombre: z.string().nullable().optional(),
  primerApellido: z.string().min(2, 'Mínimo 2 caracteres'),
  segundoApellido: z.string().min(2, 'Mínimo 2 caracteres'),
  telefono: z.string().length(10, 'Debe tener 10 dígitos'),
  direccion: z.string().min(5, 'Dirección muy corta'),
  departamento: z.string().min(1, 'Selecciona un departamento'),
  ciudad: z.string().min(1, 'Selecciona una ciudad'),
})

const infoLaboralSchema = z.object({
  tipoContrato: z.nativeEnum(TipoContrato),
  profesion: z.string().min(3, 'Mínimo 3 caracteres'),
  actividadEconomica: z.string().regex(/^\d{4}$/, 'Código CIIU inválido'),
  numeroContratos: z.number().int().min(1).max(50),
  ingresoMensualPromedio: z.number().min(1, 'Debe ser mayor a 0'),
})

const seguridadSocialSchema = z.object({
  entidadSalud: z.string().min(1, 'Selecciona una EPS'),
  fechaAfiliacionSalud: z.string().optional(),
  entidadPension: z.string().min(1, 'Selecciona un fondo de pensión'),
  fechaAfiliacionPension: z.string().optional(),
  arl: z.string().optional(),
  nivelRiesgoARL: z.number().int().min(1).max(5).optional(),
  fechaAfiliacionARL: z.string().optional(),
})

const infoAdicionalSchema = z.object({
  estadoCivil: z.nativeEnum(EstadoCivil),
  personasACargo: z.number().int().min(0),
  suscribirNewsletter: z.boolean().optional(),
})

const infoTributariaSchema = z.object({
  regimenTributario: z.nativeEnum(RegimenTributario, {
    required_error: 'Debes seleccionar tu régimen tributario',
  }),
  responsableIVA: z.boolean(),
  razonSocial: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .optional()
    .or(z.literal('')),
  emailFacturacion: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
})

// GET - Obtener perfil del usuario
export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await auth()

    if (!session?.user?.email) {
      secureLogger.warn('Intento de acceso sin autenticación', {
        url: req.url,
      })
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        primerNombre: true,
        segundoNombre: true,
        primerApellido: true,
        segundoApellido: true,
        tipoDocumento: true,
        numeroDocumento: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        departamento: true,
        tipoContrato: true,
        profesion: true,
        actividadEconomica: true,
        numeroContratos: true,
        ingresoMensualPromedio: true,
        entidadSalud: true,
        fechaAfiliacionSalud: true,
        entidadPension: true,
        fechaAfiliacionPension: true,
        arl: true,
        nivelRiesgoARL: true,
        fechaAfiliacionARL: true,
        estadoCivil: true,
        personasACargo: true,
        suscribirNewsletter: true,
        // Información tributaria
        nit: true,
        razonSocial: true,
        regimenTributario: true,
        responsableIVA: true,
        autorretenedor: true,
        granContribuyente: true,
        resolucionDIAN: true,
        prefijoFactura: true,
        rangoFacturacionDesde: true,
        rangoFacturacionHasta: true,
        fechaResolucion: true,
        consecutivoActual: true,
        logoEmpresaUrl: true,
        colorPrimario: true,
        nombreBanco: true,
        tipoCuenta: true,
        numeroCuenta: true,
        emailFacturacion: true,
        perfilCompleto: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    secureLogger.info('Perfil consultado', {
      userId: user.id,
      duration: `${Date.now() - startTime}ms`,
    })

    return NextResponse.json({ user })
  } catch (error) {
    secureLogger.error('Error obteniendo perfil', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// POST - Crear perfil completo (onboarding)
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[Profile API] Datos recibidos:', JSON.stringify(body, null, 2))

    const validatedData = updateProfileSchema.parse(body)
    console.log('[Profile API] Datos validados OK')

    // Sanitizar inputs sensibles
    const sanitizedData = {
      ...validatedData,
      primerNombre: validatedData.primerNombre.replace(/[<>]/g, ''),
      segundoNombre: validatedData.segundoNombre?.replace(/[<>]/g, '') || null,
      primerApellido: validatedData.primerApellido.replace(/[<>]/g, ''),
      segundoApellido: validatedData.segundoApellido.replace(/[<>]/g, ''),
      numeroDocumento: validatedData.numeroDocumento.replace(/\D/g, ''),
      telefono: validatedData.telefono.replace(/[^\d+]/g, ''),
      direccion: validatedData.direccion.replace(/[<>]/g, ''),
      ciudad: validatedData.ciudad.replace(/[<>]/g, ''),
      departamento: validatedData.departamento.replace(/[<>]/g, ''),
      profesion: validatedData.profesion.replace(/[<>]/g, ''),
    }

    // Generar nombre completo para compatibilidad con NextAuth
    const nombreCompleto =
      [
        sanitizedData.primerNombre,
        sanitizedData.segundoNombre,
        sanitizedData.primerApellido,
        sanitizedData.segundoApellido,
      ]
        .filter(Boolean)
        .join(' ') || 'Usuario' // Fallback por si está vacío

    // Convertir nivel de riesgo de string a number si existe
    const nivelRiesgo = validatedData.nivelRiesgoARL
      ? parseInt(validatedData.nivelRiesgoARL.toString())
      : null

    // Actualizar usuario en la base de datos (encriptación automática de campos sensibles)
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        name: nombreCompleto, // Para compatibilidad con NextAuth
        primerNombre: sanitizedData.primerNombre,
        segundoNombre: sanitizedData.segundoNombre,
        primerApellido: sanitizedData.primerApellido,
        segundoApellido: sanitizedData.segundoApellido,
        tipoDocumento: sanitizedData.tipoDocumento,
        numeroDocumento: sanitizedData.numeroDocumento, // Se encripta automáticamente
        telefono: sanitizedData.telefono, // Se encripta automáticamente
        direccion: sanitizedData.direccion,
        ciudad: sanitizedData.ciudad,
        departamento: sanitizedData.departamento,
        tipoContrato: sanitizedData.tipoContrato,
        profesion: sanitizedData.profesion,
        actividadEconomica: sanitizedData.actividadEconomica,
        numeroContratos: sanitizedData.numeroContratos,
        ingresoMensualPromedio: sanitizedData.ingresoMensualPromedio,
        entidadSalud: sanitizedData.entidadSalud,
        fechaAfiliacionSalud: sanitizedData.fechaAfiliacionSalud
          ? new Date(sanitizedData.fechaAfiliacionSalud)
          : null,
        entidadPension: sanitizedData.entidadPension,
        fechaAfiliacionPension: sanitizedData.fechaAfiliacionPension
          ? new Date(sanitizedData.fechaAfiliacionPension)
          : null,
        arl: sanitizedData.arl || null,
        nivelRiesgoARL: nivelRiesgo,
        fechaAfiliacionARL: sanitizedData.fechaAfiliacionARL
          ? new Date(sanitizedData.fechaAfiliacionARL)
          : null,
        estadoCivil: sanitizedData.estadoCivil,
        personasACargo: sanitizedData.personasACargo,
        suscribirNewsletter: sanitizedData.suscribirNewsletter ?? false,
        perfilCompleto: true,
        updatedAt: new Date(),
      },
    })

    // Log de auditoría
    secureLogger.audit('Perfil completo creado', {
      userId: updatedUser.id,
      duration: `${Date.now() - startTime}ms`,
    })

    return NextResponse.json({
      success: true,
      message: 'Perfil completado exitosamente',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        primerNombre: updatedUser.primerNombre,
        primerApellido: updatedUser.primerApellido,
        perfilCompleto: updatedUser.perfilCompleto,
      },
    })
  } catch (error) {
    secureLogger.error('Error creando perfil completo', error)
    console.error('[Profile API] Error completo:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    // Devolver más detalles del error para debugging
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      {
        error: 'Error al guardar perfil',
        details: errorMessage,
        stack:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar sección específica del perfil
export async function PUT(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { seccion, data } = body

    // Validar según sección
    let validatedData: any
    switch (seccion) {
      case 'personal':
        validatedData = datosPersonalesSchema.parse(data)
        break
      case 'laboral':
        validatedData = infoLaboralSchema.parse(data)
        break
      case 'seguridad_social':
        validatedData = seguridadSocialSchema.parse(data)
        // Convertir fechas
        if (validatedData.fechaAfiliacionSalud) {
          validatedData.fechaAfiliacionSalud = new Date(
            validatedData.fechaAfiliacionSalud
          )
        }
        if (validatedData.fechaAfiliacionPension) {
          validatedData.fechaAfiliacionPension = new Date(
            validatedData.fechaAfiliacionPension
          )
        }
        if (validatedData.fechaAfiliacionARL) {
          validatedData.fechaAfiliacionARL = new Date(
            validatedData.fechaAfiliacionARL
          )
        }
        break
      case 'adicional':
        validatedData = infoAdicionalSchema.parse(data)
        break
      case 'tributaria':
        validatedData = infoTributariaSchema.parse(data)
        break
      default:
        throw new Error('Sección inválida')
    }

    // Actualizar en DB
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        primerNombre: true,
        segundoNombre: true,
        primerApellido: true,
        segundoApellido: true,
        tipoDocumento: true,
        numeroDocumento: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        departamento: true,
        tipoContrato: true,
        profesion: true,
        actividadEconomica: true,
        numeroContratos: true,
        ingresoMensualPromedio: true,
        entidadSalud: true,
        fechaAfiliacionSalud: true,
        entidadPension: true,
        fechaAfiliacionPension: true,
        arl: true,
        nivelRiesgoARL: true,
        fechaAfiliacionARL: true,
        estadoCivil: true,
        personasACargo: true,
        suscribirNewsletter: true,
        // Información tributaria
        nit: true,
        razonSocial: true,
        regimenTributario: true,
        responsableIVA: true,
        autorretenedor: true,
        granContribuyente: true,
        resolucionDIAN: true,
        prefijoFactura: true,
        rangoFacturacionDesde: true,
        rangoFacturacionHasta: true,
        fechaResolucion: true,
        consecutivoActual: true,
        logoEmpresaUrl: true,
        colorPrimario: true,
        nombreBanco: true,
        tipoCuenta: true,
        numeroCuenta: true,
        emailFacturacion: true,
        perfilCompleto: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log de auditoría
    secureLogger.audit('Sección de perfil actualizada', {
      userId: updatedUser.id,
      seccion,
      duration: `${Date.now() - startTime}ms`,
    })

    return NextResponse.json({
      success: true,
      message: 'Información actualizada correctamente',
      user: updatedUser,
    })
  } catch (error: any) {
    const errorData = error.seccion ? { seccion: error.seccion } : {}
    secureLogger.error('Error actualizando sección de perfil', error, errorData)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
