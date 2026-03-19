/******************************************************************************
CODIGO FRANKESTEIN A VER SI SALE LO DEL CAMPO TIO 2.0

*******************************************************************************/
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

const PLAYERS_DATA: Record<string, string[]> = {
  "1K FC": ["Achraf Laiti.png", "Cristian Faura.png", "Erik Beattie.png", "Gerard-Verge.png", "Guelmi-Pons.png", "Isma-Reguia.png", "Iván-Rivera.png", "Joel Paredes.png", "Joel-Navas.png", "Karim-Moya.png", "Michel-Owono.png", "Pau 'ZZ' Ruiz.png", "Pol-Lechuga.png"],
  "El Barrio": ["Carlos Val.png", "Cristian Ubón.png", "Gerard Puigvert.png", "Hugo Eyre.png", "Joel Bañuls.png", "Pablo Saborido.png", "Pau Fernández.png", "Pol Molés.png", "Robert Vallribera.png", "Sergio Fernández.png", "Sergio Herrero.png", "Ñito Martín.png"],
  "Jijantes FC": ["Cristian Lobato.png", "Dani Martí.png", "Daniel Plaza.png", "David Toro.png", "Iker Hernández.png", "Ion Vázquez.png", "José Segovia.png", "Juanpe Nzo.png", "Mario León.png", "Michel Herrero.png", "Pau Fer.png", "Sergi Torres.png", "Víctor Pérez Bello.png", "Álex Cañero.png"],
  "La Capital CF": ["Antoni Hernández.png", "Daniel Pérez.png", "Daouda Bamma.png", "Iñaki Villalba.png", "Julen Álvarez.png", "Manel Jiménez.png", "Manuel Martín.png", "Mario Victorio.png", "Omar Dambelleh.png", "Pablo Beguer.png", "Sergi Vives.png", "Sohaib Rektout.png"],
  "Los Troncos FC": ["Alex Cubedo.png", "Carles Planas.png", "Carlos Contreras.png", "Daniel Tamayo.png", "David Reyes.png", "Eloy Amoedo.png", "Joan Oriol.png", "Mark Sorroche.png", "Masi Dabo.png", "Sagar Escoto Majó.png", "Victor Oribe.png", "Yaroslav Toporkov.png", "Álvaro Arché.png"],
  "PIO FC": ["Adri Espinar.png", "Adrián Frutos.png", "Fernando Velillas.png", "Iker Bartolomé.png", "Izan Grande.png", "Joan Luque.png", "Luis García.png", "Marc Briones.png", "Marc Grifell.png", "Pol Benito.png", "Yeray Muñoz.png", "Álex Sánchez.png"],
  "Porcinos FC": ["Aitor Vives.png", "Dani Pérez.png", "David Soriano.png", "Edgar Alvaro.png", "Fouad El Amrani.png", "Marc Pelaz.png", "Nadir Louah.png", "Nico Santos.png", "Oscar Coll.png", "Ricard Pujol.png", "Roger Carbó.png", "Tomeu Nadal.png", "Victor Nofuentes.png"],
  "Rayo de Barcelona": ["Abde Bakkali.png", "Adrià Escribano.png", "Carlos Heredia.png", "Carlos Omabegho.png", "David Moreno.png", "Gerard Oliva.png", "Guillem 'ZZ' Ruiz.png", "Ismael González.png", "Iván Torres.png", "Jordi Gómez.png", "Jorge Ibáñez.png", "Roc Bancells.png"],
  "Saiyans FC": ["Albert Garcia.png", "Borja Montejo.png", "Dani Santiago.png", "Diego Jiménez.png", "Feliu Torrus.png", "Gerard Vacas.png", "Gio Ferinu.png", "Isaac Maldonado.png", "Iván Fajardo.png", "Juanan Gallego.png", "Pablo Fernández.png", "Sergi Gestí.png"],
  "Skull FC": ["Alberto Arnalot.png", "Dani Santos.png", "David 'Burrito' Ruiz.png", "Jorge Escobar.png", "Kevin Zárate.png", "Koke Navares.png", "Nano Modrego.png", "Pablo de Castro.png", "Raúl Escobar.png", "Roberto Tobe.png", "Víctor Mongil.png", "Álex Salas.png"],
  "Ultimate Mostoles": ["Aleix Hernando.png", "Aleix Lage.png", "Aleix Martí.png", "Alex 'Capi' Domingo.png", "David Grifell.png", "Eloy Pizarro.png", "Ferran Corominas.png", "Javi Espinosa.png", "Juan Lorente.png", "Marc Granero.png", "Mikhail Prokopev.png", "Víctor Vidal.png"],
  "xBuyer Team": ["Aleix Ruiz.png", "Eric Sánchez.png", "Galde Hugue.png", "Jacobo Liencres.png", "Javier Comas.png", "Joel Espinosa.png", "Juanma González.png", "Mario Reyes.png", "Sergio 'Chechi' Costa.png", "Sergio Campos.png", "Víctor Vargas.png", "Xavier Cabezas.png", "Álex Romero.png"],
}

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [view, setView] = useState<'picks' | 'ranking' | 'simulator' | 'pizarra'>('picks')
  const [menuOpen, setMenuOpen] = useState(false)
  
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [hasSavedInDB, setHasSavedInDB] = useState(false)
  
  const shareTicketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('muertazos_user')
    if (!storedUser) {
      router.push('/')
    } else {
      setUser(JSON.parse(storedUser))
    }
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  useEffect(() => {
    if (user) {
        loadData()
        setCurrentDayIndex(0) 
        setIsEditing(false)
    }
  }, [user, league])

  const loadData = async () => {
    const { data: mDays } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', league)
      .eq('is_visible', true)
      .order('display_order')

    if (mDays) {
      const sortedDays = mDays.map(day => {
        const sortedMatches = [...(day.matches || [])].sort((a: any, b: any) => {
          const orderA = a.match_order ?? a.id;
          const orderB = b.match_order ?? b.id;
          return orderA - orderB;
        });
        return { ...day, matches: sortedMatches };
      });

      setMatchdays(sortedDays)
      const { data: preds } = await supabase.from('predictions').select('*').eq('user_id', user.id)
      const predMap: Record<number, number> = {}
      preds?.forEach((p: any) => predMap[p.match_id] = p.predicted_team_id)
      setPredictions(predMap)
      const currentMatchesIds = sortedDays[currentDayIndex]?.matches.map((m:any) => m.id) || []
      const alreadyHasPreds = preds?.some((p:any) => currentMatchesIds.includes(p.match_id))
      setHasSavedInDB(!!alreadyHasPreds)
    }
  }

  const handlePredict = (matchId: number, teamId: number) => {
    if (hasSavedInDB && !isEditing) return 
    if (matchdays[currentDayIndex]?.is_locked) return 
    setPredictions(prev => {
        if (prev[matchId] === teamId) {
            const next = { ...prev };
            delete next[matchId];
            return next;
        }
        return { ...prev, [matchId]: teamId };
    });
  }

  const savePredictions = async () => {
    const currentMatches = matchdays[currentDayIndex].matches
    for (const match of currentMatches) {
        const selectedTeamId = predictions[match.id]
        if (selectedTeamId) {
            await supabase.from('predictions').upsert({
                user_id: user.id,
                match_id: match.id,
                predicted_team_id: selectedTeamId
            }, { onConflict: 'user_id, match_id' })
        } else {
            await supabase.from('predictions').delete().eq('user_id', user.id).eq('match_id', match.id)
        }
    }
    setIsEditing(false)
    setHasSavedInDB(true)
    loadData() 
  }

  const handleSharePicks = async () => {
    if (!shareTicketRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const canvas = await html2canvas(shareTicketRef.current, { useCORS: true, scale: 2, backgroundColor: '#0a0a0a', logging: false });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Picks_${user.username}.png`;
      link.click();
    } catch (error) { console.error(error); } finally { setIsGenerating(false); }
  }

  if (!user) return null

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  // COMPONENTE DE BOTÓN DE NAVEGACIÓN CORREGIDO
  const NavButton = ({ label, targetView, targetLeague }: { label: string, targetView: any, targetLeague?: any }) => {
    const isActive = view === targetView && (!targetLeague || league === targetLeague);
    
    // Un solo className que maneja toda la lógica de estilos
    const classFinal = `
      h-full px-2 text-[11px] lg:text-lg font-black italic tracking-widest whitespace-nowrap transition-all
      ${isActive && targetLeague === 'kings' ? 'text-[#ffd300]' : 
        isActive && targetLeague === 'queens' ? 'text-[#01d6c3]' : 
        isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
    `;

    return (
      <button 
        onClick={() => { setView(targetView); if(targetLeague) setLeague(targetLeague); setMenuOpen(false); }}
        style={{ borderBottom: isActive ? `3px solid ${isActive && targetLeague === 'queens' ? '#01d6c3' : isActive && targetLeague === 'kings' ? '#ffd300' : '#ffffff'}` : '3px solid transparent' }}
        className={classFinal}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      
      {/* HEADER ADAPTATIVO */}
      <header className="w-full h-16 md:h-24 flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 md:px-10 sticky top-0 z-50">
        
        {/* IZQUIERDA: Hamburguesa (Móvil) / Nav (PC) */}
        <div className="flex items-center flex-1">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
          
          <nav className="hidden lg:flex gap-6 h-full items-center">
            <NavButton label="KINGS" targetView="picks" targetLeague="kings" />
            <NavButton label="QUEENS" targetView="picks" targetLeague="queens" />
            <NavButton label="RANKING" targetView="ranking" />
          </nav>
        </div>

        {/* MEDIO: Logo */}
        <div className="relative w-28 h-8 md:w-44 md:h-12 flex-shrink-0">
            <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
        </div>

        {/* DERECHA */}
        <div className="flex items-center justify-end flex-1 gap-2 md:gap-6">
          <nav className="hidden lg:flex gap-6 h-full items-center mr-6">
            <NavButton label="SIMULADOR" targetView="simulator" />
            <NavButton label="PIZARRA" targetView="pizarra" />
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl">
                <Image src={`/usuarios/${user.username}.jpg`} alt={user.username} fill className="object-cover" />
            </div>
            <button onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} className="text-[9px] md:text-xs font-black text-red-500 border border-red-500/20 px-3 py-1 md:px-5 md:py-2 rounded-full hover:bg-red-500 hover:text-white transition-all italic">SALIR</button>
          </div>
        </div>
      </header>

      {/* MENU LATERAL MÓVIL */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-6">
             <button onClick={() => {setView('picks'); setLeague('kings'); setMenuOpen(false)}} className="text-left font-black italic text-xl text-[#ffd300]">KINGS</button>
             <button onClick={() => {setView('picks'); setLeague('queens'); setMenuOpen(false)}} className="text-left font-black italic text-xl text-[#01d6c3]">QUEENS</button>
             <button onClick={() => {setView('ranking'); setMenuOpen(false)}} className="text-left font-black italic text-xl">RANKING</button>
             <button onClick={() => {setView('simulator'); setMenuOpen(false)}} className="text-left font-black italic text-xl">SIMULADOR</button>
             <button onClick={() => {setView('pizarra'); setMenuOpen(false)}} className="text-left font-black italic text-xl text-white">PIZARRA</button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto pt-6 pb-20 px-4">
        {view === 'picks' ? (
            <div className="max-w-2xl mx-auto bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-sm">
                {matchdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <p className="text-slate-600 font-black italic tracking-widest animate-pulse">PROXIMAMENTE...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                            <button disabled={currentDayIndex === 0} onClick={() => { setCurrentDayIndex(i => i-1); setIsEditing(false); }} style={{ color: activeColor, borderColor: activeColor + '40' }} className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"> ← </button>
                            <div className="text-center">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: activeColor }}>{matchdays[currentDayIndex].name}</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{matchdays[currentDayIndex].date_label}</p>
                            </div>
                            <button disabled={currentDayIndex === matchdays.length - 1} onClick={() => { setCurrentDayIndex(i => i+1); setIsEditing(false); }} style={{ color: activeColor, borderColor: activeColor + '40' }} className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"> → </button>
                        </div>
                        <div className="space-y-4">
                            {matchdays[currentDayIndex].matches.map((match: any) => {
                                const isLocked = matchdays[currentDayIndex].is_locked
                                const myPick = predictions[match.id]
                                const anyPick = myPick !== undefined;
                                return (
                                    <div key={match.id} className="flex justify-between items-center bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                        <TeamButton team={match.home} league={league} isSelected={myPick === match.home_team_id} anyPickInMatch={anyPick} onClick={() => handlePredict(match.id, match.home_team_id)} disabled={(hasSavedInDB && !isEditing) || isLocked} />
                                        <span className="text-3xl font-black text-white italic tracking-tighter mx-4">VS</span>
                                        <TeamButton team={match.away} league={league} isSelected={myPick === match.away_team_id} anyPickInMatch={anyPick} onClick={() => handlePredict(match.id, match.away_team_id)} disabled={(hasSavedInDB && !isEditing) || isLocked} />
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-10 flex justify-center">
                            {matchdays[currentDayIndex]?.is_locked ? (
                                <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">JORNADA CERRADA</div>
                            ) : (
                                hasSavedInDB && !isEditing ? (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button onClick={() => setIsEditing(true)} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black italic uppercase text-sm">Editar predicción</button>
                                        <button onClick={handleSharePicks} disabled={isGenerating} className="bg-[#218b44] text-white px-8 py-4 rounded-2xl font-black italic uppercase text-sm flex items-center justify-center gap-2">{isGenerating ? 'GENERANDO...' : 'COMPARTIR PICKS'}</button>
                                    </div>
                                ) : (
                                    <button onClick={savePredictions} className={`${btnColor} text-slate-950 px-12 py-4 rounded-2xl font-black italic uppercase text-sm`}>Confirmar Jornada</button>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        ) : view === 'ranking' ? (
            <RankingView user={user} />
        ) : view === 'simulator' ? ( // <--- AQUÍ FALTABA ESTA CONDICIÓN
            <SimulatorView />
        ) : (
            /* Este es el "si no" final, que muestra la pizarra */
            <PizarraView />
        )}
      </main>
      {/* Ticket oculto */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && (
          <div ref={shareTicketRef} className="w-[450px] bg-[#0a0a0a] p-10 font-sans border border-[#1e293b]">
              <div className="flex justify-between items-center mb-8">
                  <div className="relative w-36 h-10">
                      <img src="/Muertazos.png" alt="Logo" className="object-contain w-full h-full" />
                  </div>
                  <div className="text-right">
                      <div className="text-white font-bold uppercase text-[10px] tracking-widest opacity-60">
                          {user.username}
                      </div>
                      <div style={{ color: activeColor }} className="font-black italic text-xl uppercase tracking-tighter leading-none mt-1">
                          {matchdays[currentDayIndex]?.name}
                      </div>
                  </div>
              </div>

              <div className="space-y-4 bg-[#000000] p-6 border border-[#ffffff10]">
                  {matchdays[currentDayIndex]?.matches.map((match: any) => {
                      const pickId = predictions[match.id]
                      const isHomePredicted = pickId === match.home_team_id;
                      const isAwayPredicted = pickId === match.away_team_id;
                      const folder = league === 'kings' ? 'Kings' : 'Queens';

                      return (
                          <div key={match.id} className="flex items-center justify-center gap-8 bg-[#0f172a] p-4 border border-[#ffffff05] rounded-2xl">
                                  <div className={`relative w-24 h-24 flex items-center justify-center ${isHomePredicted ? 'opacity-100 scale-110' : 'opacity-20 grayscale scale-90'}`}>
                                      <img src={`/logos/${folder}/${match.home.logo_file}`} alt="" className="w-[90%] h-[90%] object-contain relative z-10" />
                                  </div>
                                  <div className="text-2xl font-black italic text-white">VS</div>
                                  <div className={`relative w-24 h-24 flex items-center justify-center ${isAwayPredicted ? 'opacity-100 scale-110' : 'opacity-20 grayscale scale-90'}`}>
                                      <img src={`/logos/${folder}/${match.away.logo_file}`} alt="" className="w-[90%] h-[90%] object-contain relative z-10" />
                                  </div>
                          </div>
                      );
                  })}
              </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamButton({ team, league, isSelected, anyPickInMatch, onClick, disabled }: any) {
    const folder = league === 'kings' ? 'Kings' : 'Queens';
    const appearanceClass = isSelected ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] grayscale-0 opacity-100 z-10" : (anyPickInMatch ? "grayscale opacity-30 scale-90" : "grayscale-0 opacity-100 scale-100");
    return (
        <button onClick={onClick} disabled={disabled} className={`relative flex items-center justify-center transition-all duration-500 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}>
            <div className="relative w-24 h-24 md:w-28 md:h-28">
                <Image src={`/logos/${folder}/${team.logo_file}`} alt={team.name} fill className="object-contain" />
            </div>
        </button>
    )
}

