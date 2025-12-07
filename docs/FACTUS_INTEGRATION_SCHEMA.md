# 📋 SCHEMA COMPLETO PARA INTEGRACIÓN FACTUS

**Fecha:** 2025-11-25
**Propósito:** Documentación completa del schema de Prisma para planificar integración con Factus (Facturación Electrónica DIAN)

---

## 🏗️ ESTRUCTURA ACTUAL DEL PROYECTO

```
/app
  /facturacion
    /clientes          → Gestión de clientes
    /facturas          → Lista de facturas
    /mis-servicios     → Servicios frecuentes
    /nueva             → Nueva factura
  /api
    /facturacion
      /anular          → Anular factura
      /emitir          → Emitir factura
      /enviar-email    → Enviar factura por email
      /estadisticas    → Stats de facturación
      /facturas        → CRUD facturas
      route.ts         → API principal facturación
    /clientes
      /[id]            → Cliente por ID
      /buscar          → Búsqueda de clientes
      /frecuentes      → Clientes frecuentes
      /stats           → Estadísticas clientes
      /validate-documento → Validar documento
      route.ts         → API principal clientes
/prisma
  /migrations          → Migraciones de BD
  schema.prisma        → Schema principal
```

---

## 📊 MODELO USER - CAMPOS DE FACTURACIÓN

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String

  // ============================================
  // INFORMACIÓN TRIBUTARIA (FACTURACIÓN ELECTRÓNICA)
  // ============================================
  nit                     String?   @map("nit")
  razonSocial             String?   @map("razon_social")
  regimenTributario       RegimenTributario? @map("regimen_tributario")
  responsableIVA          Boolean   @default(false) @map("responsable_iva")
  autorretenedor          Boolean   @default(false) @map("autorretenedor")
  granContribuyente       Boolean   @default(false) @map("gran_contribuyente")

  // Resolución DIAN para facturación electrónica
  resolucionDIAN          String?   @map("resolucion_dian")
  prefijoFactura          String?   @map("prefijo_factura")
  rangoFacturacionDesde   Int?      @map("rango_facturacion_desde")
  rangoFacturacionHasta   Int?      @map("rango_facturacion_hasta")
  fechaResolucion         DateTime? @map("fecha_resolucion")
  consecutivoActual       Int?      @default(1) @map("consecutivo_actual")

  // Branding para facturas
  logoEmpresaUrl          String?   @map("logo_empresa_url")
  colorPrimario           String?   @map("color_primario")

  // Información bancaria para facturas
  nombreBanco             String?   @map("nombre_banco")
  tipoCuenta              String?   @map("tipo_cuenta")
  numeroCuenta            String?   @map("numero_cuenta")
  emailFacturacion        String?   @map("email_facturacion")

  // Relaciones de facturación
  facturas            Factura[]
  clientes            Cliente[]
  serviciosFrecuentes ServicioFrecuente[]
}
```

---

## 👥 MODELO CLIENTE

```prisma
model Cliente {
  id     String @id @default(cuid())
  userId String @map("user_id")

  // Información básica
  nombre          String
  tipoDocumento   TipoDocumentoCliente @map("tipo_documento")
  numeroDocumento String               @map("numero_documento")
  email           String?
  telefono        String?
  direccion       String?
  ciudad          String?
  departamento    String?

  // Información fiscal (opcional, para empresas)
  razonSocial           String?            @map("razon_social")
  nombreComercial       String?            @map("nombre_comercial")
  regimenTributario     RegimenTributario? @map("regimen_tributario")
  responsabilidadFiscal String?            @map("responsabilidad_fiscal")

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  facturas Factura[]

  @@unique([userId, numeroDocumento])
  @@index([userId])
  @@index([numeroDocumento])
  @@map("clientes")
}
```

---

## 🧾 MODELO FACTURA

```prisma
model Factura {
  id        String @id @default(cuid())
  userId    String @map("user_id")
  clienteId String @map("cliente_id")

  // Información de la factura
  numeroFactura    String    @map("numero_factura")
  prefijo          String?
  fecha            DateTime  @default(now())
  fechaVencimiento DateTime? @map("fecha_vencimiento")
  metodoPago       String?   @map("metodo_pago")

  // Información del cliente (desnormalizada para histórico)
  clienteNombre    String  @map("cliente_nombre")
  clienteDocumento String  @map("cliente_documento")
  clienteEmail     String? @map("cliente_email")
  clienteTelefono  String? @map("cliente_telefono")
  clienteDireccion String? @map("cliente_direccion")
  clienteCiudad    String? @map("cliente_ciudad")

  // Items de la factura (JSON)
  conceptos Json // [{ descripcion, cantidad, valorUnitario, iva, descuento, total }]

  // Totales
  subtotal        Decimal @db.Decimal(12, 2)
  totalDescuentos Decimal @default(0) @map("total_descuentos") @db.Decimal(12, 2)
  totalIva        Decimal @map("total_iva") @db.Decimal(12, 2)
  totalImpuestos  Decimal @default(0) @map("total_impuestos") @db.Decimal(12, 2)
  total           Decimal @db.Decimal(12, 2)

  // Estado de la factura
  estado EstadoFactura @default(BORRADOR)

  // Información DIAN (factura electrónica)
  cufe   String? @unique  // Código Único de Factura Electrónica
  cude   String?          // Código Único de Documento Electrónico
  qrCode String? @map("qr_code")

  // Archivos generados
  pdfUrl String? @map("pdf_url")
  xmlUrl String? @map("xml_url")

  // Notas y observaciones
  notas        String? @db.Text
  terminosPago String? @map("terminos_pago")

  // Metadata
  fechaEmision    DateTime? @map("fecha_emision")
  fechaAnulacion  DateTime? @map("fecha_anulacion")
  motivoAnulacion String?   @map("motivo_anulacion") @db.Text

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  cliente Cliente        @relation(fields: [clienteId], references: [id], onDelete: Restrict)
  envios  EnvioFactura[]

  @@unique([userId, numeroFactura])
  @@index([userId])
  @@index([clienteId])
  @@index([estado])
  @@index([fecha])
  @@index([cufe])
  @@map("facturas")
}
```

---

## 📧 MODELO ENVIO FACTURA

```prisma
model EnvioFactura {
  id        String @id @default(cuid())
  facturaId String @map("factura_id")

  // Información del envío
  destinatario String
  cc           String?
  asunto       String
  mensaje      String? @db.Text

  // Adjuntos enviados
  adjuntoPdf Boolean @default(true) @map("adjunto_pdf")
  adjuntoXml Boolean @default(true) @map("adjunto_xml")

  // Estado del envío
  exitoso Boolean @default(false)
  error   String? @db.Text

  // Metadata
  fechaEnvio DateTime @default(now()) @map("fecha_envio")

  // Relaciones
  factura Factura @relation(fields: [facturaId], references: [id], onDelete: Cascade)

  @@index([facturaId])
  @@index([fechaEnvio])
  @@map("envios_facturas")
}
```

---

## 🛠️ MODELO SERVICIOS FRECUENTES

```prisma
model ServicioFrecuente {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Datos del servicio
  descripcion     String
  valorUnitario   Decimal  @db.Decimal(15, 2)
  unidad          String   @default("UND")
  aplicaIVA       Boolean  @default(false)
  porcentajeIVA   Int      @default(0)

  // Tracking y organización
  vecesUtilizado  Int      @default(0)
  categoria       String?
  activo          Boolean  @default(true)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([userId, activo])
}
```

---

## 🏷️ ENUMS RELACIONADOS CON FACTURACIÓN

### TipoDocumentoCliente

```prisma
enum TipoDocumentoCliente {
  CC        // Cédula de Ciudadanía
  CE        // Cédula de Extranjería
  NIT       // Número de Identificación Tributaria (empresas)
  PASAPORTE // Pasaporte
  TI        // Tarjeta de Identidad
  RC        // Registro Civil
  DIE       // Documento de Identificación Extranjero
}
```

### RegimenTributario

```prisma
enum RegimenTributario {
  SIMPLE        // Régimen Simple de Tributación
  ORDINARIO     // Régimen Ordinario (Común)
  ESPECIAL      // Régimen Especial (casos específicos)
  NO_DECLARANTE // No declarante de renta
}
```

### EstadoFactura

```prisma
enum EstadoFactura {
  BORRADOR  // Guardada pero no emitida
  EMITIDA   // Emitida y enviada a DIAN
  PAGADA    // Factura pagada por el cliente
  VENCIDA   // Factura vencida sin pago
  ANULADA   // Factura anulada
  RECHAZADA // Rechazada por DIAN
}
```

### TipoDocumento (User)

```prisma
enum TipoDocumento {
  CC        // Cédula de Ciudadanía
  CE        // Cédula de Extranjería
  PEP       // Permiso Especial de Permanencia
  PASAPORTE // Pasaporte
  NIT       // Número de Identificación Tributaria (empresas)
}
```

---

## 🔗 API ENDPOINTS ACTUALES

### Facturación

- `POST /api/facturacion` - Crear factura
- `GET /api/facturacion/facturas` - Lista de facturas
- `POST /api/facturacion/emitir` - Emitir factura
- `POST /api/facturacion/anular` - Anular factura
- `POST /api/facturacion/enviar-email` - Enviar factura por email
- `GET /api/facturacion/estadisticas` - Estadísticas

### Clientes

- `POST /api/clientes` - Crear cliente
- `GET /api/clientes` - Lista de clientes
- `GET /api/clientes/[id]` - Cliente por ID
- `GET /api/clientes/buscar` - Búsqueda de clientes
- `GET /api/clientes/frecuentes` - Clientes frecuentes
- `POST /api/clientes/validate-documento` - Validar documento
- `GET /api/clientes/stats` - Estadísticas

### Servicios Frecuentes

- `GET /api/servicios-frecuentes` - Lista de servicios
- `POST /api/servicios-frecuentes` - Crear servicio

---

## 🎯 CAMPOS CRÍTICOS PARA INTEGRACIÓN FACTUS

### En User (Emisor)

- ✅ `nit` - Identificación del emisor
- ✅ `razonSocial` - Nombre o razón social
- ✅ `regimenTributario` - Régimen del emisor
- ✅ `responsableIVA` - Si es responsable de IVA
- ✅ `resolucionDIAN` - Número de resolución DIAN
- ✅ `prefijoFactura` - Prefijo autorizado
- ✅ `rangoFacturacionDesde` / `rangoFacturacionHasta` - Rango autorizado
- ✅ `consecutivoActual` - Último número usado
- ⚠️ **FALTANTE:** `codigoCIIU` - Actividad económica
- ⚠️ **FALTANTE:** `responsabilidadFiscal` - Responsabilidades fiscales detalladas
- ⚠️ **FALTANTE:** `municipioCodigo` - Código DIVIPOLA del municipio

### En Cliente (Adquiriente)

- ✅ `tipoDocumento` - Tipo de documento del cliente
- ✅ `numeroDocumento` - Número de documento
- ✅ `nombre` / `razonSocial` - Identificación del cliente
- ✅ `email` - Email para envío
- ✅ `direccion` - Dirección
- ✅ `ciudad` / `departamento` - Ubicación
- ⚠️ **FALTANTE:** `codigoPostal` - Código postal
- ⚠️ **FALTANTE:** `municipioCodigo` - Código DIVIPOLA del municipio
- ⚠️ **FALTANTE:** `paisCodigo` - Código ISO del país

### En Factura

- ✅ `numeroFactura` - Número consecutivo
- ✅ `prefijo` - Prefijo de factura
- ✅ `fecha` - Fecha de emisión
- ✅ `fechaVencimiento` - Fecha de vencimiento
- ✅ `conceptos` - Items de la factura (JSON)
- ✅ `subtotal` - Subtotal sin IVA
- ✅ `totalIva` - Total IVA
- ✅ `total` - Total a pagar
- ✅ `cufe` - Código Único Factura Electrónica
- ✅ `qrCode` - Código QR
- ✅ `pdfUrl` - URL del PDF
- ✅ `xmlUrl` - URL del XML
- ⚠️ **FALTANTE:** `cufeTecnico` - CUFE completo con todos los datos
- ⚠️ **FALTANTE:** `tipoOperacion` - Tipo de operación (10 = estándar)
- ⚠️ **FALTANTE:** `ordenCompra` - Número de orden de compra (opcional)
- ⚠️ **FALTANTE:** `notasFactura` - Notas adicionales (JSON array)

---

## 🚨 CAMPOS QUE FACTUS REQUIERE (NO ESTÁN EN EL SCHEMA)

### Para el Emisor

1. `codigoCIIU` - Código de actividad económica (4 dígitos)
2. `responsabilidadesFiscales` - Array de códigos (ej: ["O-13", "O-15", "R-99-PN"])
3. `municipioCodigo` - Código DIVIPOLA del municipio (5 dígitos)
4. `direccionCompleta` - Dirección completa del emisor
5. `matriculaMercantil` - Matrícula mercantil (opcional)

### Para el Adquiriente (Cliente)

1. `codigoPostal` - Código postal
2. `municipioCodigo` - Código DIVIPOLA del municipio
3. `paisCodigo` - Código ISO del país (ej: "CO")
4. `nombreContacto` - Nombre del contacto (opcional)
5. `emailContacto` - Email del contacto (opcional)

### Para la Factura

1. `tipoOperacion` - Tipo de operación (10 = estándar)
2. `tipoDocumento` - Tipo de documento (01 = factura venta)
3. `ambiente` - Ambiente (1 = producción, 2 = habilitación)
4. `formaPago` - Forma de pago (1 = contado, 2 = crédito)
5. `medioPago` - Medio de pago (10 = efectivo, 42 = transferencia, etc.)
6. `ordenCompra` - Número de orden de compra (opcional)
7. `observaciones` - Notas o observaciones adicionales

### Para Items/Conceptos

Actualmente es JSON libre. Debería tener estructura:

```typescript
{
  codigo?: string          // Código del producto/servicio
  descripcion: string      // Descripción
  cantidad: number         // Cantidad
  unidadMedida: string     // Código unidad (ej: "94" = unidad)
  valorUnitario: number    // Valor unitario
  descuento?: number       // Descuento
  totalBruto: number       // Total antes de impuestos
  iva: number              // Valor del IVA
  totalNeto: number        // Total con impuestos
  codigoImpuesto?: string  // Código del impuesto (01 = IVA)
  tarifaImpuesto?: number  // Tarifa del impuesto (0, 5, 19)
}
```

---

## 📝 RECOMENDACIONES PARA INTEGRACIÓN FACTUS

### 1. **Agregar Campos Faltantes al Schema**

```prisma
// En User
model User {
  // ... campos existentes

  // Agregar:
  codigoCIIU              String?   @map("codigo_ciiu")
  responsabilidadesFiscales String[] @map("responsabilidades_fiscales")
  municipioCodigo         String?   @map("municipio_codigo")
  direccionCompleta       String?   @map("direccion_completa")
  matriculaMercantil      String?   @map("matricula_mercantil")
}

