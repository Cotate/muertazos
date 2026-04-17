'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

const COLLABORATORS = ['Ivanx', 'Chavez6', 'Gaby Velazco', 'Lucholuna', 'Ahmazee', 'Shall', 'Yuli', 'Viri']

export default function Home() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

      <AppHeader variant="minimal" onLoginClick={() => { setError(''); setShowLogin(true) }} />

      {showLogin && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowLogin(false) }}
        >
          <div className="w-full max-w-sm">
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-7 shadow-2xl">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute top-3 right-3 text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 bg-[#0a0a0a]/80 border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-[#01d6c3] focus:ring-1 focus:ring-[#01d6c3]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0013.5 13.5M6.357 6.357A9.953 9.953 0 003 12c2.087 4.17 6.298 7 9 7a9.96 9.96 0 005.642-1.742M9.878 4.121A9.97 9.97 0 0112 4c2.702 0 6.913 2.83 9 7a9.967 9.967 0 01-1.614 2.386" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
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
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <Link href="/tierlist"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-8 min-h-[220px] flex flex-col justify-between hover:border-[#FFD300]/40 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#FFD300]/8 rounded-full blur-3xl group-hover:bg-[#FFD300]/20 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="bg-[#FFD300]/10 text-[#FFD300] p-4 rounded-xl border border-[#FFD300]/15 group-hover:scale-110 transition-transform duration-300 w-fit mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                </svg>
              </div>
              <h4 className="font-black italic uppercase text-2xl text-white mb-2 group-hover:text-[#FFD300] transition-colors">Tier List</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Crea tu propia tier list de jugadores, equipos y más.</p>
            </div>
            <div className="relative z-10 mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD300]/40 group-hover:text-[#FFD300]/70 transition-colors">Abrir →</span>
            </div>
          </Link>

          <Link href="/pizarra"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-8 min-h-[220px] flex flex-col justify-between hover:border-purple-500/40 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute inset-0 bg-purple-500/2 group-hover:bg-purple-500/5 transition-colors duration-500 rounded-2xl" />
            <div className="relative z-10">
              <div className="bg-purple-500/10 text-purple-400 p-4 rounded-xl border border-purple-500/15 group-hover:scale-110 transition-transform duration-300 w-fit mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="font-black italic uppercase text-2xl text-white mb-2 group-hover:text-purple-400 transition-colors">Pizarra</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Diseña estrategias y arma alineaciones para tus partidos.</p>
            </div>
            <div className="relative z-10 mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/40 group-hover:text-purple-400/70 transition-colors">Abrir →</span>
            </div>
          </Link>

          <Link href="/simulator"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-8 min-h-[220px] flex flex-col justify-between hover:border-[#FF5733]/40 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF5733]/10 rounded-full blur-3xl group-hover:bg-[#FF5733]/25 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="bg-[#FF5733]/10 text-[#FF5733] p-4 rounded-xl border border-[#FF5733]/15 group-hover:scale-110 transition-transform duration-300 w-fit mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-black italic uppercase text-2xl text-white mb-2 group-hover:text-[#FF5733] transition-colors">Simulador</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Simula resultados de las jornadas y visualiza la clasificación de tu equipo.</p>
            </div>
            <div className="relative z-10 mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5733]/40 group-hover:text-[#FF5733]/70 transition-colors">Abrir →</span>
            </div>
          </Link>

          <Link href="/predis"
            className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-8 min-h-[220px] flex flex-col justify-between hover:border-[#01d6c3]/40 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1.5">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#01d6c3]/8 rounded-full blur-3xl group-hover:bg-[#01d6c3]/20 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="bg-[#01d6c3]/10 text-[#01d6c3] p-4 rounded-xl border border-[#01d6c3]/15 group-hover:scale-110 transition-transform duration-300 w-fit mb-5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h4 className="font-black italic uppercase text-2xl text-white mb-2 group-hover:text-[#01d6c3] transition-colors">Predis</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Haz tus picks para las jornadas y comparte tu predicción.</p>
            </div>
            <div className="relative z-10 mt-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#01d6c3]/40 group-hover:text-[#01d6c3]/70 transition-colors">Abrir →</span>
            </div>
          </Link>

        </div>
      </main>

      <section className="bg-black/40 backdrop-blur-md py-3 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <p className="text-center text-[8px] font-black uppercase tracking-[0.5em] text-[#FFD300]/30 mb-2">Colaboradores</p>
        <div className="flex whitespace-nowrap items-center"
          style={{ animation: 'marquee 24s linear infinite', width: 'max-content' }}>
          {marqueeItems.map((name, i) => (
            <span key={i} className="font-black italic uppercase text-sm text-[#FFD300]/50 flex items-center gap-10 px-8">
              {name}
              <span className="text-white/10 text-xs">·</span>
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
