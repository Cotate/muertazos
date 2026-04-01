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
    <html lang="es">
      <body className={`${inter.className} bg-[#0a0a0a] text-white min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>

        {/* FOOTER GLOBAL */}
        <footer className="w-full flex flex-col items-center gap-3 py-5 border-t border-slate-900 bg-slate-950">
          <div id="donate-button-global" />
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
            MUERTAZOS © 2026
          </p>
        </footer>

        <Analytics />

        <Script
          src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
          strategy="lazyOnload"
          onLoad={() => {
            if ((window as any).PayPal) {
              (window as any).PayPal.Donation.Button({
                env: 'production',
                hosted_button_id: 'PE6W2EWS2SJFW',
                image: {
                  src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif',
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
