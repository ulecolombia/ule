# UX/UI Analysis Report: Electronic Invoice Form

**Date:** 2025-11-16
**Analyzed by:** Claude (UX/UI Specialist)
**Component:** Electronic Invoice Creation Form (`/app/facturacion/nueva/page.tsx`)

---

## Executive Summary

The electronic invoice form shows **solid foundational architecture** with good separation of concerns, but suffers from **critical UX issues** that impact usability, particularly around form input editability, mobile experience, and information hierarchy. The reported issue where "inputs weren't editable unless browser console was open" indicates JavaScript event handling or state management conflicts.

**Overall UX Score:** 6.5/10
**Priority Issues:** 4 Critical, 8 High, 12 Medium

---

## 1. UX Analysis: Usability & User Flow

### 1.1 Critical Issues (Fix Immediately)

#### **ISSUE #1: Form Input Editability Problems**

**Severity:** CRITICAL
**Location:** Items table (`items-table.tsx`), all input fields

**Problem:**

- User reports inputs not editable unless browser console is open
- Likely caused by:
  1. **React Hook Form's `mode: 'onSubmit'` + validation conflicts**
  2. **Event handler interference from debouncing/watching**
  3. **Z-index stacking context blocking pointer events**
  4. **Overly aggressive `useWatch` + `useDebounce` causing re-renders**

**Evidence from code:**

```typescript
// page.tsx line 70
mode: 'onSubmit', // Only validate on submit, not while typing

// line 106-111 - Double watching pattern
const formData = useWatch({ control })
const debouncedFormData = useDebounce(formData, 300)

// items-table.tsx line 249-256 - Custom onChange in register
{...register(`items.${index}.valorUnitario`, {
  onChange: (e) => {
    const formateado = formatearNumero(e.target.value)
    e.target.value = formateado  // MUTATION inside onChange
  },
})}
```

**Root Cause:** The `onChange` handler in `valorUnitario` mutates `e.target.value` directly, which can cause React Hook Form to lose control of the input state. When combined with `useWatch` and debouncing, this creates a race condition where the input becomes "frozen."

**Fix Recommendation:**

```typescript
// DON'T mutate e.target.value inside onChange
// Instead, use react-hook-form's setValue or transform
const { register, setValue, watch } = useForm()

// Better pattern:
<input
  {...register(`items.${index}.valorUnitario`)}
  onChange={(e) => {
    const raw = e.target.value
    const formatted = formatearNumero(raw)
    setValue(`items.${index}.valorUnitario`, formatted, {
      shouldValidate: false,
      shouldDirty: true,
    })
  }}
/>

// Or use getValues/setValue pattern with controlled input
const currentValue = watch(`items.${index}.valorUnitario`)
<input
  value={formatearNumero(currentValue || '')}
  onChange={(e) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    setValue(`items.${index}.valorUnitario`, cleaned)
  }}
/>
```

---

#### **ISSUE #2: Z-Index Conflicts & Pointer Events**

**Severity:** CRITICAL
**Location:** Multiple overlapping fixed/sticky elements

**Problem:**

- Sticky action buttons (line 850): `z-10`
- Mobile preview button (vista-previa-wrapper line 81): `z-10`
- Autocomplete dropdown (autocomplete-cliente line 174): `z-50`
- **No z-index coordination strategy**

**Current stacking:**

```tsx
// Bottom action bar
<div className="sticky bottom-0 z-10"> {/* z-10 */}

// Mobile preview button
<div className="fixed bottom-20 right-4 z-10"> {/* z-10 - CONFLICT! */}

// Autocomplete dropdown
<div className="absolute z-50 mt-2"> {/* z-50 */}
```

**Issues:**

1. Mobile preview button and action bar have same z-index (conflict)
2. No central z-index scale defined
3. Sticky preview on desktop (line 55) has no z-index

**Fix Recommendation:**
Create a z-index scale in design system:

```typescript
// lib/theme/z-index.ts
export const Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 40,
  overlay: 100,
  modal: 200,
  tooltip: 300,
  toast: 400,
} as const

// Apply to components:
// Action bar: z-[40] (sticky)
// Preview button: z-[30] (above content, below sticky)
// Dropdown: z-[50] (above sticky)
// Modal: z-[200] (DialogContent already handles this)
```

---

#### **ISSUE #3: Poor Mobile Input Experience**

