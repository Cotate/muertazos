import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos - Predicciones',
  description: 'Liga de predicciones Kings & Queens',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
        <header className="w-full p-4 flex justify-center bg-slate-950 border-b border-slate-800 shadow-lg relative z-10">
            <div className="relative w-48 h-16">
                 {/* Asegúrate de tener Muertazos.png en public */}
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