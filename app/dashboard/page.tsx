'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [hasSavedInDB, setHasSavedInDB] = useState(false)
  
  // Referencia y estado para generar la imagen
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
          const orderA = a.match_order !== null && a.match_order !== undefined ? a.match_order : a.id;
          const orderB = b.match_order !== null && b.match_order !== undefined ? b.match_order : b.id;
          return orderA - orderB;
        });
        return { ...day, matches: sortedMatches };
      });

      setMatchdays(sortedDays)

      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
      
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
    if (matchdays[currentDayIndex].is_locked) return 
    
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
      const canvas = await html2canvas(shareTicketRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0a'
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Muertazos_Picks_${user.username}.png`;
      link.click();
    } catch (error) {
      console.error('Error al generar la imagen', error);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!user) return null

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      
      <header className="w-full h-24 flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-8 sticky top-0 z-50">
        <div className="flex gap-20 flex-1 items-center">
            <button 
                onClick={() => { setLeague('kings'); setIsEditing(false); }}
                style={{ borderBottom: league === 'kings' ? `3px solid #ffd300` : '3px solid transparent' }}
                className={`h-full pt-2 text-xl font-black italic tracking-widest transition-all ${league === 'kings' ? 'text-[#ffd300]' : 'text-slate-600 hover:text-slate-400'}`}
            >KINGS</button>
            <button 
                onClick={() => { setLeague('queens'); setIsEditing(false); }}
                style={{ borderBottom: league === 'queens' ? `3px solid #01d6c3` : '3px solid transparent' }}
                className={`h-full pt-2 text-xl font-black italic tracking-widest transition-all ${league === 'queens' ? 'text-[#01d6c3]' : 'text-slate-600 hover:text-slate-400'}`}
            >QUEENS</button>
        </div>

        <div className="relative w-40 h-14 flex-shrink-0">
            <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
        </div>

        <div className="flex-1 flex justify-end items-center gap-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl">
                 <Image 
                    src={`/usuarios/${user.username}.jpg`} 
                    alt={user.username} 
                    fill 
                    className="object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold -z-10 uppercase text-xs">
                    {user.username.charAt(0)}
                </div>
            </div>
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="text-[9px] font-black text-red-500 border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all italic tracking-tighter"
            >SALIR</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pt-10 pb-20 px-4">
        <div className="bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-sm">
            {matchdays.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-slate-600 font-black italic tracking-widest animate-pulse">PROXIMAMENTE...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                        <button 
                            disabled={currentDayIndex === 0} 
                            onClick={() => { setCurrentDayIndex(i => i-1); setIsEditing(false); }} 
                            style={{ color: activeColor, borderColor: activeColor + '40' }}
                            className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
                        > ← </button>
                        
                        <div className="text-center">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: activeColor }}>
                                {matchdays[currentDayIndex].name}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{matchdays[currentDayIndex].date_label}</p>
                        </div>

                        <button 
                            disabled={currentDayIndex === matchdays.length - 1} 
                            onClick={() => { setCurrentDayIndex(i => i+1); setIsEditing(false); }} 
                            style={{ color: activeColor, borderColor: activeColor + '40' }}
                            className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
                        > → </button>
                    </div>

                    <div className="space-y-4">
                        {matchdays[currentDayIndex].matches.map((match: any) => {
                            const isLocked = matchdays[currentDayIndex].is_locked
                            const myPick = predictions[match.id]
                            const anyPick = myPick !== undefined;

                            return (
                                <div key={match.id} className="flex justify-between items-center bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                    <TeamButton 
                                        team={match.home} 
                                        league={league}
                                        isSelected={myPick === match.home_team_id}
                                        anyPickInMatch={anyPick}
                                        onClick={() => handlePredict(match.id, match.home_team_id)}
                                        disabled={(hasSavedInDB && !isEditing) || isLocked}
                                    />
                                    <span className="text-3xl font-black text-white italic tracking-tighter mx-4">VS</span>
                                    <TeamButton 
                                        team={match.away} 
                                        league={league}
                                        isSelected={myPick === match.away_team_id}
                                        anyPickInMatch={anyPick}
                                        onClick={() => handlePredict(match.id, match.away_team_id)}
                                        disabled={(hasSavedInDB && !isEditing) || isLocked}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-10 flex justify-center">
                        {matchdays[currentDayIndex].is_locked ? (
                            <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">
                                JORNADA CERRADA
                            </div>
                        ) : (
                            hasSavedInDB && !isEditing ? (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black italic uppercase text-sm hover:bg-slate-200 transition-all shadow-lg"
                                    >Editar predicción</button>
                                    
                                    <button 
                                        onClick={handleSharePicks} 
                                        disabled={isGenerating}
                                        className="bg-[#218b44] text-white px-8 py-4 rounded-2xl font-black italic uppercase text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(33,139,68,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? 'GENERANDO...' : 'COMPARTIR PICKS'}
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={savePredictions} 
                                    className={`${btnColor} text-slate-950 px-12 py-4 rounded-2xl font-black italic uppercase text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,0,0,0.4)]`}
                                >Confirmar Jornada</button>
                            )
                        )}
                    </div>
                </>
            )}
        </div>
      </main>

      {/* --- TICKET OCULTO PARA COMPARTIR --- */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && (
          <div ref={shareTicketRef} className="w-[450px] bg-[#0a0a0a] p-8 text-white font-sans border border-slate-800 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-5 border-b border-slate-800 pb-5 mb-5">
                  <div className="relative w-28 h-10 shrink-0">
                      <img src="/Muertazos.png" alt="Logo" className="object-contain w-full h-full" />
                  </div>
                  <div className="flex-grow">
                      <div style={{ color: activeColor }} className="font-black italic uppercase text-xs tracking-widest">
                          PICKS DE {user.username}
                      </div>
                      <div className="text-xl font-bold uppercase tracking-tight text-white mt-0.5">
                          {matchdays[currentDayIndex]?.name}
                      </div>
                  </div>
              </div>

              <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-white/5 relative">
                  {matchdays[currentDayIndex]?.matches.map((match: any) => {
                      const pickId = predictions[match.id]
                      const isHomePredicted = pickId === match.home_team_id;
                      const isAwayPredicted = pickId === match.away_team_id;
                      const folder = league === 'kings' ? 'Kings' : 'Queens';

                      return (
                          <div key={match.id} className="flex items-center justify-between gap-2 bg-slate-900 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                              <div className="flex flex-col items-center flex-1 text-center">
                                  <div className={`relative w-16 h-16 rounded-lg flex items-center justify-center p-1 transition-all ${isHomePredicted ? 'scale-110' : 'opacity-40 grayscale'}`}>
                                      {isHomePredicted && (
                                        <div 
                                          className="absolute inset-0 rounded-lg border-2 border-dashed" 
                                          style={{ boxShadow: `0 0 15px ${activeColor}40`, borderColor: `${activeColor}50` }} 
                                        ></div>
                                      )}
                                      <img src={`/logos/${folder}/${match.home.logo_file}`} alt="H" className="object-contain w-14 h-14 relative z-10" />
                                  </div>
                                  <span className={`text-[10px] mt-1 uppercase font-bold tracking-tight truncate w-full ${isHomePredicted ? 'text-white' : 'text-slate-500'}`}>{match.home.name}</span>
                              </div>

                              <div className="text-xl font-black italic text-slate-700 shrink-0 px-2">VS</div>

                              <div className="flex flex-col items-center flex-1 text-center">
                                  <div className={`relative w-16 h-16 rounded-lg flex items-center justify-center p-1 transition-all ${isAwayPredicted ? 'scale-110' : 'opacity-40 grayscale'}`}>
                                      {isAwayPredicted && (
                                        <div 
                                          className="absolute inset-0 rounded-lg border-2 border-dashed" 
                                          style={{ boxShadow: `0 0 15px ${activeColor}40`, borderColor: `${activeColor}50` }} 
                                        ></div>
                                      )}
                                      <img src={`/logos/${folder}/${match.away.logo_file}`} alt="A" className="object-contain w-14 h-14 relative z-10" />
                                  </div>
                                  <span className={`text-[10px] mt-1 uppercase font-bold tracking-tight truncate w-full ${isAwayPredicted ? 'text-white' : 'text-slate-500'}`}>{match.away.name}</span>
                              </div>
                          </div>
                      );
                  })}
              </div>
              <div className="text-center text-[10px] text-slate-700 mt-5 pt-3 border-t border-slate-800 font-bold uppercase tracking-[0.3em] italic">
                  muertazos.com
              </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamButton({ team, league, isSelected, anyPickInMatch, onClick, disabled }: any) {
    const folder = league === 'kings' ? 'Kings' : 'Queens';
    let appearanceClass = isSelected ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] grayscale-0 opacity-100 z-10" : (anyPickInMatch ? "grayscale opacity-30 scale-90" : "grayscale-0 opacity-100 scale-100");

    return (
        <button onClick={onClick} disabled={disabled} className={`relative flex items-center justify-center transition-all duration-500 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}>
            <div className="relative w-28 h-28">
                <Image src={`/logos/${folder}/${team.logo_file}`} alt={team.name} fill className="object-contain" />
            </div>
        </button>
    )
}