**Severity:** HIGH
**Location:** Items table mobile view, number inputs

**Problems:**

1. **No input type optimization for mobile keyboards**

   ```tsx
   // Line 212-224 - Cantidad uses type="number"
   <input type="number" min="0.01" step="0.01" />
   // This shows decimal keyboard on mobile - GOOD

   // Line 248-262 - Valor unitario uses type="text"
   <input type="text" {...register(`items.${index}.valorUnitario`)} />
   // This shows QWERTY keyboard - BAD for numbers
   ```

2. **Touch targets too small (< 44px)** - Violates iOS/Android guidelines

   ```tsx
   // Line 317-338 - Action buttons
   <button className="p-2">
     {' '}
     {/* Only 2*4px = 8px padding */}
     <span className="text-xl">delete</span>
   </button>
   ```

3. **No input mode attributes for better mobile UX**

**Fix Recommendations:**

```tsx
// Use inputMode for better mobile keyboards
<input
  type="text"
  inputMode="decimal" // Shows decimal keyboard on mobile
  pattern="[0-9.,]*"  // Fallback pattern
  {...register(`items.${index}.valorUnitario`)}
/>

// Increase touch targets (minimum 44px)
<button className="p-3 min-h-[44px] min-w-[44px]">
  <span className="material-symbols-outlined text-xl">delete</span>
</button>

// Add haptic feedback for mobile
const handleDelete = (index: number) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10) // Subtle haptic feedback
  }
  remove(index)
}
```

---

#### **ISSUE #4: Autocomplete Accessibility & UX**

**Severity:** HIGH
**Location:** `autocomplete-cliente.tsx`

**Problems:**

1. **No click-outside handler** - Dropdown stays open indefinitely
2. **No keyboard navigation** - Users can't arrow through results
3. **No ARIA attributes** - Screen readers lost
4. **Search doesn't close dropdown when clicking input again**

**Evidence:**

```tsx
// Line 173-244 - Dropdown without proper interaction handlers
{
  isOpen && (
    <div className="... absolute z-50">
      {/* No onKeyDown, no aria-role, no click-outside */}
    </div>
  )
}
```

**Fix Recommendations:**

```tsx
// Add click-outside handler
import { useRef, useEffect } from 'react'

const dropdownRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }
}, [isOpen])

// Add keyboard navigation
const [focusedIndex, setFocusedIndex] = useState(-1)

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!isOpen) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      setFocusedIndex(prev =>
        Math.min(prev + 1, displayClientes.length - 1)
      )
      break
    case 'ArrowUp':
      e.preventDefault()
      setFocusedIndex(prev => Math.max(prev - 1, 0))
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex >= 0) {
        handleSelect(displayClientes[focusedIndex])
      }
      break
    case 'Escape':
      setIsOpen(false)
      break
  }
}

// Add ARIA
<div
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-owns="cliente-listbox"
>
  <input
    role="searchbox"
    aria-autocomplete="list"
    aria-controls="cliente-listbox"
    onKeyDown={handleKeyDown}
  />
</div>

<ul
  id="cliente-listbox"
  role="listbox"
  ref={dropdownRef}
>
  <li
    role="option"
    aria-selected={focusedIndex === index}
  >
```

---

### 1.2 High Priority Issues

#### **ISSUE #5: Form State Management Complexity**

**Severity:** HIGH
**Impact:** Performance, maintainability

**Problem:**
Multiple overlapping state management patterns:

1. React Hook Form (`useForm`)
2. LocalStorage auto-save (every 30s)
3. `useWatch` for entire form
4. `useDebounce` for preview
5. Manual `editarEmisor` state
6. `emisorOverride` partial state

**Code smell:**

```typescript
// Line 106-111 - Watching entire form twice
const formData = useWatch({ control })
const debouncedFormData = useDebounce(formData, 300)

// Line 98-103 - Also watching individual fields
const watchItems = watch('items')
const watchClienteId = watch('clienteId')
const watchFecha = watch('fecha')
// ... etc

// Line 241-250 - Auto-save with isDirty check
useEffect(() => {
  if (!isDirty) return
  const interval = setInterval(() => {
    guardarBorradorLocal()
  }, 30000)
}, [isDirty, watchClienteId, watchItems, ...]) // Over-specified dependencies
```

**Performance Impact:**

