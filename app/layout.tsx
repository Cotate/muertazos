// layout.tsx
import type { Metadata } from 'next'
import { Inter, Doppio_One } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import AppFooter from '@/components/AppFooter'

const inter = Inter({ subsets: ['latin'] })
const doppioOne = Doppio_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-doppio',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Muertazos',
  description: 'Herramientas Kings & Queens',
  icons: { icon: '/MUERTAZOS ESTRUCTURA/Muertazos.webp?v=1', apple: '/MUERTAZOS ESTRUCTURA/Muertazos.webp?v=1' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${doppioOne.variable} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>
        <AppFooter />
        <Analytics />
      </body>
    </html>
  )
}
