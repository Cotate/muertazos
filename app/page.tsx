'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'

// --- DATOS DE LA PIZARRA ---
const PLAYERS_DATA: Record<string, string[]> = {
  "1K FC": ["Achraf Laiti.png", "Cristian Faura.png", "Erik Beattie.png", "Gerard Verge.png", "Guelmi Pons.png", "Isma Reguia.png", "Iván Rivera.png", "Joel Paredes.png", "Joel Navas.png", "Karim Moya.png", "Michel Owono.png", "Pau 'ZZ' Ruiz.png", "Pol Lechuga.png"],
  "El Barrio": ["Carlos Val.png", "Cristian Ubón.png", "Haitam Babia.png", "Gerard Puigvert.png", "Hugo Eyre.png", "Joel Bañuls.png", "Pablo Saborido.png", "Pau Fernández.png", "Pol Molés.png", "Robert Vallribera.png", "Sergio Fernández.png", "Sergio Herrero.png", "Ñito Martín.png"],
  "Jijantes FC": ["Cristian Lobato.png", "Dani Martí.png", "Daniel Plaza.png", "David Toro.png", "Iker Hernández.png", "Ion Vázquez.png", "José Segovia.png", "Juanpe Nzo.png", "Mario León.png", "Michel Herrero.png", "Pau Fer.png", "Sergi Torres.png", "Víctor Pérez Bello.png", "Álex Cañero.png"],
  "La Capital CF": ["Antoni Hernández.png", "Daniel Pérez.png", "Daouda Bamma.png", "Iñaki Villalba.png", "Julen Álvarez.png", "Manel Jiménez.png", "Manuel Martín.png", "Mario Victorio.png", "Omar Dambelleh.png", "Pablo Beguer.png", "Sergi Vives.png", "Sohaib Rektout.png"],
  "Los Troncos FC": ["Alex Cubedo.png", "Carles Planas.png", "Carlos Contreras.png", "Daniel Tamayo.png", "David Reyes.png", "Eloy Amoedo.png", "Joan Oriol.png", "Mark Sorroche.png", "Masi Dabo.png", "Sagar Escoto Majó.png", "Victor Oribe.png", "Yaroslav Toporkov.png", "Álvaro Arché.png"],
  "PIO FC": ["Adri Espinar.png", "Adrián Frutos.png", "Manel Beneite.png", "Fernando Velillas.png", "Iker Bartolomé.png", "Sergio Mulero.png", "Joan Luque.png", "Luis García.png", "Marc Briones.png", "Marc Grifell.png", "Pol Benito.png", "Yeray Muñoz.png", "Álex Sánchez.png"],
  "Porcinos FC": ["Aitor Vives.png", "Dani Pérez.png", "Gerard Gómez.png", "David Soriano.png", "Edgar Alvaro.png", "Fouad El Amrani.png", "Marc Pelaz.png", "Nadir Louah.png", "Nico Santos.png", "Oscar Coll.png", "Ricard Pujol.png", "Roger Carbó.png", "Tomeu Nadal.png", "Victor Nofuentes.png"],
  "Rayo de Barcelona": ["Abde Bakkali.png", "Adrià Escribano.png", "Nil Pradas.png", "Carlos Heredia.png", "Carlos Omabegho.png", "David Moreno.png", "Gerard Oliva.png", "Guillem 'ZZ' Ruiz.png", "Ismael González.png", "Iván Torres.png", "Jordi Gómez.png", "Jorge Ibáñez.png", "Roc Bancells.png"],
  "Saiyans FC": ["Albert Garcia.png", "Borja Montejo.png", "Dani Santiago.png", "Diego Jiménez.png", "Feliu Torrus.png", "Gerard Vacas.png", "Gio Ferinu.png", "Isaac Maldonado.png", "Iván Fajardo.png", "Juanan Gallego.png", "Pablo Fernández.png", "Sergi Gestí.png"],
  "Skull FC": ["Alberto Arnalot.png", "Dani Santos.png", "Samuel Aparicio.png", "David Asensio.png", "Jorge Escobar.png", "Kevin Zárate.png", "Koke Navares.png", "Nano Modrego.png", "Pablo de Castro.png", "Raúl Escobar.png", "Víctor Mongil.png", "Álex Salas.png"],
  "Ultimate Mostoles": ["Aleix Hernando.png", "Aleix Lage.png", "Josep Riart.png", "Aleix Martí.png", "Alex 'Capi' Domingo.png", "David Grifell.png", "Eloy Pizarro.png", "Ferran Corominas.png", "Javi Espinosa.png", "Juan Lorente.png", "Marc Granero.png", "Mikhail Prokopev.png", "Víctor Vidal.png"],
  "xBuyer Team": ["Aleix Ruiz.png", "Eric Sánchez.png", "Galde Hugue.png", "Jacobo Liencres.png", "Javier Comas.png", "Joel Espinosa.png", "Juanma González.png", "Mario Reyes.png", "Sergio 'Chechi' Costa.png", "Víctor Vargas.png", "Xavier Cabezas.png", "Álex Romero.png", "Eric Pérez.png"],
}

