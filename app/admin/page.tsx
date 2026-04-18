'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Globe, GlobeLock, Lock, Unlock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import SimulatorView from '@/components/SimulatorView'
import RankingView from '@/components/RankingView'
import AdminPlayerRoster from '@/components/AdminPlayerRoster'
import { Country, getLogoSize, getTeamLogoPath } from '@/lib/utils'
import { useState } from 'react'

// ─── Section config ──────────────────────────────────────────────────────────

type Section = 'espana' | 'brasil' | 'mexico' | 'queens' | 'ranking' | 'simulator'
type SubTab  = 'picks' | 'jugadores'


const COMP_SECTIONS: Record<string, {
  compKey: string; country: Country; label: string; color: string
}> = {
  espana: { compKey: 'kings',  country: 'spain',  label: 'España', color: '#FFD300' },
  brasil: { compKey: 'kings',  country: 'brazil', label: 'Brasil', color: '#FFD300' },
  mexico: { compKey: 'kings',  country: 'mexico', label: 'México', color: '#FFD300' },
  queens: { compKey: 'queens', country: 'spain',  label: 'Queens', color: '#01d6c3' },
}

const VALID_SECTIONS: Section[] = ['espana', 'brasil', 'mexico', 'queens', 'ranking', 'simulator']

/** Derive current section from URL params (new-style + legacy compat) */
function resolveSection(
  rawSection: string | null,
  legacyTab:  string | null,
): Section {
  if (rawSection && VALID_SECTIONS.includes(rawSection as Section)) return rawSection as Section
  if (legacyTab === 'queens')    return 'queens'
  if (legacyTab === 'ranking')   return 'ranking'
  if (legacyTab === 'simulator') return 'simulator'
  if (legacyTab === 'kings')     return 'espana'
  return 'espana'
}

// ─── Page shell ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return <Suspense><AdminDashboardInner /></Suspense>
}

function AdminDashboardInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Auth guard
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') { router.push('/'); return }
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  // ── Derive state purely from URL — sidebar links drive everything ──
  const section = resolveSection(searchParams.get('section'), searchParams.get('tab'))
  const rawSub  = searchParams.get('sub')
  const subTab: SubTab = (rawSub === 'jugadores' || rawSub === 'jugadoras') ? 'jugadores' : 'picks'

  const cfg = COMP_SECTIONS[section]  // defined only for competition sections
  const urlCountry = searchParams.get('country') as Country | null
  const urlLeague  = searchParams.get('league') as 'kings' | 'queens' | null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
      <AppHeader onLogout={handleLogout} userRole="admin" variant="nav" />

      {/* ── Content — navigation is fully handled by the sidebar ── */}
      <div className="relative w-full overflow-x-hidden pt-6">
        {section === 'ranking' ? (
          <RankingView />
        ) : section === 'simulator' ? (
          <SimulatorView
            key={`sim-admin-${urlCountry ?? 'all'}-${urlLeague ?? 'kings'}`}
            isAdmin
            initialCountry={urlCountry || undefined}
            initialLeague={urlLeague || undefined}
            hideControls={!!(urlCountry || urlLeague)}
          />
        ) : cfg && subTab === 'picks' ? (
          <CompetitionAdmin
            key={`${cfg.compKey}-${cfg.country}`}
            competitionKey={cfg.compKey}
            country={cfg.country}
          />
        ) : cfg && subTab === 'jugadores' ? (
          <AdminPlayerRoster
            key={`roster-${cfg.compKey}-${cfg.country}`}
            competitionKey={cfg.compKey}
            country={cfg.country}
          />
        ) : null}
      </div>
    </div>
  )
}

// ─── CompetitionAdmin (Picks view — unchanged from original) ─────────────────

