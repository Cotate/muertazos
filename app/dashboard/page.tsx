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
  const [view, setView] = useState<'picks' | 'ranking'>('picks')
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
      await new Promise(resolve => setTimeout(resolve, 400));
      const canvas = await html2canvas(shareTicketRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0a',
        logging: false
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Picks_${user.username}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error al generar la imagen.');
    } finally {
      setIsGenerating(false);
    }
  }

  if (!user) return null

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      
      <header className="w-full h-20 flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-8 sticky top-0 z-50">
        <div className="flex gap-10 flex-1 items-center h-full">
            <button 
                onClick={() => { setLeague('kings'); setView('picks'); }}
                style={{ borderBottom: league === 'kings' && view === 'picks' ? `3px solid #ffd300` : '3px solid transparent' }}
                className={`h-full text-xl font-black italic tracking-widest transition-all ${league === 'kings' && view === 'picks' ? 'text-[#ffd300]' : 'text-slate-600 hover:text-slate-400'}`}
            >KINGS</button>
            <button 
                onClick={() => { setLeague('queens'); setView('picks'); }}
                style={{ borderBottom: league === 'queens' && view === 'picks' ? `3px solid #01d6c3` : '3px solid transparent' }}
                className={`h-full text-xl font-black italic tracking-widest transition-all ${league === 'queens' && view === 'picks' ? 'text-[#01d6c3]' : 'text-slate-600 hover:text-slate-400'}`}
            >QUEENS</button>
            <button 
                onClick={() => setView('ranking')}
                style={{ borderBottom: view === 'ranking' ? `3px solid #ffffff` : '3px solid transparent' }}
                className={`h-full text-xl font-black italic tracking-widest transition-all ${view === 'ranking' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
            >RANKING</button>
        </div>

        <div className="relative w-32 h-10 flex-shrink-0">
            <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
        </div>

        <div className="flex-1 flex justify-end items-center gap-6">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl">
                 <Image 
                    src={`/usuarios/${user.username}.jpg`} 
                    alt={user.username} 
                    fill 
                    className="object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
            </div>
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="text-[9px] font-black text-red-500 border border-red-500/20 px-4 py-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all italic tracking-tighter"
            >SALIR</button>
        </div>
      </header>

      {/* Aumentado max-w de 5xl a 7xl para dar más espacio a la tabla */}
      <main className="max-w-7xl mx-auto pt-4 pb-4 px-4">
        {view === 'picks' ? (
            /* Aumentado max-w de 2xl a 4xl para picks más grandes y coherentes con el nuevo ancho */
            <div className="max-w-4xl mx-auto bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-sm">
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
                                            className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black italic uppercase text-sm"
                                        >Editar predicción</button>
                                        
                                        <button 
                                            onClick={handleSharePicks} 
                                            disabled={isGenerating}
                                            className="bg-[#218b44] text-white px-8 py-4 rounded-2xl font-black italic uppercase text-sm flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? 'GENERANDO...' : 'COMPARTIR PICKS'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={savePredictions} 
                                        className={`${btnColor} text-slate-950 px-12 py-4 rounded-2xl font-black italic uppercase text-sm`}
                                    >Confirmar Jornada</button>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        ) : (
            /* Vista de Ranking */
            <RankingView user={user} />
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
    let appearanceClass = isSelected ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] grayscale-0 opacity-100 z-10" : (anyPickInMatch ? "grayscale opacity-30 scale-90" : "grayscale-0 opacity-100 scale-100");

    return (
        <button onClick={onClick} disabled={disabled} className={`relative flex items-center justify-center transition-all duration-500 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}>
            <div className="relative w-28 h-28">
                <Image src={`/logos/${folder}/${team.logo_file}`} alt={team.name} fill className="object-contain" />
            </div>
        </button>
    )
}

