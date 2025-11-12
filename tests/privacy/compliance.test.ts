/**
 * TESTS DE CUMPLIMIENTO - LEY 1581 DE 2012
 * Verifica que el sistema cumple con todos los requisitos legales
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { db } from '@/lib/db'
import {
  registrarConsentimiento,
  verificarConsentimientosRequeridos,
  obtenerHistorialConsentimientos,
} from '@/lib/privacy/consent-manager'
import { exportarDatosUsuario } from '@/lib/privacy/data-portability'
import {
  solicitarEliminacion,
  confirmarEliminacion,
  cancelarEliminacion,
  obtenerSolicitudesPendientes,
} from '@/lib/privacy/account-deletion'
import { TipoConsentimiento } from '@prisma/client'

describe('Cumplimiento de Ley 1581 de 2012', () => {
  let testUserId: string
  let testUserEmail: string

  beforeEach(async () => {
    // Crear usuario de prueba
    testUserEmail = `test-${Date.now()}@test.com`
    const user = await db.user.create({
      data: {
        email: testUserEmail,
        nombre: 'Usuario Test',
        passwordHash: 'hash-test',
        emailVerified: new Date(),
      },
    })
    testUserId = user.id
  })

  afterEach(async () => {
    // Limpiar datos de prueba
    try {
      await db.user.delete({
        where: { id: testUserId },
      })
    } catch (error) {
      // Usuario ya eliminado
    }
  })

  describe('Gestión de Consentimientos (Art. 9 Ley 1581)', () => {
    it('debe registrar consentimiento con metadata de auditoría', async () => {
      await registrarConsentimiento({
        userId: testUserId,
        tipo: TipoConsentimiento.POLITICA_PRIVACIDAD,
        otorgado: true,
        version: '1.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test',
      })

      const historial = await obtenerHistorialConsentimientos(testUserId)
      expect(historial.length).toBeGreaterThan(0)

      const consentimiento = historial[0]
      expect(consentimiento.tipo).toBe(TipoConsentimiento.POLITICA_PRIVACIDAD)
      expect(consentimiento.otorgado).toBe(true)
      expect(consentimiento.version).toBe('1.0')
    })

    it('debe verificar consentimientos requeridos', async () => {
      const verificacion = await verificarConsentimientosRequeridos(testUserId)
      expect(verificacion).toHaveProperty('completo')
      expect(verificacion).toHaveProperty('faltantes')
      expect(verificacion.completo).toBe(false)
      expect(verificacion.faltantes.length).toBeGreaterThan(0)
    })

    it('debe registrar revocación de consentimiento', async () => {
      // Otorgar
      await registrarConsentimiento({
        userId: testUserId,
        tipo: TipoConsentimiento.COOKIES_ANALITICAS,
        otorgado: true,
        version: '1.0',
      })

      // Revocar
      await registrarConsentimiento({
        userId: testUserId,
        tipo: TipoConsentimiento.COOKIES_ANALITICAS,
        otorgado: false,
        version: '1.0',
      })

      const historial = await obtenerHistorialConsentimientos(testUserId)
      const revocado = historial.find(
        (c) => c.tipo === TipoConsentimiento.COOKIES_ANALITICAS && !c.otorgado
      )
      expect(revocado).toBeDefined()
    })
  })

  describe('Portabilidad de Datos (Art. 20 Ley 1581)', () => {
    it('debe exportar datos del usuario en formato JSON', async () => {
      const resultado = await exportarDatosUsuario(testUserId)

      expect(resultado).toHaveProperty('archivoUrl')
      expect(resultado).toHaveProperty('tamanoBytes')
      expect(resultado.tamanoBytes).toBeGreaterThan(0)
      expect(resultado.archivoUrl).toContain('.json')
    })

    it('debe incluir metadata de exportación', async () => {
      const resultado = await exportarDatosUsuario(testUserId)

      // Verificar que se creó la solicitud en DB
      const solicitud = await db.solicitudPortabilidad.findFirst({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      })

      expect(solicitud).toBeDefined()
      expect(solicitud?.estado).toBe('COMPLETADA')
      expect(solicitud?.archivoUrl).toBe(resultado.archivoUrl)
    })

    it('debe respetar rate limit de 1 exportación cada 24 horas', async () => {
      // Primera exportación
      await exportarDatosUsuario(testUserId)

      // Intentar segunda exportación inmediata
      await expect(exportarDatosUsuario(testUserId)).rejects.toThrow(
        /ya solicitaste una exportación/i
      )
    })
  })

  describe('Derecho al Olvido (Art. 15 Ley 1581)', () => {
    it('debe crear solicitud de eliminación con token', async () => {
      const token = await solicitarEliminacion(
        testUserId,
        'Motivo de prueba',
        '192.168.1.1'
      )

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)

      const solicitud = await db.solicitudEliminacion.findFirst({
        where: { userId: testUserId },
      })

      expect(solicitud).toBeDefined()
      expect(solicitud?.estado).toBe('PENDIENTE')
      expect(solicitud?.tokenConfirmacion).toBe(token)
    })

    it('debe confirmar eliminación e iniciar período de gracia de 30 días', async () => {
      const token = await solicitarEliminacion(testUserId)

      await confirmarEliminacion(testUserId, token)

      const solicitud = await db.solicitudEliminacion.findFirst({
        where: { userId: testUserId },
      })

      expect(solicitud?.estado).toBe('EN_PERIODO_GRACIA')
      expect(solicitud?.fechaConfirmacion).toBeDefined()
      expect(solicitud?.fechaEjecucion).toBeDefined()

      // Verificar que la fecha de ejecución es aproximadamente 30 días después
      const diff =
        solicitud!.fechaEjecucion!.getTime() - new Date().getTime()
      const dias = diff / (1000 * 60 * 60 * 24)

      expect(dias).toBeGreaterThan(29)
      expect(dias).toBeLessThan(31)
    })

    it('debe permitir cancelar eliminación durante período de gracia', async () => {
      const token = await solicitarEliminacion(testUserId)
      await confirmarEliminacion(testUserId, token)

      await cancelarEliminacion(testUserId)

      const solicitud = await db.solicitudEliminacion.findFirst({
        where: { userId: testUserId },
      })

      expect(solicitud?.estado).toBe('CANCELADA')
      expect(solicitud?.fechaCancelacion).toBeDefined()
    })

    it('debe rechazar token inválido', async () => {
      await solicitarEliminacion(testUserId)

      await expect(
        confirmarEliminacion(testUserId, 'token-invalido-123')
      ).rejects.toThrow(/token inválido/i)
    })

    it('debe obtener solicitudes pendientes para cron job', async () => {
      const token = await solicitarEliminacion(testUserId)
      await confirmarEliminacion(testUserId, token)

      // Modificar fecha de ejecución a ayer (para simular que ya pasó el periodo)
      await db.solicitudEliminacion.updateMany({
        where: { userId: testUserId },
        data: {
          fechaEjecucion: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      })

      const pendientes = await obtenerSolicitudesPendientes()
      expect(pendientes.length).toBeGreaterThan(0)

      const miSolicitud = pendientes.find((s) => s.userId === testUserId)
      expect(miSolicitud).toBeDefined()
    })
  })

  describe('Auditoría y Trazabilidad', () => {
    it('debe registrar logs de privacidad para consentimientos', async () => {
      await registrarConsentimiento({
        userId: testUserId,
        tipo: TipoConsentimiento.TERMINOS_CONDICIONES,
        otorgado: true,
        version: '1.0',
      })

      const logs = await db.logPrivacidad.findMany({
        where: { userId: testUserId },
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].accion).toBe('CONSENTIMIENTO_OTORGADO')
    })

    it('debe registrar logs para solicitud de eliminación', async () => {
      await solicitarEliminacion(testUserId, 'Test')

      const logs = await db.logPrivacidad.findMany({
        where: {
          userId: testUserId,
          accion: 'SOLICITUD_ELIMINACION',
        },
      })

      expect(logs.length).toBeGreaterThan(0)
    })

    it('debe registrar logs para exportación de datos', async () => {
      await exportarDatosUsuario(testUserId)

      const logs = await db.logPrivacidad.findMany({
        where: {
          userId: testUserId,
          accion: 'EXPORTACION_DATOS',
        },
      })

      expect(logs.length).toBeGreaterThan(0)
    })
  })

  describe('Seguridad y Privacidad', () => {
    it('debe generar tokens de confirmación seguros', async () => {
      const token1 = await solicitarEliminacion(testUserId)

      // Cancelar para poder solicitar otra vez
      await cancelarEliminacion(testUserId)

      const testUserId2 = (
        await db.user.create({
          data: {
            email: `test2-${Date.now()}@test.com`,
            nombre: 'Usuario Test 2',
            passwordHash: 'hash',
            emailVerified: new Date(),
          },
        })
      ).id

      const token2 = await solicitarEliminacion(testUserId2)

      // Tokens deben ser únicos
      expect(token1).not.toBe(token2)

      // Tokens deben ser largos (seguros)
      expect(token1.length).toBeGreaterThan(32)
      expect(token2.length).toBeGreaterThan(32)

      // Limpiar
      await db.user.delete({ where: { id: testUserId2 } })
    })

    it('no debe permitir solicitud duplicada de eliminación', async () => {
      await solicitarEliminacion(testUserId)

      await expect(solicitarEliminacion(testUserId)).rejects.toThrow(
        /ya existe una solicitud/i
      )
    })
  })
})