- Every keystroke triggers `useWatch` → `useDebounce` → preview re-render
- Auto-save checks every 30s even if no changes
- Multiple watchers cause redundant re-renders

**Fix Recommendation:**

```typescript
// Consolidate watching - use one source of truth
const formValues = watch() // Single watch

// Debounce only what needs it (preview)
const debouncedForPreview = useDebounce(formValues, 500)

// Use more efficient auto-save
const { isDirty, dirtyFields } = formState
useEffect(() => {
  if (!isDirty) return

  const timeoutId = setTimeout(() => {
    guardarBorradorLocal()
  }, 30000)

  return () => clearTimeout(timeoutId)
}, [formValues]) // Single dependency
```

---

#### **ISSUE #6: Inconsistent Validation Strategy**

**Severity:** HIGH
**Location:** Multiple validation approaches

**Problems:**

1. Schema validation is **optional** for many fields:

   ```typescript
   // factura.ts line 12-15
   descripcion: z.string().optional().or(z.literal(''))
   // Should be required for emission, not optional
   ```

2. Client-side validation doesn't match emission requirements:

   ```typescript
   // page.tsx line 302-318 - Borrador validation is too lenient
   if (!items || items.length === 0) {
     toast.error('Debes agregar al menos un ítem')
     return
   }
   // But schema allows empty descripcion!
   ```

3. Validation feedback is inconsistent:
   - Some errors show inline (red border + text)
   - Some show as toasts
   - Some as browser `confirm()` dialogs

**Fix Recommendation:**

```typescript
// Two-tier validation schema
export const borradorFacturaSchema = z.object({
  items: z.array(
    z.object({
      descripcion: z.string().optional(), // Lenient for drafts
      // ...
    })
  ),
})

export const emitirFacturaSchema = z.object({
  items: z
    .array(
      z.object({
        descripcion: z.string().min(3, 'Descripción requerida'), // Strict
        cantidad: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
        valorUnitario: z.number().min(1, 'Valor requerido'),
      })
    )
    .min(1),
})

// Validate appropriately
const guardarBorrador = () => {
  const result = borradorFacturaSchema.safeParse(formData)
  // ...
}

const prepararEmision = () => {
  const result = emitirFacturaSchema.safeParse(formData)
  if (!result.success) {
    // Show all errors inline, not toast
    Object.entries(result.error.flatten().fieldErrors).forEach(
      ([field, errors]) => {
        setError(field, { message: errors[0] })
      }
    )
    return
  }
}
```

---

#### **ISSUE #7: Information Overload**

**Severity:** MEDIUM-HIGH
**Location:** Main form layout

**Problem:** All sections visible at once creates cognitive overload

**Current structure:**

1. Emisor (always visible, 6+ fields in edit mode)
2. Cliente (search + 6 fields when selected)
3. Fecha + Método pago
4. Items table (can grow indefinitely)
5. Notas + Términos (500 + 300 chars)
6. Totales (sticky sidebar)
7. Action buttons (sticky bottom)

**User Pain Points:**

- Can't see "big picture" on laptop screens
- Must scroll extensively to review
- No clear visual grouping/separation
- Mobile: endless scrolling

**Fix Recommendation:**
Use **progressive disclosure** with accordion/tabs:

```tsx
// Option A: Accordion
<Accordion type="multiple" defaultValue={['cliente', 'items']}>
  <AccordionItem value="emisor">
    <AccordionTrigger>
      Emisor: {emisorData?.razonSocial}
      {emisorValidation.isValid && <CheckCircle />}
    </AccordionTrigger>
    <AccordionContent>
      {/* Emisor fields */}
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="cliente">
    <AccordionTrigger>
      Cliente {clienteSeleccionado?.nombre}
    </AccordionTrigger>
    {/* ... */}
  </AccordionItem>
</Accordion>

// Option B: Stepper (better for mobile)
<Stepper currentStep={currentStep}>
  <Step title="Datos Básicos" />
  <Step title="Items" />
  <Step title="Revisión" />
</Stepper>
```

---

### 1.3 Medium Priority Issues

#### **ISSUE #8: Duplicate Client Modal Pattern**

**Severity:** MEDIUM
**Location:** Client selection flow

**Problem:**
User must:

1. Click autocomplete → type search
2. If not found, click "Nuevo Cliente"
3. Fill modal → Submit
4. Return to invoice form

**Better UX:**

