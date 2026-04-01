/******************************************************************************
ADMIN
*******************************************************************************/
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type TabKey = 'kings' | 'queens' | 'ranking' | 'simulator'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('kings')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') { router.push('/'); return }
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  const tabs: { key: TabKey; label: string; color: string }[] = [
    { key: 'kings',     label: 'KINGS',     color: '#ffd300' },
    { key: 'queens',    label: 'QUEENS',    color: '#01d6c3' },
    { key: 'ranking',   label: 'RANKING',   color: '#ffffff' },
    { key: 'simulator', label: 'SIMULADOR', color: '#FF5733' },
  ]

  const logout = () => { localStorage.removeItem('muertazos_user'); router.push('/') }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">

      {/* HEADER */}
      <header className="w-full h-16 md:h-20 flex items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 md:px-8 sticky top-0 z-50 gap-4">

        {/* LEFT: hamburger (mobile) | tabs (desktop) */}
        <div className="flex items-center flex-1 min-w-0">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-2 shrink-0" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
          <nav className="hidden lg:flex h-full items-center gap-2 xl:gap-6">
            {tabs.slice(0, 2).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ color: tab === t.key ? t.color : '#475569', borderBottom: `4px solid ${tab === t.key ? t.color : 'transparent'}` }}
                className="h-full px-3 xl:px-5 font-black italic tracking-tighter transition-all uppercase text-base xl:text-xl hover:text-white">
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* CENTER: logo */}
        <div className="relative w-28 h-8 md:w-40 md:h-11 shrink-0 hover:scale-105 transition-transform duration-500 cursor-pointer">
          <Image src="/Muertazos.png" alt="Muertazos Logo" fill className="object-contain" priority />
        </div>

        {/* RIGHT: tabs (desktop) + logout */}
        <div className="flex items-center justify-end flex-1 gap-1 xl:gap-4 min-w-0">
          <nav className="hidden lg:flex h-full items-center gap-2 xl:gap-6">
            {tabs.slice(2).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ color: tab === t.key ? t.color : '#475569', borderBottom: `4px solid ${tab === t.key ? t.color : 'transparent'}` }}
                className="h-full px-3 xl:px-5 font-black italic tracking-tighter transition-all uppercase text-base xl:text-xl hover:text-white">
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={logout}
            className="ml-2 bg-red-600/10 text-red-500 border border-red-500/30 px-3 xl:px-5 py-1.5 rounded-md font-black hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase italic tracking-[0.2em] whitespace-nowrap">
            SALIR
          </button>
        </div>
      </header>

      {/* MENÚ LATERAL MÓVIL */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
            <div className="flex items-center justify-center h-16 border-b border-slate-800">
              <div className="relative w-28 h-8">
                <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" />
              </div>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {tabs.map(t => (
                <button key={t.key}
                  onClick={() => { setTab(t.key); setMenuOpen(false) }}
                  style={{ color: tab === t.key ? t.color : undefined }}
                  className={`text-left font-black italic text-xl px-3 py-3 rounded-xl transition-all ${tab === t.key ? 'bg-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto p-4 border-t border-slate-800">
              <button onClick={logout}
                className="w-full text-red-500 border border-red-500/30 px-4 py-2.5 rounded-xl font-black italic text-sm uppercase hover:bg-red-500 hover:text-white transition-all">
                SALIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {tab === 'ranking' ? <RankingView />
          : tab === 'simulator' ? <SimulatorView />
            : <CompetitionAdmin key={tab} competitionKey={tab} />}
      </div>
    </div>
  )
}

/* ─────────────────────────────── COMPETITION ADMIN ─── */
function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [allPreds, setAllPreds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageChunks, setPageChunks] = useState<number[][]>([])

  const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'
  const isPio = (f: string) => f?.toLowerCase().includes('pio')
  const getLogoSize = (f: string) => isPio(f) ? 38 : 54
  const accentColor = competitionKey === 'kings' ? '#FFD300' : '#01d6c3'

  const load = async () => {
    const { data: mData } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', competitionKey)
      .order('display_order')

    const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username').limit(5000)

    if (mData) {
      mData.forEach(day => day.matches?.sort((a: any, b: any) => (a.match_order ?? 99) - (b.match_order ?? 99) || a.id - b.id))
      setMatchdays(mData)
      setActiveMatchdayId(prev => {
        const pub = mData.find(d => d.is_visible)
        if (!prev || !mData.find(d => d.id === prev)) return pub ? pub.id : mData[0]?.id ?? null
        return prev
      })
    }

    const fetchedUsers = uData || []
    setUsers(fetchedUsers)
    if (fetchedUsers.length) {
      const perPage = 12
      setPageChunks(Array.from({ length: Math.ceil(fetchedUsers.length / perPage) }, (_, i) => [i * perPage, (i + 1) * perPage]))
      setCurrentPage(p => Math.min(p, Math.max(0, Math.ceil(fetchedUsers.length / perPage) - 1)))
    }
  }

  useEffect(() => { load() }, [competitionKey])

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!activeMatchdayId || !matchdays.length || !pageChunks.length) return
      const activeDay = matchdays.find(d => d.id === activeMatchdayId)
      if (!activeDay?.matches?.length) { setAllPreds([]); return }
      const visibleUsers = users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1])
      if (!visibleUsers.length) return
      const { data, error } = await supabase
        .from('predictions')
        .select('*, predicted_team:predicted_team_id(logo_file)')
        .in('match_id', activeDay.matches.map((m: any) => m.id))
        .in('user_id', visibleUsers.map(u => u.id))
      if (!error && data) setAllPreds(data)
    }
    fetchPredictions()
  }, [activeMatchdayId, matchdays, currentPage, pageChunks, users])

  const toggleVisible = async (id: number, current: boolean) => {
    if (!id) return
    if (!current) await supabase.from('matchdays').update({ is_visible: false }).eq('competition_key', competitionKey)
    await supabase.from('matchdays').update({ is_visible: !current }).eq('id', id)
    load()
  }

  const toggleLock = async (id: number, val: boolean) => {
    if (!id) return
    await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id)
    load()
  }

  const setWinner = async (matchId: number, teamId: number | null) => {
    await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId)
    load()
  }

  const paginatedUsers = pageChunks.length ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
  const totalPages = pageChunks.length
  const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

  return (
    <div className="w-full flex flex-col items-center">
      {/* Jornadas */}
      <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-6 border-b border-white/5 bg-slate-900/20">
        {matchdays.map(day => (
          <button key={day.id} onClick={() => setActiveMatchdayId(day.id)}
            className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider rounded border transition-all shadow-sm ${
              activeMatchdayId === day.id
                ? `text-black border-[${accentColor}] scale-105`
                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
            }`}
            style={activeMatchdayId === day.id ? { backgroundColor: accentColor, borderColor: accentColor } : {}}>
            {day.name.replace(/Jornada\s*/i, 'J')}
          </button>
        ))}
      </div>

      {activeMatchday && (
        <div className="w-full mb-8">
          {/* Controles de jornada */}
          <div className="w-full px-4 md:px-10 py-4 grid grid-cols-3 items-center bg-slate-900/40 border-b border-white/5">
            <div className="flex justify-start">
              {totalPages > 1 && (
                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                  <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}
                    className={`px-4 py-2 text-xs font-black border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                  <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}
                    className={`px-4 py-2 text-xs font-black ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <h3 style={{ color: accentColor }} className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-center">
                {activeMatchday.name}
              </h3>
            </div>
            <div className="flex justify-end gap-2 md:gap-4">
              <button onClick={() => toggleVisible(activeMatchday.id, activeMatchday.is_visible)}
                className={`px-3 md:px-6 py-1.5 md:py-2 text-[10px] md:text-xs font-black rounded-full border ${activeMatchday.is_visible ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {activeMatchday.is_visible ? 'PÚBLICO' : 'OCULTO'}
              </button>
              <button onClick={() => toggleLock(activeMatchday.id, activeMatchday.is_locked)}
                className={`px-3 md:px-6 py-1.5 md:py-2 text-[10px] md:text-xs font-black rounded-full border ${activeMatchday.is_locked ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'}`}>
                {activeMatchday.is_locked ? 'BLOQUEADO' : 'ABIERTO'}
              </button>
            </div>
          </div>

          {/* Tabla de predicciones */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-center">
              <thead>
                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                  <th className="w-[160px] md:w-[180px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                  {paginatedUsers.map(u => (
                    <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-lg">
                          {u.username.charAt(0).toUpperCase()}
                          <Image src={`/usuarios/${u.username}.jpg`} alt={u.username} fill sizes="48px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <span className="text-[9px] md:text-[10px] leading-tight truncate w-full px-1">{u.username}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMatchday.matches?.map((m: any) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-1 px-2 border-r border-white/5 bg-slate-900/30">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <button onClick={() => setWinner(m.id, m.winner_team_id == m.home_team_id ? null : m.home_team_id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id == m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                          {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />}
                        </button>
                        <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                        <button onClick={() => setWinner(m.id, m.winner_team_id == m.away_team_id ? null : m.away_team_id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id == m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                          {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />}
                        </button>
                      </div>
                    </td>
                    {paginatedUsers.map(u => {
                      const pred = allPreds.find(p => p.user_id == u.id && p.match_id == m.id)
                      const isHit = m.winner_team_id && pred?.predicted_team_id == m.winner_team_id
                      const logoFile = Array.isArray(pred?.predicted_team) ? pred?.predicted_team[0]?.logo_file : pred?.predicted_team?.logo_file
                      return (
                        <td key={u.id} className="p-1 border-r border-white/5">
                          {logoFile ? (
                            <div className="flex justify-center">
                              <Image src={`/logos/${folder}/${logoFile}`} width={getLogoSize(logoFile)} height={getLogoSize(logoFile)} alt="p"
                                className={`transition-all duration-500 ${m.winner_team_id ? (isHit ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,211,0,0.4)] scale-110' : 'opacity-15 grayscale scale-90') : 'opacity-100'}`} />
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

/* ─────────────────────────────────── RANKING ─── */
function RankingView() {
  const [rankingData, setRankingData] = useState<{ users: any[]; days: any[] }>({ users: [], days: [] })
  const [showFull, setShowFull] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true)
      const { data: lockedDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('display_order')
      if (!lockedDays?.length) { setRankingData({ users: [], days: [] }); setLoading(false); return }
      const [{ data: appUsers }, { data: pointsData }] = await Promise.all([
        supabase.from('app_users').select('id, username').neq('role', 'admin'),
        supabase.from('user_points').select('user_id, matchday_id, points').in('matchday_id', lockedDays.map(d => d.id)),
      ])
      if (!appUsers) { setLoading(false); return }
      const userScores = appUsers.map(u => {
        let total = 0; const dayBreakdown: Record<number, number> = {}
        pointsData?.filter(p => p.user_id === u.id).forEach(p => { dayBreakdown[p.matchday_id] = p.points; total += p.points })
        return { username: u.username, total, dayBreakdown }
      }).sort((a, b) => b.total - a.total || a.username.localeCompare(b.username))
      setRankingData({ users: userScores, days: lockedDays })
      setLoading(false)
    }
    fetchRanking()
  }, [])

  if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla optimizada...</div>

  const allUsers = rankingData.users
  const pageChunks = Array.from({ length: Math.ceil(allUsers.length / 15) || 1 }, (_, i) => [i * 15, Math.min((i + 1) * 15, allUsers.length)])
  const totalPages = pageChunks.length
  const safePage = Math.min(currentPage, totalPages - 1)
  const chunk = pageChunks[safePage] || [0, 0]
  const paginatedUsers = allUsers.slice(chunk[0], chunk[1])

  return (
    <div className="w-full flex flex-col items-center py-2 px-4 md:px-6">
      <div className="w-full flex items-center justify-between mb-4 px-2 md:px-8 gap-4">
        <div className="flex-1 flex justify-start">
          <button onClick={() => setShowFull(!showFull)}
            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500 ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}>
            {showFull ? '← VOLVER' : 'DESGLOSE'}
          </button>
        </div>
        <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-center px-2 shrink-0">
          <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
        </h2>
        <div className="flex-1 flex justify-end">
          {totalPages > 1 && (
            <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
              <button disabled={safePage === 0} onClick={() => setCurrentPage(p => p - 1)} className={`px-5 py-2 text-xs font-black border-r border-white/10 ${safePage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
              <button disabled={safePage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className={`px-5 py-2 text-xs font-black ${safePage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
            </div>
          )}
        </div>
      </div>

      <div className="w-fit mx-auto">
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
          <table className="border-collapse table-auto">
            <tbody>
              {paginatedUsers.map((user, idx) => {
                const globalPos = chunk[0] + idx + 1
                const isFirst = globalPos === 1
                return (
                  <tr key={user.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''}`}>
                    <td className="w-10 px-2 py-1 text-center border-r border-white/5 font-black italic text-[10px]">
                      {isFirst ? <span className="text-lg drop-shadow-[0_0_8px_rgba(255,211,0,0.6)]">👑</span> : <span className="text-slate-600 group-hover:text-slate-400">{globalPos}</span>}
                    </td>
                    <td className="w-[130px] px-2 py-1 border-r border-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 shadow-md flex items-center justify-center bg-slate-800 font-bold text-[10px] ${isFirst ? 'border-[#FFD300]' : 'border-white/10 text-slate-400'}`}>
                          {user.username.charAt(0).toUpperCase()}
                          <img src={`/usuarios/${user.username}.jpg`} alt={user.username} className="absolute inset-0 object-cover w-full h-full z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <span className={`uppercase text-[10px] tracking-[0.1em] truncate block w-full font-black ${isFirst ? 'text-[#FFD300]' : 'text-slate-300 group-hover:text-white'}`}>
                          {user.username}
                        </span>
                      </div>
                    </td>
                    {showFull && rankingData.days.map(day => (
                      <td key={day.id} className={`px-1 py-1 text-center border-l border-white/5 text-[10px] font-mono w-8 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                        <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                      </td>
                    ))}
                    <td className={`w-16 px-2 py-1 text-center border-l border-white/10 font-black text-base italic ${isFirst ? 'bg-[#FFD300] text-black' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
                      {user.total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── SIMULATOR (diseño usuario + admin controls) ─── */
function SimulatorView() {
  const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings')
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [scores, setScores] = useState<Record<number, { hg: string; ag: string; penaltyWinnerId: number | null }>>({})

  const folder = compKey === 'kings' ? 'Kings' : 'Queens'
  const isPio = (f: string) => f?.toLowerCase().includes('pio')
  const getLogoSize = (f: string) => isPio(f) ? 54 : 72
  const getRowColor = (idx: number) => idx === 0 ? 'bg-yellow-500' : idx <= 5 ? 'bg-blue-500' : idx <= 9 ? 'bg-red-500' : 'bg-transparent'

  useEffect(() => {
    const load = async () => {
      const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey)
      if (tData) setTeams(tData)
      const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', compKey).order('display_order')
      const { data: rData } = await supabase.from('match_results').select('*')
      if (mData) {
        const loadedScores: any = {}
        rData?.forEach((res: any) => {
          let pWinner = null
          if (res.home_goals === res.away_goals) {
            const match = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)
            if (res.home_penalties > res.away_penalties) pWinner = match?.home_team_id
            if (res.away_penalties > res.home_penalties) pWinner = match?.away_team_id
          }
          loadedScores[res.match_id] = { hg: res.home_goals != null ? String(res.home_goals) : '', ag: res.away_goals != null ? String(res.away_goals) : '', penaltyWinnerId: pWinner }
        })
        setScores(loadedScores); setMatchdays(mData)
        if (!activeMatchdayId && mData.length) setActiveMatchdayId(mData[0].id)
      }
    }
    load()
  }, [compKey])

  const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

  const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    setScores(prev => {
      const cur = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }
      const nh = field === 'hg' ? value : cur.hg, na = field === 'ag' ? value : cur.ag
      return { ...prev, [matchId]: { ...cur, [field]: value, penaltyWinnerId: nh === na ? cur.penaltyWinnerId : null } }
    })
  }

  const togglePenaltyWinner = (matchId: number, teamId: number) => {
    setScores(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId } }))
  }

  const saveActiveMatchday = async () => {
    if (!activeMatchday) return
    const toUpsert = activeMatchday.matches
      .filter((m: any) => scores[m.id]?.hg !== '' && scores[m.id]?.ag !== '')
      .map((m: any) => {
        const s = scores[m.id]; const isTie = s.hg === s.ag
        return {
          match_id: m.id, home_goals: parseInt(s.hg), away_goals: parseInt(s.ag),
          home_penalties: isTie ? (s.penaltyWinnerId === m.home_team_id ? 1 : 0) : null,
          away_penalties: isTie ? (s.penaltyWinnerId === m.away_team_id ? 1 : 0) : null,
        }
      })
    if (!toUpsert.length) return alert('No hay marcadores para guardar.')
    if (toUpsert.some((r: any) => r.home_goals === r.away_goals && r.home_penalties === 0 && r.away_penalties === 0))
      return alert('Selecciona al ganador de los penales haciendo clic en su escudo.')
    const { error } = await supabase.from('match_results').upsert(toUpsert, { onConflict: 'match_id' })
    if (error) alert('Error: ' + error.message)
    else alert(`Jornada ${activeMatchday.name} guardada.`)
  }

  const deleteActiveMatchday = async () => {
    if (!activeMatchday || !confirm('¿Borrar resultados?')) return
    const matchIds = activeMatchday.matches.map((m: any) => m.id)
    const { error } = await supabase.from('match_results').delete().in('match_id', matchIds)
    if (!error) {
      const ns = { ...scores }; matchIds.forEach((id: number) => delete ns[id]); setScores(ns)
    }
  }

  const standings = teams.map(team => {
    let w = 0, l = 0, gf = 0, gc = 0
    matchdays.forEach(md => md.matches?.forEach((m: any) => {
      const s = scores[m.id]; if (!s || s.hg === '' || s.ag === '') return
      const hG = parseInt(s.hg), aG = parseInt(s.ag)
      if (m.home_team_id === team.id) { gf += hG; gc += aG; (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) ? w++ : l++ }
      else if (m.away_team_id === team.id) { gf += aG; gc += hG; (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) ? w++ : l++ }
    }))
    return { ...team, w, l, gf, gc, dg: gf - gc }
  }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf)

  return (
    <div className="w-full flex flex-col items-center">
      {/* TOP BAR UNIFICADA (estilo usuario) */}
      <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-6 border-b border-white/5">
        <div className="flex gap-2 border-r border-white/10 pr-4">
          <button onClick={() => setCompKey('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Kings</button>
          <button onClick={() => setCompKey('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Queens</button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {matchdays.map(day => {
            const label = day.name.toUpperCase().replace('JORNADA', 'J').replace(/\s+/g, '')
            return (
              <button key={day.id} onClick={() => setActiveMatchdayId(day.id)}
                className={`px-2 py-1.5 text-[11px] font-black italic uppercase border-b-2 transition-colors ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'border-[#FFD300] text-[#FFD300]' : 'border-[#01d6c3] text-[#01d6c3]') : 'border-transparent text-slate-400 hover:text-white'}`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Título + botones admin */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">{activeMatchday?.name}</h3>
          <div className="flex gap-2">
            <button onClick={saveActiveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2 rounded-lg text-[11px] font-black uppercase italic transition-colors">Guardar</button>
            <button onClick={deleteActiveMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-lg text-[11px] font-black uppercase italic transition-colors">Borrar</button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Partidos */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMatchday?.matches?.map((m: any) => {
              const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null }
              const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag
              return (
                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-4">
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex flex-col items-center flex-1">
                      {m.home && <button onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                        <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />
                      </button>}
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="text" value={s.hg} onChange={e => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-11 h-11 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                      <span className="text-xs font-black text-slate-600 italic">VS</span>
                      <input type="text" value={s.ag} onChange={e => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-11 h-11 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      {m.away && <button onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                        <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />
                      </button>}
                    </div>
                  </div>
                  {isTie && <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>}
                </div>
              )
            })}
          </div>

          {/* Tabla de posiciones */}
          <div className="w-full xl:w-[460px]">
            <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                    <th className="py-3 w-8">#</th><th className="py-3 text-left pl-2">Equipo</th>
                    <th className="py-3 w-8">V</th><th className="py-3 w-8">D</th>
                    <th className="py-3 w-8">GF</th><th className="py-3 w-8">GC</th>
                    <th className="py-3 w-10 bg-white/5">DG</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, idx) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="relative py-2.5 font-black text-xs"><div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>{idx + 1}</td>
                      <td className="py-2.5 pl-2 text-left"><div className="flex items-center gap-2"><Image src={`/logos/${folder}/${t.logo_file}`} width={22} height={22} alt={t.name} /><span className="text-[10px] font-bold uppercase truncate max-w-[110px]">{t.name}</span></div></td>
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
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div><span>1º Semifinal</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div><span>2º–6º Cuartos</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div><span>7º–10º Play In</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
