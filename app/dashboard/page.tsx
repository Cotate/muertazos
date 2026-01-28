'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('muertazos_user')
    if (!storedUser) {
      router.push('/')
    } else {
      setUser(JSON.parse(storedUser))
    }

    // CORRECCIÓN 1: MODO OSCURO TOTAL
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  useEffect(() => {
    if (user) {
        loadData()
        setCurrentDayIndex(0) 
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
      const sortedDays = mDays.map(day => ({
        ...day,
        matches: day.matches.sort((a: any, b: any) => a.id - b.id)
      }))
      setMatchdays(sortedDays)

      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
      
      const predMap: Record<number, number> = {}
      preds?.forEach((p: any) => predMap[p.match_id] = p.predicted_team_id)
      setPredictions(predMap)
    }
  }

  const handlePredict = (matchId: number, teamId: number) => {
    if (!isEditing && hasSaved) return 
    if (matchdays[currentDayIndex].is_locked) return 
    
    setPredictions(prev => {
        // CORRECCIÓN 2: Desmarcar si se toca el mismo equipo
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
    
    // CORRECCIÓN 3: Persistencia de deselección (Si está vacío, lo borramos de Supabase)
    for (const match of currentMatches) {
        const selectedTeamId = predictions[match.id]
        
        if (selectedTeamId) {
            // Upsert para guardar/actualizar
            await supabase.from('predictions').upsert({
                user_id: user.id,
                match_id: match.id,
                predicted_team_id: selectedTeamId
            }, { onConflict: 'user_id, match_id' })
        } else {
            // Si el usuario lo dejó vacío, borrar de la DB para que no vuelva a aparecer
            await supabase.from('predictions')
                .delete()
                .eq('user_id', user.id)
                .eq('match_id', match.id)
        }
    }
    
    setIsEditing(false)
    loadData() // Recargar para confirmar cambios
  }

  const currentMatches = matchdays[currentDayIndex]?.matches || []
  const hasSaved = currentMatches.length > 0 && currentMatches.some((m:any) => predictions[m.id])

  if (!user) return null

  // COLORES DINÁMICOS
  const activeColor = league === 'kings' ? 'text-[#ffd300]' : 'text-[#01d6c3]'
  const accentHex = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 px-4 text-white">
      {/* Selector de Competición */}
      <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto pt-8">
        <div className="flex gap-4">
            <button 
                onClick={() => { setLeague('kings'); setIsEditing(false); }} 
                className={`text-xl font-black transition-all ${league === 'kings' ? 'text-[#ffd300] border-b-4 border-[#ffd300]' : 'text-gray-600'}`}
            >
                KINGS
            </button>
            <button 
                onClick={() => { setLeague('queens'); setIsEditing(false); }} 
                className={`text-xl font-black transition-all ${league === 'queens' ? 'text-[#01d6c3] border-b-4 border-[#01d6c3]' : 'text-gray-600'}`}
            >
                QUEENS
            </button>
        </div>
        <button 
            onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
            className="text-[10px] font-bold text-red-500 uppercase border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
        >
            Cerrar Sesión
        </button>
      </div>

      <div className="bg-slate-900/40 rounded-3xl p-4 min-h-[500px] border border-slate-800 shadow-2xl max-w-2xl mx-auto">
        {matchdays.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-600 font-bold italic">PROXIMAMENTE...</p>
           </div>
        ) : (
            <>
                {/* Navegación de Jornadas */}
                <div className="flex justify-between items-center mb-6 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                    {/* CORRECCIÓN 4: BOTONES CON COLOR FIJO */}
                    <button 
                        disabled={currentDayIndex === 0} 
                        onClick={() => { setCurrentDayIndex(i => i-1); setIsEditing(false); }} 
                        style={{ color: accentHex, borderColor: accentHex + '40' }}
                        className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-10 transition-all font-black"
                    >
                        ←
                    </button>
                    
                    <div className="text-center">
                        <h2 className={`text-2xl font-black italic uppercase ${activeColor}`}>
                            {matchdays[currentDayIndex].name}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{matchdays[currentDayIndex].date_label}</p>
                    </div>

                    <button 
                        disabled={currentDayIndex === matchdays.length - 1} 
                        onClick={() => { setCurrentDayIndex(i => i+1); setIsEditing(false); }} 
                        style={{ color: accentHex, borderColor: accentHex + '40' }}
                        className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-10 transition-all font-black"
                    >
                        →
                    </button>
                </div>

                {/* Lista de Partidos */}
                <div className="space-y-4">
                    {matchdays[currentDayIndex].matches.map((match: any) => {
                        const isLocked = matchdays[currentDayIndex].is_locked
                        const myPick = predictions[match.id]
                        return (
                            <div key={match.id} className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                                <TeamButton 
                                    team={match.home} 
                                    league={league}
                                    isSelected={myPick === match.home_team_id}
                                    onClick={() => handlePredict(match.id, match.home_team_id)}
                                    disabled={(!isEditing && hasSaved) || isLocked}
                                />
                                <div className="flex flex-col items-center z-10">
                                    <span className="text-[10px] font-black text-slate-700 italic">VS</span>
                                </div>
                                <TeamButton 
                                    team={match.away} 
                                    league={league}
                                    isSelected={myPick === match.away_team_id}
                                    onClick={() => handlePredict(match.id, match.away_team_id)}
                                    disabled={(!isEditing && hasSaved) || isLocked}
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 flex justify-center">
                    {matchdays[currentDayIndex].is_locked ? (
                        <div className="bg-red-600/10 border border-red-600 text-red-500 px-8 py-3 rounded-full font-black italic tracking-tighter">
                            JORNADA BLOQUEADA
                        </div>
                    ) : (
                        hasSaved && !isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="bg-white text-slate-900 px-10 py-3 rounded-full font-black italic uppercase hover:scale-105 transition-transform"
                            >
                                Editar mi elección
                            </button>
                        ) : (
                            <button 
                                onClick={savePredictions} 
                                className={`${btnColor} text-slate-900 px-10 py-3 rounded-full font-black italic uppercase shadow-xl hover:scale-105 transition-transform`}
                            >
                                GUARDAR JORNADA
                            </button>
                        )
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  )
}

function TeamButton({ team, league, isSelected, onClick, disabled }: any) {
    const folder = league === 'kings' ? 'Kings' : 'Queens';
    
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`
                flex flex-col items-center w-28 p-3 rounded-xl transition-all duration-300
                ${isSelected 
                    ? (league === 'kings' ? 'bg-[#ffd300] text-slate-900' : 'bg-[#01d6c3] text-slate-900') 
                    : 'text-slate-400 opacity-40 grayscale hover:opacity-60'
                } 
                ${disabled && !isSelected ? 'opacity-10' : ''}
            `}
        >
            <div className="relative w-16 h-16 mb-2 pointer-events-none">
                <Image 
                    src={`/logos/${folder}/${team.logo_file}`} 
                    alt={team.name} 
                    fill 
                    className={`object-contain transition-transform ${isSelected ? 'scale-110' : ''}`}
                />
            </div>
            <span className="text-[9px] font-black text-center leading-tight uppercase tracking-tighter">
                {team.name}
            </span>
        </button>
    )
}