import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos - Predicciones',
  description: 'Liga de predicciones Kings & Queens',
  icons: {
    // Le añadimos ?v=1 al final para forzar la actualización
    icon: '/Muertazos.png?v=1',
    apple: '/Muertazos.png?v=1',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      {/* CAMBIO: bg-[#0a0a0a] para consistencia total con el modo oscuro */}
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen`}>
        <header className="w-full p-4 flex justify-center bg-slate-950 border-b border-slate-800 shadow-lg relative z-10">
            <div className="relative w-48 h-16">
                <Image 
                  src="/Muertazos.png" 
                  alt="Muertazos Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
            </div>
        </header>
        <main className="max-w-4xl mx-auto p-4">
            {children}
        </main>
      </body>
    </html>
  )
}