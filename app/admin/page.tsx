'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import SimulatorView from '@/components/SimulatorView'
import RankingView from '@/components/RankingView'
import { Country, COUNTRIES, getCompFolder, getLogoSize } from '@/lib/utils'

export default function AdminDashboard() {
  return <Suspense><AdminDashboardInner /></Suspense>
}

function AdminDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'kings' | 'queens' | 'ranking' | 'simulator'>('kings')
  const [country, setCountry] = useState<Country>('spain')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') { router.push('/'); return }
    document.body.style.backgroundColor = '#0a0a0a'
    const t = searchParams.get('tab') as any
    if (['kings', 'queens', 'ranking', 'simulator'].includes(t)) setTab(t)
    return () => { document.body.style.backgroundColor = '' }
  }, [router, searchParams])

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  const activeColor = tab === 'kings' ? '#ffd300' : tab === 'queens' ? '#01d6c3' : tab === 'simulator' ? '#FF5733' : '#ffffff'
  const isKingsTab = tab === 'kings'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
      <AppHeader
        onLogout={handleLogout}
        userRole="admin"
        variant="nav"
      />

      {isKingsTab && (
        <div className="flex gap-2 px-4 pt-4 max-w-5xl mx-auto overflow-x-auto pb-1">
          {COUNTRIES.map(({ key, flag, name }) => (
            <button
              key={key}
              onClick={() => setCountry(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black italic uppercase tracking-tight whitespace-nowrap transition-all
                ${country === key
                  ? 'border-current'
                  : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'
                }`}
              style={country === key ? { borderColor: activeColor, color: activeColor, backgroundColor: activeColor + '18' } : {}}
            >
              <span>{flag}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full overflow-x-hidden">
        {tab === 'ranking' ? (
          <RankingView />
        ) : tab === 'simulator' ? (
          <SimulatorView isAdmin />
        ) : country !== 'spain' ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-5xl">🌎</p>
            <p className="text-slate-600 font-black italic uppercase tracking-widest text-xl">PRÓXIMAMENTE</p>
            <p className="text-slate-700 text-sm">
              {tab === 'kings' ? 'Kings' : 'Queens'} {country === 'mexico' ? 'México' : 'Brasil'} aún no está disponible
            </p>
          </div>
        ) : (
          <CompetitionAdmin key={`${tab}-${country}`} competitionKey={tab} />
        )}
      </div>
    </div>
  )
}

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [allPreds, setAllPreds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [pageChunks, setPageChunks] = useState<number[][]>([])

  const folder = getCompFolder(competitionKey)
  const logoSize = (filename: string) => getLogoSize(filename)

  const load = async () => {
    const { data: mData } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', competitionKey)
      .order('display_order')

    const { data: uData } = await supabase
      .from('app_users')
      .select('id, username')
      .neq('role', 'admin')
      .order('username')
      .limit(5000)

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
        const publicDay = mData.find(d => d.is_visible === true)
        if (!prev) return publicDay ? publicDay.id : (mData.length > 0 ? mData[0].id : null)
        if (!mData.find(d => d.id === prev)) return publicDay ? publicDay.id : (mData.length > 0 ? mData[0].id : null)
        return prev
      })
    }

    const fetchedUsers = uData || []
    setUsers(fetchedUsers)

    if (fetchedUsers.length > 0) {
      const targetPerPage = 12
      const pages = Math.ceil(fetchedUsers.length / targetPerPage)
      const base = Math.floor(fetchedUsers.length / pages)
      const remainder = fetchedUsers.length % pages
      let chunks: number[][] = [], start = 0
      for (let i = 0; i < pages; i++) {
        const size = base + (i < remainder ? 1 : 0)
        chunks.push([start, start + size])
        start += size
      }
      setPageChunks(chunks)
      setCurrentPage(prev => Math.min(prev, Math.max(0, chunks.length - 1)))
    }
  }

  useEffect(() => { load() }, [competitionKey])

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!activeMatchdayId || matchdays.length === 0) return
      const activeDay = matchdays.find(d => d.id === activeMatchdayId)
      if (!activeDay?.matches?.length) { setAllPreds([]); return }

      const currentUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
      const userIds = currentUsers.map(u => u.id)
      if (userIds.length === 0) return

      const matchIds = activeDay.matches.map((m: any) => m.id)
      const { data: pData, error } = await supabase
        .from('predictions')
        .select('*, predicted_team:predicted_team_id(logo_file)')
        .in('match_id', matchIds)
        .in('user_id', userIds)

      if (!error && pData) setAllPreds(pData)
    }
    fetchPredictions()
  }, [activeMatchdayId, matchdays, currentPage, pageChunks, users])

  const toggleVisible = async (id: number, currentVal: boolean) => {
    if (!id) return
    const newVal = !currentVal
    if (newVal === true) {
      await supabase.from('matchdays').update({ is_visible: false }).eq('competition_key', competitionKey)
    }
    await supabase.from('matchdays').update({ is_visible: newVal }).eq('id', id)
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

  const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
  const totalPages = pageChunks.length
  const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

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

      {activeMatchday && (
        <div className="relative group w-full mb-8">
          <div className="w-full px-4 md:px-10 py-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 bg-slate-900/40 border-b border-white/5">
            <div className="flex justify-center sm:justify-start">
              {totalPages > 1 && (
                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                  <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                  <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className={`px-5 py-2 text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
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
            <div className="flex justify-center sm:justify-end gap-2 flex-wrap">
              <button onClick={() => toggleVisible(activeMatchday.id, activeMatchday.is_visible)} className={`px-4 md:px-6 py-2 text-xs font-black rounded-full border ${activeMatchday.is_visible ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {activeMatchday.is_visible ? 'PÚBLICO' : 'OCULTO'}
              </button>
              <button onClick={() => toggleLock(activeMatchday.id, activeMatchday.is_locked)} className={`px-4 md:px-6 py-2 text-xs font-black rounded-full border ${activeMatchday.is_locked ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'}`}>
                {activeMatchday.is_locked ? 'BLOQUEADO' : 'ABIERTO'}
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse table-fixed text-center">
              <thead>
                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                  <th className="w-[160px] md:w-[180px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                  {paginatedUsers.map(u => (
                    <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle min-w-[60px]">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-lg">
                          {u.username.charAt(0).toUpperCase()}
                          <Image src={`/usuarios/${u.username}.jpg`} alt={u.username} fill sizes="48px" className="object-cover z-10" onError={e => (e.currentTarget.style.display = 'none')} />
                        </div>
                        <span className="text-[9px] leading-tight truncate w-full px-1">{u.username}</span>
                      </div>
                    </th>
                  ))}
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
                            ${m.winner_team_id == m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                              : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}
                        >
                          {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={logoSize(m.home.logo_file)} height={logoSize(m.home.logo_file)} alt="h" />}
                        </button>
                        <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                        <button
                          onClick={() => setWinner(m.id, m.winner_team_id == m.away_team_id ? null : m.away_team_id)}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-xl transition-all duration-300 flex items-center justify-center
                            ${m.winner_team_id == m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                              : m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}
                        >
                          {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={logoSize(m.away.logo_file)} height={logoSize(m.away.logo_file)} alt="a" />}
                        </button>
                      </div>
                    </td>
                    {paginatedUsers.map(u => {
                      const pred = allPreds.find(p => p.user_id == u.id && p.match_id == m.id)
                      const isHit = m.winner_team_id && pred && pred.predicted_team_id == m.winner_team_id
                      const hasWinner = m.winner_team_id !== null
                      const logoFile = Array.isArray(pred?.predicted_team)
                        ? pred?.predicted_team[0]?.logo_file
                        : pred?.predicted_team?.logo_file

                      return (
                        <td key={u.id} className="p-1 border-r border-white/5">
                          {logoFile ? (
                            <div className="flex justify-center">
                              <Image
                                src={`/logos/${folder}/${logoFile}`}
                                width={logoSize(logoFile)}
                                height={logoSize(logoFile)}
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