// En Cliente
model Cliente {
  // ... campos existentes

  // Agregar:
  codigoPostal     String? @map("codigo_postal")
  municipioCodigo  String? @map("municipio_codigo")
  paisCodigo       String? @default("CO") @map("pais_codigo")
  nombreContacto   String? @map("nombre_contacto")
  emailContacto    String? @map("email_contacto")
}

// En Factura
model Factura {
  // ... campos existentes

  // Agregar:
  tipoOperacion    String? @default("10") @map("tipo_operacion")
  tipoDocumento    String? @default("01") @map("tipo_documento")
  ambiente         Int?    @default(2)    // 1=producción, 2=habilitación
  formaPago        String? @map("forma_pago")
  medioPago        String? @map("medio_pago")
  ordenCompra      String? @map("orden_compra")
  observaciones    String? @db.Text

  // CUFE técnico completo
  cufeTecnico      String? @map("cufe_tecnico")
}
```

### 2. **Crear Modelo para Items de Factura**

En lugar de JSON libre en `conceptos`, crear un modelo:

```prisma
model ItemFactura {
  id              String  @id @default(cuid())
  facturaId       String  @map("factura_id")

  orden           Int     // Orden del item
  codigo          String?
  descripcion     String
  cantidad        Decimal @db.Decimal(12, 3)
  unidadMedida    String  @default("94") @map("unidad_medida")
  valorUnitario   Decimal @db.Decimal(15, 2) @map("valor_unitario")
  descuento       Decimal @default(0) @db.Decimal(15, 2)
  totalBruto      Decimal @db.Decimal(15, 2) @map("total_bruto")

  // Impuestos
  codigoImpuesto  String? @map("codigo_impuesto")
  tarifaImpuesto  Decimal? @db.Decimal(5, 2) @map("tarifa_impuesto")
  valorImpuesto   Decimal @default(0) @db.Decimal(15, 2) @map("valor_impuesto")

  totalNeto       Decimal @db.Decimal(15, 2) @map("total_neto")

  factura         Factura @relation(fields: [facturaId], references: [id], onDelete: Cascade)

  @@index([facturaId])
  @@map("items_factura")
}
```

### 3. **Crear Tabla de Configuración Factus**

```prisma
model ConfiguracionFactus {
  id     String @id @default(cuid())
  userId String @unique @map("user_id")

  // Credenciales Factus
  apiKey          String  @map("api_key")
  apiSecret       String  @map("api_secret")
  ambiente        Int     @default(2) // 1=producción, 2=habilitación

  // Configuración
  habilitado      Boolean @default(false)
  autoEmitir      Boolean @default(false) @map("auto_emitir")
  emailCopia      String? @map("email_copia")

  // Metadata
  ultimaEmision   DateTime? @map("ultima_emision")
  totalEmitidas   Int       @default(0) @map("total_emitidas")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("configuracion_factus")
}
```

### 4. **Crear Tabla de Logs de Emisión**

```prisma
model LogEmisionFactura {
  id              String   @id @default(cuid())
  facturaId       String   @map("factura_id")

  // Request
  requestPayload  Json     @map("request_payload")

  // Response
  exitoso         Boolean  @default(false)
  codigoRespuesta String?  @map("codigo_respuesta")
  mensajeRespuesta String? @db.Text @map("mensaje_respuesta")
  responsePayload Json?    @map("response_payload")

  // CUFE y archivos
  cufeGenerado    String?  @map("cufe_generado")
  pdfUrl          String?  @map("pdf_url")
  xmlUrl          String?  @map("xml_url")
  qrData          String?  @map("qr_data")

  // Metadata
  duracionMs      Int?     @map("duracion_ms")
  timestamp       DateTime @default(now())

  factura         Factura  @relation(fields: [facturaId], references: [id], onDelete: Cascade)

  @@index([facturaId])
  @@index([timestamp])
  @@index([exitoso])
  @@map("logs_emision_facturas")
}
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

