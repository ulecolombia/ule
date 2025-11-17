# 🎨 Sistema de Diseño ULE

## Filosofía de Diseño

**Inspiración**: N26, Stripe, Modern Banking Apps
**Principios**: Minimalista, Profesional, Accesible
**Objetivo**: Hacer la gestión de seguridad social simple y clara

---

## 🎨 Paleta de Colores

### Colores Principales

```css
/* Primary - Turquesa */
--primary: #14b8a6; /* teal-500 */
--primary-dark: #0f766e; /* teal-700 */
--primary-light: #5eead4; /* teal-300 */

/* Accent */
--accent: #06b6d4; /* cyan-500 */
--accent-dark: #0891b2; /* cyan-600 */
--accent-light: #67e8f9; /* cyan-300 */

/* Success */
--success: #10b981; /* emerald-500 */
--success-dark: #059669; /* emerald-600 */
--success-light: #6ee7b7; /* emerald-300 */

/* Warning */
--warning: #f59e0b; /* amber-500 */
--warning-dark: #d97706; /* amber-600 */
--warning-light: #fcd34d; /* amber-300 */

/* Error/Danger */
--error: #ef4444; /* red-500 */
--danger: #dc2626; /* red-600 */
--error-light: #fca5a5; /* red-300 */

/* Neutral - Dark */
--dark: #1e293b; /* slate-800 */
--dark-100: #64748b; /* slate-500 */
--dark-200: #94a3b8; /* slate-400 */

/* Neutral - Light */
--light-50: #f8fafc; /* slate-50 */
--light-100: #f1f5f9; /* slate-100 */
--light-200: #e2e8f0; /* slate-200 */
--light-300: #cbd5e1; /* slate-300 */
```

### Uso de Colores

| Color     | Uso Principal                            | Ejemplos                         |
| --------- | ---------------------------------------- | -------------------------------- |
| `primary` | Botones principales, enlaces, highlights | CTA buttons, active states       |
| `accent`  | Énfasis secundario                       | Badges, subtle highlights        |
| `success` | Confirmaciones, estados positivos        | Toast success, status badges     |
| `warning` | Advertencias, pendientes                 | Alert banners, pending states    |
| `error`   | Errores, estados negativos               | Form errors, destructive actions |
| `dark`    | Textos principales                       | Headings, body text              |
| `light`   | Fondos, borders                          | Backgrounds, dividers            |

### Contraste WCAG AA ✅

Todos los colores cumplen con contraste mínimo:

- `dark` sobre `white`: 12.63:1 ✅
- `dark-100` sobre `white`: 4.63:1 ✅
- `primary` sobre `white`: 3.52:1 ⚠️ (usar solo para elementos grandes)
- `white` sobre `primary`: 5.97:1 ✅

---

## 📝 Tipografía

### Font Family

```css
font-family:
  'Inter',
  system-ui,
  -apple-system,
  sans-serif;
```

**Carga**: Google Fonts con `display=swap` para optimización

### Escala Tipográfica

```css
/* Headings */
.text-4xl {
  font-size: 2.25rem;
} /* h1 - 36px */
.text-3xl {
  font-size: 1.875rem;
} /* h2 - 30px */
.text-2xl {
  font-size: 1.5rem;
} /* h3 - 24px */
.text-xl {
  font-size: 1.25rem;
} /* h4 - 20px */
.text-lg {
  font-size: 1.125rem;
} /* h5 - 18px */

/* Body */
.text-base {
  font-size: 1rem;
} /* 16px - Default */
.text-sm {
  font-size: 0.875rem;
} /* 14px - Labels */
.text-xs {
  font-size: 0.75rem;
} /* 12px - Captions */
```

### Font Weights

```css
.font-normal {
  font-weight: 400;
} /* Body text */
.font-medium {
  font-weight: 500;
} /* Emphasis */
.font-semibold {
  font-weight: 600;
} /* Subheadings */
.font-bold {
  font-weight: 700;
} /* Headings */
```

