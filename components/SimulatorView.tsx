'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getCompFolder, getLogoSize } from '@/lib/utils'

interface Props {
  /** When true, shows save/delete buttons and uses smaller logo sizes */
  isAdmin?: boolean
}

export default function SimulatorView({ isAdmin = false }: Props) {
  const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [scores, setScores] = useState<Record<number, { hg: string; ag: string; penaltyWinnerId: number | null }>>({})

  const folder = getCompFolder(compKey)
  const logoSize = (filename: string) => getLogoSize(filename, !isAdmin)

  const getRowColor = (idx: number) => {
    if (idx === 0) return 'bg-yellow-500'
    if (idx >= 1 && idx <= 5) return 'bg-blue-500'
    if (idx >= 6 && idx <= 9) return 'bg-red-500'
    return 'bg-transparent'
  }

  useEffect(() => {
    const load = async () => {
      const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey)
      if (tData) setTeams(tData)

      const { data: mData } = await supabase
        .from('matchdays')
        .select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
        .eq('competition_key', compKey)
        .order('display_order')

      const { data: rData } = await supabase.from('match_results').select('*')

      if (mData) {
        const loadedScores: any = {}
        if (rData) {
          const allMatches = mData.flatMap((d: any) => d.matches)
          rData.forEach((res: any) => {
            let pWinner = null
            if (res.home_goals === res.away_goals) {
              const match = allMatches.find((m: any) => m.id === res.match_id)
              if (res.home_penalties > res.away_penalties) pWinner = match?.home_team_id ?? null
              if (res.away_penalties > res.home_penalties) pWinner = match?.away_team_id ?? null
            }
            loadedScores[res.match_id] = {
              hg: res.home_goals != null ? String(res.home_goals) : '',
              ag: res.away_goals != null ? String(res.away_goals) : '',
              penaltyWinnerId: pWinner,
            }
          })
        }
        setScores(loadedScores)
        setMatchdays(mData)
        if (mData.length > 0) setActiveMatchdayId(mData[0].id)
      }
    }
    load()
  }, [compKey])

  const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

  const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    setScores(prev => {
      const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }
      const newHg = field === 'hg' ? value : current.hg
      const newAg = field === 'ag' ? value : current.ag
      const pWinner = newHg === newAg ? current.penaltyWinnerId : null
      return { ...prev, [matchId]: { ...current, [field]: value, penaltyWinnerId: pWinner } }
    })
  }

  const togglePenaltyWinner = (matchId: number, teamId: number) => {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId },
    }))
  }

  const saveActiveMatchday = async () => {
    if (!activeMatchday) return
    const resultsToUpsert = activeMatchday.matches
      .filter((m: any) => scores[m.id]?.hg !== '' && scores[m.id]?.ag !== '')
      .map((m: any) => {
        const s = scores[m.id]
        const isTie = s.hg === s.ag
        return {
          match_id: m.id,
          home_goals: parseInt(s.hg),
          away_goals: parseInt(s.ag),
          home_penalties: isTie ? (s.penaltyWinnerId === m.home_team_id ? 1 : 0) : null,
          away_penalties: isTie ? (s.penaltyWinnerId === m.away_team_id ? 1 : 0) : null,
        }
      })
    if (resultsToUpsert.length === 0) return alert('No hay marcadores para guardar.')
    const pendingPenalties = resultsToUpsert.some(
      (r: any) => r.home_goals === r.away_goals && r.home_penalties === 0 && r.away_penalties === 0
    )
    if (pendingPenalties) return alert('Selecciona al ganador de los penales haciendo clic en su escudo.')
    const { error } = await supabase.from('match_results').upsert(resultsToUpsert, { onConflict: 'match_id' })
    if (error) alert('Error: ' + error.message)
    else alert(`Jornada ${activeMatchday.name} guardada.`)
  }

  const deleteActiveMatchday = async () => {
    if (!activeMatchday || !confirm('¿Borrar resultados?')) return
    const matchIds = activeMatchday.matches.map((m: any) => m.id)
    const { error } = await supabase.from('match_results').delete().in('match_id', matchIds)
    if (!error) {
      const newScores = { ...scores }
      matchIds.forEach((id: number) => delete newScores[id])
      setScores(newScores)
    }
  }

  const standings = teams
    .map(team => {
      let w = 0, l = 0, gf = 0, gc = 0
      matchdays.forEach(md => {
        md.matches?.forEach((m: any) => {
          const s = scores[m.id]
          if (!s || s.hg === '' || s.ag === '') return
          const hG = parseInt(s.hg), aG = parseInt(s.ag)
          if (m.home_team_id === team.id) {
            gf += hG; gc += aG
            if (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) w++; else l++
          } else if (m.away_team_id === team.id) {
            gf += aG; gc += hG
            if (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) w++; else l++
          }
        })
      })
      return { ...team, w, l, gf, gc, dg: gf - gc }
    })
    .sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf)

  return (
    <div className="w-full flex flex-col items-center">
      {/* Competition + matchday selector */}
      <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-4 border-b border-white/5">
        <div className="flex gap-2 border-r border-white/10 pr-4">
          <button
            onClick={() => { setCompKey('kings'); setActiveMatchdayId(null) }}
            className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}
          >Kings</button>
          <button
            onClick={() => { setCompKey('queens'); setActiveMatchdayId(null) }}
            className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}
          >Queens</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {matchdays.map(day => {
            const shortName = day.name.toUpperCase().replace('JORNADA', 'J').replace(/\s+/g, '')
            const label = shortName.includes('J') ? shortName : `J${day.display_order || ''}`
            return (
              <button
                key={day.id}
                onClick={() => setActiveMatchdayId(day.id)}
                className={`px-2 py-1.5 text-[11px] font-black italic uppercase border-b-2 transition-colors ${activeMatchdayId === day.id
                  ? compKey === 'kings' ? 'border-[#FFD300] text-[#FFD300]' : 'border-[#01d6c3] text-[#01d6c3]'
                  : 'border-transparent text-slate-400 hover:text-white'}`}
              >{label}</button>
            )
          })}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-8 xl:items-start">
          {/* Matches grid — title left-aligned, matches in 2-col grid */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                {activeMatchday?.name}
              </h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={saveActiveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Guardar</button>
                  <button onClick={deleteActiveMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Borrar</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeMatchday?.matches?.map((m: any) => {
              const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null }
              const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag
              const size = isAdmin ? logoSize(m.home?.logo_file || '') : 96
              return (
                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl px-5 py-3 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      {m.home && (
                        <button
                          onClick={() => isAdmin && isTie && togglePenaltyWinner(m.id, m.home_team_id)}
                          className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''} ${isAdmin ? '' : 'cursor-default'}`}
                        >
                          <Image src={`/logos/${folder}/${m.home.logo_file}`} width={size} height={size} alt="home" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.hg}
                        readOnly={!isAdmin}
                        onChange={e => isAdmin && handleLocalScoreChange(m.id, 'hg', e.target.value)}
                        className={`w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none ${!isAdmin ? 'cursor-default' : ''}`}
                        maxLength={2}
                      />
                      <span className="text-xs font-black text-white italic">VS</span>
                      <input
                        type="text"
                        value={s.ag}
                        readOnly={!isAdmin}
                        onChange={e => isAdmin && handleLocalScoreChange(m.id, 'ag', e.target.value)}
                        className={`w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none ${!isAdmin ? 'cursor-default' : ''}`}
                        maxLength={2}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      {m.away && (
                        <button
                          onClick={() => isAdmin && isTie && togglePenaltyWinner(m.id, m.away_team_id)}
                          className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''} ${isAdmin ? '' : 'cursor-default'}`}
                        >
                          <Image src={`/logos/${folder}/${m.away.logo_file}`} width={size} height={size} alt="away" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isAdmin && isTie && (
                    <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>
                  )}
                </div>
              )
            })}
            </div>
          </div>

          {/* Standings table */}
          <div className="w-full xl:w-[480px]">
            <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
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
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`} />
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pl-2 text-left">
                        <div className="flex items-center gap-2">
                          <Image src={`/logos/${folder}/${t.logo_file}`} width={22} height={22} alt={t.name} />
                          <span className="text-[10px] font-bold uppercase truncate max-w-[110px]">{t.name}</span>
                        </div>
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
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" /><span>1º Semifinal</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /><span>2º a 6º Cuartos</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-500 rounded-full" /><span>7º a 10º Play In</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
