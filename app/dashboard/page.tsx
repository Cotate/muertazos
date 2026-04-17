'use client'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import SimulatorView from '@/components/SimulatorView'
import RankingView from '@/components/RankingView'
import PizarraView from '@/components/PizarraView'
import { Country, COUNTRIES, getCompFolder, getLogoSize, getTeamLogoPath, sortMatchesByOrder } from '@/lib/utils'

export default function UserDashboard() {
  return <Suspense><UserDashboardInner /></Suspense>
}

function UserDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  const [country, setCountry] = useState<Country>('spain')
  const [view, setView] = useState<'picks' | 'ranking' | 'simulator' | 'pizarra' | 'all-picks' | 'settings'>('picks')

  const [matchdays, setMatchdays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [predictions, setPredictions] = useState<Record<number, number>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [hasSavedInDB, setHasSavedInDB] = useState(false)

  const shareTicketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('muertazos_user')
    const tab = searchParams.get('tab')
    const PUBLIC_TABS = new Set(['ranking', 'pizarra', 'simulator'])
    if (!storedUser && !PUBLIC_TABS.has(tab || '')) { router.push('/'); return }
    if (storedUser) setUser(JSON.parse(storedUser))
    document.body.style.backgroundColor = '#0a0a0a'
    if (tab === 'kings')     { setLeague('kings');  setView('picks') }
    if (tab === 'queens')    { setLeague('queens'); setView('picks') }
    if (tab === 'ranking')   setView('ranking')
    if (tab === 'picks')     setView('all-picks')
    if (tab === 'pizarra')   setView('pizarra')
    if (tab === 'simulator') setView('simulator')
    if (tab === 'settings')  setView('settings')
    return () => { document.body.style.backgroundColor = '' }
  }, [router, searchParams])

  const loadData = useCallback(async () => {
    if (!user) return
    if (league === 'kings' && country !== 'spain') { setMatchdays([]); return }
    const effectiveCountry = league === 'queens' ? 'spain' : country

    const { data: mDays } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', league)
      .eq('country', effectiveCountry)
      .eq('is_visible', true)
      .order('display_order')

    if (mDays) {
      const sortedDays = mDays.map(day => ({
        ...day,
        matches: sortMatchesByOrder(day.matches || []),
      }))

      setMatchdays(sortedDays)
      const { data: preds } = await supabase.from('predictions').select('*').eq('user_id', user.id)
      const predMap: Record<number, number> = {}
      preds?.forEach((p: any) => { predMap[p.match_id] = p.predicted_team_id })
      setPredictions(predMap)
      const firstDayMatchIds = sortedDays[0]?.matches.map((m: any) => m.id) || []
      setHasSavedInDB(!!preds?.some((p: any) => firstDayMatchIds.includes(p.match_id)))
    }
  }, [user, league, country])

  useEffect(() => {
    if (!user) return
    setCurrentDayIndex(0)
    setIsEditing(false)
    loadData()
  }, [loadData])

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
      const { captureAndDownload } = await import('@/lib/captureTicket')
      await captureAndDownload(
        shareTicketRef.current,
        `picks-${user?.username || 'muertazos'}.webp`
      )
    } catch (err) {
      console.error('[Picks] Share failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const isPublicView = view === 'ranking' || view === 'pizarra' || view === 'simulator' || view === 'settings'
  if (!user && !isPublicView) return null

  const activeColor = league === 'kings' ? '#ffd300' : '#01d6c3'
  const btnColor = league === 'kings' ? 'bg-[#ffd300]' : 'bg-[#01d6c3]'

  const countryGlow: React.CSSProperties | undefined = league === 'queens' ? {
    boxShadow: '0 0 0 1px rgba(1,214,195,0.55), 0 0 18px rgba(1,214,195,0.28), 0 0 55px rgba(1,214,195,0.12)',
  } : league === 'kings' ? {
    boxShadow:
      country === 'spain'
        ? '0 0 0 1px rgba(198,11,30,0.55), 0 0 18px rgba(198,11,30,0.28), 0 0 55px rgba(255,196,0,0.12)'
        : country === 'brazil'
        ? '0 0 0 1px rgba(0,156,59,0.55), 0 0 18px rgba(0,156,59,0.28), 0 0 55px rgba(255,223,0,0.12)'
        : '0 0 0 1px rgba(0,104,71,0.55), 0 0 18px rgba(0,104,71,0.28), 0 0 55px rgba(206,17,38,0.12)',
  } : undefined

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  const showCountrySelector = view === 'picks' && league === 'kings'
  const folder = getCompFolder(league)

  const getPicksBorderGradient = () => {
    if (league === 'queens') return 'from-[#01d6c3] via-[#01d6c3]/50 to-[#01d6c3]'
    if (country === 'mexico') return 'from-[#006847] via-white to-[#ce1126]'
    if (country === 'brazil') return 'from-[#009c3b] via-[#ffdf00] to-[#009c3b]'
    return 'from-[#c60b1e] via-[#ffd300] to-[#c60b1e]'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      <AppHeader
        onLogout={user ? handleLogout : undefined}
        userAvatar={user ? (user.avatar_url || `/usuarios/${user.username}.webp`) : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />

      <main className={`mx-auto pt-6 pb-2 ${view === 'all-picks' || view === 'pizarra' ? 'w-full' : 'max-w-5xl px-4'}`}>

        {showCountrySelector && (
          <div className="flex gap-2 mb-5 max-w-2xl mx-auto overflow-x-auto pb-1">
            {COUNTRIES.map(({ key, flag, name }) => {
              const isSoon = key !== 'spain'
              const isActive = country === key
              return (
                <button
                  key={key}
                  onClick={() => setCountry(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black italic uppercase tracking-tight whitespace-nowrap transition-all
                    ${isActive
                      ? 'border-current'
                      : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                  style={isActive ? { borderColor: activeColor, color: activeColor, backgroundColor: activeColor + '18' } : {}}
                >
                  <span>{flag}</span>
                  <span>{name}</span>
                  {isSoon && <span className="text-[8px] font-black not-italic tracking-widest text-slate-600 ml-0.5">PRÓX.</span>}
                </button>
              )
            })}
          </div>
        )}

        {view === 'picks' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/70 rounded-3xl p-4 sm:p-6 border border-white/5 transition-shadow duration-500" style={countryGlow}>
              <div className={`h-0.5 w-full bg-gradient-to-r ${getPicksBorderGradient()} rounded-full mb-4 opacity-60`} />
              {matchdays.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  {league === 'queens' ? (
                    <>
                      <p className="text-4xl mb-4">👑</p>
                      <p className="font-black italic tracking-widest" style={{ color: '#01d6c3' }}>PRÓXIMAMENTE</p>
                      <p className="text-slate-700 text-xs mt-2">Queens aún no está disponible</p>
                    </>
                  ) : country !== 'spain' ? (
                    <>
                      <p className="text-4xl mb-4">🌎</p>
                      <p className="text-slate-600 font-black italic tracking-widest">PRÓXIMAMENTE</p>
                      <p className="text-slate-700 text-xs mt-2">
                        {country === 'mexico' ? 'Kings México' : 'Kings Brasil'} aún no está disponible
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-600 font-black italic tracking-widest animate-pulse">PROXIMAMENTE...</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-3 px-1 py-2">
                    <button
                      disabled={currentDayIndex === 0}
                      onClick={() => { setCurrentDayIndex(i => i - 1); setIsEditing(false) }}
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
                      onClick={() => { setCurrentDayIndex(i => i + 1); setIsEditing(false) }}
                      style={{ color: activeColor, borderColor: activeColor + '40' }}
                      className="w-12 h-10 flex items-center justify-center border rounded-xl disabled:opacity-5 font-black text-xl hover:bg-white/5 transition-colors"
                    >→</button>
                  </div>

                  <div className="space-y-4">
                    {matchdays[currentDayIndex].matches.map((match: any) => {
                      const isLocked = matchdays[currentDayIndex].is_locked
                      const myPick = predictions[match.id]
                      const anyPick = myPick !== undefined
                      return (
                        <div key={match.id} className="flex justify-between items-center bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                          <TeamButton team={match.home} league={league} country={country} isSelected={myPick === match.home_team_id} anyPickInMatch={anyPick} onClick={() => handlePredict(match.id, match.home_team_id)} disabled={(hasSavedInDB && !isEditing) || isLocked} />
                          <span className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter mx-2 sm:mx-4">VS</span>
                          <TeamButton team={match.away} league={league} country={country} isSelected={myPick === match.away_team_id} anyPickInMatch={anyPick} onClick={() => handlePredict(match.id, match.away_team_id)} disabled={(hasSavedInDB && !isEditing) || isLocked} />
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 flex justify-center">
                    {matchdays[currentDayIndex]?.is_locked ? (
                      <div className="bg-red-950/20 border border-red-900/50 text-red-500 px-10 py-4 rounded-2xl font-black italic tracking-widest text-sm">JORNADA CERRADA</div>
                    ) : hasSavedInDB && !isEditing ? (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setIsEditing(true)} className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black italic uppercase text-sm">Editar predicción</button>
                        <button
                          onClick={handleSharePicks}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black italic uppercase text-xs tracking-tight transition-all disabled:opacity-50"
                          style={{ backgroundColor: activeColor + '1a', borderColor: activeColor + '66', color: activeColor }}
                        >
                          {isGenerating ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          )}
                          Compartir
                        </button>
                      </div>
                    ) : (
                      <button onClick={savePredictions} className={`${btnColor} text-slate-950 px-12 py-4 rounded-2xl font-black italic uppercase text-sm`}>Confirmar Jornada</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : view === 'ranking' ? (
          <RankingView currentUser={user?.username} />
        ) : view === 'all-picks' ? (
          <CompetitionReadOnly competitionKey={league} country={country} />
        ) : view === 'simulator' ? (
          <SimulatorView />
        ) : view === 'settings' ? (
          <SettingsView user={user} />
        ) : (
          <PizarraView />
        )}
      </main>

      <div className="absolute top-[-9999px] left-[-9999px]">
        {matchdays.length > 0 && user && (
          <div ref={shareTicketRef} className="w-[450px] bg-[#0a0a0a] p-10 font-sans" style={{ borderRadius: '16px' }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <img src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Logo" loading="eager" style={{ width: '144px', height: '40px', objectFit: 'contain' }} />
              </div>
              <div className="text-right">
                <div className="text-white font-bold uppercase text-[10px] tracking-widest opacity-60">{user.username}</div>
                <div style={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.3em' }}>PICKS</div>
                <div style={{ color: activeColor }} className="font-black italic text-xl uppercase tracking-tighter leading-none">
                  {league === 'kings' ? 'Kings' : 'Queens'} {matchdays[currentDayIndex]?.name}
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchdays[currentDayIndex]?.matches.map((match: any) => {
                const pickId = predictions[match.id]
                return (
                  <div key={match.id} className="flex items-center justify-center gap-8 bg-[#0f172a] p-4 border border-[#ffffff05] rounded-2xl">
                    <div className={`relative w-24 h-24 flex items-center justify-center ${pickId === match.home_team_id ? 'opacity-100 scale-110' : 'opacity-20 grayscale scale-90'}`}>
                      <img src={getTeamLogoPath(league, match.home.logo_file, 'spain')} alt="" loading="eager" className="w-[90%] h-[90%] object-contain relative z-10" />
                    </div>
                    <div className="text-2xl font-black italic text-white">VS</div>
                    <div className={`relative w-24 h-24 flex items-center justify-center ${pickId === match.away_team_id ? 'opacity-100 scale-110' : 'opacity-20 grayscale scale-90'}`}>
                      <img src={getTeamLogoPath(league, match.away.logo_file, 'spain')} alt="" loading="eager" className="w-[90%] h-[90%] object-contain relative z-10" />
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
    </div>
  )
}

function TeamButton({ team, league, country = 'spain', isSelected, anyPickInMatch, onClick, disabled }: any) {
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
        <Image src={getTeamLogoPath(league, team.logo_file, country)} alt={team.name} fill className="object-contain" />
      </div>
    </button>
  )
}

function CompetitionReadOnly({ competitionKey, country = 'spain' }: { competitionKey: string; country?: string }) {
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [allPreds, setAllPreds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageChunks, setPageChunks] = useState<number[][]>([])

  const logoSize = (filename: string) => getLogoSize(filename)

  const load = async () => {
    const { data: mData } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', competitionKey)
      .eq('country', country)
      .eq('is_visible', false)
      .eq('is_locked', true)
      .order('display_order')

    let { data: uData, error: uErr } = await supabase
      .from('app_users')
      .select('id, username, favorite_team:favorite_team_id(logo_file, competition_key, country)')
      .neq('role', 'admin')
      .order('username')

    if (uErr) {
      const { data: fallback } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
      uData = fallback
    }

    if (mData && mData.length > 0) {
      mData.forEach(day => {
        if (day.matches) day.matches.sort((a: any, b: any) => (a.match_order ?? 99) - (b.match_order ?? 99))
      })
      setMatchdays(mData)
      setActiveMatchdayId(mData[0].id)
    } else {
      setMatchdays([])
    }

    const fetchedUsers = uData || []
    setUsers(fetchedUsers)

    if (fetchedUsers.length > 0) {
      const perPage = 10
      const pages = Math.ceil(fetchedUsers.length / perPage)
      setPageChunks(Array.from({ length: pages }, (_, i) => [i * perPage, (i + 1) * perPage]))
    }
  }

  useEffect(() => { load() }, [competitionKey])

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!activeMatchdayId || matchdays.length === 0) return
      const activeDay = matchdays.find(d => d.id === activeMatchdayId)
      if (!activeDay?.matches?.length) { setAllPreds([]); return }

      const matchIds = activeDay.matches.map((m: any) => m.id)
      const { data: pData, error } = await supabase
        .from('predictions')
        .select('*, predicted_team:predicted_team_id(logo_file)')
        .in('match_id', matchIds)

      if (!error && pData) setAllPreds(pData)
    }
    fetchPredictions()
  }, [activeMatchdayId, matchdays])

  const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
  const totalPages = pageChunks.length
  const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

  if (matchdays.length === 0) return (
    <div className="w-full text-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
      <p className="text-slate-600 font-black italic text-2xl uppercase tracking-widest">No hay jornadas cerradas para mostrar</p>
    </div>
  )

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-4 md:px-6 border-b border-white/5 bg-slate-900/20">
        {matchdays.map(day => (
          <button
            key={day.id}
            onClick={() => { setActiveMatchdayId(day.id); setCurrentPage(0) }}
            className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider transition-all rounded border shadow-sm
              ${activeMatchdayId === day.id
                ? competitionKey === 'kings'
                  ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105'
                  : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105'
                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
          >
            {day.name.replace(/Jornada\s*/i, 'J')}
          </button>
        ))}
      </div>

      {activeMatchday && (
        <div className="relative group w-full mb-8">
          <div className="w-full px-4 md:px-10 py-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-slate-900/40 border-b border-white/5">
            <div className="flex justify-center sm:justify-start">
              {totalPages > 1 && (
                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                  <button disabled={currentPage === 0} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }} className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                  <span className="px-4 py-2 text-xs font-black text-slate-400 tabular-nums select-none border-r border-white/10">{currentPage + 1} / {totalPages}</span>
                  <button disabled={currentPage === totalPages - 1} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }} className={`px-5 py-2 text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <h3
                style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }}
                className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter"
              >
                {activeMatchday.name}
              </h3>
            </div>
            <div />
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-center">
              <thead>
                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                  <th className="w-[160px] md:w-[180px] p-2 border-r border-white/5 align-middle text-sm text-white">PARTIDO</th>
                  {paginatedUsers.map(u => {
                    const favTeam = u.favorite_team
                      ? (Array.isArray(u.favorite_team) ? u.favorite_team[0] : u.favorite_team)
                      : null
                    return (
                    <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle min-w-[72px]">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-lg">
                          {u.username.charAt(0).toUpperCase()}
                          <Image src={`/usuarios/${u.username}.webp`} alt={u.username} fill sizes="48px" className="object-cover z-10" onError={e => (e.currentTarget.style.display = 'none')} />
                        </div>
                        <div className="flex items-center justify-center gap-1 w-full px-1">
                          <span className="text-[12px] leading-tight truncate min-w-0">{u.username}</span>
                          {favTeam && (
                            <img
                              src={getTeamLogoPath(favTeam.competition_key, favTeam.logo_file, favTeam.country)}
                              alt=""
                              className="w-8 h-8 object-contain shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </th>
                  )})}
                </tr>
              </thead>
              <tbody>
                {activeMatchday.matches?.map((m: any) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-1 px-2 border-r border-white/5 bg-slate-900/30">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                          {m.home && <Image src={getTeamLogoPath(competitionKey, m.home.logo_file, country)} width={logoSize(m.home.logo_file)} height={logoSize(m.home.logo_file)} alt="h" />}
                        </div>
                        <span className="text-[9px] font-black text-white italic">VS</span>
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                          {m.away && <Image src={getTeamLogoPath(competitionKey, m.away.logo_file, country)} width={logoSize(m.away.logo_file)} height={logoSize(m.away.logo_file)} alt="a" />}
                        </div>
                      </div>
                    </td>
                    {paginatedUsers.map(u => {
                      const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                      const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                      const hasWinner = m.winner_team_id !== null
                      return (
                        <td key={u.id} className="p-1 border-r border-white/5">
                          {pred?.predicted_team?.logo_file ? (
                            <div className="flex justify-center">
                              <Image
                                src={getTeamLogoPath(competitionKey, pred.predicted_team.logo_file, country)}
                                width={logoSize(pred.predicted_team.logo_file)}
                                height={logoSize(pred.predicted_team.logo_file)}
                                alt="p"
                                className={`transition-all duration-500 ${hasWinner ? (isHit ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,211,0,0.4)] scale-110' : 'opacity-15 grayscale scale-90') : 'opacity-100'}`}
                              />
                            </div>
                          ) : <span className="text-slate-800 text-xs">-</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ user }: { user: any }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus]               = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [pwLoading, setPwLoading]             = useState(false)

  const [showCurrentPw, setShowCurrentPw]     = useState(false)
  const [showNewPw, setShowNewPw]             = useState(false)
  const [showConfirmPw, setShowConfirmPw]     = useState(false)

  // ── Favorite team state ────────────────────────────────────
  const [allTeams, setAllTeams]       = useState<any[]>([])
  const [favTeamId, setFavTeamId]     = useState<number | null>(null)
  const [favComp, setFavComp]         = useState<'kings' | 'queens'>('kings')
  const [favCountry, setFavCountry]   = useState<'spain' | 'brazil' | 'mexico'>('spain')
  const [favSaved, setFavSaved]       = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('teams').select('id, name, logo_file, competition_key, country')
      .then(({ data }) => { if (data) setAllTeams(data) })
    supabase.from('app_users').select('favorite_team_id').eq('id', user.id).single()
      .then(({ data }) => { if (data?.favorite_team_id) setFavTeamId(data.favorite_team_id) })
  }, [user?.id])

  const saveFavTeam = async (teamId: number) => {
    setFavTeamId(teamId)
    await supabase.from('app_users').update({ favorite_team_id: teamId }).eq('id', user.id)
    setFavSaved(true)
    setTimeout(() => setFavSaved(false), 2500)
  }

  const visibleTeams = allTeams.filter(t =>
    t.competition_key === favComp && (favComp === 'queens' || t.country === favCountry)
  )
  const selectedTeam = allTeams.find(t => t.id === favTeamId)
  // ── end favorite team state ────────────────────────────────

  if (!user) return (
    <div className="max-w-lg mx-auto py-24 text-center">
      <p className="text-slate-600 font-black italic uppercase tracking-widest">Inicia sesión para ver ajustes</p>
    </div>
  )

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwStatus(null)
    if (!newPassword || !currentPassword) { setPwStatus({ type: 'error', msg: 'Rellena todos los campos' }); return }
    if (newPassword !== confirmPassword) { setPwStatus({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' }); return }
    if (newPassword.length < 4) { setPwStatus({ type: 'error', msg: 'La contraseña debe tener al menos 4 caracteres' }); return }
    setPwLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('password')
        .eq('id', user.id)
        .single()
      if (error || !data) { setPwStatus({ type: 'error', msg: 'Error al verificar contraseña' }); return }
      if (data.password !== currentPassword) { setPwStatus({ type: 'error', msg: 'Contraseña actual incorrecta' }); return }
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ password: newPassword })
        .eq('id', user.id)
      if (updateError) { setPwStatus({ type: 'error', msg: updateError.message }); return }
      setPwStatus({ type: 'success', msg: 'Contraseña actualizada correctamente' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 flex flex-col gap-8">
      <div>
        <h1 className="font-black italic text-2xl uppercase tracking-tighter">
          Ajustes <span className="text-[#FFD300]">de cuenta</span>
        </h1>
      </div>

      {/* Favorite team picker */}
      <section className="bg-slate-900/70 rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black italic uppercase text-base tracking-tight text-slate-300">
            Equipo favorito
          </h2>
          {selectedTeam && (
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300 ${favSaved ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
              <img
                src={getTeamLogoPath(selectedTeam.competition_key, selectedTeam.logo_file, selectedTeam.country)}
                alt={selectedTeam.name}
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className={`text-xs font-black uppercase tracking-wide ${favSaved ? 'text-emerald-400' : 'text-slate-300'}`}>
                {favSaved ? '✓ Guardado' : selectedTeam.name}
              </span>
            </div>
          )}
        </div>

        {/* Competition / country tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['kings', 'queens'] as const).map(c => (
            <button key={c} onClick={() => { setFavComp(c); setFavCountry('spain') }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black italic uppercase border transition-all ${
                favComp === c ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white hover:border-slate-500'
              }`}>
              {c}
            </button>
          ))}
          {favComp === 'kings' && (['spain', 'brazil', 'mexico'] as const).map(cn => (
            <button key={cn} onClick={() => setFavCountry(cn)}
              className={`px-2.5 py-1.5 rounded-full text-sm border transition-all ${
                favCountry === cn ? 'bg-white/20 border-white/30' : 'border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700'
              }`}>
              {cn === 'spain' ? '🇪🇸' : cn === 'brazil' ? '🇧🇷' : '🇲🇽'}
            </button>
          ))}
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
          {visibleTeams.map(team => {
            const isActive = favTeamId === team.id
            return (
              <button
                key={team.id}
                onClick={() => saveFavTeam(team.id)}
                title={team.name}
                className={`flex items-center justify-center p-2 rounded-xl border transition-all ${
                  isActive
                    ? 'border-[#FFD300]/70 bg-[#FFD300]/10 scale-105'
                    : 'border-transparent hover:border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="w-9 h-9 flex items-center justify-center">
                  <img
                    src={getTeamLogoPath(team.competition_key, team.logo_file, team.country)}
                    alt={team.name}
                    className="w-full h-full object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15' }}
                  />
                </div>
              </button>
            )
          })}
          {visibleTeams.length === 0 && (
            <p className="col-span-full text-slate-700 text-xs italic py-4 text-center">Sin equipos disponibles</p>
          )}
        </div>
      </section>

      {/* Password change */}
      <section className="bg-slate-900/70 rounded-2xl border border-white/5 p-6">
        <h2 className="font-black italic uppercase text-base tracking-tight text-slate-300 mb-5">
          Cambiar contraseña
        </h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          {([
            { label: 'Contraseña actual', value: currentPassword, setter: setCurrentPassword, show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
            { label: 'Nueva contraseña', value: newPassword, setter: setNewPassword, show: showNewPw, toggle: () => setShowNewPw(v => !v) },
            { label: 'Confirmar nueva contraseña', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPw, toggle: () => setShowConfirmPw(v => !v) },
          ] as const).map(({ label, value, setter, show, toggle }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm font-bold text-white placeholder-slate-700 focus:border-[#FFD300]/60 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwStatus && (
            <p className={`text-xs font-bold ${pwStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {pwStatus.msg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            className="mt-1 w-full h-12 bg-[#FFD300] text-black font-black italic uppercase tracking-tight rounded-xl hover:bg-white transition-colors disabled:opacity-50 text-sm"
          >
            {pwLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
