// inicio sesion
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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

    if (dbError || !data) {
      setError('Datos incorrectos')
      return
    }

    localStorage.setItem('muertazos_user', JSON.stringify(data))
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* HEADER */}
      <header className="w-full h-24 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg relative z-50">
        <div className="relative w-48 h-16">
          <Image src="/Muertazos.png" alt="Muertazos Logo" fill className="object-contain" priority />
        </div>
      </header>

      {/* LOGIN CARD */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-slate-900/40 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800 backdrop-blur-sm">
          <h1 className="text-3xl font-black italic text-center mb-8 tracking-tighter uppercase leading-none">
            <span className="text-white">INICIAR</span>
            <span className="ml-2 text-[#FFD300]">SESIÓN</span>
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Usuario</label>
              <input
                type="text"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-[#ffd300] transition-all font-bold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest">Contraseña</label>
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
      </div>
    </div>
  )
}
