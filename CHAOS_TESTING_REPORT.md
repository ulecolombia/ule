# 🧨 REPORTE DE CHAOS TESTING - ULE

**Fecha:** 2025-11-24
**Ingeniero QA:** SDET (Software Development Engineer in Test)
**Alcance:** Calculadora PILA y funciones críticas del sistema
**Tests Ejecutados:** 44 tests destructivos

---

## 📊 RESUMEN EJECUTIVO

| Métrica               | Valor       |
| --------------------- | ----------- |
| **Tests Totales**     | 44          |
| **✅ Pasaron**        | 27 (61%)    |
| **❌ Fallaron**       | 17 (39%)    |
| **🔥 Bugs Críticos**  | 11          |
| **⚠️ Bugs Medios**    | 6           |
| **Severidad General** | 🔴 **ALTA** |

---

## 🚨 BUGS CRÍTICOS ENCONTRADOS

### 🔴 CATEGORÍA 1: VALIDACIÓN DE TIPOS (Type Safety)

#### BUG #1: `undefined` no se valida correctamente

**Severidad:** 🔴 CRÍTICA
**Archivo:** `lib/calculadora-pila.ts`
**Función:** `calcularIBC()`, `calcularPension()`

**Problema:**

```typescript
calcularIBC(undefined) // ❌ NO LANZA ERROR - Debería lanzar
calcularPension(undefined) // ❌ NO LANZA ERROR - Debería lanzar
```

**Impacto:**

- Si el frontend envía `undefined`, el cálculo continúa con valores incorrectos
- Puede resultar en cálculos NaN que no se detectan
- Podría causar cobros incorrectos a usuarios

**Reproducción:**

```typescript
const result = calcularIBC(undefined)
// result.ibc = NaN (no lanza error)
```

**Solución Propuesta:**

```typescript
export function calcularIBC(ingresoMensual: number): CalculoIBC {
  // ✅ AGREGAR VALIDACIÓN EXPLÍCITA
  if (ingresoMensual === undefined || ingresoMensual === null) {
    throw new Error('El ingreso mensual es requerido')
  }

  if (isNaN(ingresoMensual) || !isFinite(ingresoMensual)) {
    throw new Error('El ingreso mensual debe ser un número válido')
  }

  if (ingresoMensual <= 0) {
    throw new Error('El ingreso mensual debe ser mayor a cero')
  }

  // ... resto del código
}
```

---

#### BUG #2: `NaN` no se valida correctamente

**Severidad:** 🔴 CRÍTICA
**Archivo:** `lib/calculadora-pila.ts`
**Función:** `calcularIBC()`

**Problema:**

```typescript
calcularIBC(NaN) // ❌ NO LANZA ERROR
// Resultado: { ibc: NaN, ajustado: false }
```

**Impacto:**

- Cálculos con NaN se propagan silenciosamente
- El sistema podría generar comprobantes con valores NaN
- Errores difíciles de debuggear en producción

