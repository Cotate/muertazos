'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    console.log("Intentando login con:", username, password)

    const { data, error: dbError } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (dbError) console.error("Error de Supabase:", dbError)
    
    if (dbError || !data) {
      setError('Credenciales incorrectas (o mojadas)')
      return
    }

    console.log("Usuario encontrado:", data)

    // ESTO ES LO QUE TE FALTABA: Guardar y Redirigir
    localStorage.setItem('muertazos_user', JSON.stringify(data))

    if (data.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-sm border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#ffd300]">INICIAR SESIÓN</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Usuario"
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#01d6c3] hover:bg-[#00b5a4] text-slate-900 font-bold py-3 rounded transition-colors"
          >
            ENTRAR
          </button>
        </form>
      </div>
    </div>
  )
}