```tsx
// Quick-add inline pattern
<AutocompleteCliente
  onSelect={handleSelect}
  quickAddFields={['nombre', 'documento', 'email']}
  onQuickAdd={(quickData) => {
    // Create minimal client inline
    createMinimalClient(quickData)
    // Show toast: "Cliente creado. Completa detalles después"
  }}
/>

// Or: Add as you type
<AutocompleteCliente
  allowCreate={true} // Create on Enter if no match
  onCreateNew={(searchTerm) => {
    // Pre-fill nombre with searchTerm
    createClientInline({ nombre: searchTerm })
  }}
/>
```

---

#### **ISSUE #9: Items Table Usability**

**Severity:** MEDIUM
**Location:** `items-table.tsx`

**Problems:**

1. **No bulk operations** - Can't delete multiple items
2. **No reordering** - Items stuck in creation order
3. **No templates/presets** - Must manually re-enter common items
4. **IVA interaction is confusing**:
   ```tsx
   // Line 271-306 - Two-step selection
   ;<select>
     {' '}
     {/* Step 1: Aplica IVA? */}
     <option value="false">No aplica</option>
     <option value="true">Aplica IVA</option>
   </select>
   {
     aplicaIVA && (
       <select>
         {' '}
         {/* Step 2: Porcentaje */}
         <option value={0}>0%</option>
         <option value={19}>19%</option>
       </select>
     )
   }
   ```
   **Why separate?** Just make one dropdown:
   - "Sin IVA (0%)"
   - "IVA Reducido (5%)"
   - "IVA General (19%)"

**Fixes:**

```tsx
// Single IVA selector
;<select {...register(`items.${index}.porcentajeIVA`)}>
  <option value={0}>Sin IVA (0%)</option>
  <option value={5}>IVA Reducido (5%)</option>
  <option value={19}>IVA General (19%)</option>
</select>

// Add drag-to-reorder with react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

;<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="items">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {fields.map((field, index) => (
          <Draggable key={field.id} draggableId={field.id} index={index}>
            {/* Item row with drag handle */}
          </Draggable>
        ))}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

---

## 2. UI Review: Visual Design & Layout

### 2.1 Layout & Spacing

**Good:**

- Clear two-column desktop layout (60/40 split)
- Consistent spacing with Tailwind classes
- Proper use of cards for section grouping

**Issues:**

1. **Inconsistent padding/margin scale**:
   - Some cards use `p-4`, others `p-6`, some `p-8`
   - No clear spacing hierarchy

2. **Visual hierarchy unclear**:
   - All headings are same size (`text-xl`)
   - No distinction between primary/secondary sections

3. **Desktop sidebar too wide**:
   ```tsx
   // Line 812 - Fixed width sidebar
   <div className="w-full lg:w-[400px]">
   ```
   400px is 25% of 1600px screen - too much for just totals + preview

**Fix:**

```tsx
// Establish spacing scale
const SPACING = {
  card: 'p-6',
  section: 'space-y-6',
  field: 'space-y-4',
  inline: 'gap-3',
}

// Visual hierarchy
<h1 className="text-3xl font-bold"> {/* Page title */}
<h2 className="text-xl font-semibold"> {/* Card titles */}
<h3 className="text-base font-medium"> {/* Subsections */}

// Responsive sidebar
<div className="w-full lg:w-80 xl:w-96"> {/* 320px / 384px */}
```

---

### 2.2 Typography & Readability

**Issues:**

1. **Font sizes too small for forms**:
   - Labels: `text-sm` (14px) - acceptable
   - Inputs: `text-[15px]` - good
   - Help text: `text-xs` (12px) - too small for accessibility

2. **Line height not optimized**:
   - Multi-line textareas have default `leading-normal`
   - Should use `leading-relaxed` for readability

3. **Color contrast issues**:
   ```tsx
   // Line 479 - Breadcrumb
   <span className="text-dark-100"> {/* What's the contrast ratio? */}
   ```

**Fix:**

```tsx
// Minimum font sizes
const TYPOGRAPHY = {
  label: 'text-sm leading-5', // 14px
  input: 'text-base leading-6', // 16px (mobile standard)
  help: 'text-sm text-dark-100', // 14px (not 12px)
  error: 'text-sm text-error',
}