**Solución:** Agregar validación `isNaN()` y `isFinite()` (ver BUG #1)

---

#### BUG #3-7: Tipos incorrectos no se validan

**Severidad:** 🔴 CRÍTICA
**Archivo:** `lib/calculadora-pila.ts`

**Problema:**
Las funciones aceptan tipos incorrectos sin lanzar errores:

- ❌ `calcularIBC('1000000')` - String
- ❌ `calcularIBC([1000000])` - Array
- ❌ `calcularIBC({ valor: 1000000 })` - Object
- ❌ `calcularIBC(true)` - Boolean
- ❌ `calcularIBC(() => 1000000)` - Function

**Impacto:**

- JavaScript hace coercion de tipos silenciosamente
- `'1000000'` se convierte a `1000000` (funciona por accidente)
- `true` se convierte a `1`
- Arrays/Objects pueden resultar en NaN

**Solución:**

```typescript
export function calcularIBC(ingresoMensual: number): CalculoIBC {
  // ✅ VALIDACIÓN ESTRICTA DE TIPO
  if (typeof ingresoMensual !== 'number') {
    throw new TypeError(
      `El ingreso debe ser un número, recibido: ${typeof ingresoMensual}`
    )
  }

  if (isNaN(ingresoMensual) || !isFinite(ingresoMensual)) {
    throw new Error('El ingreso mensual debe ser un número válido')
  }

  // ... resto
}
```

---

### 🔴 CATEGORÍA 2: SEGURIDAD - INJECTION ATTACKS

#### BUG #8-10: No hay sanitización de inputs maliciosos

**Severidad:** 🔴 CRÍTICA (SEGURIDAD)
**Archivo:** `lib/calculadora-pila.ts`

**Problema:**
El sistema acepta strings maliciosos que podrían usarse en ataques:

- ❌ `calcularIBC("1000000; DROP TABLE users--")` - SQL Injection attempt
- ❌ `calcularIBC("<script>alert('xss')</script>")` - XSS attempt
- ❌ `calcularIBC({ $gt: 0 })` - NoSQL injection attempt

**Impacto:**
Aunque TypeScript debería prevenir esto en tiempo de compilación:

- Si se usa `any` en el frontend, estos valores pueden pasar
- En APIs REST sin validación, pueden llegar estos payloads
- Riesgo de seguridad si se loggean estos valores sin sanitizar

**Solución:**

1. **Validación estricta de tipos** (ver BUG #3-7)
2. **Sanitización en APIs:**

```typescript
// En /app/api/pila/calcular/route.ts
import { z } from 'zod'

const calculoPILASchema = z.object({
  ingresoMensual: z.number().positive().finite(),
  nivelRiesgo: z.enum(['I', 'II', 'III', 'IV', 'V']),
})

export async function POST(req: Request) {
  const body = await req.json()

  // ✅ VALIDAR CON ZOD
  const validacion = calculoPILASchema.safeParse(body)

  if (!validacion.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: validacion.error },
      { status: 400 }
    )
  }

  const { ingresoMensual, nivelRiesgo } = validacion.data
  // Ahora sí es seguro calcular
}
```

---

### ⚠️ CATEGORÍA 3: FUNCIÓN FALTANTE

#### BUG #11: `calcularAportes` no existe (export faltante)

**Severidad:** ⚠️ MEDIA (ERROR DE TESTS)
**Archivo:** `lib/calculadora-pila.ts`

**Problema:**

```typescript
import { calcularAportes } from '../calculadora-pila'
// ❌ TypeError: calcularAportes is not a function
```

**Causa:**
La función se llama `calcularTotalAportes`, no `calcularAportes`

**Solución:**

```typescript
// Opción 1: Agregar alias de export
export { calcularTotalAportes as calcularAportes }

// Opción 2: Actualizar tests para usar nombre correcto
import { calcularTotalAportes } from '../calculadora-pila'
```

---

## ✅ ASPECTOS QUE FUNCIONAN CORRECTAMENTE

### 🟢 VALIDACIONES EXITOSAS:

1. ✅ **Null values** - Correctamente rechazados
2. ✅ **Valores negativos** - Correctamente rechazados
3. ✅ **Infinity** - Correctamente manejado (ajusta a máximo)
4. ✅ **Números extremos (MAX_SAFE_INTEGER)** - Ajusta a IBC_MAXIMO
5. ✅ **Nivel de riesgo inválido** - Lanza error apropiado
6. ✅ **Concurrencia** - 100 llamadas concurrentes sin corrupción
7. ✅ **Performance** - 10,000 cálculos sin memory leaks
8. ✅ **Constantes Colombia** - SMMLV 2025 correcto
9. ✅ **Límites IBC** - Mínimo y máximo correctos
10. ✅ **Todos los niveles ARL** - Definidos correctamente

---

## 📋 PLAN DE ACCIÓN - PRIORIZADO

### 🔥 FASE 1: SEGURIDAD Y VALIDACIÓN (URGENTE - 1 día)

**Prioridad:** 🔴 CRÍTICA

#### Tarea 1.1: Fortalecer validaciones en `calculadora-pila.ts`

**Archivos a modificar:**

- `lib/calculadora-pila.ts`

**Cambios requeridos:**

```typescript
// ✅ NUEVA FUNCIÓN DE VALIDACIÓN CENTRALIZADA
function validarNumeroPositivo(valor: any, nombreCampo: string): number {
  // Validar tipo
  if (typeof valor !== 'number') {
    throw new TypeError(
      `${nombreCampo} debe ser un número, recibido: ${typeof valor}`
    )
  }

  // Validar NaN
  if (isNaN(valor)) {
    throw new Error(`${nombreCampo} no es un número válido (NaN)`)
  }

  // Validar finito
  if (!isFinite(valor)) {
    throw new Error(`${nombreCampo} debe ser un número finito (no Infinity)`)
  }

  // Validar positivo
  if (valor <= 0) {
    throw new Error(`${nombreCampo} debe ser mayor a cero`)
  }

  return valor
}

// ✅ APLICAR EN TODAS LAS FUNCIONES
export function calcularIBC(ingresoMensual: number): CalculoIBC {
  const ingresoValidado = validarNumeroPositivo(
    ingresoMensual,
    'Ingreso mensual'
  )

  let ibc = ingresoValidado
  // ... resto del código
}

export function calcularSalud(ibc: number): number {
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  const resultado = ibcValidado * (PORCENTAJE_SALUD / 100)
  return Math.round(resultado)
}

export function calcularPension(ibc: number): number {
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  const resultado = ibcValidado * (PORCENTAJE_PENSION / 100)
  return Math.round(resultado)
}

export function calcularARL(ibc: number, nivelRiesgo: NivelRiesgoARL): number {
  const ibcValidado = validarNumeroPositivo(ibc, 'IBC')

  const porcentaje = PORCENTAJES_ARL[nivelRiesgo]
  if (!porcentaje) {
    throw new Error(`Nivel de riesgo inválido: ${nivelRiesgo}`)
  }

  const resultado = ibcValidado * (porcentaje / 100)
  return Math.round(resultado)
}
```

**Estimación:** 2-3 horas
**Testing:** Ejecutar tests destructivos y verificar que todos pasen

---

#### Tarea 1.2: Validación en APIs con Zod

**Archivos a crear/modificar:**

- `lib/validations/pila.ts` (NUEVO)
- `app/api/pila/calcular/route.ts`
- `app/api/pila/webhook/route.ts`

**Nuevo archivo de validación:**

```typescript
// lib/validations/pila.ts
import { z } from 'zod'

export const calculoPILASchema = z.object({
  ingresoMensual: z
    .number({
      required_error: 'El ingreso mensual es requerido',
      invalid_type_error: 'El ingreso mensual debe ser un número',
    })
    .positive('El ingreso mensual debe ser positivo')
    .finite('El ingreso mensual debe ser un número finito')
    .max(99999999999, 'El ingreso mensual es demasiado alto'),

  nivelRiesgo: z
    .enum(['I', 'II', 'III', 'IV', 'V'], {
      errorMap: () => ({ message: 'Nivel de riesgo inválido' }),
    })
    .default('I'),
})

export const webhookPILASchema = z.object({
  aporteId: z.string().cuid('ID de aporte inválido'),
  referencia: z.string().min(1, 'Referencia requerida'),
})
```

**Aplicar en API:**

```typescript
// app/api/pila/calcular/route.ts
import { calculoPILASchema } from '@/lib/validations/pila'

export async function POST(req: Request) {
  const body = await req.json()

  // ✅ VALIDAR CON ZOD
  const validacion = calculoPILASchema.safeParse(body)

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: 'Datos de entrada inválidos',
        details: validacion.error.flatten(),
      },
      { status: 400 }
    )
  }

  // Ahora los datos están garantizados como correctos
  const { ingresoMensual, nivelRiesgo } = validacion.data

  try {
    const aportes = calcularTotalAportes(ingresoMensual, nivelRiesgo)
    return NextResponse.json({ success: true, aportes })
  } catch (error) {
    // Capturar errores de cálculo
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Estimación:** 3-4 horas
**Testing:** Tests de integración de API

---

### 🟡 FASE 2: MEJORAS DE CALIDAD (MEDIA - 1 día)

**Prioridad:** ⚠️ MEDIA

#### Tarea 2.1: Agregar tests unitarios para validaciones

**Archivo a crear:**

- `lib/__tests__/calculadora-pila-validations.test.ts`

**Contenido:**

```typescript
describe('Validaciones de entrada', () => {
  describe('validarNumeroPositivo', () => {
    it('debe rechazar undefined', () => {
      expect(() => calcularIBC(undefined)).toThrow(TypeError)
    })

    it('debe rechazar null', () => {
      expect(() => calcularIBC(null)).toThrow(TypeError)
    })

    it('debe rechazar NaN', () => {
      expect(() => calcularIBC(NaN)).toThrow('no es un número válido')
    })

    // ... más tests
  })
})
```

**Estimación:** 2-3 horas

---

#### Tarea 2.2: Documentación de errores

**Archivo a crear:**

- `docs/ERRORES_COMUNES.md`

**Contenido:**

```markdown
# Errores Comunes - Calculadora PILA

## TypeError: El ingreso debe ser un número

**Causa:** Se envió un valor que no es número
**Solución:** Asegúrate de convertir strings a números con `Number(valor)` o `parseFloat(valor)`

## Error: El ingreso mensual debe ser mayor a cero

**Causa:** Se envió 0 o un número negativo
**Solución:** Validar en el frontend que el usuario ingrese un valor positivo
```

**Estimación:** 1 hora

---

### 🟢 FASE 3: OPTIMIZACIÓN (BAJA - 2 días)

**Prioridad:** 🟢 BAJA

#### Tarea 3.1: Agregar logging de errores

**Archivo a modificar:**

- `lib/calculadora-pila.ts`

**Agregar:**

```typescript
import { logger } from '@/lib/logger'

function validarNumeroPositivo(valor: any, nombreCampo: string): number {
  if (typeof valor !== 'number') {
    logger.warn('Tipo incorrecto en cálculo PILA', {
      campo: nombreCampo,
      valorRecibido: valor,
      tipoRecibido: typeof valor,
    })
    throw new TypeError(/*...*/)
  }
  // ...
}
```

**Estimación:** 2 horas

---

#### Tarea 3.2: Agregar métricas de errores

**Usar Sentry para trackear:**

- Frecuencia de errores de validación
- Tipos de errores más comunes
- Endpoints más problemáticos

**Estimación:** 2 horas

---

## 📈 MÉTRICAS DE ÉXITO

### Antes de las correcciones:

- ❌ 17 tests fallando (39%)
- 🔴 11 bugs críticos
- ⚠️ 6 bugs medios

### Después de las correcciones (objetivo):

- ✅ 100% tests pasando
- 🟢 0 bugs críticos
- 🟢 0 bugs medios
- 🟢 Cobertura de código > 90%

---

## 🕐 TIMELINE ESTIMADO

| Fase                           | Duración     | Recursos        |
| ------------------------------ | ------------ | --------------- |
| Fase 1: Seguridad y Validación | 1 día        | 1 dev senior    |
| Fase 2: Mejoras de Calidad     | 1 día        | 1 dev mid-level |
| Fase 3: Optimización           | 2 días       | 1 dev junior    |
| Testing Final                  | 0.5 días     | QA Engineer     |
| **TOTAL**                      | **4.5 días** | **2-3 devs**    |

---

## 🔄 PROCESO DE IMPLEMENTACIÓN

### 1. Pre-implementación

- [ ] Crear branch de trabajo: `fix/chaos-testing-critical-bugs`
- [ ] Comunicar cambios al equipo
- [ ] Preparar entorno de testing

### 2. Implementación

- [ ] Fase 1: Validaciones críticas
- [ ] Ejecutar tests: `npm test -- chaos-destructive.test.ts`
- [ ] Verificar: 0 tests fallando
- [ ] Code review
- [ ] Merge a develop

### 3. Post-implementación

- [ ] Monitorear errores en producción
- [ ] Actualizar documentación
- [ ] Training al equipo sobre nuevas validaciones

---

## 📞 CONTACTO

**Responsable QA:** SDET
**Fecha Límite:** 2025-11-28
**Status:** 🔴 CRÍTICO - REQUIERE ACCIÓN INMEDIATA

---

## 🔖 ANEXOS

### Anexo A: Comandos útiles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests destructivos
npm test -- chaos-destructive.test.ts

# Ver cobertura
npm test -- --coverage

# Watch mode para desarrollo
npm test -- --watch
```

### Anexo B: Referencias

- [Documentación Zod](https://zod.dev)
- [Jest Best Practices](https://jestjs.io/docs/getting-started)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

**FIN DEL REPORTE**

🧨 Este reporte fue generado mediante Chaos Testing - Metodología de testing destructivo diseñada para encontrar bugs antes de que lleguen a producción.