### Fase 1: Preparación del Schema

- [ ] Agregar campos faltantes a `User`
- [ ] Agregar campos faltantes a `Cliente`
- [ ] Agregar campos faltantes a `Factura`
- [ ] Crear modelo `ItemFactura`
- [ ] Crear modelo `ConfiguracionFactus`
- [ ] Crear modelo `LogEmisionFactura`
- [ ] Ejecutar migración de Prisma

### Fase 2: Actualizar UI de Configuración

- [ ] Formulario de configuración Factus en perfil/facturación
- [ ] Campos de actividad económica (CIIU) en User
- [ ] Responsabilidades fiscales en User
- [ ] Municipio DIVIPOLA en User y Cliente
- [ ] Validación de campos requeridos por DIAN

### Fase 3: Implementar Servicio Factus

- [ ] `/lib/services/factus-service.ts` - Cliente HTTP Factus
- [ ] Mapeo de datos ULE → Formato Factus
- [ ] Generación de CUFE
- [ ] Emisión de facturas
- [ ] Descarga de PDF y XML
- [ ] Manejo de errores y reintentos

### Fase 4: Actualizar API Endpoints

- [ ] `POST /api/facturacion/emitir` - Integrar con Factus
- [ ] `GET /api/facturacion/verificar-estado` - Estado en DIAN
- [ ] `POST /api/facturacion/reenviar` - Reenviar a Factus
- [ ] `POST /api/facturacion/sincronizar` - Sincronizar con DIAN