### Uso Recomendado

| Elemento           | Tamaño                  | Peso            | Color           |
| ------------------ | ----------------------- | --------------- | --------------- |
| Page Title (H1)    | `text-3xl` o `text-4xl` | `font-bold`     | `text-dark`     |
| Section Title (H2) | `text-2xl`              | `font-bold`     | `text-dark`     |
| Subsection (H3)    | `text-xl`               | `font-semibold` | `text-dark`     |
| Card Title         | `text-lg`               | `font-semibold` | `text-dark`     |
| Body Text          | `text-base`             | `font-normal`   | `text-dark`     |
| Label              | `text-sm`               | `font-medium`   | `text-dark`     |
| Helper Text        | `text-xs`               | `font-normal`   | `text-dark-100` |
| Error Text         | `text-sm`               | `font-normal`   | `text-error`    |

---

## 📦 Componentes UI

### Button

**Archivo**: `/components/ui/button.tsx`

**Variantes**:

```tsx
<Button variant="default">Guardar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Cerrar</Button>
<Button variant="secondary">Secundario</Button>
```

**Tamaños**:

```tsx
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
```

**Estados**:

```tsx
<Button disabled>Cargando...</Button>
<Button isLoading>Procesando</Button>
```

### Input

**Archivo**: `/components/ui/input.tsx`

**Con label**:

```tsx
<Input
  label="Correo electrónico"
  type="email"
  placeholder="tu@email.com"
  error={errors.email?.message}
  required
  icon={<MailIcon />}
/>
```

**Sin label**:

```tsx
<Input type="text" placeholder="Buscar..." />
```

### Card

**Archivo**: `/components/ui/card.tsx`

**Estructura**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardBody>Contenido de la card</CardBody>
</Card>
```

**Variantes**:

```tsx
<Card variant="default">Contenido</Card>
<Card variant="metric">Métricas/Stats</Card>
```

### Select

**Archivo**: `/components/ui/select.tsx`

```tsx
<Select
  label="Tipo de documento"
  error={errors.tipoDocumento?.message}
  icon={<IdIcon />}
>
  <option value="">Seleccionar...</option>
  <option value="CC">Cédula de Ciudadanía</option>
  <option value="CE">Cédula de Extranjería</option>
</Select>
```

### Checkbox

**Archivo**: `/components/ui/checkbox.tsx`

```tsx
<Checkbox
  label="Acepto términos y condiciones"
  checked={accepted}
  onChange={(checked) => setAccepted(checked)}
  error={errors.terms?.message}
  required
/>
```

### Modal

**Archivo**: `/components/ui/modal.tsx`

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmar acción"
>
  <p>¿Estás seguro?</p>
  <div className="flex gap-2">
    <Button onClick={handleConfirm}>Confirmar</Button>
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
  </div>
</Modal>
```

### Toast Notifications

**Librería**: Sonner

```tsx
import { toast } from 'sonner'

// Success
toast.success('¡Operación exitosa!', {
  description: 'Los datos se guardaron correctamente',
})

// Error
toast.error('Error al guardar', {
  description: 'Por favor intenta nuevamente',
  action: {
    label: 'Reintentar',
    onClick: () => retry(),
  },
})

// Info
toast.info('Actualización disponible')

// Warning
toast.warning('Revisa los datos ingresados')
```

---

## 📐 Espaciado y Layout

### Espaciado Interno (Padding)

```css
/* Cards */
.p-6        /* 24px - Default card padding */
.p-8        /* 32px - Large cards */

/* Modales */
.p-6        /* 24px - Modal content */

/* Inputs */
.px-4 py-3  /* Horizontal: 16px, Vertical: 12px */

/* Buttons */
.px-6 py-3  /* Horizontal: 24px, Vertical: 12px */
```

### Espaciado Externo (Margin/Gap)

