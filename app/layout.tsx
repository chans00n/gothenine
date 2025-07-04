import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/lib/polyfills'
import { PWAInit } from '@/components/pwa-init'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { OfflineBanner } from '@/components/ui/offline-indicator'
import { ErrorBoundary } from '@/components/error-boundary'
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider'
import { PerformanceMonitor, PerformanceDebugPanel } from '@/components/performance-monitor'
import { AccessibilityTest } from '@/components/accessibility-test'
import { DeviceTest } from '@/components/device-test'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Go the Nine',
  description: 'Track your Go the Nine Challenge progress',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="75hard-theme">
          <ErrorBoundary>
            <ServiceWorkerProvider>
              <PerformanceMonitor />
              <PerformanceDebugPanel />
              <AccessibilityTest />
              <DeviceTest />
              <PWAInit />
              <OfflineBanner />
              {children}
              <Toaster />
            </ServiceWorkerProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}