function CompetitionAdmin({ competitionKey, country }: { competitionKey: string; country: Country }) {
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
      .order('display_order')

    let { data: uData, error: uErr } = await supabase
      .from('app_users')
      .select('id, username, favorite_team:favorite_team_id(logo_file, competition_key, country)')
      .neq('role', 'admin')
      .order('username')
      .limit(5000)

    if (uErr) {
      const { data: fallback } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username').limit(5000)
      uData = fallback as typeof uData
    }

    if (mData) {
      mData.forEach(day => {
        if (day.matches) {
          day.matches.sort((a: any, b: any) => {
            if (a.match_order !== b.match_order) return (a.match_order ?? 99) - (b.match_order ?? 99)
            return a.id - b.id
          })
        }
      })
      setMatchdays(mData)
      setActiveMatchdayId(prev => {
        const emptyDay   = mData.find(d => d.matches?.length > 0 && d.matches.every((m: any) => m.winner_team_id == null))
        const visibleDay = mData.find(d => d.is_visible === true)
        const fallback   = mData.length > 0 ? mData[0].id : null
        if (!prev) return emptyDay?.id ?? visibleDay?.id ?? fallback
        if (!mData.find(d => d.id === prev)) return emptyDay?.id ?? visibleDay?.id ?? fallback
        return prev
      })
    }

    const fetchedUsers = uData || []
    setUsers(fetchedUsers)

    if (fetchedUsers.length > 0) {
      const perPage = 10
      const pages   = Math.ceil(fetchedUsers.length / perPage)
      const chunks: number[][] = Array.from({ length: pages }, (_, i) => [i * perPage, (i + 1) * perPage])
      setPageChunks(chunks)
      setCurrentPage(prev => Math.min(prev, Math.max(0, chunks.length - 1)))
    }
  }

  useEffect(() => { load() }, [competitionKey, country])

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!activeMatchdayId || matchdays.length === 0) return
      const activeDay = matchdays.find(d => d.id === activeMatchdayId)
      if (!activeDay?.matches?.length) { setAllPreds([]); return }

      const currentUsers = pageChunks.length > 0
        ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1])
        : []
      const userIds  = currentUsers.map(u => u.id)
      if (userIds.length === 0) return

      const matchIds = activeDay.matches.map((m: any) => m.id)
      const { data: pData, error } = await supabase
        .from('predictions')
        .select('*, predicted_team:predicted_team_id(logo_file, country)')
        .in('match_id', matchIds)
        .in('user_id', userIds)

      if (!error && pData) setAllPreds(pData)
    }
    fetchPredictions()
  }, [activeMatchdayId, matchdays, currentPage, pageChunks, users])

  const toggleUserVisible = async (id: number, currentVal: boolean) => {
    if (!id) return
    const newVal = !currentVal
    if (newVal === true) {
      await supabase.from('matchdays').update({ is_visible: false }).eq('competition_key', competitionKey).eq('country', country)
    }
    await supabase.from('matchdays').update({ is_visible: newVal }).eq('id', id)
    load()
  }

  const togglePublicVisible = async (id: number, currentVal: boolean) => {
    if (!id) return
    const newVal = !currentVal
    if (newVal === true) {
      await supabase.from('matchdays').update({ is_public_visible: false }).eq('competition_key', competitionKey).eq('country', country)
    }
    await supabase.from('matchdays').update({ is_public_visible: newVal }).eq('id', id)
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

  const paginatedUsers  = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
  const totalPages      = pageChunks.length
  const activeMatchday  = matchdays.find(d => d.id === activeMatchdayId)
  const accentColor     = competitionKey === 'kings' ? '#FFD300' : '#01d6c3'

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-4 md:px-6 border-b border-white/5 bg-slate-900/20">
        {matchdays.map(day => (
          <button
            key={day.id}
            onClick={() => setActiveMatchdayId(day.id)}
            className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider transition-all rounded border shadow-sm
              ${activeMatchdayId === day.id
                ? competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105'
                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
          >
            {day.name.replace(/Jornada\s*/i, 'J')}
          </button>
        ))}
      </div>

      {matchdays.length === 0 && competitionKey === 'queens' && (
        <div className="flex flex-col items-center justify-center py-24 gap-6 w-full">
          <div className="relative w-24 h-24 opacity-20">
            <div className="absolute inset-0 rounded-full border-4 border-[#01d6c3] animate-pulse" />
            <div className="absolute inset-3 rounded-full border-2 border-[#01d6c3]/60" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-[#01d6c3] font-black italic uppercase tracking-[0.3em] text-2xl">Próximamente</p>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Queens · Split 6 España</p>
          </div>
        </div>
      )}

      {activeMatchday && (
        <div className="relative group w-full mb-8">
          <div className="w-full px-4 md:px-10 py-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-slate-900/40 border-b border-white/5">
            {/* Pagination */}
            <div className="flex justify-center sm:justify-start">
              {totalPages > 1 && (
                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }}
                    className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                  >◀</button>
                  <span className="px-4 py-2 text-xs font-black text-slate-400 tabular-nums select-none border-r border-white/10">{currentPage + 1} / {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages - 1}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }}
                    className={`px-5 py-2 text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                  >▶</button>
                </div>
              )}
            </div>

            {/* Matchday title */}
            <div className="flex justify-center">
              <h3
                style={{ color: accentColor }}
                className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter"
              >
                {activeMatchday.name}
              </h3>
            </div>

            {/* Toggle buttons */}
            <div className="flex justify-center sm:justify-end gap-2 flex-wrap">
              <button
                onClick={() => toggleUserVisible(activeMatchday.id, activeMatchday.is_visible)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-full border transition-all ${
                  activeMatchday.is_visible
                    ? 'bg-emerald-600/80 border-emerald-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {activeMatchday.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                USUARIO: {activeMatchday.is_visible ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => togglePublicVisible(activeMatchday.id, activeMatchday.is_public_visible)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-full border transition-all ${
                  activeMatchday.is_public_visible
                    ? 'bg-sky-600/80 border-sky-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {activeMatchday.is_public_visible ? <Globe size={13} /> : <GlobeLock size={13} />}
                PÚBLICO: {activeMatchday.is_public_visible ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => toggleLock(activeMatchday.id, activeMatchday.is_locked)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black rounded-full border transition-all ${
                  activeMatchday.is_locked
                    ? 'bg-red-600/80 border-red-400 text-white'
                    : 'bg-blue-600/80 border-blue-400 text-white'
                }`}
              >
                {activeMatchday.is_locked ? <Lock size={13} /> : <Unlock size={13} />}
                {activeMatchday.is_locked ? 'CERRADO' : 'ABIERTO'}
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-center">
              <thead>
                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                  <th className="w-[160px] md:w-[180px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                  {paginatedUsers.map(u => {
                    const favTeam = u.favorite_team
                      ? (Array.isArray(u.favorite_team) ? u.favorite_team[0] : u.favorite_team)
                      : null
                    return (
                    <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle min-w-[72px]">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-lg">
                          {u.username.charAt(0).toUpperCase()}
                          <Image
                            src={`/usuarios/${u.username}.webp`}
                            alt={u.username}
                            fill
                            sizes="48px"
                            className="object-cover z-10"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1 w-full px-1">
                          <span className="text-[9px] leading-tight truncate min-w-0">{u.username}</span>
                          {favTeam && (
                            <img
                              src={getTeamLogoPath(competitionKey, favTeam.logo_file, favTeam.country ?? country)}
                              alt=""
                              className="w-6 h-6 object-contain shrink-0"
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
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-1 px-2 border-r border-white/5 bg-slate-900/30">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setWinner(m.id, m.winner_team_id == m.home_team_id ? null : m.home_team_id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex items-center justify-center
                            ${m.winner_team_id == m.home_team_id
                              ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                              : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'
                            }`}
                        >
                          {m.home && (
                            <Image
                              src={getTeamLogoPath(competitionKey, m.home.logo_file, m.home.country ?? country)}
                              width={logoSize(m.home.logo_file)}
                              height={logoSize(m.home.logo_file)}
                              alt="h"
                              onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
                            />
                          )}
                        </button>
                        <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                        <button
                          onClick={() => setWinner(m.id, m.winner_team_id == m.away_team_id ? null : m.away_team_id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex items-center justify-center
                            ${m.winner_team_id == m.away_team_id
                              ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                              : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'
                            }`}
                        >
                          {m.away && (
                            <Image
                              src={getTeamLogoPath(competitionKey, m.away.logo_file, m.away.country ?? country)}
                              width={logoSize(m.away.logo_file)}
                              height={logoSize(m.away.logo_file)}
                              alt="a"
                              onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
                            />
                          )}
                        </button>
                      </div>
                    </td>
                    {paginatedUsers.map(u => {
                      const pred      = allPreds.find(p => p.user_id == u.id && p.match_id == m.id)
                      const isHit     = m.winner_team_id && pred && pred.predicted_team_id == m.winner_team_id
                      const hasWinner = m.winner_team_id !== null
                      const predTeam  = Array.isArray(pred?.predicted_team) ? pred?.predicted_team[0] : pred?.predicted_team
                      const logoFile  = predTeam?.logo_file
                      const predCountry = predTeam?.country ?? country

                      return (
                        <td key={u.id} className="p-1 border-r border-white/5">
                          {logoFile ? (
                            <div className="flex justify-center">
                              <Image
                                src={getTeamLogoPath(competitionKey, logoFile, predCountry)}
                                width={logoSize(logoFile)}
                                height={logoSize(logoFile)}
                                alt="p"
                                className={`transition-all duration-500 ${
                                  hasWinner
                                    ? isHit ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,211,0,0.4)] scale-110' : 'opacity-15 grayscale scale-90'
                                    : 'opacity-100'
                                }`}
                                onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-800 text-xs">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {(!activeMatchday.matches || activeMatchday.matches.length === 0) && (
                  <tr>
                    <td
                      colSpan={paginatedUsers.length + 1}
                      className="py-12 text-center text-slate-700 text-xs font-black italic uppercase tracking-widest"
                    >
                      Sin partidos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
