/**
 * Script de inicialización del sistema de auditoría
 * Crea las políticas de retención por defecto en la base de datos
 *
 * Ejecutar: npm run audit:init
 */

import { PrismaClient } from '@prisma/client'
import { inicializarPoliticasRetencion } from '../lib/audit/retention-service'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando configuración del sistema de auditoría...')

  try {
    // Inicializar políticas de retención
    await inicializarPoliticasRetencion()

    console.log('✅ Políticas de retención inicializadas correctamente')
    console.log('')
    console.log('📊 Resumen de políticas creadas:')

    const politicas = await prisma.politicaRetencion.findMany({
      orderBy: { diasRetencion: 'desc' },
    })

    console.log('┌─────────────────────────────┬───────────────┬─────────────────────────────┐')
    console.log('│ Categoría                   │ Retención     │ Requisito Legal             │')
    console.log('├─────────────────────────────┼───────────────┼─────────────────────────────┤')

    politicas.forEach(p => {
      const categoria = p.categoria.padEnd(28)
      const dias = `${p.diasRetencion} días`.padEnd(14)
      const req = (p.requisitoLegal || 'N/A').padEnd(28)
      console.log(`│ ${categoria}│ ${dias}│ ${req}│`)
    })

    console.log('└─────────────────────────────┴───────────────┴─────────────────────────────┘')
    console.log('')
    console.log('✨ Sistema de auditoría configurado exitosamente')
    console.log('💡 Próximos pasos:')
    console.log('   1. Verificar que las migraciones de Prisma estén aplicadas')
    console.log('   2. Configurar el cron job de limpieza (opcional)')
    console.log('   3. Revisar el archivo docs/AUDITORIA.md para más información')
  } catch (error) {
    console.error('❌ Error inicializando sistema de auditoría:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
