// layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos - Predicciones',
  description: 'Liga de predicciones Kings & Queens',
  icons: { icon: '/Muertazos.png?v=1', apple: '/Muertazos.png?v=1' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
        {/* Sin header aquí, cada página pondrá el suyo */}
        <main>{children}</main>
      </body>
    </html>
  )
}