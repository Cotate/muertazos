'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

// --- DATOS CONSTANTES ---
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

const features = [
  { id: 'login', title: 'Iniciar Sesión', description: 'Accede a tu cuenta para guardar tu progreso.', action: 'login', color: '#01d6c3' },
  { id: 'simulador', title: 'Simulador', description: 'Calcula las posiciones de la liga en tiempo real.', action: 'simulador', color: '#FFD300' },
  { id: 'pizarra', title: 'Pizarra', description: 'Planifica tus tácticas con los jugadores oficiales.', action: 'pizarra', color: '#FF4B4B' },
  { id: 'tierlist', title: 'Tier List', description: 'Clasifica los mejores elementos del meta actual.', action: '/tierlist', color: '#B829FF' }
]

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<'menu' | 'login' | 'pizarra' | 'simulador'>('menu')
  const [isTouch, setIsTouch] = useState(false)
  const [activeCard, setActiveCard] = useState<string | null>(null)

  // --- ESTADOS LOGIN ---
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // --- ESTADOS PIZARRA ---
  const availableTeams = Object.keys(PLAYERS_DATA)
  const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0])
  const [selectedPlayer, setSelectedPlayer] = useState<string>(PLAYERS_DATA[availableTeams[0]]?.[0] || "")
  const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // --- ESTADOS SIMULADOR ---
  const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings');
  const [matchdays, setMatchdays] = useState<any[]>([]);
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, { hg: string, ag: string, penaltyWinnerId: number | null }>>({});

  useEffect(() => {
    const handleTouch = () => setIsTouch(true)
    window.addEventListener('touchstart', handleTouch, { once: true })
    return () => window.removeEventListener('touchstart', handleTouch)
  }, [])

  // Carga de datos Simulador
  useEffect(() => {
    if (view !== 'simulador') return;
    const loadSimulatorData = async () => {
      const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey);
      if (tData) setTeams(tData);

      const { data: mData } = await supabase
        .from('matchdays')
        .select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
        .eq('competition_key', compKey)
        .order('display_order');

      const { data: rData } = await supabase.from('match_results').select('*');

      if (mData) {
        const loadedScores: any = {};
        if (rData) {
          rData.forEach((res: any) => {
            let pWinner = null;
            if (res.home_goals === res.away_goals) {
              const match = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id);
              if (res.home_penalties > res.away_penalties) pWinner = match?.home_team_id;
              if (res.away_penalties > res.home_penalties) pWinner = match?.away_team_id;
            }
            loadedScores[res.match_id] = {
              hg: res.home_goals != null ? String(res.home_goals) : '',
              ag: res.away_goals != null ? String(res.away_goals) : '',
              penaltyWinnerId: pWinner
            };
          });
        }
        setScores(loadedScores);
        setMatchdays(mData);
        if (mData.length > 0) setActiveMatchdayId(mData[0].id);
      }
    };
    loadSimulatorData();
  }, [view, compKey]);

  // --- LÓGICA GENERAL ---
  const handleCardClick = (id: string, action: string) => {
    if (isTouch) {
      if (activeCard === id) {
        if (action === 'login' || action === 'pizarra' || action === 'simulador') setView(action as any)
        else router.push(action)
      } else setActiveCard(id)
    } else {
      if (action === 'login' || action === 'pizarra' || action === 'simulador') setView(action as any)
      else router.push(action)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await supabase.from('app_users').select('*').eq('username', username).eq('password', password).single()
    if (!data) return setLoginError('Incorrecto')
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
  }

  // --- LÓGICA PIZARRA ---
  const addPlayerToPitch = (fileName: string) => {
    const newP = { id: Math.random().toString(36).substr(2, 9), team: selectedTeam, fileName, x: 50, y: 50, zIndex: playersOnPitch.length + 1 }
    setPlayersOnPitch([...playersOnPitch, newP])
  }

  const addAllPlayers = () => {
    const players = PLAYERS_DATA[selectedTeam];
    if (!players) return;
    const newOnes = players.map((f, i) => ({
      id: Math.random().toString(36).substr(2, 9), team: selectedTeam, fileName: f, x: 50, y: 50, zIndex: playersOnPitch.length + i + 1
    }))
    setPlayersOnPitch([...playersOnPitch, ...newOnes])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPlayersOnPitch(prev => prev.map(p => p.id === draggingId ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) } : p))
  }

  // --- LÓGICA SIMULADOR ---
  const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    setScores(prev => {
      const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null };
      const newHg = field === 'hg' ? value : current.hg;
      const newAg = field === 'ag' ? value : current.ag;
      return { ...prev, [matchId]: { ...current, [field]: value, penaltyWinnerId: newHg === newAg ? current.penaltyWinnerId : null } };
    });
  };

  const standings = teams.map(team => {
    let w = 0, l = 0, gf = 0, gc = 0;
    matchdays.forEach(md => md.matches?.forEach((m: any) => {
      const s = scores[m.id];
      if (!s || s.hg === '' || s.ag === '') return;
      const hG = parseInt(s.hg), aG = parseInt(s.ag);
      if (m.home_team_id === team.id) {
        gf += hG; gc += aG;
        if (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) w++; else l++;
      } else if (m.away_team_id === team.id) {
        gf += aG; gc += hG;
        if (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) w++; else l++;
      }
    }));
    return { ...team, w, l, gf, gc, dg: gf - gc };
  }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf);

  const getRowColor = (idx: number) => {
    if (idx === 0) return 'bg-yellow-500';
    if (idx >= 1 && idx <= 5) return 'bg-blue-500';
    if (idx >= 6 && idx <= 9) return 'bg-red-500';
    return 'bg-transparent';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <header className="w-full h-24 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg z-50">
        <div className="relative w-48 h-16 cursor-pointer" onClick={() => setView('menu')}>
          <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* MENU PRINCIPAL */}
        {view === 'menu' && (
          <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl md:text-5xl font-black italic text-center mb-12 uppercase">
              SELECCIONA UNA <span style={{ color: '#FFD300' }}>FUNCIÓN</span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.id} className="group h-64 perspective-[1000px] cursor-pointer" onClick={() => handleCardClick(f.id, f.action)}>
                  <div className={`relative h-full transition-all duration-500 [transform-style:preserve-3d] ${!isTouch ? 'group-hover:[transform:rotateY(180deg)]' : activeCard === f.id ? '[transform:rotateY(180deg)]' : ''}`}>
                    <div className="absolute inset-0 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-center p-6 [backface-visibility:hidden]">
                      <h2 className="text-2xl font-black italic text-center uppercase" style={{ color: f.color }}>{f.title}</h2>
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-slate-950 border border-slate-700 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-slate-300 text-sm mb-6">{f.description}</p>
                      <span className="text-[11px] font-black uppercase border-b-2" style={{ borderColor: f.color, color: f.color }}>Entrar &rarr;</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="w-full max-w-sm bg-slate-900/40 p-8 rounded-3xl border border-slate-800 relative">
            <button onClick={() => setView('menu')} className="absolute top-6 left-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">&larr; Volver</button>
            <h1 className="text-3xl font-black italic text-center mt-6 mb-8 uppercase">Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="USUARIO" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none" value={username} onChange={e => setUsername(e.target.value)} />
              <input type="password" placeholder="CONTRASEÑA" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none" value={password} onChange={e => setPassword(e.target.value)} />
              {loginError && <p className="text-red-500 text-xs font-bold text-center italic">{loginError}</p>}
              <button type="submit" className="w-full bg-[#01d6c3] text-black font-black italic py-4 rounded-2xl uppercase">Entrar</button>
            </form>
          </div>
        )}

        {/* PIZARRA VIEW */}
        {view === 'pizarra' && (
          <div className="w-full max-w-5xl flex flex-col gap-4 animate-in fade-in duration-500">
            <button onClick={() => setView('menu')} className="self-start text-slate-400 font-bold text-[10px] uppercase tracking-widest">&larr; Volver al Menú</button>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-400 uppercase">Equipo</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm">
                  {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-400 uppercase">Jugador</label>
                <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm">
                  {PLAYERS_DATA[selectedTeam]?.map(p => <option key={p} value={p}>{p.replace('.png', '')}</option>)}
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => addPlayerToPitch(selectedPlayer)} className="bg-[#ffd300] text-black font-black italic px-4 py-2 rounded-lg flex-1">Añadir</button>
                <button onClick={addAllPlayers} className="bg-[#01d6c3] text-black font-black italic px-4 py-2 rounded-lg flex-1">Todos</button>
                <button onClick={() => setPlayersOnPitch([])} className="bg-red-500 text-white font-black italic px-4 py-2 rounded-lg flex-1">Limpiar</button>
              </div>
            </div>
            <div ref={boardRef} onPointerMove={handlePointerMove} onPointerUp={() => setDraggingId(null)} className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 touch-none shadow-2xl" style={{ backgroundImage: 'url(/Campo.jpg)', backgroundSize: '100% 100%' }}>
              {playersOnPitch.map(p => (
                <div key={p.id} onPointerDown={() => setDraggingId(p.id)} onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(x => x.id !== p.id))} className="absolute w-12 h-12 md:w-24 md:h-24 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing" style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: p.zIndex }}>
                  <div className="relative w-full h-full">
                    <Image src={p.fileName === "Nuevo.png" ? "/Nuevo.png" : `/jugadores/${p.team}/${p.fileName}`} alt="jugador" fill className="object-contain pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMULADOR VIEW */}
        {view === 'simulador' && (
          <div className="w-full max-w-7xl animate-in fade-in duration-500 flex flex-col">
            <button onClick={() => setView('menu')} className="self-start text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">&larr; Volver al Menú</button>
            <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-6 border-b border-white/5 bg-slate-900/30 rounded-t-3xl">
              <div className="flex gap-2 border-r border-white/10 pr-4">
                <button onClick={() => setCompKey('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'text-slate-500 border-slate-700'}`}>Kings</button>
                <button onClick={() => setCompKey('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'text-slate-500 border-slate-700'}`}>Queens</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {matchdays.map(day => (
                  <button key={day.id} onClick={() => setActiveMatchdayId(day.id)} className={`px-2 py-1.5 text-[11px] font-black italic uppercase border-b-2 ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'border-[#FFD300] text-[#FFD300]' : 'border-[#01d6c3] text-[#01d6c3]') : 'border-transparent text-slate-400'}`}>
                    {day.name.replace('JORNADA', 'J').replace(/\s+/g, '')}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 p-6 bg-slate-900/20 border border-white/5 rounded-b-3xl">
              <div className="xl:col-span-2 space-y-4">
                {matchdays.find(d => d.id === activeMatchdayId)?.matches?.map((m: any) => {
                  const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null };
                  const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag;
                  const folder = compKey === 'kings' ? 'Kings' : 'Queens';
                  return (
                    <div key={m.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex flex-col items-center flex-1">
                         <button onClick={() => isTie && setScores({...scores, [m.id]: {...s, penaltyWinnerId: m.home_team_id}})} className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_8px_#ffd300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                            <Image src={`/logos/${folder}/${m.home?.logo_file}`} width={60} height={60} alt="home" />
                         </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="text" value={s.hg} onChange={e => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-xl font-black text-xl" />
                        <span className="font-black italic text-xs text-slate-500">VS</span>
                        <input type="text" value={s.ag} onChange={e => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-xl font-black text-xl" />
                      </div>
                      <div className="flex flex-col items-center flex-1">
                         <button onClick={() => isTie && setScores({...scores, [m.id]: {...s, penaltyWinnerId: m.away_team_id}})} className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_8px_#ffd300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                            <Image src={`/logos/${folder}/${m.away?.logo_file}`} width={60} height={60} alt="away" />
                         </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="bg-slate-950/50 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-[10px] uppercase font-bold">
                  <thead>
                    <tr className="bg-white/5 text-slate-500"><th className="p-2 w-8">#</th><th className="text-left p-2">Equipo</th><th className="p-2">V</th><th className="p-2">D</th><th className="p-2">DG</th></tr>
                  </thead>
                  <tbody>
                    {standings.map((t, i) => (
                      <tr key={t.id} className="border-b border-white/5">
                        <td className="p-2 relative"><div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(i)}`} />{i + 1}</td>
                        <td className="p-2 flex items-center gap-2"><Image src={`/logos/${compKey === 'kings' ? 'Kings' : 'Queens'}/${t.logo_file}`} width={18} height={18} alt="t" />{t.name}</td>
                        <td className="p-2 text-center text-green-400 font-black">{t.w}</td>
                        <td className="p-2 text-center text-red-400 font-black">{t.l}</td>
                        <td className="p-2 text-center">{t.dg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="py-8 flex flex-col items-center gap-4">
        <div id="donate-button-container"><div id="donate-button"></div></div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">MUERTAZOS © 2026</p>
      </footer>

      <Script src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js" strategy="lazyOnload" onLoad={() => {
          if ((window as any).PayPal) {
            (window as any).PayPal.Donation.Button({
              env: 'production', hosted_button_id: 'PE6W2EWS2SJFW',
              image: { src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif', alt: 'Donar' }
            }).render('#donate-button')
          }
      }} />
    </div>
  )
}