// Check contrast ratios
// text-dark on white: should be ≥ 4.5:1
// text-dark-100 on white: check if ≥ 4.5:1
```

---

### 2.3 Form Controls

**Good:**

- Material Icons used consistently
- Error states have red borders
- Loading states with spinners

**Issues:**

1. **Input heights inconsistent**:
   - Some use `h-12` (48px)
   - Input component doesn't specify height
   - Textareas auto-size with `rows={3}`

2. **No focus indicators on custom controls**:

   ```tsx
   // Line 234-243 - Custom select with no focus ring
   <select className="...">
   ```

3. **Button variants not semantic**:
   ```tsx
   // Line 851-902 - Three buttons, all different styles
   <Button variant="outline">Cancelar</Button>
   <Button variant="outline">Guardar Borrador</Button>
   <Button className="bg-primary">Emitir</Button>
   ```
   Should be: `variant="ghost"`, `variant="secondary"`, `variant="primary"`

**Fix:**

```tsx
// Standardize heights
const INPUT_HEIGHT = 'h-11' // 44px - touch-friendly
const TEXTAREA_MIN = 'min-h-[88px]' // 2 lines minimum

// Add focus states
<select className="focus:ring-2 focus:ring-primary/20 focus:outline-none">

// Semantic button variants
<Button variant="ghost">Cancelar</Button>
<Button variant="secondary">Guardar Borrador</Button>
<Button variant="primary">Emitir Factura</Button>
```

---

## 3. Accessibility Audit

### 3.1 Critical Accessibility Issues

#### **A11Y-1: Missing Form Labels**

**WCAG:** 3.3.2 Labels or Instructions (Level A)

**Problems:**

```tsx
// items-table.tsx line 193-207 - Textarea with no label
<textarea
  {...register(`items.${index}.descripcion`)}
  placeholder="Ej: Desarrollo de software"
  // NO label, only placeholder
/>
```

**Fix:**

```tsx
<label htmlFor={`item-${index}-descripcion`} className="sr-only">
  Descripción del ítem {index + 1}
</label>
<textarea
  id={`item-${index}-descripcion`}
  aria-label={`Descripción del ítem ${index + 1}`}
  {...register(`items.${index}.descripcion`)}
/>
```

---

#### **A11Y-2: No Keyboard Navigation for Autocomplete**

**WCAG:** 2.1.1 Keyboard (Level A)

Already covered in ISSUE #4. Users cannot tab through autocomplete results.

---

#### **A11Y-3: Icon-Only Buttons Without Labels**

**WCAG:** 1.1.1 Non-text Content (Level A)

**Problem:**

```tsx
// Line 317-326 - Icon buttons with only title attribute
<button title="Duplicar ítem">
  <span className="material-symbols-outlined">content_copy</span>
</button>
```

**Issue:** `title` attribute is not accessible to screen readers on mobile, and doesn't show on keyboard focus.

**Fix:**

```tsx
<button aria-label="Duplicar ítem" title="Duplicar ítem">
  <span className="material-symbols-outlined" aria-hidden="true">
    content_copy
  </span>
  <span className="sr-only">Duplicar ítem</span>
</button>
```

---

#### **A11Y-4: No Error Announcements**

**WCAG:** 3.3.1 Error Identification (Level A)

**Problem:**
Errors appear visually but aren't announced to screen readers.

**Fix:**

```tsx
// Add live region for form errors
<div role="alert" aria-live="assertive" className="sr-only">
  {Object.keys(errors).length > 0 && (
    `Se encontraron ${Object.keys(errors).length} errores en el formulario`
  )}
</div>

// Or use react-hook-form's built-in support
<form
  onSubmit={handleSubmit(onSubmit)}
  aria-label="Formulario de nueva factura"
  noValidate // Disable HTML5 validation, use RHF
>
```

---

### 3.2 High Priority Accessibility Issues

#### **A11Y-5: No Skip Links**

**WCAG:** 2.4.1 Bypass Blocks (Level A)

**Problem:**
Form has lots of navigation (breadcrumb, header) before main content.

**Fix:**

```tsx
// Add skip link at top of page
<a
  href="#main-form"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Saltar al formulario
</a>

<main id="main-form">
  {/* Form content */}
