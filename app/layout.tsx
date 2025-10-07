/**
 * ULE - LAYOUT ROOT
 * Layout principal de la aplicación con metadatos SEO
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Ule - Gestión de Seguridad Social',
    template: '%s | Ule',
  },
  description:
    'Sistema integral de gestión de seguridad social para Colombia',
  keywords: ['seguridad social', 'Colombia', 'gestión', 'salud', 'pensiones'],
  authors: [{ name: 'Ule Team' }],
  creator: 'Ule',
  publisher: 'Ule',
  applicationName: 'Ule',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    title: 'Ule - Gestión de Seguridad Social',
    description: 'Sistema integral de gestión de seguridad social para Colombia',
    siteName: 'Ule',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ule - Gestión de Seguridad Social',
    description: 'Sistema integral de gestión de seguridad social para Colombia',
  },
  robots: {
    index: false, // Cambiar a true en producción
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
