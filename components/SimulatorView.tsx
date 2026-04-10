'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getCompFolder, getLogoSize, getTeamLogoPath } from '@/lib/utils'

type SplitKey = 'spain' | 'brazil' | 'mexico'

const SPLIT_OPTIONS: { key: SplitKey; label: string; flag: string; accentColor: string }[] = [
  { key: 'spain',  label: 'SPLIT 6 ESPAÑA',  flag: '🇪🇸', accentColor: '#c60b1e' },
  { key: 'brazil', label: 'SPLIT 2 BRASIL',  flag: '🇧🇷', accentColor: '#009c3b' },
  { key: 'mexico', label: 'SPLIT 4 MÉXICO',  flag: '🇲🇽', accentColor: '#006847' },
]

interface Props {
  isAdmin?: boolean
}

export default function SimulatorView({ isAdmin = false }: Props) {
  const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings')
  const [splitCountry, setSplitCountry] = useState<SplitKey>('spain')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [scores, setScores] = useState<Record<number, { hg: string; ag: string; penaltyWinnerId: number | null }>>({})
  const [isSharing, setIsSharing] = useState(false)
  const shareTicketRef = useRef<HTMLDivElement>(null)
  const [simUser, setSimUser] = useState<{ username: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('muertazos_user')
      if (stored) setSimUser(JSON.parse(stored))
    } catch {}
  }, [])

  const logoSize = (filename: string) => getLogoSize(filename, !isAdmin)
  const activeSplit = SPLIT_OPTIONS.find(s => s.key === splitCountry) ?? SPLIT_OPTIONS[0]

  const getRowColor = (idx: number) => {
    if (idx === 0) return 'bg-yellow-500'
    if (idx >= 1 && idx <= 5) return 'bg-blue-500'
    if (idx >= 6 && idx <= 9) return 'bg-red-500'
    return 'bg-transparent'
  }

  useEffect(() => {
    const load = async () => {
      // Try to load teams from DB (with country column after migration)
      const { data: tData } = await supabase
        .from('teams')
        .select('*')
        .eq('competition_key', compKey)
        .eq('country', splitCountry)

      setTeams(tData ?? [])

      const { data: mData } = await supabase
        .from('matchdays')
        .select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
        .eq('competition_key', compKey)
        .eq('country', splitCountry)
        .order('display_order')

      const { data: rData } = await supabase.from('match_results').select('*')

      if (mData && mData.length > 0) {
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
        // Auto-select the closest upcoming empty matchday (no results loaded)
        const matchIdsWithResults = new Set(Object.keys(loadedScores).map(Number))
        const firstEmpty = mData.find((d: any) =>
          d.matches?.length > 0 && !d.matches.some((m: any) => matchIdsWithResults.has(m.id))
        )
        setActiveMatchdayId((firstEmpty ?? mData[mData.length - 1] ?? mData[0]).id)
      } else {
        setMatchdays([])
        setActiveMatchdayId(null)
        setScores({})
      }
    }
    load()
  }, [compKey, splitCountry])

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

  const isNonSpainKings = compKey === 'kings' && splitCountry !== 'spain' && matchdays.length === 0

  const handleShare = async () => {
    if (!shareTicketRef.current || isSharing) return
    setIsSharing(true)
    try {
      const { captureAndDownload } = await import('@/lib/captureTicket')
      await captureAndDownload(
        shareTicketRef.current,
        `simulador-${simUser?.username || 'muertazos'}.webp`
      )
    } catch (err) {
      console.error('[Simulator] Share failed:', err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
    <div className="w-full flex flex-col items-center">
      {/* Top bar: competition + split selectors */}
      <div className="w-full flex flex-col border-b border-white/5">
        {/* Row 1: Kings / Queens + matchday tabs */}
        <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-4">
          <div className="flex gap-2 border-r border-white/10 pr-4">
            <button
              onClick={() => { setCompKey('kings'); setActiveMatchdayId(null) }}
              className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}
            >Kings</button>
            {splitCountry !== 'brazil' && splitCountry !== 'mexico' && (
              <button
                onClick={() => { setCompKey('queens'); setSplitCountry('spain'); setActiveMatchdayId(null) }}
                className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}
              >Queens</button>
            )}
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

        {/* Row 2: Split selector (Kings only) */}
        {compKey === 'kings' && (
          <div className="flex justify-center gap-2 px-4 pb-3">
            {SPLIT_OPTIONS.map(opt => {
              const isActive = splitCountry === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => { setSplitCountry(opt.key); if (opt.key === 'brazil') setCompKey('kings'); setActiveMatchdayId(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black italic uppercase tracking-tight whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-black border-transparent'
                      : 'bg-transparent text-slate-500 border-slate-700 hover:text-white hover:border-slate-500'
                  }`}
                  style={isActive ? { backgroundColor: opt.accentColor, borderColor: opt.accentColor } : {}}
                >
                  <span className="not-italic">{opt.flag}</span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col xl:flex-row gap-8 xl:items-start">
          {/* Match containers */}
          <div className="flex-1 flex flex-col gap-3 xl:max-w-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                {isNonSpainKings
                  ? `Kings ${splitCountry === 'brazil' ? 'Brasil' : 'México'} · ${activeSplit.label}`
                  : activeMatchday?.name}
              </h3>
              <div className="flex gap-2">
                {isAdmin && !isNonSpainKings && (
                  <>
                    <button onClick={saveActiveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Guardar</button>
                    <button onClick={deleteActiveMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Borrar</button>
                  </>
                )}
                {!isAdmin && !isNonSpainKings && activeMatchday && (
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#FFD300]/10 border border-[#FFD300]/40 text-[#FFD300] hover:bg-[#FFD300]/20 font-black italic uppercase text-xs tracking-tight transition-all disabled:opacity-50"
                  >
                    {isSharing ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    Compartir
                  </button>
                )}
              </div>
            </div>

            {isNonSpainKings ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-2xl gap-3">
                <span className="text-3xl not-italic">{activeSplit.flag}</span>
                <p className="text-slate-500 font-black italic uppercase text-sm tracking-widest">
                  Jornadas {splitCountry === 'brazil' ? 'Brasil' : 'México'} próximamente
                </p>
                <p className="text-slate-700 text-xs">Los datos de partidos se añadirán cuando estén disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {activeMatchday?.matches?.map((m: any) => {
                  const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null }
                  const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag
                  const size = 96
                  return (
                    <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl px-5 py-3 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          {m.home && (
                            <button
                              onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)}
                              className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                            >
                              <Image src={getTeamLogoPath(compKey, m.home.logo_file, splitCountry)} width={size} height={size} alt="home" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={s.hg}
                            onChange={e => handleLocalScoreChange(m.id, 'hg', e.target.value)}
                            className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none"
                            maxLength={2}
                          />
                          <span className="text-xs font-black text-white italic">VS</span>
                          <input
                            type="text"
                            value={s.ag}
                            onChange={e => handleLocalScoreChange(m.id, 'ag', e.target.value)}
                            className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none"
                            maxLength={2}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          {m.away && (
                            <button
                              onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)}
                              className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                            >
                              <Image src={getTeamLogoPath(compKey, m.away.logo_file, splitCountry)} width={size} height={size} alt="away" />
                            </button>
                          )}
                        </div>
                      </div>
                      {isTie && (
                        <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
                          <Image src={getTeamLogoPath(compKey, t.logo_file, splitCountry)} width={22} height={22} alt={t.name} />
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

    {/* Hidden share ticket */}

    {!isAdmin && activeMatchday && (
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={shareTicketRef} style={{ width: '520px', backgroundColor: '#0A0A0A', padding: '32px', fontFamily: 'sans-serif', borderRadius: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <img src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos.bet" loading="eager" style={{ width: '130px', height: '36px', objectFit: 'contain' }} />
              <span style={{ color: '#334155', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>MUERTAZOS.BET</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {simUser?.username && (
                <div style={{ color: '#ffffff', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.12em', opacity: 0.45 }}>
                  {simUser.username}
                </div>
              )}
              <div style={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '2px' }}>
                SIMULADOR
              </div>
              <div style={{ color: compKey === 'kings' ? '#FFD300' : '#01d6c3', fontWeight: 900, fontStyle: 'italic', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {compKey === 'kings' ? 'Kings' : 'Queens'} · {splitCountry === 'brazil' ? 'Brasil' : splitCountry === 'mexico' ? 'México' : 'España'} · {activeMatchday.name}
              </div>
            </div>
          </div>

          {/* Matches */}
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            {activeMatchday.matches?.map((m: any, i: number, arr: any[]) => {
              const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null }
              const logoSz = 64
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '16px', padding: '12px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  backgroundColor: '#0A0A0A',
                }}>
                  <div style={{ width: logoSz, height: logoSz, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {m.home && <img src={getTeamLogoPath(compKey, m.home.logo_file, splitCountry)} alt={m.home.name} loading="eager" style={{ maxWidth: logoSz, maxHeight: logoSz, width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
                    <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '28px', fontStyle: 'italic', minWidth: '32px', textAlign: 'center', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                      {s.hg !== '' ? s.hg : '-'}
                    </span>
                    <span style={{ color: '#475569', fontWeight: 900, fontSize: '12px', fontStyle: 'italic', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>VS</span>
                    <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '28px', fontStyle: 'italic', minWidth: '32px', textAlign: 'center', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                      {s.ag !== '' ? s.ag : '-'}
                    </span>
                  </div>
                  <div style={{ width: logoSz, height: logoSz, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {m.away && <img src={getTeamLogoPath(compKey, m.away.logo_file, splitCountry)} alt={m.away.name} loading="eager" style={{ maxWidth: logoSz, maxHeight: logoSz, width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', textAlign: 'center', color: '#334155', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.45em' }}>
            MUERTAZOS.BET
          </div>
        </div>
      </div>
    )}
    </>
  )
}
