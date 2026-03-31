'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'

// Definimos las funciones (tarjetas)
const features = [
  {
    id: 'login',
    title: 'Iniciar Sesión',
    description: 'Accede a tu cuenta para guardar tu progreso, estadísticas y gestionar tu perfil.',
    action: 'login', // Usamos action para diferenciar del route
    color: '#01d6c3' 
  },
  {
    id: 'simulador',
    title: 'Simulador',
    description: 'Prueba diferentes estrategias, builds y escenarios en tiempo real.',
    action: '/simulador',
    color: '#FFD300' 
  },
  {
    id: 'pizarra',
    title: 'Pizarra',
    description: 'Dibuja, planea y comparte tus tácticas de juego con tu equipo.',
    action: '/pizarra',
    color: '#FF4B4B' 
  },
  {
    id: 'tierlist',
    title: 'Tier List',
    description: 'Clasifica, vota y descubre los mejores elementos del meta actual.',
    action: '/tierlist',
    color: '#B829FF' 
  }
]

export default function Home() {
  const router = useRouter()

  // --- ESTADOS DE NAVEGACIÓN Y UI ---
  const [showLogin, setShowLogin] = useState(false)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [isTouch, setIsTouch] = useState(false)

  // --- ESTADOS DE LOGIN ---
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a0a'
    
    // Detectar si el dispositivo es táctil al primer toque en la pantalla
    const handleTouch = () => setIsTouch(true)
    window.addEventListener('touchstart', handleTouch, { once: true })

    return () => { 
      document.body.style.backgroundColor = '' 
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [])

  // --- LÓGICA DE LOGIN ORIGINAL ---
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

    if (data.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  // --- LÓGICA DE CLIC EN TARJETAS ---
  const handleCardClick = (featureId: string, action: string) => {
    // Si es un dispositivo táctil (teléfono/tablet)
    if (isTouch) {
      if (activeCard === featureId) {
        // Segundo clic: Ejecutar acción
        ejecutarAccion(action)
      } else {
        // Primer clic: Solo girar la tarjeta
        setActiveCard(featureId)
      }
    } else {
      // Si es en PC (mouse), se entra directo al primer clic 
      // (porque el giro ya se vio con el hover)
      ejecutarAccion(action)
    }
  }

  const ejecutarAccion = (action: string) => {
    if (action === 'login') {
      setShowLogin(true)
      setActiveCard(null) // Reseteamos la tarjeta activa
    } else {
      router.push(action)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      
      {/* HEADER INTEGRADO */}
      <header className="w-full h-24 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg relative z-50">
        <div 
          className="relative w-48 h-16 cursor-pointer" 
          onClick={() => {
            setShowLogin(false)
            router.push('/')
          }}
        >
          <Image 
            src="/Muertazos.png" 
            alt="Muertazos Logo" 
            fill 
            className="object-contain"
            priority 
          />
        </div>
      </header>

      {/* ÁREA PRINCIPAL DINÁMICA */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8 px-4 md:px-8">
        
        {/* VISTA 1: MENÚ DE TARJETAS */}
        {!showLogin && (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl md:text-5xl font-black italic text-center mb-12 tracking-tighter uppercase leading-none text-white drop-shadow-lg">
              SELECCIONA UNA <span style={{ color: '#FFD300' }}>FUNCIÓN</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {features.map((feature) => (
                <div 
                  key={feature.id} 
                  className="group h-64 w-full perspective-[1000px] cursor-pointer"
                  onClick={() => handleCardClick(feature.id, feature.action)}
                >
                  <div className={`relative h-full w-full rounded-3xl transition-all duration-500 [transform-style:preserve-3d] shadow-xl 
                    ${!isTouch ? 'group-hover:[transform:rotateY(180deg)] group-hover:scale-105' : ''} 
                    ${activeCard === feature.id ? '[transform:rotateY(180deg)] scale-105' : ''}
                  `}>
                    
                    {/* FRENTE DE LA TARJETA */}
                    <div className="absolute inset-0 h-full w-full rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm [backface-visibility:hidden] flex flex-col items-center justify-center p-6 shadow-2xl">
                      <h2 
                        className="text-2xl font-black italic text-center uppercase tracking-tighter"
                        style={{ color: feature.color }}
                      >
                        {feature.title}
                      </h2>
                    </div>

                    {/* REVERSO DE LA TARJETA */}
                    <div className="absolute inset-0 h-full w-full rounded-3xl bg-slate-950 border border-slate-700 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                      <p className="text-slate-300 text-sm font-medium mb-6">
                        {feature.description}
                      </p>
                      <span 
                        className="text-[11px] font-black uppercase tracking-widest border-b-2 pb-1 transition-all"
                        style={{ borderColor: feature.color, color: feature.color }}
                      >
                        {isTouch && activeCard === feature.id ? 'Toca de nuevo para entrar' : 'Entrar \u2192'}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 2: FORMULARIO DE INICIO DE SESIÓN */}
        {showLogin && (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="bg-slate-900/40 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-800 backdrop-blur-sm relative">
              
              {/* BOTÓN DE REGRESAR CON FLECHA */}
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <span>&larr;</span> Volver
              </button>

              <h1 className="text-3xl font-black italic text-center mt-6 mb-8 tracking-tighter uppercase leading-none">
                  <span style={{ color: '#FFFFFF' }}>INICIAR</span> 
                  <span className="ml-2" style={{ color: '#FFD300' }}>SESIÓN</span>
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
                  className="w-full bg-[#01d6c3] hover:scale-[1.02] active:scale-95 text-slate-900 font-black italic py-4 rounded-2xl transition-all uppercase tracking-tighter mt-4"
                >
                  ENTRAR
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER CON BOTÓN DE DONACIÓN (Siempre visible) */}
      <div className="mt-auto flex flex-col items-center gap-4 pb-8">
        <div id="donate-button-container">
          <div id="donate-button" className="hover:scale-105 transition-transform"></div>
        </div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          MUERTAZOS © 2026
        </p>
      </div>

      {/* CARGA DEL SDK DE PAYPAL */}
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
              }
            }).render('#donate-button')
          }
        }}
      />
    </div>
  )
}