// COMPONENTE DE RANKING ADAPTADO PARA USUARIOS CON ANCHO AMPLIADO
function RankingView({ user }: { user: any }) {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0) 

    useEffect(() => {
        const fetchRanking = async () => {
            const { data: lockedDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('display_order')
            if (!lockedDays || lockedDays.length === 0) { setRankingData({users: [], days: []}); setLoading(false); return }
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
    
    // Mostramos 15 usuarios por página para asegurar que quepa sin scroll vertical
    const pageChunks: number[][] = [];
    for (let i = 0; i < totalUsers; i += 15) {
        pageChunks.push([i, Math.min(i + 15, totalUsers)]);
    }

    const totalPages = pageChunks.length || 1;
    const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
    const currentChunk = pageChunks[safeCurrentPage] || [0, 0];
    const paginatedUsers = allUsers.slice(currentChunk[0], currentChunk[1]);

    return (
        <div className="w-full flex flex-col items-center py-1">
            {/* Header de la tabla compacto */}
            <div className="w-full flex items-center justify-between mb-2 px-4 md:px-8">
                <div className="flex-1 flex justify-start">
                    <button 
                        onClick={() => setShowFull(!showFull)} 
                        className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}
                    >
                        {showFull ? '← VOLVER' : 'DESGLOSE'}
                    </button>
                </div>

                <h2 className="text-xl font-black italic uppercase tracking-tighter text-center px-4 shrink-0">
                    <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
                </h2>
                
                <div className="flex-1 flex justify-end">
                    {totalPages > 1 && (
                        <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                            <button 
                                disabled={safeCurrentPage === 0} 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                className={`px-4 py-1.5 text-[10px] font-black transition-colors border-r border-white/10 ${safeCurrentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            > ◀ </button>
                            <button 
                                disabled={safeCurrentPage === totalPages - 1} 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                className={`px-4 py-1.5 text-[10px] font-black transition-colors ${safeCurrentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            > ▶ </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenedor de la tabla, se elimina mx-auto y se usa w-full para que crezca */}
            <div className="w-full">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="border-collapse table-auto w-full">
                        <thead>
                            <tr className="bg-black/40 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-white/10">
                                {/* Aumentado ancho de columna # de 10 a 14 */}
                                <th className="w-14 px-2 py-2 border-r border-white/5">#</th>
                                {/* Aumentado ancho de columna USUARIO de [120px] a [200px] */}
                                <th className="w-[200px] px-4 py-2 text-left border-r border-white/5">USUARIO</th>
                                {showFull && rankingData.days.map(day => (
                                    /* Aumentado ancho de columna J de 8 a 10 */
                                    <th key={day.id} className="px-1 py-2 w-10 border-l border-white/5">
                                        {day.name.includes('JORNADA') ? day.name.replace('JORNADA ', 'J') : day.name.substring(0,2)}
                                    </th>
                                ))}
                                {/* Aumentado ancho de columna PTS de 14 a 20 */}
                                <th className="w-20 px-4 py-2">PTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((u, idx) => {
                                const globalPos = currentChunk[0] + idx + 1;
                                const isFirst = globalPos === 1;
                                const isMe = u.username === user.username;

                                return (
                                    <tr key={u.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''} ${isMe ? 'bg-blue-500/10' : ''}`}>
                                        <td className="px-2 py-0.5 text-center border-r border-white/5 font-black italic text-[10px]">
                                            {isFirst ? (
                                                <span className="text-base drop-shadow-[0_0_8px_rgba(255,211,0,0.6)]">👑</span>
                                            ) : (
                                                <span className={`${isMe ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>{globalPos}</span>
                                            )}
                                        </td>
                                        
                                        <td className="px-2 py-0.5 border-r border-white/5">
                                            <div className="flex items-center gap-2">
                                                {/* Aumentado tamaño de avatar de w-6 h-6 a w-7 h-7, y text-9 a text-10 */}
                                                <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 shadow-md flex items-center justify-center bg-slate-800 font-bold text-[10px] ${isFirst ? 'border-[#FFD300]' : isMe ? 'border-white' : 'border-white/10 text-slate-400'}`}>
                                                    {u.username.charAt(0).toUpperCase()}
                                                    <Image 
                                                        key={`${currentPage}-${u.username}`}
                                                        src={`/usuarios/${u.username}.jpg`} 
                                                        alt={u.username} 
                                                        fill 
                                                        sizes="28px" 
                                                        className="object-cover z-10" 
                                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                                    />
                                                </div>
                                                <span className={`uppercase text-[10px] tracking-[0.1em] truncate block w-full ${isFirst ? 'text-[#FFD300] font-black' : isMe ? 'text-white font-black underline decoration-[#FFD300]/40' : 'text-slate-300 font-medium group-hover:text-white'}`}>
                                                    {u.username}
                                                </span>
                                            </div>
                                        </td>

                                        {showFull && rankingData.days.map(day => (
                                            <td key={day.id} className={`px-1 py-0.5 text-center border-l border-white/5 text-[9px] font-mono ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                                <span className={u.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{u.dayBreakdown[day.id] || 0}</span>
                                            </td>
                                        ))}
                                        
                                        <td className={`px-2 py-0.5 text-center border-l border-white/10 font-black text-sm italic ${isFirst ? 'bg-[#FFD300] text-black' : isMe ? 'bg-white/10 text-white' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
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
    )
}