'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Donor { username: string; tier?: 'gold' | 'silver' | 'bronze' | null }

const CREATORS = [
  { username: 'Cotate',  href: 'https://x.com/Cotate_' },
  { username: 'Jude',   href: 'https://x.com/jude_utd05' },
  { username: 'Annagg', href: 'https://x.com/Annagg05' },
  { username: 'Anye',   href: 'https://x.com/anyecrx_' },
]

export default function AppFooter() {
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    supabase.from('donors').select('username, tier').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setDonors(data) })
  }, [])

  useEffect(() => {
    const scriptId = 'paypal-donate-sdk'
    if (document.getElementById(scriptId)) { renderPayPal(); return }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js'
    script.async = true
    script.onload = renderPayPal
    document.body.appendChild(script)
  }, [])

  function renderPayPal() {
    const win = window as any
    if (!win.PayPal) return
    const container = document.getElementById('footer-donate-button')
    if (!container || container.childElementCount > 0) return
    win.PayPal.Donation.Button({
      env: 'production',
      hosted_button_id: 'PE6W2EWS2SJFW',
      image: { src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_SM.gif', alt: 'Donar con PayPal', title: 'PayPal' },
    }).render('#footer-donate-button')
  }

  const tierStyles: Record<string, string> = {
    gold:   'text-[#FFD300] border-[#FFD300]/40 bg-[#FFD300]/5',
    silver: 'text-slate-300 border-slate-500/40 bg-slate-500/5',
    bronze: 'text-amber-600 border-amber-700/40 bg-amber-700/5',
  }

  return (
    <footer className="w-full bg-slate-950 border-t border-white/5">

      {/* Donor wall — full width */}
      {donors.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-5 pb-3 border-b border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 text-center mb-3">
            ★ MURO DE DONADORES ★
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {donors.map((d, i) => (
              <span key={i} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${tierStyles[d.tier ?? 'bronze'] ?? tierStyles.bronze}`}>
                {d.username}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4-column bottom bar */}
      <div className="max-w-5xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-6 items-start">

        {/* Col 1: Donate */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
            <Star className="w-2.5 h-2.5 fill-current" />
            APOYA LA PAGINA
            <Star className="w-2.5 h-2.5 fill-current" />
          </h3>
          <div id="footer-donate-button" className="hover:scale-105 transition-transform" />
        </div>

        {/* Col 2: Creators */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
            <Star className="w-2.5 h-2.5 fill-current" />
            CREADORES
            <Star className="w-2.5 h-2.5 fill-current" />
          </h3>
          <div className="flex gap-3">
            {CREATORS.map(c => (
              <a key={c.username} href={c.href} target="_blank" rel="noopener noreferrer"
                className="group" title={`@${c.username}`}>
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 group-hover:border-slate-500 transition-colors">
                  <img src={`/usuarios/${c.username}.webp`} alt={c.username}
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Col 3: Pagina Oficial */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
            <Star className="w-2.5 h-2.5 fill-current" />
            PAGINA OFICIAL
            <Star className="w-2.5 h-2.5 fill-current" />
          </h3>
          <a href="https://x.com/muertazos_com" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center group hover:opacity-80 transition-opacity h-9">
            <Image
              src="/MUERTAZOS ESTRUCTURA/MuertazosX.webp"
              alt="Muertazos en X"
              width={104}
              height={36}
              className="object-contain h-9 w-auto"
            />
          </a>
        </div>

        {/* Col 4: Site links */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
            <Star className="w-2.5 h-2.5 fill-current" />
            MUERTAZOS
            <Star className="w-2.5 h-2.5 fill-current" />
          </h3>
          <div className="flex flex-col items-center gap-1.5">
            <Link
              href="/quienes-somos"
              className="text-slate-500 hover:text-slate-200 text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              Quienes somos
            </Link>
            <Link
              href="/contacto"
              className="text-slate-500 hover:text-slate-200 text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