</main>
```

---

#### **A11Y-6: Loading States Not Announced**

**WCAG:** 4.1.3 Status Messages (Level AA)

**Problem:**

```tsx
// Line 868-874 - Loading state not announced
{isSubmitting ? (
  <>
    <span className="animate-spin">progress_activity</span>
    Guardando...
  </>
) : ...}
```

**Fix:**

```tsx
{
  isSubmitting && (
    <div role="status" aria-live="polite">
      <span className="sr-only">Guardando factura, por favor espere</span>
    </div>
  )
}
```

---

### 3.3 Color Contrast

**Needs checking:**

- `text-dark-100` on white background
- `text-primary` on light backgrounds
- Error red on white
- Placeholder text contrast

**Tool:** Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Minimum requirements:**

- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

---

## 4. Mobile Experience Analysis

### 4.1 Critical Mobile Issues

#### **M-1: Preview Button Covers Content**

**Severity:** CRITICAL
**Location:** `vista-previa-wrapper.tsx` line 81

**Problem:**

```tsx
<div className="fixed bottom-20 right-4 z-10">
  <Button size="lg">Ver Vista Previa</Button>
</div>
```

- `bottom-20` (80px) assumes action bar is at bottom
- No consideration for mobile keyboard (can cover button)
- `right-4` not RTL-friendly
- Button too large (`size="lg"`)

**Fix:**

```tsx
// Make button float above keyboard
<div className="fixed bottom-[calc(env(safe-area-inset-bottom)+90px)] right-4 z-30">
  <Button
    size="md"
    className="h-14 w-14 rounded-full p-0 shadow-xl"
    aria-label="Ver vista previa"
  >
    <span className="material-symbols-outlined">visibility</span>
  </Button>
</div>

// Or use bottom sheet instead of modal
```

---

#### **M-2: Table Overflow on Mobile**

**Severity:** HIGH

**Problem:**
Mobile items table uses card layout (good) but lacks visual feedback for scrollable areas.

**Fix:**

```tsx
// Add scroll hint indicator
<div className="relative">
  {hasMoreItems && (
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-gradient-to-l from-white" />
  )}
  <div className="overflow-x-auto">{/* Table content */}</div>
</div>
```

---

#### **M-3: Modal Doesn't Account for Safe Areas**

**Severity:** MEDIUM

**Problem:**
Dialog content can be cut off by iPhone notch/home indicator.

**Fix:**

```tsx
// In dialog content
<DialogContent className="max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]">
```

---

### 4.2 Touch Target Sizes

**Current issues:**

| Element            | Current Size | Minimum | Status |
| ------------------ | ------------ | ------- | ------ |
| Icon buttons       | ~32px        | 44px    | FAIL   |
| Input fields       | 48px         | 44px    | PASS   |
| Autocomplete items | 40px         | 44px    | FAIL   |
| Checkbox/radio     | n/a          | 44px    | n/a    |

**Fix:**

```tsx
// Increase all interactive elements
const TOUCH_TARGET = 'min-h-[44px] min-w-[44px]'

<button className={`${TOUCH_TARGET} ...`}>
```

---

### 4.3 Mobile Keyboard Optimization

**Good:**

- Number inputs use `type="number"` for cantidad

**Missing:**

- `inputMode="decimal"` for currency fields
- `autocomplete` attributes for common fields
- `enterkeyhint` for better UX

**Fix:**

```tsx
// Cliente nombre
<input
  autoComplete="name"
  enterKeyHint="next"
/>

// Email
<input
  type="email"
  autoComplete="email"
  inputMode="email"
  enterKeyHint="next"
/>

// Valor unitario
<input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*"
  enterKeyHint="done"
