// layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import AppFooter from '@/components/AppFooter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos',
  description: 'Herramientas Kings & Queens',
  icons: { icon: '/Muertazos.png?v=1', apple: '/Muertazos.png?v=1' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>
        <AppFooter />
        <Analytics />
      </body>
    </html>
  )
}
