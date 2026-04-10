'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import { COUNTRIES, getTeamLogoPath, getTeamLogoPathEncoded, sortMatchesByOrder, type Country } from '@/lib/utils'

export default function PredisPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userChecked, setUserChecked] = useState(false)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [country, setCountry] = useState<Country>('spain')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const shareTicketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    setUserChecked(true)
  }, [])

  // Queens is Spain-only; Kings supports all three countries
  const effectiveCountry: Country = league === 'queens' ? 'spain' : country

  const loadMatchdays = useCallback(async () => {
    if (!userChecked) return
    // Logged-in users see matchdays controlled by is_visible (USUARIO toggle)
    // Unauthenticated visitors see matchdays controlled by is_public_visible (PÚBLICO toggle)
    const visibilityField = user ? 'is_visible' : 'is_public_visible'
    const { data } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', league)
      .eq('country', league === 'queens' ? 'spain' : country)
      .eq(visibilityField, true)
      .order('display_order')

    setMatchdays(data ? data.map(day => ({ ...day, matches: sortMatchesByOrder(day.matches || []) })) : [])
    setCurrentDayIndex(0)
    setPredictions({})
  }, [league, country, user, userChecked])

  useEffect(() => { loadMatchdays() }, [loadMatchdays])

  const handlePredict = (matchId: number, teamId: number) => {
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

  const handleShare = async () => {
    if (!shareTicketRef.current || isGenerating) return
    setIsGenerating(true)
    try {
      const { captureAndDownload } = await import('@/lib/captureTicket')
      await captureAndDownload(
        shareTicketRef.current,
        `predis-${user?.username || 'muertazos'}.webp`
      )
    } catch (err) {
      console.error('[Predis] Share failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'

  const getPicksBorderGradient = () => {
    if (league === 'queens') return 'from-[#01d6c3] via-[#01d6c3]/50 to-[#01d6c3]'
    if (country === 'mexico') return 'from-[#006847] via-white to-[#ce1126]'
    if (country === 'brazil') return 'from-[#009c3b] via-[#ffdf00] to-[#009c3b]'
    return 'from-[#c60b1e] via-[#ffd300] to-[#c60b1e]'
  }

  const countryLabel = effectiveCountry === 'brazil' ? 'Brasil' : effectiveCountry === 'mexico' ? 'México' : 'España'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <AppHeader
        onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-8 pb-10">

        {/* League toggle */}
        <div className="flex gap-2 mb-4 justify-center">
          {(['kings', 'queens'] as const)
            .filter(lg => !(lg === 'queens' && (country === 'mexico' || country === 'brazil')))
            .map(lg => (
              <button
                key={lg}
                onClick={() => { setLeague(lg); if (lg === 'queens') setCountry('spain') }}
                className={`px-5 py-2 rounded-full text-xs font-black italic uppercase border transition-colors ${
                  league === lg
                    ? lg === 'kings'
                      ? 'bg-[#FFD300] text-black border-[#FFD300]'
                      : 'bg-[#01d6c3] text-black border-[#01d6c3]'
                    : 'bg-transparent text-slate-500 border-slate-700 hover:text-white hover:border-slate-500'
                }`}
              >
                {lg === 'kings' ? 'Kings' : 'Queens'}
              </button>
            ))}
        </div>

        {/* Country selector — Kings only */}
        {league === 'kings' && (
          <div className="flex gap-2 mb-6 justify-center flex-wrap">
            {COUNTRIES.map(({ key, flag, name }) => {
              const isActive = country === key
              return (
                <button
                  key={key}
                  onClick={() => {
                    setCountry(key)
                    if ((key === 'mexico' || key === 'brazil') && league === 'queens') setLeague('kings')
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black italic uppercase tracking-tight whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-current'
                      : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'
                  }`}
                  style={isActive ? { borderColor: activeColor, color: activeColor, backgroundColor: activeColor + '18' } : {}}
                >
                  <span>{flag}</span>
                  <span>{name}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="bg-slate-900/70 rounded-3xl p-4 sm:p-6 border border-white/5">
          <div className={`h-0.5 w-full bg-gradient-to-r ${getPicksBorderGradient()} rounded-full mb-4 opacity-60`} />

          {matchdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="font-black italic tracking-widest text-slate-600 animate-pulse">PRÓXIMAMENTE...</p>
            </div>
          ) : (
            <>
              {/* Matchday navigator */}
              <div className="flex justify-between items-center mb-3 px-1 py-2">
                <button
                  disabled={currentDayIndex === 0}
                  onClick={() => setCurrentDayIndex(i => i - 1)}
                  style={{ color: activeColor, borderColor: activeColor + '40' }}
                  className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
                >←</button>
                <div className="text-center">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter" style={{ color: activeColor }}>
                    {matchdays[currentDayIndex].name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                    {matchdays[currentDayIndex].date_label}
                  </p>
                </div>
                <button
                  disabled={currentDayIndex === matchdays.length - 1}
                  onClick={() => setCurrentDayIndex(i => i + 1)}
                  style={{ color: activeColor, borderColor: activeColor + '40' }}
                  className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
                >→</button>
              </div>

              {/* Matches */}
              <div className="space-y-4">
                {matchdays[currentDayIndex].matches.map((match: any) => {
                  const isLocked = matchdays[currentDayIndex].is_locked
                  const myPick = predictions[match.id]
                  const anyPick = myPick !== undefined
                  return (
                    <div key={match.id} className="flex justify-between items-center bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                      <TeamButton
                        team={match.home}
                        league={league}
                        country={effectiveCountry}
                        isSelected={myPick === match.home_team_id}
                        anyPickInMatch={anyPick}
                        onClick={() => handlePredict(match.id, match.home_team_id)}
                        disabled={isLocked}
                      />
                      <span className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter mx-2 sm:mx-4">VS</span>
                      <TeamButton
                        team={match.away}
                        league={league}
                        country={effectiveCountry}
                        isSelected={myPick === match.away_team_id}
                        anyPickInMatch={anyPick}
                        onClick={() => handlePredict(match.id, match.away_team_id)}
                        disabled={isLocked}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Action — Share only, no save */}
              <div className="mt-6 flex justify-center">
                {matchdays[currentDayIndex]?.is_locked ? (
                  <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">
                    JORNADA CERRADA
                  </div>
                ) : (
                  <button
                    onClick={handleShare}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all disabled:opacity-50"
                    style={{ backgroundColor: activeColor + '1a', borderColor: activeColor + '66', color: activeColor }}
                  >
                    {isGenerating ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    Compartir mis picks
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Hidden share ticket */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && (
          <div ref={shareTicketRef} style={{ width: '450px', backgroundColor: '#0A0A0A', padding: '40px', fontFamily: 'sans-serif', borderRadius: '16px' }}>
            {/* Standardized header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <img src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Logo" loading="eager" style={{ width: '144px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                {user?.username && (
                  <div style={{ color: '#ffffff', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.12em', opacity: 0.6 }}>{user.username}</div>
                )}
                <div style={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '2px' }}>PREDIS</div>
                <div style={{ color: activeColor, fontWeight: 900, fontStyle: 'italic', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {league === 'kings' ? 'Kings' : 'Queens'} {matchdays[currentDayIndex]?.name}
                </div>
              </div>
            </div>

            {/* Match picks */}
            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
              {matchdays[currentDayIndex]?.matches.map((match: any, i: number, arr: any[]) => {
                const pickId = predictions[match.id]
                return (
                  <div key={match.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px',
                    padding: '16px 24px', backgroundColor: '#0f172a',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div style={{ width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pickId === match.home_team_id ? 1 : 0.2, filter: pickId === match.home_team_id ? 'none' : 'grayscale(1)', transform: pickId === match.home_team_id ? 'scale(1.1)' : 'scale(0.9)' }}>
                      <img src={getTeamLogoPathEncoded(league, match.home.logo_file, match.home.country ?? effectiveCountry)} alt="" loading="eager" style={{ maxWidth: '96px', maxHeight: '96px', width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                    </div>
                    <div style={{ color: '#475569', fontWeight: 900, fontSize: '16px', fontStyle: 'italic' }}>VS</div>
                    <div style={{ width: '96px', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pickId === match.away_team_id ? 1 : 0.2, filter: pickId === match.away_team_id ? 'none' : 'grayscale(1)', transform: pickId === match.away_team_id ? 'scale(1.1)' : 'scale(0.9)' }}>
                      <img src={getTeamLogoPathEncoded(league, match.away.logo_file, match.away.country ?? effectiveCountry)} alt="" loading="eager" style={{ maxWidth: '96px', maxHeight: '96px', width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', textAlign: 'center', color: '#334155', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.45em' }}>
              MUERTAZOS.COM
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamButton({ team, league, country, isSelected, anyPickInMatch, onClick, disabled }: {
  team: any; league: string; country: string; isSelected: boolean; anyPickInMatch: boolean; onClick: () => void; disabled: boolean
}) {
  const appearanceClass = isSelected
    ? 'scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] grayscale-0 opacity-100 z-10'
    : anyPickInMatch
    ? 'grayscale opacity-30 scale-90'
    : 'grayscale-0 opacity-100 scale-100'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center transition-all duration-500 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}
    >
      <div className="relative w-20 h-20 sm:w-28 sm:h-28">
        <Image src={getTeamLogoPath(league, team.logo_file, team.country ?? country)} alt={team.name} fill className="object-contain" onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }} />
      </div>
    </button>
  )
}