### Fase 5: Testing

- [ ] Tests unitarios de mapeo de datos
- [ ] Tests de integración con Factus (ambiente habilitación)
- [ ] Validación de CUFE
- [ ] Validación de PDF y XML generados
- [ ] Tests de escenarios de error

### Fase 6: Despliegue

- [ ] Configuración de variables de entorno
- [ ] Migración de datos existentes
- [ ] Emisión en ambiente de habilitación
- [ ] Certificación ante DIAN
- [ ] Activación en producción

---

## 🔐 VARIABLES DE ENTORNO REQUERIDAS

```env
# Factus API
FACTUS_API_KEY=tu_api_key
FACTUS_API_SECRET=tu_api_secret
FACTUS_API_URL=https://api.factus.com.co
FACTUS_AMBIENTE=2  # 1=producción, 2=habilitación

# Storage para PDFs y XMLs
FACTUS_STORAGE_BUCKET=facturas-ule
FACTUS_STORAGE_URL=https://storage.googleapis.com/facturas-ule
```

---

## 📚 RECURSOS ÚTILES

- **Factus Docs:** https://docs.factus.com.co
- **DIAN Normativa:** https://www.dian.gov.co/factura-electronica
- **CUFE Generator:** https://github.com/factus/cufe-generator
- **Códigos DIVIPOLA:** https://www.dane.gov.co/divipola
- **Códigos CIIU:** https://www.dian.gov.co/ciiu

---

**Generado:** 2025-11-25
**Autor:** Claude Code
**Versión:** 1.0
