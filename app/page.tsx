/**
 * ULE - PÁGINA PRINCIPAL
 * Landing page con showcase del sistema de diseño
 */

import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-light-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4">Fase 0.1 - Setup Completo</Badge>
          <h1 className="mb-6 text-4xl font-bold text-dark md:text-6xl">
            Bienvenido a <span className="text-primary">Ule</span>
          </h1>
          <p className="mb-8 text-xl text-dark-100">
            Sistema integral de gestión de seguridad social para Colombia
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">Comenzar</Button>
            <Button variant="outline" size="lg">
              Documentación
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>🎨 Diseño Moderno</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Inspirado en N26 con una paleta de colores personalizada
              </CardDescription>
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>🔐 Seguro</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Headers de seguridad y mejores prácticas desde el inicio
              </CardDescription>
            </CardBody>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>♿ Accesible</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Cumple con WCAG 2.1 AA para todos los usuarios
              </CardDescription>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Design System Preview */}
      <section className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-4xl" variant="elevated">
          <CardHeader>
            <h2 className="text-2xl font-bold">Sistema de Diseño</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h3 className="mb-3 font-semibold">Paleta de Colores</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-xl bg-primary"></div>
                    <span className="mt-1 text-xs">Primary</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-xl bg-accent"></div>
                    <span className="mt-1 text-xs">Accent</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-xl bg-success"></div>
                    <span className="mt-1 text-xs">Success</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-xl bg-warning"></div>
                    <span className="mt-1 text-xs">Warning</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-xl bg-error"></div>
                    <span className="mt-1 text-xs">Error</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div>
                <h3 className="mb-3 font-semibold">Botones</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="mb-3 font-semibold">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-light-100 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-dark-100">
            © 2025 Ule - Sistema de Gestión de Seguridad Social
          </p>
        </div>
      </footer>
    </div>
  )
}
