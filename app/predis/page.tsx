'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Users, Share2, X, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import { getTeamLogoPath, getTeamLogoPathEncoded, sortMatchesByOrder, type Country } from '@/lib/utils'


function getCountryLabel(c: string): string {
  if (c === 'mexico') return 'MÉXICO'
  if (c === 'brazil') return 'BRASIL'
  return 'ESPAÑA'
}

export default function PredisPage() {
  return <Suspense><PredisPageInner /></Suspense>
}

function PredisPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [userChecked, setUserChecked] = useState(false)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [country, setCountry] = useState<Country>('spain')

  // URL params set when navigating from the menu — hide filter UI when present
  const urlLeague  = searchParams.get('league')  as 'kings' | 'queens' | null
  const urlCountry = searchParams.get('country') as Country | null
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null)
  const shareTicketRef = useRef<HTMLDivElement>(null)

  // Multi-guest state
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [modalStep, setModalStep] = useState<1 | 2>(1)
  const [guestCount, setGuestCount] = useState(2)
  const [guestNameInputs, setGuestNameInputs] = useState<string[]>(['', ''])
  const [guests, setGuests] = useState<string[]>([])
  const [isMultiMode, setIsMultiMode] = useState(false)
  const [guestPredictions, setGuestPredictions] = useState<Record<number, Record<number, number>>>({})
  const multiBoardRef = useRef<HTMLDivElement>(null)
  const multiCaptureBoardRef = useRef<HTMLDivElement>(null)

  // Load user once on mount
  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    setUserChecked(true)
  }, [])

  // Re-sync league/country whenever URL params change (sidebar navigation)
  useEffect(() => {
    if (urlLeague)  setLeague(urlLeague)
    if (urlCountry) setCountry(urlCountry)
  }, [urlLeague, urlCountry])

  const effectiveCountry: Country = league === 'queens' ? 'spain' : country

  const loadMatchdays = useCallback(async () => {
    if (!userChecked) return
    setMatchdays([])
    setPredictions({})
    setGuestPredictions({})
    const visibilityField = user ? 'is_visible' : 'is_public_visible'
    const { data } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', league)
      .eq('country', league === 'queens' ? 'spain' : country)
      .eq(visibilityField, true)
      .order('display_order')

    const days = data ? data.map(day => ({ ...day, matches: sortMatchesByOrder(day.matches || []) })) : []
    setMatchdays(days)
    setCurrentDayIndex(0)
    setGuestPredictions({})

    // Load pre-existing predictions for the logged-in user
    if (user && days.length > 0) {
      const allMatchIds = days.flatMap(d => (d.matches || []).map((m: any) => m.id))
      const { data: existingPreds } = await supabase
        .from('predictions')
        .select('match_id, predicted_team_id')
        .eq('user_id', user.id)
        .in('match_id', allMatchIds)
      if (existingPreds?.length) {
        const map: Record<number, number> = {}
        existingPreds.forEach(p => { map[p.match_id] = p.predicted_team_id })
        setPredictions(map)
      } else {
        setPredictions({})
      }
    } else {
      setPredictions({})
    }
  }, [league, country, user, userChecked])

  useEffect(() => { loadMatchdays() }, [loadMatchdays])

  const handlePredict = (matchId: number, teamId: number) => {
    if (matchdays[currentDayIndex]?.is_locked) return
    setPredictions(prev => {
      if (prev[matchId] === teamId) { const next = { ...prev }; delete next[matchId]; return next }
      return { ...prev, [matchId]: teamId }
    })
  }

  const handleGuestPredict = (guestIdx: number, matchId: number, teamId: number) => {
    if (matchdays[currentDayIndex]?.is_locked) return
    setGuestPredictions(prev => {
      const guestPreds = prev[guestIdx] ?? {}
      if (guestPreds[matchId] === teamId) {
        const next = { ...guestPreds }; delete next[matchId]
        return { ...prev, [guestIdx]: next }
      }
      return { ...prev, [guestIdx]: { ...guestPreds, [matchId]: teamId } }
    })
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) return
    const entries = Object.entries(predictions)
    if (!entries.length) return
    setSaving(true)
    setSaveStatus(null)
    const rows = entries.map(([matchId, teamId]) => ({
      user_id: user.id,
      match_id: Number(matchId),
      predicted_team_id: teamId,
    }))
    const { error } = await supabase
      .from('predictions')
      .upsert(rows, { onConflict: 'user_id,match_id' })
    setSaving(false)
    if (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 4000)
    } else {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleShare = async () => {
    if (!shareTicketRef.current || isGenerating) return
    setIsGenerating(true)
    try {
      const { captureAndDownload } = await import('@/lib/captureTicket')
      await captureAndDownload(shareTicketRef.current, `predis-${user?.username || 'muertazos'}.webp`)
    } catch (err) { console.error('[Predis] Share failed:', err) }
    finally { setIsGenerating(false) }
  }

  const handleMultiShare = async () => {
    if (!multiCaptureBoardRef.current || isGenerating) return
    setIsGenerating(true)
    try {
      const { captureAndDownload } = await import('@/lib/captureTicket')
      await captureAndDownload(multiCaptureBoardRef.current, 'predis-multijugador.webp')
    } catch (err) { console.error('[Predis] Multi-share failed:', err) }
    finally { setIsGenerating(false) }
  }

  const openModal = () => {
    setModalStep(1)
    setGuestCount(2)
    setGuestNameInputs(['', ''])
    setShowGuestModal(true)
  }

  const handleModalNext = () => {
    const n = Math.max(2, Math.min(5, guestCount))
    setGuestCount(n)
    setGuestNameInputs(prev => Array(n).fill('').map((_, i) => prev[i] ?? ''))
    setModalStep(2)
  }

  const handleModalCreate = () => {
    const names = guestNameInputs.map((n, i) => n.trim() || `Invitado ${i + 1}`)
    setGuests(names)
    setGuestPredictions({})
    setIsMultiMode(true)
    setShowGuestModal(false)
  }

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'

  const getPicksBorderGradient = () => {
    if (league === 'queens') return 'from-[#01d6c3] via-[#01d6c3]/50 to-[#01d6c3]'
    if (country === 'mexico') return 'from-[#006847] via-white to-[#ce1126]'
    if (country === 'brazil') return 'from-[#009c3b] via-[#ffdf00] to-[#009c3b]'
    return 'from-[#c60b1e] via-[#ffd300] to-[#c60b1e]'
  }

  const currentMatchday = matchdays[currentDayIndex]
  const isLocked = currentMatchday?.is_locked

  // ── MULTI-BOARD MODE ─────────────────────────────────────────────────────────
  if (isMultiMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <AppHeader
          onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
          userAvatar={user ? (user.avatar_url || `/usuarios/${user.username}.webp`) : undefined}
          username={user?.username}
          userRole={user?.role}
          variant="nav"
          backTo="/"
        />

        {/* Boards */}
        {matchdays.length === 0 ? (
          <div className="flex items-center justify-center flex-1 h-64">
            <p className="font-black italic tracking-widest text-slate-600 animate-pulse">PRÓXIMAMENTE...</p>
          </div>
        ) : (
          <div ref={multiBoardRef} className="bg-[#0a0a0a] px-4 pt-4 pb-6">
            {/* Live boards — single column on mobile, side-by-side from md upwards */}
            <div className={`grid gap-2 ${
              guests.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
              guests.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
              guests.length === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            }`}>
              {guests.map((guestName, gIdx) => (
                <GuestBoard
                  key={gIdx}
                  guestName={guestName}
                  matchday={currentMatchday}
                  league={league}
                  effectiveCountry={effectiveCountry}
                  predictions={guestPredictions[gIdx] ?? {}}
                  onPredict={(matchId, teamId) => handleGuestPredict(gIdx, matchId, teamId)}
                  activeColor={activeColor}
                  gradientClass={getPicksBorderGradient()}
                />
              ))}
            </div>

            {/* Compartir picks — centred below boards */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleMultiShare}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all disabled:opacity-50"
                style={{ backgroundColor: activeColor + '1a', borderColor: activeColor + '66', color: activeColor }}
              >
                {isGenerating ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                  </svg>
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Compartir picks
              </button>
            </div>
          </div>
        )}

        {/* Hidden capture element — inline styles only (no oklch/lab), flex row so all N boards stay in one line */}
        <div className="absolute top-[-9999px] left-[-9999px]">
          {matchdays.length > 0 && currentMatchday && (
            <div
              ref={multiCaptureBoardRef}
              style={{
                backgroundColor: '#0a0a0a',
                padding: '16px 12px',
                fontFamily: 'sans-serif',
                width: guests.length <= 2 ? '480px'
                  : guests.length === 3 ? '700px'
                  : guests.length === 4 ? '920px'
                  : '1140px',
              }}
            >
              {/* Header — logo left, branding right */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <img src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" loading="eager" style={{ height: '24px', objectFit: 'contain' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.25em' }}>MULTIPREDIS</div>
                  <div style={{ color: activeColor, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '-0.02em', marginTop: '2px' }}>
                    {getCountryLabel(effectiveCountry)} {currentMatchday.name}
                  </div>
                </div>
              </div>

              {/* Boards — FLEX ROW + NOWRAP forces all boards into one horizontal line */}
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '10px' }}>
                {guests.map((guestName, gIdx) => {
                  const preds = guestPredictions[gIdx] ?? {}
                  return (
                    <div key={gIdx} style={{ flex: '1 1 0', minWidth: 0, backgroundColor: '#0f172a', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#475569', marginBottom: '3px' }}>PREDIS DE</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', color: activeColor, marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guestName}</div>
                      {currentMatchday.matches?.map((match: any, i: number, arr: any[]) => {
                        const pickId = preds[match.id]
                        return (
                          <div key={match.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <div style={{ width: '72px', height: '72px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pickId === match.home_team_id ? 1 : 0.2, filter: pickId === match.home_team_id ? 'none' : 'grayscale(1)', transform: pickId === match.home_team_id ? 'scale(1.05)' : 'scale(0.9)' }}>
                              <img src={getTeamLogoPathEncoded(league, match.home.logo_file, match.home.country ?? effectiveCountry)} alt="" loading="eager" style={{ maxWidth: '72px', maxHeight: '72px', width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                            </div>
                            <span style={{ color: '#334155', fontWeight: 900, fontSize: '9px', fontStyle: 'italic', flexShrink: 0 }}>VS</span>
                            <div style={{ width: '72px', height: '72px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pickId === match.away_team_id ? 1 : 0.2, filter: pickId === match.away_team_id ? 'none' : 'grayscale(1)', transform: pickId === match.away_team_id ? 'scale(1.05)' : 'scale(0.9)' }}>
                              <img src={getTeamLogoPathEncoded(league, match.away.logo_file, match.away.country ?? effectiveCountry)} alt="" loading="eager" style={{ maxWidth: '72px', maxHeight: '72px', width: 'auto', height: 'auto', display: 'block' }} crossOrigin="anonymous" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Footer branding */}
              <div style={{ marginTop: '12px', textAlign: 'center', color: '#334155', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.45em' }}>
                MUERTAZOS.COM
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── STANDARD VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <AppHeader
        onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
        userAvatar={user ? (user.avatar_url || `/usuarios/${user.username}.webp`) : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-10">

        {/* Country / league selector — always visible */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { label: 'España',  league: 'kings' as const,  country: 'spain'  as Country, dot: '#c60b1e' },
            { label: 'México',  league: 'kings' as const,  country: 'mexico' as Country, dot: '#006847' },
            { label: 'Brasil',  league: 'kings' as const,  country: 'brazil' as Country, dot: '#009c3b' },
            { label: 'Queens',  league: 'queens' as const, country: 'spain'  as Country, dot: null     },
          ].map(item => {
            const isActive = league === item.league && effectiveCountry === item.country
            const color = item.league === 'queens' ? '#01d6c3' : '#FFD300'
            return (
              <a
                key={item.label}
                href={`/predis?league=${item.league}&country=${item.country}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black italic uppercase tracking-tight transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-black border-transparent'
                    : 'bg-transparent text-slate-500 border-slate-700 hover:text-white hover:border-slate-500'
                }`}
                style={isActive ? { backgroundColor: color, borderColor: color } : {}}
              >
                {item.dot
                  ? <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.35)' : item.dot }} />
                  : <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke={isActive ? 'rgba(0,0,0,0.6)' : '#01d6c3'} strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                }
                {item.label}
              </a>
            )
          })}
        </div>

        {/* Multipredis trigger */}
        {matchdays.length > 0 && !isLocked && (
          <div className="flex justify-end mb-4">
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-bold transition-colors whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              Multipredis
            </button>
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
              {/* Matchday title */}
              <div className="text-center mb-4 py-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter" style={{ color: activeColor }}>
                  {matchdays[currentDayIndex].name}
                </h2>
                {matchdays[currentDayIndex].date_label && matchdays[currentDayIndex].date_label !== matchdays[currentDayIndex].name && (
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                    {matchdays[currentDayIndex].date_label}
                  </p>
                )}
              </div>

              {/* Matches */}
              <div className="space-y-4">
                {matchdays[currentDayIndex].matches.map((match: any) => {
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

              {/* Action */}
              <div className="mt-6 flex flex-col items-center gap-3">
                {isLocked ? (
                  <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">
                    JORNADA CERRADA
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    {user && (
                      <button
                        onClick={handleSave}
                        disabled={saving || Object.keys(predictions).length === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-black italic uppercase text-sm tracking-tight text-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: activeColor }}
                      >
                        {saving ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                          </svg>
                        ) : (
                          <Save size={15} />
                        )}
                        Guardar predis
                      </button>
                    )}
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
                  </div>
                )}

                {/* Save feedback toast */}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold tracking-wide">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Predis guardadas correctamente!
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Error al guardar. Inténtalo de nuevo.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Hidden share ticket (single-user) */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && (
          <div ref={shareTicketRef} style={{ width: '450px', backgroundColor: '#0A0A0A', padding: '40px', fontFamily: 'sans-serif', borderRadius: '16px' }}>
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
                  {getCountryLabel(effectiveCountry)} {matchdays[currentDayIndex]?.name}
                </div>
              </div>
            </div>
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
            <div style={{ marginTop: '16px', textAlign: 'center', color: '#334155', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.45em' }}>
              MUERTAZOS.COM
            </div>
          </div>
        )}
      </div>

      {/* Guest Setup Modal */}
      {showGuestModal && (
        <GuestSetupModal
          step={modalStep}
          guestCount={guestCount}
          guestNameInputs={guestNameInputs}
          onCountChange={n => setGuestCount(n)}
          onNameChange={(i, v) => setGuestNameInputs(prev => { const arr = [...prev]; arr[i] = v; return arr })}
          onNext={handleModalNext}
          onBack={() => setModalStep(1)}
          onCreate={handleModalCreate}
          onClose={() => setShowGuestModal(false)}
          activeColor={activeColor}
        />
      )}
    </div>
  )
}

// ── GUEST SETUP MODAL ──────────────────────────────────────────────────────────

function GuestSetupModal({
  step, guestCount, guestNameInputs,
  onCountChange, onNameChange, onNext, onBack, onCreate, onClose, activeColor,
}: {
  step: 1 | 2
  guestCount: number
  guestNameInputs: string[]
  onCountChange: (n: number) => void
  onNameChange: (i: number, v: string) => void
  onNext: () => void
  onBack: () => void
  onCreate: () => void
  onClose: () => void
  activeColor: string
}) {
  const [rawInput, setRawInput] = useState(String(guestCount))

  const commitValue = (raw: string) => {
    const parsed = parseInt(raw, 10)
    const clamped = isNaN(parsed) ? 2 : Math.max(2, Math.min(5, parsed))
    setRawInput(String(clamped))
    onCountChange(clamped)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-base font-black italic uppercase tracking-tight" style={{ color: activeColor }}>
            {step === 1 ? 'Multipredis' : 'Nombres de los invitados'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors ml-4 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <>
            <p className="text-sm text-slate-400 mb-4">¿Cuántos usuarios van a hacer sus picks?</p>
            <input
              type="text"
              inputMode="numeric"
              value={rawInput}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 1)
                setRawInput(cleaned)
                const n = parseInt(cleaned, 10)
                if (!isNaN(n) && n >= 2 && n <= 5) onCountChange(n)
              }}
              onBlur={() => commitValue(rawInput)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-black focus:outline-none focus:border-slate-500"
            />
            <p className="text-xs text-slate-600 text-center mt-2">Mínimo 2, máximo 5</p>
            <button
              onClick={() => { commitValue(rawInput); onNext() }}
              className="w-full mt-5 py-3 rounded-xl font-black italic uppercase text-sm tracking-tight text-black transition-all hover:opacity-90"
              style={{ backgroundColor: activeColor }}
            >
              Siguiente →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-4">Escribe el nombre de cada invitado:</p>
            <div className="space-y-2.5">
              {guestNameInputs.map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500 w-4 text-right shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Invitado ${i + 1}`}
                    value={name}
                    onChange={e => onNameChange(i, e.target.value)}
                    maxLength={20}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-bold placeholder-slate-600 focus:outline-none focus:border-slate-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={onBack}
                className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={onCreate}
                className="flex-1 py-3 rounded-xl font-black italic uppercase text-sm tracking-tight text-black transition-all hover:opacity-90"
                style={{ backgroundColor: activeColor }}
              >
                Crear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── GUEST BOARD ────────────────────────────────────────────────────────────────

function GuestBoard({ guestName, matchday, league, effectiveCountry, predictions, onPredict, activeColor, gradientClass }: {
  guestName: string
  matchday: any
  league: string
  effectiveCountry: string
  predictions: Record<number, number>
  onPredict: (matchId: number, teamId: number) => void
  activeColor: string
  gradientClass: string
}) {
  const isLocked = matchday?.is_locked
  return (
    <div className="bg-slate-900/70 rounded-2xl p-3 sm:p-4 border border-white/5 flex flex-col">
      <div className={`h-0.5 w-full bg-gradient-to-r ${gradientClass} rounded-full mb-3 opacity-60`} />
      <div className="mb-3">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">PREDIS DE</p>
        <h3 className="text-lg font-black italic uppercase tracking-tighter leading-tight truncate" style={{ color: activeColor }}>
          {guestName}
        </h3>
        {isLocked && (
          <span className="text-[9px] text-red-500 font-black uppercase tracking-wider">JORNADA CERRADA</span>
        )}
      </div>
      <div className="space-y-2 flex-1">
        {matchday?.matches?.map((match: any) => {
          const myPick = predictions[match.id]
          const anyPick = myPick !== undefined
          return (
            <div key={match.id} className="flex justify-center items-center gap-2 bg-slate-950/60 py-2 rounded-xl border border-slate-800/50">
              <GuestTeamButton
                team={match.home}
                league={league}
                country={effectiveCountry}
                isSelected={myPick === match.home_team_id}
                anyPickInMatch={anyPick}
                onClick={() => onPredict(match.id, match.home_team_id)}
                disabled={isLocked}
              />
              <span className="text-sm font-black text-white/25 italic">VS</span>
              <GuestTeamButton
                team={match.away}
                league={league}
                country={effectiveCountry}
                isSelected={myPick === match.away_team_id}
                anyPickInMatch={anyPick}
                onClick={() => onPredict(match.id, match.away_team_id)}
                disabled={isLocked}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GuestTeamButton({ team, league, country, isSelected, anyPickInMatch, onClick, disabled }: {
  team: any; league: string; country: string; isSelected: boolean; anyPickInMatch: boolean; onClick: () => void; disabled: boolean
}) {
  const appearanceClass = isSelected
    ? 'scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] grayscale-0 opacity-100 z-10'
    : anyPickInMatch
    ? 'grayscale opacity-25 scale-90'
    : 'grayscale-0 opacity-100 scale-100'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center justify-center transition-all duration-300 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <Image
          src={getTeamLogoPath(league, team.logo_file, team.country ?? country)}
          alt={team.name}
          fill
          className="object-contain"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
        />
      </div>
    </button>
  )
}

// ── SINGLE-USER TEAM BUTTON ────────────────────────────────────────────────────

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
