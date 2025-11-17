# 📚 Documentación del Proyecto ULE

**Guía rápida para restaurar contexto del proyecto**

---

## 🚀 Start Here (5 minutos)

Si eres nuevo en el proyecto o necesitas restaurar contexto rápidamente, lee en este orden:

### 1️⃣ [CURRENT_STATE.md](./CURRENT_STATE.md) - **Empieza aquí** ⭐

**Tiempo**: 2 min | **Prioridad**: 🔴 Alta

**Lee esto primero** para saber:

- ✅ Qué está completado
- 🚧 Qué está en progreso
- 🔴 Issues críticos actuales
- 🎯 Próximos pasos sugeridos

### 2️⃣ [ARCHITECTURE.md](./ARCHITECTURE.md) - Estructura técnica

**Tiempo**: 10 min | **Prioridad**: 🟡 Media

Lee esto cuando necesites entender:

- 📁 Estructura del proyecto
- 🔄 Flujos principales (auth, onboarding, facturación, PILA)
- 🗄️ Modelos de base de datos
- 🔐 Configuración de seguridad
- 📦 Stack tecnológico

### 3️⃣ [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Estándares UI/UX

**Tiempo**: 5 min | **Prioridad**: 🟢 Baja

Lee esto cuando vayas a:

- 🎨 Crear nuevos componentes
- 📱 Trabajar en UI/UX
- ♿ Implementar accesibilidad
- 🌙 Agregar dark mode

---

## 🎯 Lectura por Objetivo

### "Necesito implementar una nueva feature"

1. Lee [CURRENT_STATE.md](./CURRENT_STATE.md) → ¿Ya existe algo similar?
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) → ¿Dónde va el código?
3. Lee [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) → ¿Qué componentes uso?

### "Necesito arreglar un bug"

1. Lee [CURRENT_STATE.md](./CURRENT_STATE.md) → Issues conocidos
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) → Flujos y archivos relacionados

### "Soy nuevo en el proyecto"

1. Lee [CURRENT_STATE.md](./CURRENT_STATE.md) → Estado general
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) → Estructura completa
3. Lee [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) → Estándares de código UI

### "Necesito hacer code review"

1. Lee [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) → Checklist de componente
2. Lee [ARCHITECTURE.md](./ARCHITECTURE.md) → Patrones y convenciones
3. Lee [CURRENT_STATE.md](./CURRENT_STATE.md) → Issues a evitar

---

## 📊 Resumen Rápido del Proyecto

**Nombre**: ULE - Gestión de Seguridad Social para Independientes
**Stack**: Next.js 14 + TypeScript + Prisma + NextAuth + Tailwind
**Versión**: 0.2.1
**Fase actual**: Subfase 0.2 - Sistema de Autenticación Completo

### Módulos Principales

- ✅ **Autenticación** - Completo (login, registro, OAuth)
- ✅ **Dashboard** - Completo (métricas, navegación, notificaciones)
- 🚧 **Onboarding** - Parcial (4 pasos, validación pendiente)
- 🚧 **Facturación** - Parcial (CRUD básico, falta DIAN)
- 🚧 **PILA** - Parcial (calculadora ok, falta pago)
- 🚧 **Asesoría IA** - Parcial (chat básico funcional)

### Issues Críticos Actuales (🔴 Alta Prioridad)

1. Import error en button.tsx → falta `/lib/theme.ts`
2. 50+ TODOs sin resolver
3. Logging inconsistente
4. Validación de ENV faltante

---

## 🔄 Mantener Documentación Actualizada

**Cuándo actualizar cada archivo**:

| Archivo            | Actualizar cuando...                                              | Frecuencia      |
| ------------------ | ----------------------------------------------------------------- | --------------- |
| `CURRENT_STATE.md` | Completes una feature, encuentres un bug, cambies prioridades     | Diaria/Semanal  |
| `ARCHITECTURE.md`  | Agregues un módulo nuevo, cambies estructura, nuevas dependencias | Mensual         |
| `DESIGN_SYSTEM.md` | Crees un componente nuevo, cambies paleta, actualices tipografía  | Según necesidad |
| `INDEX.md`         | Agregues nuevo archivo de docs, cambies orden de lectura          | Rara vez        |

---

## 📝 Comandos Útiles

```bash
# Leer documentación rápidamente
cat docs/CURRENT_STATE.md

# Buscar en toda la documentación
grep -r "keyword" docs/

# Ver última actualización
ls -lt docs/
```

---

## 🔗 Enlaces Externos

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth v5 Docs](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod Validation](https://zod.dev/)

---

**Última actualización**: 2025-11-15
**Mantenedor**: Equipo Ule
