/**
 * Script para verificar índices de base de datos
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyIndexes() {
  try {
    console.log('🔍 Verificando índices de base de datos...\n')

    // Query para obtener todos los índices de eventos_calendario
    const indexes = await prisma.$queryRaw<
      Array<{ indexname: string; indexdef: string }>
    >`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'eventos_calendario'
      ORDER BY indexname;
    `

    console.log('📊 Índices encontrados en eventos_calendario:\n')

    let optimizationIndexesCount = 0

    indexes.forEach((index) => {
      console.log(`✓ ${index.indexname}`)

      // Verificar si es uno de nuestros índices de optimización
      if (
        index.indexname.includes('notificar') ||
        (index.indexname.includes('user_id') &&
          index.indexname.includes('fecha'))
      ) {
        optimizationIndexesCount++
        console.log('  └─ 🚀 Índice de optimización de performance')
      }
    })

    console.log(`\n✅ Total de índices: ${indexes.length}`)
    console.log(`🚀 Índices de optimización: ${optimizationIndexesCount}`)

    if (optimizationIndexesCount >= 4) {
      console.log('\n✨ ¡Índices de performance aplicados exitosamente!')
      console.log(
        '   Mejora esperada: 100x más rápido en queries de recordatorios\n'
      )
    } else {
      console.log('\n⚠️  Algunos índices de optimización pueden faltar\n')
    }
  } catch (error) {
    console.error('❌ Error al verificar índices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyIndexes()
