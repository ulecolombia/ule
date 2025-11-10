/**
 * ULE - TYPES
 * Exports de tipos de Prisma y tipos personalizados
 */

// Enums de Prisma para User
export {
  Role,
  TipoDocumento,
  TipoContrato,
  EstadoCivil,
  AporteEstado,
  TipoDocumentoCliente,
  RegimenTributario,
  EstadoFactura,
  RolMensaje,
  TipoDocumentoArchivo,
  TipoRecordatorio,
  CategoriaFAQ,
  TipoTermino,
  TipoExportacion,
  FrecuenciaExportacion,
  TipoEvento,
  CategoriaEvento,
  FrecuenciaEvento,
  TipoCalculadora,
  TipoInteraccionAyuda,
  CategoriaEventoAnalytics,
  SeveridadError,
} from '@prisma/client'

// Tipos inferidos de Prisma
export type { User, Aporte, ConfiguracionPila, Cliente, Factura } from '@prisma/client'
