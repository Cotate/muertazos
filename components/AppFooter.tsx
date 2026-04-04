'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Donor {
  username: string
  tier?: 'gold' | 'silver' | 'bronze' | null
}

export default function AppFooter() {
  const [donors, setDonors] = useState<Donor[]>([])

  /* Carga donadores desde Supabase (tabla opcional: 'donors') */
  useEffect(() => {
    const fetchDonors = async () => {
      const { data } = await supabase
        .from('donors')
        .select('username, tier')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setDonors(data)
    }
    fetchDonors().catch(() => {/* tabla inexistente — OK */})
  }, [])

  /* Carga el SDK de PayPal y renderiza el botón */
  useEffect(() => {
    const scriptId = 'paypal-donate-sdk'
    if (document.getElementById(scriptId)) {
      renderPayPal()
      return
    }
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
      image: {
        src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif',
        alt: 'Donar con PayPal',
        title: 'PayPal — The safer, easier way to pay online!',
      },
    }).render('#footer-donate-button')
  }

  const tierStyles: Record<string, string> = {
    gold:   'text-[#FFD300] border-[#FFD300]/40 bg-[#FFD300]/5',
    silver: 'text-slate-300 border-slate-500/40 bg-slate-500/5',
    bronze: 'text-amber-600 border-amber-700/40 bg-amber-700/5',
  }

  return (
    <footer className="w-full bg-slate-950 mt-4">

      {/* Donadores */}
      {donors.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-10 pb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 text-center mb-5">
            ★ MURO DE DONADORES ★
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {donors.map((d, i) => (
              <span
                key={i}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border 
                  ${tierStyles[d.tier ?? 'bronze'] ?? tierStyles.bronze}`}
              >
                {d.username}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Donación + copyright */}
      <div className="flex flex-col items-center gap-4 py-8 px-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">
          ¿Te gusta la app? Dale de comer a una panchita
        </p>
        <div id="footer-donate-button" className="hover:scale-105 transition-transform" />
        <p className="text-slate-700 text-[9px] font-black uppercase tracking-[0.35em] mt-2">
          MUERTAZOS © 2026
        </p>
      </div>
    </footer>
  )
}
