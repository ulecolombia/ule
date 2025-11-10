/**
 * ULE - LAYOUT ROOT
 * Layout principal de la aplicación con metadatos SEO
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'
import { SessionProvider } from '@/components/providers/session-provider'
import { MainNav } from '@/components/layout/MainNav'
import { ErrorBoundary } from '@/components/error-boundary'
import { initSentry } from '@/lib/sentry'

// Inicializar Sentry en el servidor
if (typeof window === 'undefined') {
  initSentry()
}

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Ule - Gestión de Seguridad Social',
    template: '%s | Ule',
  },
  description: 'Sistema integral de gestión de seguridad social para Colombia',
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
    description:
      'Sistema integral de gestión de seguridad social para Colombia',
    siteName: 'Ule',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ule - Gestión de Seguridad Social',
    description:
      'Sistema integral de gestión de seguridad social para Colombia',
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <MainNav />
            {children}
          </SessionProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
