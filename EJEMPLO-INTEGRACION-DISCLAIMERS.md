# Guía de Integración de Disclaimers y Términos

## Sistema Implementado

El sistema completo de disclaimers, términos y condiciones ha sido implementado. A continuación se muestra cómo integrarlo en tus páginas.

## Componentes Creados

### 1. DisclaimerBanner
Banner de advertencia que se muestra en la parte superior de las páginas.

```tsx
import { DisclaimerBanner } from '@/components/asesoria/disclaimer-banner'

// En tu página
<DisclaimerBanner
  variant="default"  // default | prominent | subtle
  showContactButton={true}
/>
```

### 2. ModalBienvenida
Modal que aparece la primera vez que el usuario accede al servicio de IA.

```tsx
import { ModalBienvenida } from '@/components/asesoria/modal-bienvenida'

// En tu página o layout
<ModalBienvenida onAceptar={() => console.log('Usuario aceptó términos')} />
```

### 3. BotonAsesoriaProfesional
Botón que despliega opciones para contactar con profesionales certificados.

```tsx
import { BotonAsesoriaProfesional } from '@/components/asesoria/boton-asesoria-profesional'

// En tu página
<BotonAsesoriaProfesional />
```

## Ejemplo de Layout Completo

```tsx
// app/asesoria/layout.tsx
import { DisclaimerBanner } from '@/components/asesoria/disclaimer-banner'
import { ModalBienvenida } from '@/components/asesoria/modal-bienvenida'
import { BotonAsesoriaProfesional } from '@/components/asesoria/boton-asesoria-profesional'

export default function AsesoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Modal de bienvenida (solo primera vez) */}
      <ModalBienvenida onAceptar={() => {}} />

      <div className="min-h-screen flex flex-col">
        {/* Banner superior */}
        <div className="p-4">
          <DisclaimerBanner
            variant="default"
            showContactButton={true}
          />
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          {children}
        </div>

        {/* Footer con botón de asesoría */}
        <div className="border-t bg-gray-50 dark:bg-gray-900 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Necesitas asesoría personalizada?
            </p>
            <BotonAsesoriaProfesional />
          </div>
        </div>
      </div>
    </>
  )
}
```

## Agregar Footer en Respuestas de IA

Si tienes un componente de mensaje de chat, agrega este footer:

```tsx
// En tu componente de mensaje
{!isUser && (
  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
    <p className="text-xs text-gray-500 flex items-center">
      <span className="material-symbols-outlined text-xs mr-1">
        smart_toy
      </span>
      Respuesta generada automáticamente. Verifica información crítica con
      un profesional certificado.
    </p>
  </div>
)}
```

## Endpoints Disponibles

### Verificar si el usuario aceptó términos
```typescript
GET /api/asesoria/verificar-terminos

// Respuesta:
{
  aceptado: boolean,
  fechaAceptacion: Date | null
}
```

### Registrar aceptación de términos
```typescript
POST /api/asesoria/aceptar-terminos

// Body:
{
  tipoTermino: 'ASESORIA_IA' | 'USO_PLATAFORMA' | 'PRIVACIDAD' | 'LIMITACION_RESPONSABILIDAD',
  version: '1.0'
}

// Respuesta:
{
  success: true,
  terminoAceptado: { ... }
}
```

## Página de Términos Completos

Accesible en: `/terminos-asesoria`

Puedes enlazar a esta página desde cualquier parte:
```tsx
<a href="/terminos-asesoria" className="text-primary hover:underline">
  Ver términos completos
</a>
```

## Variantes del DisclaimerBanner

### Default (Advertencia estándar)
```tsx
<DisclaimerBanner variant="default" />
```

### Prominent (Más visible, para casos críticos)
```tsx
<DisclaimerBanner variant="prominent" showContactButton={true} />
```

### Subtle (Más discreto, para información general)
```tsx
<DisclaimerBanner variant="subtle" />
```

## Modelo de Datos

El sistema registra automáticamente:
- Usuario que aceptó
- Tipo de término aceptado
- Versión de los términos
- Fecha y hora de aceptación
- Dirección IP
- User Agent

Esto está guardado en la tabla `TerminosAceptados` para compliance legal.

## Actualizar Versión de Términos

Si actualizas los términos, cambia la versión en:
1. `ModalBienvenida`: Línea con `version: '1.0'`
2. `verificar-terminos/route.ts`: Línea con `version: '1.0'`
3. Página de términos: Sección final

Los usuarios tendrán que aceptar nuevamente con la nueva versión.

## Recomendaciones

1. **Siempre mostrar el banner** en páginas que usen IA
2. **El modal se muestra automáticamente** la primera vez
3. **El botón de asesoría profesional** debe estar visible
4. **Agregar footer** en cada respuesta de IA
5. **Enlazar a términos completos** en descripciones extensas

## Enlaces Útiles

- Junta Central de Contadores: https://www.contaduria.gov.co/
- DIAN: https://www.dian.gov.co/
- Página de contacto: `/contacto`
- Términos completos: `/terminos-asesoria`
