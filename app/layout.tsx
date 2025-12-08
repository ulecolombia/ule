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
import { ErrorBoundary } from '@/components/error-boundary'
import { SWRProvider } from '@/lib/cache/swr-config'
import { initSentry } from '@/lib/sentry'

// Validación de seguridad en el servidor
if (typeof window === 'undefined') {
  // Inicializar Sentry
  initSentry()

  // Validar variables de entorno (env-validator ya valida automáticamente al importarse)
  // Validar clave de encriptación
  try {
    const { validateEncryptionKey } = require('@/lib/security/field-encryption')
    validateEncryptionKey()
  } catch (error) {
    console.error('Error validando clave de encriptación:', error)
  }
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
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
        />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14B8A6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ule" />
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
        {/* Script para limpiar service worker cache corrupto */}
        <Script id="cleanup-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                }
              });
              // Limpiar todos los caches
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (let name of names) {
                    caches.delete(name);
                  }
                });
              }
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <SWRProvider>
              {children}
              {/* <CommandPaletteProvider /> */}
            </SWRProvider>
          </SessionProvider>
        </ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
