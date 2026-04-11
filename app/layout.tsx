// layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import AppFooter from '@/components/AppFooter'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos',
  description: 'Herramientas Kings & Queens',
  icons: { icon: '/MUERTAZOS ESTRUCTURA/Muertazos.webp?v=1', apple: '/MUERTAZOS ESTRUCTURA/Muertazos.webp?v=1' },
  other: { 'google-adsense-account': 'ca-pub-5763902761360524' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>
        <AppFooter />
        <Analytics />
        <Script
          id="google-adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5763902761360524"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
