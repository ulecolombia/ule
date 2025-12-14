/**
 * API ENDPOINT: LOGIN SEGURO CON 2FA
 *
 * Implementa autenticación segura con:
 * - Rate limiting por email e IP
 * - Verificación de contraseña con bcrypt
 * - Soporte para 2FA (TOTP)
 * - Bloqueo temporal de cuenta por intentos fallidos
 * - Tracking de intentos de login
 * - Registro de eventos de seguridad
 *
 * POST /api/auth/secure-login
 * Body: { email, password, twoFactorCode? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  checkLoginRateLimit,
  formatRateLimitError,
  resetRateLimit,
} from '@/lib/security/rate-limit'
import { verifyPassword } from '@/lib/security/encryption'
import { verifyTwoFactorToken } from '@/lib/security/two-factor'
import { decrypt } from '@/lib/security/encryption'
import { createSession } from '@/lib/security/session-manager'
import { generateSecureToken } from '@/lib/security/encryption'
import { logger } from '@/lib/logger'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  twoFactorCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Parsear body
    const body = await req.json()
    const { email, password, twoFactorCode } = loginSchema.parse(body)

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0'

    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Rate limiting por email:IP
    const identifier = `${email.toLowerCase()}:${ip}`
    const rateLimit = await checkLoginRateLimit(identifier)

    if (!rateLimit.success) {
      const errorMessage = formatRateLimitError(rateLimit, 'login')

      logger.warn('Login bloqueado por rate limit', {
        context: 'auth.secure-login',
        email: email.toLowerCase(),
        ip,
      })

      return NextResponse.json(
        {
          error: errorMessage,
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Registrar intento fallido si no existe usuario
    if (!user) {
      await prisma.intentoLogin.create({
        data: {
          email: email.toLowerCase(),
          exitoso: false,
          razonFallo: 'usuario_no_existe',
          ip,
          userAgent,
        },
      })

      logger.info('Login fallido: usuario no existe', {
        context: 'auth.secure-login',
        email: email.toLowerCase(),
        ip,
      })

      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar si cuenta está bloqueada
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await prisma.intentoLogin.create({
        data: {
          userId: user.id,
          email: email.toLowerCase(),
          exitoso: false,
          razonFallo: 'cuenta_bloqueada',
          ip,
          userAgent,
        },
      })

      const minutosRestantes = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 60000
      )

      logger.warn('Login bloqueado: cuenta temporalmente bloqueada', {
        context: 'auth.secure-login',
        userId: user.id,
        email: email.toLowerCase(),
        minutosRestantes,
      })

      return NextResponse.json(
        {
          error: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minutos`,
          lockedUntil: user.accountLockedUntil.toISOString(),
        },
        { status: 403 }
      )
    }

    // Verificar contraseña
    if (!user.passwordHash) {
      logger.error('Usuario sin passwordHash', {
        context: 'auth.secure-login',
        userId: user.id,
      })

      return NextResponse.json(
        { error: 'Configuración de cuenta inválida' },
        { status: 500 }
      )
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash)

    if (!passwordMatch) {
      // Incrementar intentos fallidos
      const failedAttempts = user.failedLoginAttempts + 1
      const shouldLock = failedAttempts >= 5

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          accountLockedUntil: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
            : null,
        },
      })

      await prisma.intentoLogin.create({
        data: {
          userId: user.id,
          email: email.toLowerCase(),
          exitoso: false,
          razonFallo: 'contraseña_incorrecta',
          ip,
          userAgent,
        },
      })

      if (shouldLock) {
        await prisma.eventoSeguridad.create({
          data: {
            userId: user.id,
            tipo: 'CUENTA_BLOQUEADA',
            descripcion: `Cuenta bloqueada por ${failedAttempts} intentos fallidos`,
            severidad: 'ALTA',
            ip,
            userAgent,
          },
        })

        logger.warn('Cuenta bloqueada por intentos fallidos', {
          context: 'auth.secure-login',
          userId: user.id,
          failedAttempts,
        })

        return NextResponse.json(
          {
            error:
              'Cuenta bloqueada por múltiples intentos fallidos. Intenta en 30 minutos',
          },
          { status: 403 }
        )
      }

      logger.info('Login fallido: contraseña incorrecta', {
        context: 'auth.secure-login',
        userId: user.id,
        failedAttempts,
      })

      return NextResponse.json(
        {
          error: 'Credenciales inválidas',
          remainingAttempts: 5 - failedAttempts,
        },
        { status: 401 }
      )
    }

    // Verificar 2FA si está habilitado
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json(
          {
            requiresTwoFactor: true,
            message: 'Ingresa el código de autenticación de dos factores',
          },
          { status: 200 }
        )
      }

      // Validar código 2FA
      if (!user.twoFactorSecret) {
        logger.error('2FA habilitado pero sin secret', {
          context: 'auth.secure-login',
          userId: user.id,
        })

        return NextResponse.json(
          { error: '2FA no configurado correctamente' },
          { status: 500 }
        )
      }

      const secret = decrypt(user.twoFactorSecret)
      const isValid = verifyTwoFactorToken(secret, twoFactorCode)

      if (!isValid) {
        await prisma.intentoLogin.create({
          data: {
            userId: user.id,
            email: email.toLowerCase(),
            exitoso: false,
            razonFallo: '2fa_fallido',
            ip,
            userAgent,
          },
        })

        logger.warn('Login fallido: código 2FA inválido', {
          context: 'auth.secure-login',
          userId: user.id,
        })

        return NextResponse.json(
          { error: 'Código 2FA inválido' },
          { status: 401 }
        )
      }

      // Registrar uso de 2FA
      await prisma.eventoSeguridad.create({
        data: {
          userId: user.id,
          tipo: 'TWO_FACTOR_CODIGO_USADO',
          descripcion: 'Código 2FA verificado exitosamente',
          severidad: 'BAJA',
          ip,
          userAgent,
        },
      })
    }

    // Login exitoso - resetear intentos fallidos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // Crear sesión
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    await createSession({
      userId: user.id,
      token,
      expiresAt,
    })

    // Registrar login exitoso
    await prisma.intentoLogin.create({
      data: {
        userId: user.id,
        email: email.toLowerCase(),
        exitoso: true,
        ip,
        userAgent,
      },
    })

    await prisma.eventoSeguridad.create({
      data: {
        userId: user.id,
        tipo: 'LOGIN_EXITOSO',
        descripcion: 'Login exitoso',
        severidad: 'BAJA',
        ip,
        userAgent,
      },
    })

    // Resetear rate limit para este usuario
    await resetRateLimit('ratelimit:login', identifier)

    logger.info('Login exitoso', {
      context: 'auth.secure-login',
      userId: user.id,
      email: user.email,
      twoFactorUsed: user.twoFactorEnabled,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error) {
    logger.error('Error en login', error as Error, {
      context: 'auth.secure-login',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}
