'use client'
import { useState, useEffect } from 'react'
import { Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getTeamLogoPath } from '@/lib/utils'

/** Returns a subtle background tint color string for a matchday row/cell */
function getMatchdayBg(day: any): string {
  if (day.competition_key === 'queens') return 'rgba(1,214,195,0.10)'
  if (day.country === 'brazil')         return 'rgba(0,180,80,0.13)'
  if (day.country === 'mexico')         return 'rgba(200,70,30,0.11)'
  return 'rgba(255,211,0,0.09)' // kings spain
}

/** Short label for the legend */
const LEGEND = [
  { label: 'Kings España', bg: 'rgba(255,211,0,0.40)'  },
  { label: 'Kings Brasil', bg: 'rgba(0,180,80,0.45)'   },
  { label: 'Kings México', bg: 'rgba(200,70,30,0.40)'  },
  { label: 'Queens',       bg: 'rgba(1,214,195,0.40)'  },
]

interface Props {
  currentUser?: string
}

export default function RankingView({ currentUser }: Props) {
  const [rankingData, setRankingData] = useState<{ users: any[]; days: any[] }>({ users: [], days: [] })
  const [showFull, setShowFull] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true)

      const { data: lockedDays } = await supabase
        .from('matchdays')
        .select('id, name, competition_key, country')
        .eq('is_locked', true)
        .order('display_order')

      if (!lockedDays || lockedDays.length === 0) {
        setRankingData({ users: [], days: [] })
        setLoading(false)
        return
      }

      const dayIds = lockedDays.map(d => d.id)

      // Fetch users and matches concurrently.
      // Matches need winner_team_id so we can compute points directly from predictions
      // instead of relying on the user_points table (which can be stale if a winner changes).
      const [usersResult, matchesResult] = await Promise.all([
        supabase
          .from('app_users')
          .select('id, username, favorite_team:favorite_team_id(logo_file, competition_key, country)')
          .neq('role', 'admin'),
        supabase
          .from('matches')
          .select('id, matchday_id, winner_team_id')
          .in('matchday_id', dayIds),
      ])

      let appUsers = usersResult.data
      if (usersResult.error) {
        const { data: fallback } = await supabase.from('app_users').select('id, username').neq('role', 'admin')
        appUsers = fallback as typeof appUsers
      }

      const matchesData = matchesResult.data ?? []

      // match_id → matchday_id and match_id → winner_team_id
      const matchToDay: Record<number, number> = {}
      const winnerByMatch: Record<number, number | null> = {}
      for (const m of matchesData) {
        matchToDay[m.id] = m.matchday_id
        winnerByMatch[m.id] = m.winner_team_id ?? null
      }
      const allMatchIds = Object.keys(matchToDay).map(Number)

      // Paginate predictions — the single source of truth for both participation and points.
      // Supabase silently caps results at max_rows; advance by page.length so any cap is handled.
      const PAGE_SIZE = 1000
      const fetchPredsPages = async () => {
        if (allMatchIds.length === 0) {
          return [] as { user_id: string; match_id: number; predicted_team_id: number }[]
        }
        const all: { user_id: string; match_id: number; predicted_team_id: number }[] = []
        let offset = 0
        while (true) {
          const { data: page } = await supabase
            .from('predictions')
            .select('user_id, match_id, predicted_team_id')
            .in('match_id', allMatchIds)
            .range(offset, offset + PAGE_SIZE - 1)
          if (!page || page.length === 0) break
          all.push(...page)
          offset += page.length
        }
        return all
      }

      const allPreds = await fetchPredsPages()

      // Build per-(user, matchday) aggregates in a single pass:
      //   predCount  — how many predictions the user submitted for this jornada
      //   correctCount — how many of those matched the actual winner
      const predCountByKey: Record<string, number> = {}
      const correctByKey:   Record<string, number> = {}

      for (const pred of allPreds) {
        const matchdayId = matchToDay[pred.match_id]
        if (matchdayId == null) continue
        const key = `${pred.user_id}-${matchdayId}`
        predCountByKey[key] = (predCountByKey[key] ?? 0) + 1
        const winner = winnerByMatch[pred.match_id]
        // Use == so string/number coercion is handled (same pattern as admin picks view)
        if (winner != null && pred.predicted_team_id == winner) {
          correctByKey[key] = (correctByKey[key] ?? 0) + 1
        }
      }

      if (!appUsers) { setLoading(false); return }

      const userScores = appUsers.map(u => {
        let total = 0
        const dayBreakdown: Record<number, number> = {}
        for (const day of lockedDays) {
          const key = `${u.id}-${day.id}`
          if ((predCountByKey[key] ?? 0) > 0) {
            // User participated: show their correct-prediction count (may be 0)
            const correct = correctByKey[key] ?? 0
            dayBreakdown[day.id] = correct
            total += correct
          }
          // predCount === 0: leave dayBreakdown[day.id] undefined → red dash in UI
        }
        const ft = u.favorite_team
        const favoriteTeam = ft ? (Array.isArray(ft) ? ft[0] : ft) : null
        return { username: u.username, total, dayBreakdown, favoriteTeam }
      })

      userScores.sort((a, b) => b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username))
      setRankingData({ users: userScores, days: lockedDays })
      setLoading(false)
    }

    fetchRanking()
  }, [])

  if (loading) return (
    <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">
      Sincronizando posiciones...
    </div>
  )

  // Sort users by total (all matchdays, no country filter)
  const allUsers = [...rankingData.users].sort((a, b) =>
    b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username)
  )

  const totalUsers = allUsers.length
  const pageChunks: number[][] = []
  for (let i = 0; i < totalUsers; i += 10) {
    pageChunks.push([i, Math.min(i + 10, totalUsers)])
  }

  const totalPages = pageChunks.length || 1
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1))
  const currentChunk = pageChunks[safeCurrentPage] || [0, 0]
  const paginatedUsers = allUsers.slice(currentChunk[0], currentChunk[1])

  // Fixed pixel widths for the three permanent columns
  const COL_POS  = 60
  const COL_NAME = 200
  const COL_TOT  = 80
  const COL_DAY  = 45  // each breakdown column

  return (
    <div
      className="flex flex-col items-center px-2 mx-auto w-fit"
      style={{ minHeight: 'calc(100vh - 9rem)' }}
    >
      {/* Header: [Desglose] — [TABLA DE POSICIONES centered] — [Pagination] */}
      <div className="w-full flex items-center gap-3 mb-3 px-2 md:px-4">
        {/* Left: Desglose toggle */}
        <button
          onClick={() => setShowFull(!showFull)}
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border shrink-0 ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
        >
          {showFull ? '← VOLVER' : 'DESGLOSE'}
        </button>

        {/* Center: Title */}
        <h2 className="flex-1 text-center text-base sm:text-xl font-black italic uppercase tracking-tighter">
          <span className="text-white">TABLA DE</span>{' '}
          <span className="text-[#FFD300]">POSICIONES</span>
        </h2>

        {/* Right: Pagination — invisible spacer keeps title centered when hidden */}
        <div className={`shrink-0 ${totalPages <= 1 ? 'invisible' : ''}`}>
          <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
            <button
              disabled={safeCurrentPage === 0}
              onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }}
              className={`px-4 py-2 text-xs font-black transition-colors border-r border-white/10 ${safeCurrentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
            >◀</button>
            <span className="px-3 py-2 text-xs font-black text-slate-400 tabular-nums select-none border-r border-white/10">
              {safeCurrentPage + 1} / {totalPages}
            </span>
            <button
              disabled={safeCurrentPage === totalPages - 1}
              onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }}
              className={`px-4 py-2 text-xs font-black transition-colors ${safeCurrentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
            >▶</button>
          </div>
        </div>
      </div>

      <div className="flex-1">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl w-fit">
            <table className="border-collapse" style={{ tableLayout: 'auto' }}>
              <colgroup>
                <col style={{ width: COL_POS, minWidth: COL_POS }} />
                <col style={{ width: COL_NAME, minWidth: COL_NAME }} />
                {showFull && rankingData.days.map((d: any) => (
                  <col key={d.id} style={{ width: COL_DAY, minWidth: COL_DAY }} />
                ))}
                <col style={{ width: COL_TOT, minWidth: COL_TOT }} />
              </colgroup>
              <tbody>
                {paginatedUsers.map((u, idx) => {
                  const globalPos = currentChunk[0] + idx + 1
                  const isFirst = globalPos === 1
                  const isMe = !!currentUser && u.username === currentUser

                  return (
                    <tr
                      key={u.username}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group
                        ${isFirst ? 'bg-[#FFD300]/5' : ''}
                        ${isMe ? 'bg-blue-500/10' : ''}`}
                    >
                      {/* Position */}
                      <td className="px-2 py-3 text-center border-r border-white/5 font-black italic text-xs">
                        {isFirst
                          ? <Crown size={20} className="text-[#FFD300] mx-auto" />
                          : <span className={`text-sm ${isMe ? 'text-white' : 'text-slate-600'}`}>{globalPos}</span>}
                      </td>

                      {/* Name + avatar */}
                      <td className="px-2 py-3 border-r border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 shadow-md flex items-center justify-center bg-slate-800 font-bold text-base shrink-0
                            ${isFirst ? 'border-[#FFD300] text-[#FFD300]' : isMe ? 'border-white text-white' : 'border-white/10 text-slate-400'}`}>
                            <span>{u.username.charAt(0).toUpperCase()}</span>
                            <img
                              src={`/usuarios/${u.username}.webp`}
                              alt={u.username}
                              className="absolute inset-0 object-cover w-full h-full z-10"
                              onError={e => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className={`uppercase text-sm tracking-[0.06em] font-black whitespace-nowrap
                              ${isFirst ? 'text-[#FFD300]' : isMe ? 'text-white' : 'text-slate-300'}`}>
                              {u.username}
                            </span>
                            {u.favoriteTeam && (
                              <img
                                src={getTeamLogoPath(u.favoriteTeam.competition_key, u.favoriteTeam.logo_file, u.favoriteTeam.country)}
                                alt=""
                                className="w-9 h-9 object-contain shrink-0"
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Breakdown columns — only when Desglose active */}
                      {showFull && rankingData.days.map((day: any) => (
                        <td
                          key={day.id}
                          className="py-3 text-center border-l border-white/5 text-xs font-mono"
                          style={{ backgroundColor: getMatchdayBg(day) }}
                        >
                          {u.dayBreakdown[day.id] !== undefined ? (
                            <span className={u.dayBreakdown[day.id] > 0 ? 'text-slate-100' : 'text-slate-300'}>
                              {u.dayBreakdown[day.id]}
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">-</span>
                          )}
                        </td>
                      ))}

                      {/* Total score */}
                      <td className={`px-2 py-3 text-center border-l border-white/10 font-black text-lg italic
                        ${isFirst ? 'bg-[#FFD300] text-black' : isMe ? 'bg-white/10 text-white' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
                        {u.total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Breakdown legend */}
          {showFull && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3 px-2">
              {LEGEND.map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 tracking-wide">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: l.bg }} />
                  {l.label}
                </div>
              ))}
            </div>
          )}

        </div>
    </div>
  )
}