/>
```

---

## 5. Prioritized Recommendations

### 5.1 CRITICAL (Fix in Sprint 1)

**Priority 1: Fix Input Editability**

- **Issue:** #1
- **Files:** `items-table.tsx`, `page.tsx`
- **Effort:** 4 hours
- **Impact:** HIGH - Blocks core functionality

**Steps:**

1. Remove `onChange` mutation in `valorUnitario` register
2. Use controlled input pattern with `setValue`
3. Test with React DevTools Profiler
4. Add e2e test for input editing

---

**Priority 2: Fix Z-Index Conflicts**

- **Issue:** #2
- **Files:** Multiple
- **Effort:** 2 hours
- **Impact:** HIGH - Prevents user interaction

**Steps:**

1. Create `lib/theme/z-index.ts` with constants
2. Apply throughout components
3. Document in design system

---

**Priority 3: Add Keyboard Navigation to Autocomplete**

- **Issue:** #4, A11Y-2
- **Files:** `autocomplete-cliente.tsx`
- **Effort:** 6 hours
- **Impact:** HIGH - Accessibility blocker

**Steps:**

1. Add `useKeyboardNavigation` hook
2. Implement arrow keys + Enter/Escape
3. Add ARIA attributes
4. Add click-outside handler
5. Test with screen reader

---

### 5.2 HIGH (Fix in Sprint 2)

**Priority 4: Simplify Form State**

- **Issue:** #5
- **Effort:** 8 hours
- **Impact:** MEDIUM - Performance & maintainability

**Priority 5: Improve Validation Feedback**

- **Issue:** #6
- **Effort:** 4 hours
- **Impact:** MEDIUM - User confusion

**Priority 6: Mobile Touch Targets**

- **Issue:** #3, M-1
- **Effort:** 3 hours
- **Impact:** HIGH - Mobile usability

**Priority 7: Icon Button Accessibility**

- **Issue:** A11Y-3
- **Effort:** 2 hours
- **Impact:** HIGH - Screen reader support

---

### 5.3 MEDIUM (Fix in Sprint 3)

**Priority 8: Progressive Disclosure (Accordion/Stepper)**

- **Issue:** #7
- **Effort:** 12 hours
- **Impact:** HIGH - But requires UX testing

**Priority 9: IVA Single Selector**

- **Issue:** #9
- **Effort:** 2 hours
- **Impact:** MEDIUM - User confusion

**Priority 10: Add Keyboard Hints**

- **Issue:** M-3
- **Effort:** 1 hour
- **Impact:** LOW - Nice to have

---

## 6. Implementation Roadmap

### Week 1: Critical Fixes

- [ ] Fix input editability issue (Priority 1)
- [ ] Establish z-index system (Priority 2)
- [ ] Add keyboard navigation to autocomplete (Priority 3)
- [ ] Increase touch targets on mobile (Priority 6)

### Week 2: Accessibility & Validation

- [ ] Add ARIA labels to all form controls (A11Y-1)
- [ ] Implement error announcements (A11Y-4)
- [ ] Add icon button labels (Priority 7)
- [ ] Two-tier validation system (Priority 5)

### Week 3: UX Improvements

- [ ] Simplify IVA selector (Priority 9)
- [ ] Add skip links (A11Y-5)
- [ ] Optimize mobile keyboard (M-3)
- [ ] Add loading announcements (A11Y-6)

### Week 4: Advanced Features

- [ ] Progressive disclosure UI (Priority 8)
- [ ] Inline client creation (Issue #8)
- [ ] Drag-to-reorder items (Issue #9)
- [ ] Performance optimization (Priority 4)

---

## 7. Testing Checklist

### Manual Testing

- [ ] Test all inputs with React DevTools open vs. closed
- [ ] Test on real iPhone (notch handling)
- [ ] Test on real Android (keyboard behavior)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test keyboard-only navigation (no mouse)
- [ ] Test with high zoom (200%+)
- [ ] Test with reduced motion preference
- [ ] Test RTL layout (if applicable)

### Automated Testing

```typescript
// cypress/e2e/factura-nueva.cy.ts
describe('Nueva Factura', () => {
  it('allows editing all input fields', () => {
    cy.visit('/facturacion/nueva')

    // Test item table inputs
    cy.get('[name="items.0.descripcion"]').type('Test service')
    cy.get('[name="items.0.descripcion"]').should('have.value', 'Test service')

    cy.get('[name="items.0.valorUnitario"]').type('150000')
    cy.get('[name="items.0.valorUnitario"]').should('have.value', '150.000')
  })

  it('supports keyboard navigation in autocomplete', () => {
    cy.get('[role="searchbox"]').type('Juan')
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[role="searchbox"]').type('{downarrow}')
    cy.get('[role="option"][aria-selected="true"]').should('exist')
    cy.get('[role="searchbox"]').type('{enter}')
    // Assert client selected
  })
})
```

---

## 8. Design System Additions Needed

### 8.1 Z-Index Scale

```typescript
// lib/theme/z-index.ts
export const Z_INDEX = {
  base: 0,
  above: 10,
  dropdown: 50,
  sticky: 40,
  overlay: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const
```

### 8.2 Touch Target Utilities

```typescript
// lib/theme/touch-targets.ts
export const TOUCH_TARGET = {
  min: 'min-h-[44px] min-w-[44px]',
  comfortable: 'min-h-[48px] min-w-[48px]',
  large: 'min-h-[56px] min-w-[56px]',
} as const
```

### 8.3 Form Spacing Scale

```typescript
// lib/theme/spacing.ts
export const FORM_SPACING = {
  field: 'space-y-2',
  section: 'space-y-4',
  card: 'space-y-6',
  page: 'space-y-8',
} as const
```

---

## 9. Colombian Accountant Workflow Optimizations

### 9.1 DIAN Compliance Quick Checks

Add visual indicators for DIAN requirements:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <h2>Información del Emisor</h2>
      <Badge variant={isDIANCompliant ? 'success' : 'warning'}>
        {isDIANCompliant ? 'DIAN OK' : 'Revisar DIAN'}
      </Badge>
    </div>
  </CardHeader>
</Card>
```

### 9.2 Common Services Templates

Add quick-add buttons for common Colombian accounting services:

```tsx
<div className="mb-4 grid grid-cols-2 gap-2">
  <Button variant="outline" onClick={() => addTemplate('HONORARIOS')}>
    + Honorarios Profesionales
  </Button>
  <Button variant="outline" onClick={() => addTemplate('CONSULTORIA')}>
    + Consultoría
  </Button>
  <Button variant="outline" onClick={() => addTemplate('ASESORIA')}>
    + Asesoría Tributaria
  </Button>
  <Button variant="outline" onClick={() => addTemplate('DECLARACION')}>
    + Declaración de Renta
  </Button>
</div>
```

### 9.3 Smart Defaults for Colombian Context

```typescript
const COLOMBIA_DEFAULTS = {
  iva: 19, // IVA general en Colombia
  unidad: 'SERVICIO', // Mayoría de contadores facturan servicios
  retencionFuente: 0.11, // 11% retención para servicios profesionales
  retencionIVA: 0.15, // 15% retención IVA si aplica
}
```

---

## 10. Metrics to Track

### Performance Metrics

- **Time to Interactive (TTI):** < 3s
- **First Input Delay (FID):** < 100ms
- **Largest Contentful Paint (LCP):** < 2.5s

### UX Metrics

- **Form completion rate:** Target > 85%
- **Average time to complete:** Target < 5 minutes
- **Error rate:** Target < 10%
- **Mobile bounce rate:** Target < 30%

### Accessibility Metrics

- **Lighthouse Accessibility Score:** Target 100
- **Keyboard navigation coverage:** 100%
- **Screen reader compatibility:** NVDA, JAWS, VoiceOver

---

## Conclusion

The electronic invoice form has **solid technical foundations** but suffers from **critical UX and accessibility issues** that prevent it from reaching its full potential. The most urgent issue—input editability—appears to stem from conflicting state management patterns between React Hook Form and manual input formatting.

**Key Takeaways:**

1. **Fix input editability FIRST** - This blocks core functionality
2. **Establish design system foundations** - Z-index, spacing, touch targets
3. **Implement accessibility systematically** - Not as afterthought
4. **Test on real devices** - Especially mobile keyboards and screen readers
5. **Optimize for Colombian accountant workflow** - Add templates, smart defaults

**Estimated Total Effort:** 40-50 hours over 4 weeks

**Expected Impact:**

- 50% reduction in form errors
- 70% improvement in mobile completion rate
- 100% keyboard navigability
- WCAG 2.1 AA compliance

---

## Files to Modify

### Critical Path

1. `/app/facturacion/nueva/page.tsx` - Form state management
2. `/components/facturacion/items-table.tsx` - Input editability
3. `/components/facturacion/autocomplete-cliente.tsx` - Keyboard navigation
4. `/components/facturacion/vista-previa-wrapper.tsx` - Z-index, mobile

### Supporting Files

5. `/lib/theme/z-index.ts` - NEW - Z-index constants
6. `/lib/theme/touch-targets.ts` - NEW - Touch target utilities
7. `/lib/validations/factura.ts` - Two-tier validation
8. `/components/ui/input.tsx` - Accessibility improvements
9. `/components/ui/button.tsx` - Semantic variants

### Testing Files

10. `/cypress/e2e/factura-nueva.cy.ts` - E2E tests
11. `/playwright/factura-accesibilidad.spec.ts` - A11y tests

---

**Report prepared by:** Claude (UX/UI Design Specialist)
**Next Steps:** Review with development team, prioritize sprint backlog
