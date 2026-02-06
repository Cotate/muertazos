'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const USERS_PER_PAGE = 11

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'kings' | 'queens' | 'ranking'>('kings')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 w-full text-white overflow-x-hidden">

      {/* CABECERA */}
      <div className="relative flex items-center justify-center py-10 px-4">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase text-center">
          <span style={{ color: '#fff', textShadow: '2px 2px 0 #000' }}>PANEL CONTROL</span>
          <span className="ml-2" style={{ color: '#FFD300', textShadow: '2px 2px 0 #000' }}>MUERTAZOS</span>
        </h1>

        <button
          onClick={() => { localStorage.removeItem('muertazos_user'); router.push('/') }}
          className="absolute right-4 bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-[10px]"
        >
          CERRAR SESIÓN
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-slate-800 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <TabBtn label="KINGS LEAGUE" active={tab === 'kings'} onClick={() => setTab('kings')} activeColor="#ffd300" />
        <TabBtn label="QUEENS LEAGUE" active={tab === 'queens'} onClick={() => setTab('queens')} activeColor="#01d6c3" />
        <TabBtn label="RANKING GENERAL" active={tab === 'ranking'} onClick={() => setTab('ranking')} activeColor="#ffffff" />
      </div>

      {/* CONTENIDO FULL WIDTH */}
      <div className="w-full px-0 sm:px-1 lg:px-2">
        {tab === 'ranking'
          ? <RankingView />
          : <CompetitionAdmin key={tab} competitionKey={tab} />
        }
      </div>
    </div>
  )
}

function TabBtn({ label, active, onClick, activeColor }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        color: active ? activeColor : '#64748b',
        borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent'
      }}
      className="pb-4 px-4 font-black italic tracking-tighter transition-all uppercase text-sm"
    >
      {label}
    </button>
  )
}

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
  const [matchdays, setMatchdays] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [allPreds, setAllPreds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(0)

  const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'
  const colorHex = competitionKey === 'kings' ? '#ffd300' : '#01d6c3'

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE)
  const paginatedUsers = users.slice(
    currentPage * USERS_PER_PAGE,
    (currentPage + 1) * USERS_PER_PAGE
  )

  useEffect(() => {
    async function load() {
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

      const { data: pData } = await supabase
        .from('predictions')
        .select('*, predicted_team:predicted_team_id(logo_file)')

      if (mData) {
        mData.forEach(d => d.matches?.sort((a: any, b: any) => a.id - b.id))
        setMatchdays(mData)
      }

      setUsers(uData || [])
      setAllPreds(pData || [])
    }

    load()
  }, [competitionKey])

  return (
    <div className="w-full space-y-6">

      {/* PAGINACIÓN FULL WIDTH */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl w-full">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
            className={`font-black italic text-[10px] px-4 py-2 rounded-lg transition-all ${currentPage === 0 ? 'opacity-10' : 'hover:text-[#ffd300] bg-slate-800'}`}
          >
            ◀ ANTERIOR
          </button>

          <div className="flex gap-3">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`px-6 py-2 rounded-xl font-black italic text-xs transition-all ${currentPage === i ? 'bg-[#ffd300] text-black scale-105 shadow-lg' : 'bg-slate-800 text-slate-500'}`}
              >
                GRUPO {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
            className={`font-black italic text-[10px] px-4 py-2 rounded-lg transition-all ${currentPage === totalPages - 1 ? 'opacity-10' : 'hover:text-[#ffd300] bg-slate-800'}`}
          >
            SIGUIENTE ▶
          </button>
        </div>
      )}

      {matchdays.map(day => (
        <div key={day.id} className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl w-full">

          {/* HEADER JORNADA */}
          <div className="p-4 bg-slate-800/60 flex justify-between items-center border-b border-slate-700/50">
            <div>
              <h3 className="text-xl font-black uppercase italic" style={{ color: colorHex }}>{day.name}</h3>
              <p className="text-[10px] text-slate-500 italic">{day.date_label || 'FECHA POR DEFINIR'}</p>
            </div>
          </div>

          {/* TABLA FULL */}
          <div className="w-full overflow-hidden">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="text-[10px] text-slate-500 font-black uppercase">

                  <th className="w-[88px] px-2 py-3 text-left bg-slate-900/50 border-r border-slate-800">
                    PARTIDO
                  </th>

                  {paginatedUsers.map(u => (
                    <th key={u.id} className="min-w-[90px] p-1 text-center">
                      <div className="bg-slate-800/60 rounded py-2 px-1 text-[10px] sm:text-[11px] leading-snug break-words border border-slate-700/30">
                        {u.username}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {day.matches?.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-800/50 hover:bg-white/[0.02]">

                    <td className="px-1 py-2 border-r border-slate-800 bg-slate-900/20">
                      <div className="flex items-center justify-between gap-0.5">
                        <Image src={`/logos/${folder}/${m.home.logo_file}`} width={28} height={28} alt="" />
                        <span className="text-[7px] font-black text-slate-700">VS</span>
                        <Image src={`/logos/${folder}/${m.away.logo_file}`} width={28} height={28} alt="" />
                      </div>
                    </td>

                    {paginatedUsers.map(u => {
                      const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                      return (
                        <td key={u.id} className="px-0.5 py-1 text-center">
                          {pred?.predicted_team?.logo_file ? (
                            <Image
                              src={`/logos/${folder}/${pred.predicted_team.logo_file}`}
                              width={32}
                              height={32}
                              alt=""
                              className="mx-auto opacity-40"
                            />
                          ) : (
                            <span className="text-slate-800">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function RankingView() {
  return <div /> // sin cambios
}
