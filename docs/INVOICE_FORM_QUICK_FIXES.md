# Invoice Form: Critical Fixes - Quick Reference

**Date:** 2025-11-16
**Priority:** CRITICAL - Production Blockers

---

## Issue #1: Inputs Not Editable (CRITICAL)

### Root Cause

React Hook Form losing control due to direct `e.target.value` mutation inside `onChange` handler.

### Location

`/components/facturacion/items-table.tsx` - Lines 249-256

### Current Code (BROKEN)

```typescript
<input
  type="text"
  {...register(`items.${index}.valorUnitario`, {
    onChange: (e) => {
      const formateado = formatearNumero(e.target.value)
      e.target.value = formateado  // ❌ MUTATION - Breaks RHF control
    },
  })}
/>
```

### Fixed Code

```typescript
import { Controller } from 'react-hook-form'

// Option A: Use Controller for formatted inputs
<Controller
  name={`items.${index}.valorUnitario`}
  control={control}
  render={({ field: { onChange, value, ...field } }) => (
    <input
      type="text"
      value={formatearNumero(value || '')}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, '')
        onChange(raw)
      }}
      {...field}
    />
  )}
/>

// Option B: Use setValue instead of mutation
const { setValue } = useForm()

<input
  type="text"
  {...register(`items.${index}.valorUnitario`)}
  onChange={(e) => {
    const raw = e.target.value.replace(/\D/g, '')
    const formatted = formatearNumero(raw)
    setValue(`items.${index}.valorUnitario`, raw, {
      shouldValidate: false,
    })
    e.target.value = formatted
  }}
/>
```

### Test

```bash
# Verify inputs are editable
1. Open form WITHOUT browser console
2. Try typing in "Valor Unitario" field
3. Verify numbers appear and format correctly
4. Verify cursor position doesn't jump
```

---

## Issue #2: Z-Index Conflicts (CRITICAL)

### Root Cause

Multiple elements using same z-index (z-10) causing stacking issues.

### Locations

- `/app/facturacion/nueva/page.tsx` - Line 850 (action bar)
- `/components/facturacion/vista-previa-wrapper.tsx` - Line 81 (preview button)

### Current Code (BROKEN)

```typescript
// Action bar
<div className="sticky bottom-0 z-10">  {/* z-10 */}

// Preview button
<div className="fixed bottom-20 right-4 z-10">  {/* z-10 - CONFLICT! */}
```

### Fixed Code

**Step 1: Create z-index constants**

```typescript
// lib/theme/z-index.ts
export const Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 40,
  mobilePreview: 30,
  overlay: 100,
  modal: 200,
  tooltip: 300,
  toast: 400,
} as const

export type ZIndex = (typeof Z_INDEX)[keyof typeof Z_INDEX]
```

**Step 2: Apply to components**

```typescript
// page.tsx - Action bar
import { Z_INDEX } from '@/lib/theme/z-index'

<div className="sticky bottom-0" style={{ zIndex: Z_INDEX.sticky }}>

// vista-previa-wrapper.tsx - Preview button
<div className="fixed bottom-20 right-4" style={{ zIndex: Z_INDEX.mobilePreview }}>
```

---

## Issue #3: Mobile Touch Targets Too Small (HIGH)

### Root Cause

Icon buttons use only `p-2` padding (8px) - far below 44px minimum.

### Location

`/components/facturacion/items-table.tsx` - Lines 317-338

### Current Code (BROKEN)

```typescript
<button
  type="button"
  onClick={() => remove(index)}
  className="p-2 rounded-lg"  // ❌ Only 32px total
>
  <span className="material-symbols-outlined text-xl">delete</span>
</button>
```

### Fixed Code

```typescript
<button
  type="button"
  onClick={() => remove(index)}
  className="p-3 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center"
  aria-label={`Eliminar ítem ${index + 1}`}
>
  <span className="material-symbols-outlined text-xl" aria-hidden="true">
    delete
  </span>
</button>
```

### Changes

- `p-2` → `p-3` (12px padding)
- Added `min-h-[44px] min-w-[44px]`
- Added `flex items-center justify-center` for proper icon centering
- Added `aria-label` for accessibility

---

## Issue #4: Autocomplete - No Keyboard Navigation (HIGH)

### Root Cause

Dropdown missing keyboard handlers and ARIA attributes.

### Location

`/components/facturacion/autocomplete-cliente.tsx`

### Fixed Code

