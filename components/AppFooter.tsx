'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Donor {
  username: string
  tier?: 'gold' | 'silver' | 'bronze' | null
}

export default function AppFooter() {
  const [donors, setDonors] = useState<Donor[]>([])

  useEffect(() => {
    const fetchDonors = async () => {
      const { data } = await supabase
        .from('donors')
        .select('username, tier')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setDonors(data)
    }
    fetchDonors().catch(() => {})
  }, [])

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
        src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_SM.gif',
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
    <footer className="w-full bg-slate-950 border-t border-white/5">

      {donors.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-3">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 text-center mb-3">
            ★ MURO DE DONADORES ★
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {donors.map((d, i) => (
              <span
                key={i}
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border
                  ${tierStyles[d.tier ?? 'bronze'] ?? tierStyles.bronze}`}
              >
                {d.username}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center h-12 px-4 gap-5">
        <div id="footer-donate-button" className="hover:scale-105 transition-transform flex-shrink-0" />
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.35em] whitespace-nowrap pointer-events-none">
          MUERTAZOS © 2026
        </p>
      </div>
    </footer>
  )
}