function PizarraView() {
    const availableTeams = Object.keys(PLAYERS_DATA);
    const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0] || "");
    const [selectedPlayer, setSelectedPlayer] = useState<string>(PLAYERS_DATA[availableTeams[0]]?.[0] || "");
    const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([]);
    const boardRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedTeam && PLAYERS_DATA[selectedTeam]) { setSelectedPlayer(PLAYERS_DATA[selectedTeam][0]); }
    }, [selectedTeam]);

    const addPlayerToPitch = (fileName: string) => {
        const newPlayer = { id: Math.random().toString(36).substr(2, 9), team: selectedTeam, fileName: fileName, x: 50, y: 50, zIndex: playersOnPitch.length + 1 };
        setPlayersOnPitch(prev => [...prev, newPlayer]);
    };

    const addAllPlayers = () => {
        const players = PLAYERS_DATA[selectedTeam];
        if (!players) return;
        const currentCount = playersOnPitch.length;
        const newPlayers = players.map((fileName, index) => ({
            id: Math.random().toString(36).substr(2, 9), team: selectedTeam, fileName: fileName, x: 30 + (index * 8) % 40, y: 30 + (index * 8) % 40, zIndex: currentCount + index + 1
        }));
        setPlayersOnPitch(prev => [...prev, ...newPlayers]);
    };

    const handlePointerDown = (id: string) => {
        setDraggingId(id);
        setPlayersOnPitch(prev => prev.map(p => p.id === id ? { ...p, zIndex: Math.max(...prev.map(pl => pl.zIndex), 0) + 1 } : p ));
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingId || !boardRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPlayersOnPitch(prev => prev.map(p => p.id === draggingId ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) } : p ));
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</label>
                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm">
                        {availableTeams.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jugador</label>
                    <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm">
                        {PLAYERS_DATA[selectedTeam]?.map(player => <option key={player} value={player}>{player.replace('.png', '')}</option>)}
                        <option value="Nuevo.png">CREAR JUGADOR</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => addPlayerToPitch(selectedPlayer)} className="bg-[#ffd300] text-black font-black italic px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex-1 sm:flex-none">Añadir</button>
                    <button onClick={addAllPlayers} className="bg-[#01d6c3] text-black font-black italic px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors flex-1 sm:flex-none">Todos</button>
                    <button onClick={() => setPlayersOnPitch([])} className="bg-red-500/10 text-red-500 border border-red-500/50 font-black italic px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none">Limpiar</button>
                </div>
            </div>

            <div ref={boardRef} onPointerMove={handlePointerMove} onPointerUp={() => setDraggingId(null)} onPointerLeave={() => setDraggingId(null)} 
                 className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl touch-none"
                 style={{ backgroundImage: 'url(/Campo.jpg)', backgroundSize: '100% 100%' }}>
                {playersOnPitch.map((player) => (
                    <div key={player.id} onPointerDown={() => handlePointerDown(player.id)} onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(p => p.id !== player.id))}
                        className={`absolute w-10 h-10 md:w-20 lg:w-24 md:h-20 lg:h-24 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${draggingId === player.id ? 'scale-110' : ''}`}
                        style={{ left: `${player.x}%`, top: `${player.y}%`, zIndex: player.zIndex, transition: draggingId === player.id ? 'none' : 'transform 0.1s' }}>
                        <div className="relative w-full h-full drop-shadow-xl">
                            <Image src={player.fileName === "Nuevo.png" ? "/Nuevo.png" : `/jugadores/${player.team}/${player.fileName}`} alt="jugador" fill className="object-contain pointer-events-none select-none" />
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">* DOBLE CLIC PARA ELIMINAR</p>
        </div>
    );
}
function SimulatorView() {
    const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings');
    const [matchdays, setMatchdays] = useState<any[]>([]);
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<number, { hg: string, ag: string, penaltyWinnerId: number | null }>>({});

    const folder = compKey === 'kings' ? 'Kings' : 'Queens';
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio');
    const getLogoSize = (filename: string) => isPio(filename) ? 54 : 72;

    const getRowColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-500'; // 1er lugar
        if (idx >= 1 && idx <= 3) return 'bg-blue-500'; // 2do a 4to
        if (idx >= 6 && idx <= 9) return 'bg-red-500'; // 7mo a 10mo
        return 'bg-transparent';
    };

    useEffect(() => {
        const load = async () => {
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
                            if (res.home_penalties > res.away_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.home_team_id;
                            if (res.away_penalties > res.home_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.away_team_id;
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
                if (!activeMatchdayId && mData.length > 0) setActiveMatchdayId(mData[0].id);
            }
        };
        load();
    }, [compKey]);

    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
        if (value !== '' && !/^\d+$/.test(value)) return;
        setScores(prev => {
            const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null };
            const newHg = field === 'hg' ? value : current.hg;
            const newAg = field === 'ag' ? value : current.ag;
            const pWinner = newHg === newAg ? current.penaltyWinnerId : null;
            return { ...prev, [matchId]: { ...current, [field]: value, penaltyWinnerId: pWinner } };
        });
    };

    const togglePenaltyWinner = (matchId: number, teamId: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId }
        }));
    };

    const standings = teams.map(team => {
        let w = 0, l = 0, gf = 0, gc = 0;
        matchdays.forEach(md => {
            md.matches?.forEach((m: any) => {
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
            });
        });
        return { ...team, w, l, gf, gc, dg: gf - gc };
    }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf);

    return (
        <div className="w-full flex flex-col items-center">
            {/* Contenedor Unificado: Sin color de fondo para que se unifique */}
            <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-6 border-b border-white/5">
                
                {/* Botones Kings / Queens */}
                <div className="flex gap-2 border-r border-white/10 pr-4">
                    <button onClick={() => setCompKey('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Kings</button>
                    <button onClick={() => setCompKey('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Queens</button>
                </div>

                {/* Botones de Jornadas */}
                <div className="flex flex-wrap items-center gap-2">
                    {matchdays.map(day => {
                        const shortName = day.name.toUpperCase().replace('JORNADA', 'J').replace(/\s+/g, '');
                        const label = shortName.includes('J') ? shortName : `J${day.display_order || ''}`;

                        return (
                            <button 
                                key={day.id} 
                                onClick={() => setActiveMatchdayId(day.id)} 
                                className={`px-2 py-1.5 text-[11px] font-black italic uppercase border-b-2 transition-colors ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'border-[#FFD300] text-[#FFD300]' : 'border-[#01d6c3] text-[#01d6c3]') : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 py-8">
                {/* Título movido arriba para que la tabla y los partidos inicien a la misma altura */}
                <div className="mb-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-center xl:text-left">{activeMatchday?.name}</h3>
                </div>

                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Columna de Partidos */}
                    <div className="flex-1 flex flex-col gap-4">
                        {activeMatchday?.matches?.map((m: any) => {
                            const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null };
                            const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag;
                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center flex-1">
                                            {m.home && (
                                                <button onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                                    <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input type="text" value={s.hg} onChange={(e) => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-md font-black text-2xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                            <span className="text-sm font-black text-white italic">VS</span>
                                            <input type="text" value={s.ag} onChange={(e) => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-md font-black text-2xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            {m.away && (
                                                <button onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                                    <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Columna de Tabla de Posiciones */}
                    <div className="w-full xl:w-[480px]">
                        <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                            <table className="w-full text-center text-sm">
                                <thead>
                                    <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                                        <th className="py-3 w-8">#</th>
                                        <th className="py-3 text-left pl-2">Equipo</th>
                                        <th className="py-3 w-8">V</th>
                                        <th className="py-3 w-8">D</th>
                                        <th className="py-3 w-8">GF</th>
                                        <th className="py-3 w-8">GC</th>
                                        <th className="py-3 w-10 bg-white/5">DG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((t, idx) => (
                                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="relative py-2.5 font-black text-xs">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 pl-2 text-left flex items-center gap-2">
                                                <Image src={`/logos/${folder}/${t.logo_file}`} width={22} height={22} alt={t.name} />
                                                <span className="text-[10px] font-bold uppercase truncate max-w-[110px]">{t.name}</span>
                                            </td>
                                            <td className="py-2.5 font-black text-green-400 text-xs">{t.w}</td>
                                            <td className="py-2.5 font-black text-red-400 text-xs">{t.l}</td>
                                            <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gf}</td>
                                            <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gc}</td>
                                            <td className="py-2.5 font-black text-white text-xs bg-white/5">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Leyenda de clasificación */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                <span>1º Semifinal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                <span>2º a 4º Cuartos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <span>7º a 10º Play In</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
/* COMPONENTE DE RANKING ADAPTADO PARA EL USUARIO */
function RankingView({ user }: { user: any }) {
    const [rankingData, setRankingData] = useState<{ users: any[], days: any[] }>({ users: [], days: [] })
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchRanking = async () => {
            const { data: lockedDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('display_order')
            if (!lockedDays || lockedDays.length === 0) { setRankingData({ users: [], days: [] }); setLoading(false); return }

            const { data: matches } = await supabase.from('matches').select('id, winner_team_id, matchday_id').in('matchday_id', lockedDays.map(d => d.id)).not('winner_team_id', 'is', null)
            const { data: predictions } = await supabase.from('predictions').select('user_id, match_id, predicted_team_id').in('match_id', matches?.map(m => m.id) || [])
            const { data: appUsers } = await supabase.from('app_users').select('id, username').neq('role', 'admin')

            const userScores = appUsers?.map(u => {
                let total = 0; const dayBreakdown: any = {}
                lockedDays.forEach(day => {
                    const matchesInDay = matches?.filter(m => m.matchday_id === day.id) || []
                    let dayHits = 0
                    matchesInDay.forEach(m => {
                        const userPred = predictions?.find(p => p.user_id === u.id && p.match_id === m.id)
                        if (userPred && userPred.predicted_team_id === m.winner_team_id) dayHits++
                    })
                    dayBreakdown[day.id] = dayHits; total += dayHits
                })
                return { username: u.username, total, dayBreakdown }
            })

            userScores?.sort((a, b) => {
                if (b.total !== a.total) return b.total - a.total;
                return a.username.localeCompare(b.username);
            });

            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>

    const allUsers = rankingData.users;
    const totalUsers = allUsers.length;
    const pageChunks: number[][] = [];
    for (let i = 0; i < totalUsers; i += 15) {
        pageChunks.push([i, Math.min(i + 15, totalUsers)]);
    }

    const totalPages = pageChunks.length || 1;
    const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
    const currentChunk = pageChunks[safeCurrentPage] || [0, 0];
    const paginatedUsers = allUsers.slice(currentChunk[0], currentChunk[1]);

    return (
        <div className="w-full flex flex-col items-center py-2 px-2">
{/* Header Responsivo */}
<div className="w-full flex flex-col md:grid md:grid-cols-3 items-center mb-6 px-2 md:px-8 gap-4">
    
    {/* Columna Izquierda: Botón */}
    <div className="w-full flex justify-center md:justify-start">
        <button
            onClick={() => setShowFull(!showFull)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
        >
            {showFull ? '← VOLVER' : 'DESGLOSE'}
        </button>
    </div>

    {/* Columna Central: Título */}
    <h2 className="text-xl font-black italic uppercase tracking-tighter text-center order-first md:order-none w-full">
        <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
    </h2>

    {/* Columna Derecha: Paginación */}
    <div className="w-full flex justify-center md:justify-end">
        {totalPages > 1 && (
            <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                <button
                    disabled={safeCurrentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${safeCurrentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                >
                    ◀
                </button>
                <button
                    disabled={safeCurrentPage === totalPages - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className={`px-5 py-2 text-xs font-black transition-colors ${safeCurrentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                >
                    ▶
                </button>
            </div>
        )}
    </div>
</div>

            {/* Contenedor de Tabla */}
            <div className="w-fit mx-auto">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="border-collapse table-auto">
                        <tbody>
                            {paginatedUsers.map((u, idx) => {
                                const globalPos = currentChunk[0] + idx + 1;
                                const isFirst = globalPos === 1;
                                const isMe = u.username === user?.username;
                                const hasError = imageErrors[u.username];

                                return (
                                    <tr key={u.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''} ${isMe ? 'bg-blue-500/10' : ''}`}>
                                        <td className="w-10 px-2 py-1 text-center border-r border-white/5 font-black italic text-[11px]">
                                            {isFirst ? <span className="text-xl">👑</span> : <span className={`${isMe ? 'text-white' : 'text-slate-600'}`}>{globalPos}</span>}
                                        </td>

                                        <td className="w-[120px] px-3 py-1 border-r border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 shadow-md flex items-center justify-center bg-slate-800 ${isFirst ? 'border-[#FFD300]' : isMe ? 'border-white' : 'border-white/10'}`}>
                                                    {!hasError ? (
                                                        <Image 
                                                            src={`/usuarios/${u.username}.jpg`} 
                                                            alt={u.username} 
                                                            fill 
                                                            className="object-cover"
                                                            onError={() => setImageErrors(prev => ({...prev, [u.username]: true}))}
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-white uppercase">
                                                            {u.username.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`uppercase text-[10px] tracking-[0.1em] ${isFirst ? 'text-[#FFD300] font-black' : isMe ? 'text-white font-black' : 'text-slate-300'}`}>
                                                    {u.username}
                                                </span>
                                            </div>
                                        </td>

                                        {showFull && rankingData.days.map(day => (
                                            <td key={day.id} className={`px-2 py-1 text-center border-l border-white/5 text-[10px] font-mono w-9 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                                <span className={u.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{u.dayBreakdown[day.id] || 0}</span>
                                            </td>
                                        ))}

                                        <td className={`w-16 px-4 py-1 text-center border-l border-white/10 font-black text-[14px] italic ${isFirst ? 'bg-[#FFD300] text-black' : isMe ? 'bg-white/10 text-white' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
                                            {u.total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}