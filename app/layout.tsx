import type { Metadata, Viewport } from 'next'
import './globals.css'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Cicla MOB — Método de Ovulação Billings',
  description: 'Acompanhe seu ciclo com o Método de Ovulação Billings de forma simples e segura.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#be185d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-full bg-gray-50">{children}</body>
    </html>
  )
}
