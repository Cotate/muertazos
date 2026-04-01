// app/page.tsx  ─── PÁGINA DE INICIO
'use client'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect } from 'react'
import Footer from '@/components/Footer'

const NAV_CARDS = [
  { href: '/login',     label: 'INICIAR SESIÓN', sub: 'Accede a tu cuenta',   accent: '#FFD300',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  { href: '/pizarra',   label: 'PIZARRA',         sub: 'Arma tu once ideal',  accent: '#01d6c3',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"/></svg> },
  { href: '/simulador', label: 'SIMULADOR',        sub: 'Simula resultados',   accent: '#FF5733',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
]

export default function HomePage() {
  useEffect(() => { document.body.style.backgroundColor = '#0a0a0a' }, [])
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <header className="w-full h-12 flex items-center justify-center bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="relative w-28 h-8">
          <Image src="/Muertazos.png" alt="Muertazos" fill className="object-contain" priority />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none text-white">MUERTAZOS</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mt-2">HERRAMIENTAS KINGS &amp; QUEENS</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {NAV_CARDS.map(({ href, label, sub, accent, icon }) => (
            <Link key={href} href={href}
              className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-3 text-center transition-all duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl pointer-events-none" style={{ background: accent }} />
              <div style={{ color: accent }}>{icon}</div>
              <span className="font-black italic text-lg tracking-tighter uppercase leading-none text-white">{label}</span>
              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{sub}</span>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: accent }} />
            </Link>
          ))}
        </div>
      </main>

      <Footer />
      <Script src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js" strategy="lazyOnload"
        onLoad={() => { if ((window as any).PayPal) { (window as any).PayPal.Donation.Button({ env:'production', hosted_button_id:'PE6W2EWS2SJFW', image:{ src:'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif', alt:'Donar', title:'PayPal' } }).render('#donate-button') } }}
      />
    </div>
  )
}