// Funciones para las tarjetas
const features = [
  { id: 'login', title: 'Iniciar Sesión', description: 'Accede a tu cuenta para guardar tu progreso y estadísticas.', action: 'login', color: '#01d6c3' },
  { id: 'simulador', title: 'Simulador', description: 'Prueba diferentes estrategias y escenarios en tiempo real.', action: '/simulador', color: '#FFD300' },
  { id: 'pizarra', title: 'Pizarra', description: 'Dibuja y planea tus tácticas de juego con los jugadores oficiales.', action: 'pizarra', color: '#FF4B4B' },
  { id: 'tierlist', title: 'Tier List', description: 'Clasifica y descubre los mejores elementos del meta actual.', action: '/tierlist', color: '#B829FF' }
]

export default function Home() {
  const router = useRouter()
  
  // --- ESTADOS DE VISTA ---
  const [view, setView] = useState<'menu' | 'login' | 'pizarra'>('menu')
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [isTouch, setIsTouch] = useState(false)

  // --- ESTADOS LOGIN ---
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // --- ESTADOS PIZARRA ---
  const availableTeams = Object.keys(PLAYERS_DATA)
  const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0])
  const [selectedPlayer, setSelectedPlayer] = useState<string>(PLAYERS_DATA[availableTeams[0]]?.[0] || "")
  const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a0a'
    const handleTouch = () => setIsTouch(true)
    window.addEventListener('touchstart', handleTouch, { once: true })
    return () => window.removeEventListener('touchstart', handleTouch)
  }, [])

  // Sincronizar jugador al cambiar equipo en pizarra
  useEffect(() => {
    if (selectedTeam && PLAYERS_DATA[selectedTeam]) {
      setSelectedPlayer(PLAYERS_DATA[selectedTeam][0])
    }
  }, [selectedTeam])

  // --- LÓGICA DE NAVEGACIÓN ---
  const handleCardClick = (id: string, action: string) => {
    if (isTouch) {
      if (activeCard === id) ejecutarAccion(action)
      else setActiveCard(id)
    } else {
      ejecutarAccion(action)
    }
  }

  const ejecutarAccion = (action: string) => {
    if (action === 'login') setView('login')
    else if (action === 'pizarra') setView('pizarra')
    else router.push(action)
    setActiveCard(null)
  }

  // --- MÉTODOS LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { data, error: dbError } = await supabase.from('app_users').select('*').eq('username', username).eq('password', password).single()
    if (dbError || !data) return setError('Datos incorrectos')
    localStorage.setItem('muertazos_user', JSON.stringify(data))
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
  }

  // --- MÉTODOS PIZARRA ---
  const addPlayerToPitch = (fileName: string) => {
    const newPlayer = { id: Math.random().toString(36).substr(2, 9), team: selectedTeam, fileName, x: 50, y: 50, zIndex: playersOnPitch.length + 1 }
    setPlayersOnPitch(prev => [...prev, newPlayer])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPlayersOnPitch(prev => prev.map(p => p.id === draggingId ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) } : p))
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      
      {/* HEADER */}
      <header className="w-full h-24 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg z-50">
        <div className="relative w-48 h-16 cursor-pointer" onClick={() => setView('menu')}>
          <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* VISTA 1: TARJETAS */}
        {view === 'menu' && (
          <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl md:text-5xl font-black italic text-center mb-12 uppercase tracking-tighter">
              SELECCIONA UNA <span style={{ color: '#FFD300' }}>FUNCIÓN</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.id} className="group h-64 w-full perspective-[1000px] cursor-pointer" onClick={() => handleCardClick(f.id, f.action)}>
                  <div className={`relative h-full w-full rounded-3xl transition-all duration-500 [transform-style:preserve-3d] ${!isTouch ? 'group-hover:[transform:rotateY(180deg)] group-hover:scale-105' : activeCard === f.id ? '[transform:rotateY(180deg)] scale-105' : ''}`}>
                    <div className="absolute inset-0 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm [backface-visibility:hidden] flex items-center justify-center p-6 shadow-2xl">
                      <h2 className="text-2xl font-black italic text-center uppercase tracking-tighter" style={{ color: f.color }}>{f.title}</h2>
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-slate-950 border border-slate-700 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-slate-300 text-sm mb-6">{f.description}</p>
                      <span className="text-[11px] font-black uppercase tracking-widest border-b-2" style={{ borderColor: f.color, color: f.color }}>
                        {isTouch && activeCard === f.id ? 'Toca para entrar' : 'Entrar \u2192'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 2: LOGIN */}
        {view === 'login' && (
          <div className="w-full max-w-sm animate-in slide-in-from-bottom-8 duration-500 bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm relative">
            <button onClick={() => setView('menu')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase">
              <span>&larr;</span> Volver
            </button>
            <h1 className="text-3xl font-black italic text-center mt-6 mb-8 uppercase tracking-tighter">
              <span className="text-white">INICIAR</span> <span style={{ color: '#FFD300' }}>SESIÓN</span>
            </h1>
            <form onSubmit={handleLogin} className="space-y-5">
              <input type="text" placeholder="USUARIO" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-[#ffd300] outline-none font-bold" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="password" placeholder="CONTRASEÑA" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl focus:border-[#01d6c3] outline-none font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <p className="text-red-500 text-[11px] font-bold text-center uppercase italic">{error}</p>}
              <button type="submit" className="w-full bg-[#01d6c3] text-slate-900 font-black italic py-4 rounded-2xl uppercase tracking-tighter">ENTRAR</button>
            </form>
          </div>
        )}

        {/* VISTA 3: PIZARRA */}
        {view === 'pizarra' && (
          <div className="w-full max-w-5xl animate-in fade-in duration-500 flex flex-col gap-4 relative">
            <button onClick={() => setView('menu')} className="self-start text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2">
              <span>&larr;</span> Volver al menú
            </button>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-400 uppercase">Equipo</label>
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm">
                  {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-400 uppercase">Jugador</label>
                <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm">
                  {PLAYERS_DATA[selectedTeam]?.map(p => <option key={p} value={p}>{p.replace('.png', '')}</option>)}
                  <option value="Nuevo.png">CREAR JUGADOR</option>
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => addPlayerToPitch(selectedPlayer)} className="bg-[#ffd300] text-black font-black italic px-6 py-2 rounded-lg flex-1 sm:flex-none">Añadir</button>
                <button onClick={() => setPlayersOnPitch([])} className="bg-red-500/10 text-red-500 border border-red-500/50 font-black italic px-4 py-2 rounded-lg">Limpiar</button>
              </div>
            </div>

            <div 
              ref={boardRef} 
              onPointerMove={handlePointerMove} onPointerUp={() => setDraggingId(null)} onPointerLeave={() => setDraggingId(null)}
              className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl touch-none"
              style={{ backgroundImage: 'url(/Campo.jpg)', backgroundSize: '100% 100%' }}
            >
              {playersOnPitch.map((p) => (
                <div 
                  key={p.id} onPointerDown={() => setDraggingId(p.id)} 
                  onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(x => x.id !== p.id))}
                  className="absolute w-12 h-12 md:w-24 md:h-24 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: p.zIndex }}
                >
                  <div className="relative w-full h-full">
                    <Image src={p.fileName === "Nuevo.png" ? "/Nuevo.png" : `/jugadores/${p.team}/${p.fileName}`} alt="jugador" fill className="object-contain pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-[10px] font-bold uppercase">* DOBLE CLIC PARA ELIMINAR JUGADOR</p>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-8 flex flex-col items-center gap-4 mt-auto">
        <div id="donate-button-container"><div id="donate-button"></div></div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">MUERTAZOS © 2026</p>
      </footer>

      <Script
        src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).PayPal) {
            (window as any).PayPal.Donation.Button({
              env: 'production',
              hosted_button_id: 'PE6W2EWS2SJFW',
              image: { src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif', alt: 'Donar' }
            }).render('#donate-button')
          }
        }}
      />
    </div>
  )
}