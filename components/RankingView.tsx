'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  /** When provided, highlights this user's row in blue */
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
        .select('id, name, competition_key')
        .eq('is_locked', true)
        .order('display_order')

      if (!lockedDays || lockedDays.length === 0) {
        setRankingData({ users: [], days: [] })
        setLoading(false)
        return
      }

      const { data: appUsers } = await supabase
        .from('app_users')
        .select('id, username')
        .neq('role', 'admin')

      const { data: pointsData } = await supabase
        .from('user_points')
        .select('user_id, matchday_id, points')
        .in('matchday_id', lockedDays.map(d => d.id))

      if (!appUsers) { setLoading(false); return }

      const userScores = appUsers.map(u => {
        let total = 0
        const dayBreakdown: Record<number, number> = {}
        pointsData?.filter(p => p.user_id === u.id).forEach(p => {
          dayBreakdown[p.matchday_id] = p.points
          total += p.points
        })
        return { username: u.username, total, dayBreakdown }
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

  const allUsers = rankingData.users
  const totalUsers = allUsers.length
  const pageChunks: number[][] = []
  for (let i = 0; i < totalUsers; i += 15) {
    pageChunks.push([i, Math.min(i + 15, totalUsers)])
  }

  const totalPages = pageChunks.length || 1
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1))
  const currentChunk = pageChunks[safeCurrentPage] || [0, 0]
  const paginatedUsers = allUsers.slice(currentChunk[0], currentChunk[1])

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center pt-2 px-2" style={{ minHeight: 'calc(100vh - 9rem)' }}>
      <div className="w-full flex flex-col md:grid md:grid-cols-3 items-center mb-3 px-2 md:px-4 gap-3">
        <div className="w-full flex justify-center md:justify-start">
          <button
            onClick={() => setShowFull(!showFull)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
          >
            {showFull ? '← VOLVER' : 'DESGLOSE'}
          </button>
        </div>

        <h2 className="text-xl font-black italic uppercase tracking-tighter text-center order-first md:order-none w-full">
          <span className="text-white">TABLA DE</span>{' '}
          <span className="text-[#FFD300]">POSICIONES</span>
        </h2>

        <div className="w-full flex justify-center md:justify-end">
          {totalPages > 1 && (
            <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
              <button
                disabled={safeCurrentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${safeCurrentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
              >◀</button>
              <button
                disabled={safeCurrentPage === totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                className={`px-5 py-2 text-xs font-black transition-colors ${safeCurrentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
              >▶</button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto flex-1">
        <div className="w-full h-full">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
            <table className="w-full border-collapse table-fixed">
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
                      <td className="w-9 px-1.5 py-2 text-center border-r border-white/5 font-black italic text-xs">
                        {isFirst
                          ? <span className="text-2xl">👑</span>
                          : <span className={`text-sm ${isMe ? 'text-white' : 'text-slate-600'}`}>{globalPos}</span>}
                      </td>

                      <td className="w-[130px] px-2 py-2 border-r border-white/5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 shadow-md flex items-center justify-center bg-slate-800 font-bold text-sm
                            ${isFirst ? 'border-[#FFD300] text-[#FFD300]' : isMe ? 'border-white text-white' : 'border-white/10 text-slate-400'}`}>
                            <span>{u.username.charAt(0).toUpperCase()}</span>
                            <img
                              src={`/usuarios/${u.username}.jpg`}
                              alt={u.username}
                              className="absolute inset-0 object-cover w-full h-full z-10"
                              onError={e => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <span className={`uppercase text-xs tracking-[0.08em] font-black truncate
                            ${isFirst ? 'text-[#FFD300]' : isMe ? 'text-white' : 'text-slate-300'}`}>
                            {u.username}
                          </span>
                        </div>
                      </td>

                      {showFull && rankingData.days.map(day => (
                        <td
                          key={day.id}
                          className={`px-1.5 py-2 text-center border-l border-white/5 text-xs font-mono w-8
                            ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}
                        >
                          {u.dayBreakdown[day.id] !== undefined ? (
                            <span className={u.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-700'}>
                              {u.dayBreakdown[day.id]}
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">-</span>
                          )}
                        </td>
                      ))}

                      <td className={`w-14 px-2 py-2 text-center border-l border-white/10 font-black text-base italic
                        ${isFirst ? 'bg-[#FFD300] text-black' : isMe ? 'bg-white/10 text-white' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
                        {u.total}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