```typescript
import { useState, useRef, useEffect } from 'react'

export function AutocompleteCliente({ ... }) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on click outside
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
        setFocusedIndex(0)
      }
      return
    }

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
        if (focusedIndex >= 0 && displayClientes[focusedIndex]) {
          handleSelect(displayClientes[focusedIndex])
        }
        break

      case 'Escape':
        setIsOpen(false)
        inputRef.current?.focus()
        break
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      const element = document.querySelector(`[data-option-index="${focusedIndex}"]`)
      element?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="cliente-listbox"
        aria-activedescendant={focusedIndex >= 0 ? `cliente-option-${focusedIndex}` : undefined}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setIsOpen(true)
          setFocusedIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div
          ref={dropdownRef}
          id="cliente-listbox"
          role="listbox"
          className="absolute z-50 mt-2 w-full"
        >
          <ul>
            {displayClientes.map((cliente, index) => (
              <li
                key={cliente.id}
                id={`cliente-option-${index}`}
                role="option"
                aria-selected={focusedIndex === index}
                data-option-index={index}
                className={focusedIndex === index ? 'bg-primary/10' : ''}
                onClick={() => handleSelect(cliente)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                {cliente.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Test Keyboard Navigation

```
1. Tab to autocomplete input
2. Press ArrowDown → Dropdown opens, first item highlighted
3. Press ArrowDown again → Second item highlighted
4. Press ArrowUp → First item highlighted
5. Press Enter → Item selected
6. Press Escape → Dropdown closes
```

---

## Issue #5: IVA Selector Confusion (MEDIUM)

### Root Cause

Two-step selection confuses users (first select "Aplica IVA?", then "Porcentaje").

### Location

`/components/facturacion/items-table.tsx` - Lines 270-306

### Current Code (CONFUSING)

```typescript
<select {...register(`items.${index}.aplicaIVA`)}>
  <option value="false">No aplica</option>
  <option value="true">Aplica IVA</option>
</select>
{watch(`items.${index}.aplicaIVA`) && (
  <select {...register(`items.${index}.porcentajeIVA`)}>
    <option value={0}>0%</option>
    <option value={5}>5%</option>
    <option value={19}>19%</option>
  </select>
)}
```

### Fixed Code (CLEAR)

```typescript
<select
  {...register(`items.${index}.porcentajeIVA`, {
    valueAsNumber: true,
  })}
  className="w-full h-12 rounded-lg border"
>
  <option value={0}>Sin IVA (0%)</option>
  <option value={5}>IVA Reducido (5%)</option>
  <option value={19}>IVA General (19%)</option>
</select>
```

### Update Validation Schema

```typescript
// lib/validations/factura.ts
export const itemFacturaSchema = z.object({
  // Remove aplicaIVA field entirely
  // Keep only porcentajeIVA
  porcentajeIVA: z.number().min(0).max(100).default(0),
})
```

---

## Issue #6: No Loading State Announcements (A11Y)

### Root Cause

Loading spinners visible but not announced to screen readers.

### Location

`/app/facturacion/nueva/page.tsx` - Lines 868-901

### Fixed Code

```typescript
<Button
  type="button"
  onClick={guardarBorrador}
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <span className="material-symbols-outlined mr-2 animate-spin">
        progress_activity
      </span>
      <span>Guardando...</span>
      <span className="sr-only" role="status" aria-live="polite">
        Guardando factura, por favor espere
      </span>
    </>
  ) : (
    <>
      <span className="material-symbols-outlined mr-2">save</span>
      Guardar Borrador
    </>
  )}
</Button>
```

---

## Issue #7: Mobile Input Type Optimization

### Root Cause

Currency inputs use `type="text"` - shows QWERTY keyboard on mobile.

### Location

`/components/facturacion/items-table.tsx` - Valor unitario inputs

### Fixed Code

```typescript
<input
  type="text"
  inputMode="decimal"  // ✅ Shows numeric keyboard with decimal
  pattern="[0-9]*"     // ✅ Fallback for older browsers
  enterKeyHint="next"  // ✅ Shows "Next" on keyboard
  {...register(`items.${index}.valorUnitario`)}
/>

// For quantity
<input
  type="number"
  inputMode="decimal"
  enterKeyHint="next"
  min="0.01"
  step="0.01"
  {...register(`items.${index}.cantidad`)}
/>
```

---

## Testing Checklist

### Manual Tests (Critical Path)

```bash
# Test 1: Input Editability
1. Open /facturacion/nueva WITHOUT DevTools
2. Add item
3. Type in "Descripción" → Should work ✓
4. Type in "Valor Unitario" → Should work ✓
5. Change "Cantidad" → Should work ✓
6. Verify no console errors

