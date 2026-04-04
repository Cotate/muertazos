'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

const COLLABORATORS = ['Ivanx', 'Chavez6', 'Gaby Velazco', 'Lucholuna', 'Ahmazee']

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        router.push(u.role === 'admin' ? '/admin' : '/dashboard')
      } catch {}
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()
    setLoading(false)
    if (dbError || !data) { setError('Datos incorrectos'); return }
    localStorage.setItem('muertazos_user', JSON.stringify(data))
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
  }

  const marqueeItems = [...COLLABORATORS, ...COLLABORATORS, ...COLLABORATORS]

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white overflow-x-hidden">

      <AppHeader variant="minimal" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* ── Login card ── */}
        <div className="w-full max-w-sm">
          <div className="relative bg-slate-900/70 backdrop-blur-md border border-white/8 rounded-2xl p-7">
            <div className="h-0.5 w-full bg-gradient-to-r from-[#ffd300] via-[#01d6c3] to-[#FF5733] rounded-full mb-7 opacity-50" />

            <h2 className="font-black italic uppercase text-3xl tracking-tight mb-6">
              Inicia <span style={{ color: '#01d6c3' }}>Sesión</span>
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Usuario</label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full px-4 py-3 bg-[#0a0a0a]/80 border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#ffd300] focus:ring-1 focus:ring-[#ffd300]/15 transition-all placeholder:text-slate-700"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Contraseña</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0a0a0a]/80 border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#01d6c3] focus:ring-1 focus:ring-[#01d6c3]/15 transition-all"
                />
              </div>
              {error && (
                <p className="text-red-400 text-[11px] font-bold text-center uppercase bg-red-500/8 border border-red-500/20 rounded-xl py-2.5">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#FFD300] text-black font-black italic uppercase tracking-tight rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all text-base disabled:opacity-50 shadow-[0_4px_24px_rgba(255,211,0,0.12)] mt-2"
              >
                {loading ? 'Cargando...' : 'Entrar →'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Public tools ── */}
        <div className="w-full max-w-3xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Tier List */}
          <Link href="/tierlist"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-[#FFD300]/35 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#FFD300]/8 rounded-full blur-2xl group-hover:bg-[#FFD300]/20 transition-colors duration-500" />
            <div className="relative z-10 mb-4">
              <div className="bg-[#FFD300]/10 text-[#FFD300] p-3 rounded-xl border border-[#FFD300]/15 group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                </svg>
              </div>
            </div>
            <h4 className="font-black italic uppercase text-xl text-white mb-2 group-hover:text-[#FFD300] transition-colors relative z-10">Tier List</h4>
            <p className="text-sm text-slate-500 font-medium relative z-10">Crea tu propia tier list de jugadores, equipos y más.</p>
          </Link>

          {/* Pizarra */}
          <Link href="/dashboard?tab=pizarra"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-purple-500/35 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-purple-500/2 group-hover:bg-purple-500/5 transition-colors duration-500 rounded-xl" />
            <div className="relative z-10 mb-4">
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/15 group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <h4 className="font-black italic uppercase text-xl text-white mb-2 group-hover:text-purple-400 transition-colors relative z-10">Pizarra</h4>
            <p className="text-sm text-slate-500 font-medium relative z-10">Diseña estrategias y arma alineaciones para tus partidos.</p>
          </Link>

          {/* Simulador */}
          <Link href="/dashboard?tab=simulator"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-[#FF5733]/35 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF5733]/10 rounded-full blur-2xl group-hover:bg-[#FF5733]/25 transition-colors duration-500" />
            <div className="relative z-10 mb-4">
              <div className="bg-[#FF5733]/10 text-[#FF5733] p-3 rounded-xl border border-[#FF5733]/15 group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h4 className="font-black italic uppercase text-xl text-white mb-2 group-hover:text-[#FF5733] transition-colors relative z-10">Simulador</h4>
            <p className="text-sm text-slate-500 font-medium relative z-10">Simula resultados de las jornadas y visualiza la clasificación de tu equipo.</p>
          </Link>

        </div>
      </main>

      {/* ── COLLABORATORS MARQUEE ── */}
      <section className="bg-black/40 backdrop-blur-md py-3 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <p className="text-center text-[8px] font-black uppercase tracking-[0.5em] text-[#FFD300]/30 mb-2">Colaboradores</p>
        <div className="flex whitespace-nowrap items-center"
          style={{ animation: 'marquee 24s linear infinite', width: 'max-content' }}>
          {marqueeItems.map((name, i) => (
            <span key={i} className="font-black italic uppercase text-sm text-[#FFD300]/50 flex items-center gap-10 px-8">
              {name}
              <span className="text-white/10 text-xs">✦</span>
            </span>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  )
}
