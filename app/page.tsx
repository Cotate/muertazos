'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const router = useRouter()

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { data, error: dbError } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (dbError || !data) { setError('Datos incorrectos'); return }
    localStorage.setItem('muertazos_user', JSON.stringify(data))
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    /* Usamos h-screen + flex-col para que el footer nunca desborde */
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* ── HEADER ── mismo alto que admin/usuario */}
      <header className="w-full h-16 md:h-20 flex-shrink-0 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg">
        <div className="relative w-36 h-10 md:w-44 md:h-12">
          <Image src="/Muertazos.png" alt="Muertazos Logo" fill className="object-contain" priority />
        </div>
      </header>

      {/* ── CONTENIDO ── scrollable solo en vertical si hace falta */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8">

        {/* TARJETA */}
        <div className="bg-slate-900/40 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800 backdrop-blur-sm">
          <h1 className="text-3xl font-black italic text-center mb-8 tracking-tighter uppercase leading-none">
            <span className="text-white">INICIAR</span>
            <span className="ml-2 text-[#FFD300]">SESIÓN</span>
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">
                Usuario
              </label>
              <input
                type="text"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-[#ffd300] transition-all font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-[#01d6c3] transition-all font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl">
                <p className="text-red-500 text-[11px] font-bold text-center uppercase italic">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#01d6c3] hover:scale-[1.02] active:scale-95 text-slate-900 font-black italic py-4 rounded-2xl transition-all uppercase tracking-tighter"
            >
              ENTRAR
            </button>
          </form>
        </div>

        {/* FOOTER / DONACIÓN */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div id="donate-button-container">
            <div id="donate-button" className="hover:scale-105 transition-transform" />
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
            MUERTAZOS © 2026
          </p>
        </div>
      </div>

      {/* PayPal SDK */}
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
            }).render('#donate-button')
          }
        }}
      />
    </div>
  )
}