# Test 2: Z-Index
1. Open form on mobile
2. Scroll down
3. Verify preview button doesn't cover action bar
4. Open autocomplete dropdown
5. Verify dropdown appears above all other elements

# Test 3: Touch Targets (Mobile)
1. Open form on iPhone/Android
2. Try tapping delete button on item
3. Verify easy to tap (not missing clicks)
4. Try tapping duplicate button
5. Verify all buttons respond to first tap

# Test 4: Keyboard Navigation
1. Tab to autocomplete input
2. Type "Juan"
3. Press ArrowDown → Dropdown opens
4. Press ArrowDown 2x → Highlight moves
5. Press Enter → Client selected
6. Verify no errors

# Test 5: Screen Reader (VoiceOver/NVDA)
1. Enable screen reader
2. Navigate form with Tab
3. Verify all fields announced correctly
4. Verify errors announced
5. Verify loading states announced
```

### Automated Tests

```typescript
// cypress/e2e/invoice-critical-fixes.cy.ts
describe('Invoice Form - Critical Fixes', () => {
  beforeEach(() => {
    cy.visit('/facturacion/nueva')
  })

  it('allows editing valor unitario input', () => {
    cy.get('[name="items.0.valorUnitario"]').clear().type('150000')
    cy.get('[name="items.0.valorUnitario"]').should('have.value', '150000')
  })

  it('supports keyboard navigation in autocomplete', () => {
    cy.get('[role="combobox"]').focus()
    cy.get('[role="combobox"]').type('{downarrow}')
    cy.get('[role="listbox"]').should('be.visible')
    cy.get('[aria-selected="true"]').should('exist')
  })

  it('has proper z-index stacking', () => {
    cy.get('.sticky').should('have.css', 'z-index', '40')
    cy.get('.fixed').should('have.css', 'z-index', '30')
  })

  it('has minimum touch target size', () => {
    cy.get('button[aria-label*="Eliminar"]').then(($btn) => {
      expect($btn.height()).to.be.at.least(44)
      expect($btn.width()).to.be.at.least(44)
    })
  })
})
```

---

## Deployment Checklist

### Before Merging

- [ ] All manual tests pass
- [ ] Cypress tests pass
- [ ] No console errors/warnings
- [ ] Tested on Chrome, Safari, Firefox
- [ ] Tested on iPhone (Safari)
- [ ] Tested on Android (Chrome)
- [ ] Screen reader test (at least VoiceOver)
- [ ] Lighthouse Accessibility score ≥ 95

### After Merging

- [ ] Monitor Sentry for new errors
- [ ] Check analytics for form abandonment rate
- [ ] Get user feedback on input experience
- [ ] Document fixes in changelog

---

## File Changes Summary

| File                         | Lines Changed | Complexity |
| ---------------------------- | ------------- | ---------- |
| `items-table.tsx`            | ~50           | Medium     |
| `autocomplete-cliente.tsx`   | ~100          | High       |
| `page.tsx`                   | ~20           | Low        |
| `vista-previa-wrapper.tsx`   | ~10           | Low        |
| `lib/theme/z-index.ts`       | ~15 (new)     | Low        |
| `lib/validations/factura.ts` | ~10           | Low        |

**Total Estimated Effort:** 8-12 hours

---

## Quick Reference: Common Patterns

### Formatted Input (Currency, Numbers)

```typescript
import { Controller } from 'react-hook-form'

<Controller
  name="valorUnitario"
  control={control}
  render={({ field }) => (
    <input
      type="text"
      inputMode="decimal"
      value={formatearNumero(field.value || '')}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, '')
        field.onChange(raw)
      }}
    />
  )}
/>
```

### Accessible Icon Button

```typescript
<button
  className="p-3 min-h-[44px] min-w-[44px]"
  aria-label="Descriptive action"
>
  <span className="material-symbols-outlined" aria-hidden="true">
    icon_name
  </span>
</button>
```

### Keyboard-Navigable Dropdown

```typescript
<div role="combobox" aria-expanded={isOpen}>
  <input
    onKeyDown={handleKeyDown}
    aria-controls="listbox-id"
  />
</div>
<ul id="listbox-id" role="listbox">
  <li role="option" aria-selected={focused}>
```

### Mobile-Optimized Input

```typescript
<input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*"
  enterKeyHint="next"
/>
```

---

**Last Updated:** 2025-11-16
**Next Review:** After Sprint 1 completion
