/**
 * TESTS PARA RATE LIMITING
 * Tests unitarios para el sistema de rate limiting
 */

import { NextRequest } from 'next/server'
import { rateLimit } from '../rate-limit'

// Mock de NextRequest
function createMockRequest(ip: string = '192.168.1.1'): NextRequest {
  const request = {
    headers: {
      get: (key: string) => {
        if (key === 'x-forwarded-for') return ip
        if (key === 'x-real-ip') return ip
        return null
      },
    },
  } as unknown as NextRequest

  return request
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear store before each test
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('rateLimit()', () => {
    it('debe permitir requests dentro del límite', async () => {
      const req = createMockRequest('192.168.1.1')
      const config = { max: 5, window: 60000 }

      // Primeros 5 requests deben pasar
      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(req, config)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(5 - i - 1)
      }
    })

    it('debe bloquear requests que exceden el límite', async () => {
      const req = createMockRequest('192.168.1.2')
      const config = { max: 3, window: 60000 }

      // Primeros 3 pasan
      for (let i = 0; i < 3; i++) {
        const result = await rateLimit(req, config)
        expect(result.success).toBe(true)
      }

      // El 4to debe fallar
      const result = await rateLimit(req, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('debe resetear el contador después de la ventana de tiempo', async () => {
      const req = createMockRequest('192.168.1.3')
      const config = { max: 2, window: 1000 } // 1 segundo

      // Hacer 2 requests (límite)
      await rateLimit(req, config)
      await rateLimit(req, config)

      // El 3ro debe fallar
      let result = await rateLimit(req, config)
      expect(result.success).toBe(false)

      // Avanzar el tiempo 1.1 segundos
      jest.advanceTimersByTime(1100)

      // Ahora debe permitir nuevamente
      result = await rateLimit(req, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('debe trackear IPs diferentes independientemente', async () => {
      const req1 = createMockRequest('192.168.1.10')
      const req2 = createMockRequest('192.168.1.20')
      const config = { max: 2, window: 60000 }

      // IP1 hace 2 requests
      await rateLimit(req1, config)
      await rateLimit(req1, config)

      // IP1 excede límite
      let result = await rateLimit(req1, config)
      expect(result.success).toBe(false)

      // IP2 puede hacer requests normalmente
      result = await rateLimit(req2, config)
      expect(result.success).toBe(true)
    })

    it('debe retornar información de reset correcta', async () => {
      const req = createMockRequest('192.168.1.4')
      const config = { max: 5, window: 10000 } // 10 segundos

      const now = Date.now()
      const result = await rateLimit(req, config)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.reset).toBeGreaterThan(now)
      expect(result.reset).toBeLessThanOrEqual(now + config.window)
    })

    it('debe usar configuración por defecto si no se provee', async () => {
      const req = createMockRequest('192.168.1.5')

      // Sin config, debe usar default (max: 100, window: 60000)
      const result = await rateLimit(req)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(99) // 100 - 1
    })

    it('debe manejar múltiples requests concurrentes correctamente', async () => {
      const req = createMockRequest('192.168.1.6')
      const config = { max: 10, window: 60000 }

      // Simular 15 requests concurrentes
      const results = await Promise.all(
        Array.from({ length: 15 }, () => rateLimit(req, config))
      )

      // Primeros 10 deben pasar
      const successful = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      expect(successful.length).toBe(10)
      expect(failed.length).toBe(5)
    })

    it('debe manejar IPs de x-forwarded-for con múltiples valores', async () => {
      const req = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return '192.168.1.100, 10.0.0.1, 172.16.0.1'
            return null
          },
        },
      } as unknown as NextRequest

      const config = { max: 2, window: 60000 }

      // Debe usar la primera IP (192.168.1.100)
      const result1 = await rateLimit(req, config)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit(req, config)
      expect(result2.success).toBe(true)

      // Tercera debe fallar
      const result3 = await rateLimit(req, config)
      expect(result3.success).toBe(false)
    })

    it('debe manejar requests sin IP (unknown)', async () => {
      const req = {
        headers: {
          get: () => null, // Sin headers de IP
        },
      } as unknown as NextRequest

      const config = { max: 5, window: 60000 }

      // Debe funcionar con IP 'unknown'
      const result = await rateLimit(req, config)
      expect(result.success).toBe(true)
    })
  })
})
