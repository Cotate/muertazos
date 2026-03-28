// layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muertazos',
  description: 'Herramientas Kings & Queens',
  icons: { icon: '/Muertazos.png?v=1', apple: '/Muertazos.png?v=1' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} bg-[#0a0a0a] text-white h-screen overflow-hidden flex flex-col`}>

        {/* Contenido principal (cada página ocupa el espacio restante) */}
        <main className="flex-1 overflow-hidden min-h-0">
          {children}
        </main>

        {/* FOOTER GLOBAL — Solo botón de donación */}
        <footer className="h-10 shrink-0 flex items-center justify-center bg-slate-950 border-t border-slate-800/60 z-40">
          <div
            id="donate-button-global"
            className="flex items-center justify-center"
            style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}
          />
        </footer>

        <Analytics />

        {/* SDK de PayPal — cargado una sola vez de forma global */}
        <Script
          src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
          strategy="lazyOnload"
          onLoad={() => {
            if ((window as any).PayPal) {
              (window as any).PayPal.Donation.Button({
                env: 'production',
                hosted_button_id: 'PE6W2EWS2SJFW',
                image: {
                  src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_SM.gif',
                  alt: 'Donar con el botón PayPal',
                  title: 'PayPal - The safer, easier way to pay online!',
                },
              }).render('#donate-button-global')
            }
          }}
        />
      </body>
    </html>
  )
}