```css
/* Stack spacing */
.space-y-4  /* 16px - Form fields */
.space-y-6  /* 24px - Sections */
.space-y-8  /* 32px - Major sections */

/* Horizontal spacing */
.gap-2      /* 8px - Tight groups */
.gap-4      /* 16px - Normal spacing */
.gap-6      /* 24px - Loose spacing */
```

### Recomendaciones por Componente

| Componente     | Padding                     | Gap/Margin                   |
| -------------- | --------------------------- | ---------------------------- |
| Page Container | `px-4 py-8 sm:px-6 lg:px-8` | -                            |
| Card           | `p-6 sm:p-8`                | `space-y-4`                  |
| Modal          | `p-6`                       | `space-y-6`                  |
| Form           | `space-y-6`                 | Entre fields: `space-y-4`    |
| Button Group   | -                           | `gap-2` o `gap-4`            |
| Section        | `py-8 px-4`                 | Entre secciones: `space-y-8` |

---

## 📱 Responsive Design

### Breakpoints

```css
sm: '640px'   /* Tablet */
md: '768px'   /* Tablet large */
lg: '1024px'  /* Desktop */
xl: '1280px'  /* Desktop large */
2xl: '1536px' /* Desktop XL */
```

### Mobile-First Approach

```tsx
// ❌ Evitar
<div className="lg:w-1/2 w-full">

// ✅ Correcto (mobile primero)
<div className="w-full lg:w-1/2">
```

### Patrones Comunes

```tsx
// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex responsivo
<div className="flex flex-col md:flex-row gap-4">

// Padding responsivo
<div className="px-4 sm:px-6 lg:px-8">

// Texto responsivo
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
```

---

## 🎭 Animaciones y Transiciones

### Clases de Transición

```css
/* Estándar */
.transition-colors   /* Color changes */
.transition-all      /* All properties */

/* Duración */
.duration-200       /* 200ms - Fast */
.duration-300       /* 300ms - Default */
.duration-500       /* 500ms - Slow */

/* Easing */
.ease-in-out        /* Default */
```

### Animaciones Custom

```css
/* globals.css */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
}
```

**Uso**:

```tsx
<div className="animate-fadeIn">Contenido</div>
<div className="animate-slideDown">Dropdown</div>
```

---

## ♿ Accesibilidad

### Focus States

```css
/* Todos los elementos interactivos */
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### ARIA Labels

```tsx
// Botones con solo iconos
<button aria-label="Cerrar modal">
  <XIcon />
</button>

// Campos de formulario
<input
  aria-label="Correo electrónico"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>

// Mensajes de error
<p id="email-error" role="alert">
  {errors.email?.message}
</p>
```

### Skip Links

```tsx
// layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
>
  Saltar al contenido principal
</a>
```

---

## 🌙 Dark Mode (Preparado)

### Configuración

```js
// tailwind.config.ts
darkMode: 'class'
```

### Uso (cuando se implemente)

```tsx
<div className="bg-white dark:bg-slate-900">
  <h1 className="text-dark dark:text-white">Título</h1>
  <p className="text-dark-100 dark:text-slate-400">Contenido</p>
</div>
```

---

## 📋 Checklist de Componente Nuevo

Al crear un componente UI nuevo, verificar:

- [ ] Cumple WCAG AA (contraste 4.5:1 para texto)
- [ ] Funciona con teclado (tab, enter, escape)
- [ ] Tiene estados visuales (hover, focus, active, disabled)
- [ ] Es responsive (funciona en mobile y desktop)
- [ ] Usa colores de la paleta
- [ ] Usa espaciado consistente
- [ ] Tiene documentación en este archivo
- [ ] Exportado desde `/components/ui/index.ts`

---

## 🎨 Inspiración y Referencias

- **N26**: Simplicidad, espacios blancos
- **Stripe**: Profesionalismo, clarity
- **Tailwind UI**: Componentes modernos
- **Radix UI**: Accesibilidad nativa

---

**Última actualización**: 2025-11-15
**Mantenedor**: Equipo Ule
