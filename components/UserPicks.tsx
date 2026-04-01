// components/UserPicks.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'
import TeamButton from '@/components/TeamButton'

export default function UserPicks({ league, user }: { league: 'kings' | 'queens', user: any }) {
  const router = useRouter()
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [hasSavedInDB, setHasSavedInDB] = useState(false)
  const shareTicketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

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
          const orderA = a.match_order ?? a.id
          const orderB = b.match_order ?? b.id
          return orderA - orderB
        })
        return { ...day, matches: sortedMatches }
      })

      setMatchdays(sortedDays)
      const { data: preds } = await supabase.from('predictions').select('*').eq('user_id', user.id)
      const predMap: Record<number, number> = {}
      preds?.forEach((p: any) => (predMap[p.match_id] = p.predicted_team_id))
      setPredictions(predMap)
      const currentMatchesIds = sortedDays[0]?.matches.map((m: any) => m.id) || []
      const alreadyHasPreds = preds?.some((p: any) => currentMatchesIds.includes(p.match_id))
      setHasSavedInDB(!!alreadyHasPreds)
    }
  }

  const handlePredict = (matchId: number, teamId: number) => {
    if (hasSavedInDB && !isEditing) return
    if (matchdays[currentDayIndex]?.is_locked) return
    setPredictions(prev => {
      if (prev[matchId] === teamId) {
        const next = { ...prev }
        delete next[matchId]
        return next
      }
      return { ...prev, [matchId]: teamId }
    })
  }

  const savePredictions = async () => {
    const currentMatches = matchdays[currentDayIndex].matches
    for (const match of currentMatches) {
      const selectedTeamId = predictions[match.id]
      if (selectedTeamId) {
        await supabase.from('predictions').upsert(
          { user_id: user.id, match_id: match.id, predicted_team_id: selectedTeamId },
          { onConflict: 'user_id, match_id' }
        )
      } else {
        await supabase.from('predictions').delete().eq('user_id', user.id).eq('match_id', match.id)
      }
    }
    setIsEditing(false)
    setHasSavedInDB(true)
    loadData()
  }

  const handleSharePicks = async () => {
    if (!shareTicketRef.current) return
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      const canvas = await html2canvas(shareTicketRef.current, {
        useCORS: true, scale: 2, backgroundColor: '#0a0a0a', logging: false,
      })
      const image = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.href = image
      link.download = `Picks_${user.username}.png`
      link.click()
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  return (
    <>
      <div className="max-w-2xl mx-auto bg-slate-900/40 rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-sm">
        {matchdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-slate-600 font-black italic tracking-widest animate-pulse">PROXIMAMENTE...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <button
                disabled={currentDayIndex === 0}
                onClick={() => { setCurrentDayIndex(i => i - 1); setIsEditing(false) }}
                style={{ color: activeColor, borderColor: activeColor + '40' }}
                className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
              > ← </button>
              <div className="text-center">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: activeColor }}>
                  {matchdays[currentDayIndex].name}
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                  {matchdays[currentDayIndex].date_label}
                </p>
              </div>
              <button
                disabled={currentDayIndex === matchdays.length - 1}
                onClick={() => { setCurrentDayIndex(i => i + 1); setIsEditing(false) }}
                style={{ color: activeColor, borderColor: activeColor + '40' }}
                className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
              > → </button>
            </div>

            <div className="space-y-4">
              {matchdays[currentDayIndex].matches.map((match: any) => {
                const isLocked = matchdays[currentDayIndex].is_locked
                const myPick = predictions[match.id]
                const anyPick = myPick !== undefined
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
                <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">
                  JORNADA CERRADA
                </div>
              ) : hasSavedInDB && !isEditing ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setIsEditing(true)} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black italic uppercase text-sm">
                    Editar predicción
                  </button>
                  <button onClick={handleSharePicks} disabled={isGenerating} className="bg-[#218b44] text-white px-8 py-4 rounded-2xl font-black italic uppercase text-sm flex items-center justify-center gap-2">
                    {isGenerating ? 'GENERANDO...' : 'COMPARTIR PICKS'}
                  </button>
                </div>
              ) : (
                <button onClick={savePredictions} className={`${btnColor} text-slate-950 px-12 py-4 rounded-2xl font-black italic uppercase text-sm`}>
                  Confirmar Jornada
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Ticket oculto para compartir */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && (
          <div ref={shareTicketRef} className="w-[450px] bg-[#0a0a0a] p-10 font-sans border border-[#1e293b]">
            <div className="flex justify-between items-center mb-8">
              <div className="relative w-36 h-10">
                <img src="/Muertazos.png" alt="Logo" className="object-contain w-full h-full" />
              </div>
              <div className="text-right">
                <div className="text-white font-bold uppercase text-[10px] tracking-widest opacity-60">{user.username}</div>
                <div style={{ color: activeColor }} className="font-black italic text-xl uppercase tracking-tighter leading-none mt-1">
                  {matchdays[currentDayIndex]?.name}
                </div>
              </div>
            </div>
            <div className="space-y-4 bg-[#000000] p-6 border border-[#ffffff10]">
              {matchdays[currentDayIndex]?.matches.map((match: any) => {
                const pickId = predictions[match.id]
                const isHomePredicted = pickId === match.home_team_id
                const isAwayPredicted = pickId === match.away_team_id
                const folder = league === 'kings' ? 'Kings' : 'Queens'
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
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
