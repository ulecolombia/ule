/**
 * ULE - PÁGINA PRINCIPAL
 * Landing page con showcase del sistema de diseño
 */

import Link from 'next/link'
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
      {/* Hero Section - Mejorado e impactante */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo visual grande */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light shadow-lg flex items-center justify-center">
              <span className="text-5xl font-extrabold text-white">U</span>
            </div>
          </div>

          {/* Badge más grande */}
          <Badge className="mb-8 px-6 py-2 text-base">
            Sistema de Autenticación Moderno ✨
          </Badge>

          {/* Título más grande y con más peso */}
          <h1 className="mb-8 text-5xl font-extrabold text-dark md:text-7xl">
            Bienvenido a <span className="text-primary">Ule</span>
          </h1>

          {/* Descripción más legible */}
          <p className="mb-12 text-2xl leading-relaxed text-dark-100">
            Sistema integral de gestión de seguridad social para Colombia
          </p>

          {/* Botones más grandes */}
          <div className="flex justify-center gap-6">
            <Link href="/registro">
              <Button className="px-8 py-4 text-lg">Comenzar Gratis</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="px-8 py-4 text-lg">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <Card variant="metric">
            <CardHeader>
              <CardTitle>🎨 Diseño Moderno</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Inspirado en N26 con una paleta de colores personalizada
              </CardDescription>
            </CardBody>
          </Card>

          <Card variant="metric">
            <CardHeader>
              <CardTitle>🔐 Seguro</CardTitle>
            </CardHeader>
            <CardBody>
              <CardDescription>
                Headers de seguridad y mejores prácticas desde el inicio
              </CardDescription>
            </CardBody>
          </Card>

          <Card variant="metric">
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
        <Card className="mx-auto max-w-4xl" variant="metric">
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
                  <Button>Default</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="secondary">Secondary</Button>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="mb-3 font-semibold">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
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
