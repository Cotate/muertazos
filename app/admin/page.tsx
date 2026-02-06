'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// Configuración de paginación exacta
const USERS_PER_PAGE = 11;

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
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [router])

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white px-2 sm:px-4 py-4">
      {/* CABECERA */}
      <div className="relative mb-6 text-center">
        <h1 className="text-xl sm:text-2xl font-black italic tracking-wide text-[#ffd300]">
          PANEL CONTROL MUERTAZOS
        </h1>
        <button
          onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}}
          className="absolute right-2 sm:right-6 top-0 bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-[10px]"
        >
          CERRAR SESIÓN
        </button>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex justify-center gap-2 sm:gap-4 mb-6">
        <TabBtn label="👑 KINGS" active={tab === 'kings'} onClick={() => setTab('kings')} activeColor="#ffd300" />
        <TabBtn label="👸 QUEENS" active={tab === 'queens'} onClick={() => setTab('queens')} activeColor="#01d6c3" />
        <TabBtn label="📊 RANKING" active={tab === 'ranking'} onClick={() => setTab('ranking')} activeColor="#FFFFFF" />
      </div>

      {/* CONTENEDOR PRINCIPAL: Usamos w-full con padding mínimo */}
      <div className="w-full">
        {tab === 'ranking' 
          ? <RankingView /> 
          : <CompetitionAdmin competitionKey={tab} />}
      </div>
    </div>
  )
}

function TabBtn({label, active, onClick, activeColor}: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-black italic text-xs sm:text-sm transition-all ${active ? 'scale-105 shadow-lg' : 'bg-slate-800 text-slate-500'}`}
      style={active ? {backgroundColor: activeColor, color: '#000'} : {}}
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
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice(currentPage * USERS_PER_PAGE, (currentPage + 1) * USERS_PER_PAGE);

  const load = async () => {
    const { data: mData } = await supabase
      .from('matchdays')
      .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
      .eq('competition_key', competitionKey)
      .order('display_order')

    const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
    const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')

    if (mData) {
      mData.forEach(day => {
        if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id)
      })
      setMatchdays(mData)
    }
    setUsers(uData || [])
    setAllPreds(pData || [])
  }

  useEffect(() => {
    load()
  }, [competitionKey])

  const toggleVisible = async (id: number, val: boolean) => {
    await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load()
  }

  const toggleLock = async (id: number, val: boolean) => {
    await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load()
  }

  const setWinner = async (matchId: number, teamId: number | null) => {
    await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load()
  }

  const colorHex = competitionKey === 'kings' ? '#ffd300' : '#01d6c3'

  return (
    <div className="w-full space-y-6">
      {/* SELECTOR DE GRUPOS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className={`font-black italic text-[10px] px-3 sm:px-4 py-2 rounded-lg transition-all ${currentPage === 0 ? 'opacity-10' : 'hover:text-[#ffd300] bg-slate-800'}`}
          >
            ◀ ANTERIOR
          </button>

          <div className="flex gap-1 sm:gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`px-3 sm:px-6 py-2 rounded-xl font-black italic text-xs transition-all ${currentPage === i ? 'bg-[#ffd300] text-black scale-105 shadow-lg' : 'bg-slate-800 text-slate-500'}`}
              >
                GRUPO {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className={`font-black italic text-[10px] px-3 sm:px-4 py-2 rounded-lg transition-all ${currentPage === totalPages - 1 ? 'opacity-10' : 'hover:text-[#ffd300] bg-slate-800'}`}
          >
            SIGUIENTE ▶
          </button>
        </div>
      )}

      {matchdays.map(day => (
        <div key={day.id} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-3 sm:p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black italic" style={{color: colorHex}}>{day.name}</h2>
              <p className="text-[10px] text-slate-500">{day.date_label || 'FECHA POR DEFINIR'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleVisible(day.id, day.is_visible)}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg border transition-all ${day.is_visible ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                {day.is_visible ? 'PÚBLICO' : 'OCULTO'}
              </button>
              <button
                onClick={() => toggleLock(day.id, day.is_locked)}
                className={`px-4 py-1.5 text-[10px] font-black rounded-lg border transition-all ${day.is_locked ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                {day.is_locked ? 'CERRADO' : 'ABIERTO'}
              </button>
            </div>
          </div>

          {/* TABLA: Ajustada para ocupar todo el ancho */}
          <div className="overflow-x-auto -mx-3 sm:-mx-6">
            <table className="w-full table-fixed text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {/* Columna partido más estrecha */}
                  <th className="w-[80px] sm:w-[100px] p-2 text-left font-black text-slate-400">PARTIDO</th>
                  {/* Columnas de usuarios con más espacio */}
                  {paginatedUsers.map(u => (
                    <th key={u.id} className="p-2 text-center font-black text-slate-400 truncate" style={{color: colorHex}}>
                      {u.username}
                    </th>
                  ))}
                  {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                    <th key={`empty-${i}`} className="p-2"></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {day.matches?.map((m: any) => (
                  <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)}
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border-2 transition-all ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/20 scale-105' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                          {m.home && <Image src={`/teams/${folder}/${m.home.logo_file}`} alt="" width={20} height={20} className="object-contain" />}
                        </button>
                        <span className="text-[8px] sm:text-[10px] text-slate-600 font-bold">VS</span>
                        <button
                          onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)}
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border-2 transition-all ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/20 scale-105' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                          {m.away && <Image src={`/teams/${folder}/${m.away.logo_file}`} alt="" width={20} height={20} className="object-contain" />}
                        </button>
                      </div>
                    </td>

                    {paginatedUsers.map(u => {
                      const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                      const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                      return (
                        <td key={u.id} className="p-2 text-center">
                          {pred?.predicted_team?.logo_file ? (
                            <div className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all ${isHit ? 'bg-green-500/20 border-2 border-green-500' : 'opacity-50'}`}>
                              <Image src={`/teams/${folder}/${pred.predicted_team.logo_file}`} alt="" width={20} height={20} className="object-contain" />
                            </div>
                          ) : <span className="text-slate-600">-</span>}
                        </td>
                      )
                    })}
                    {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                      <td key={`empty-${i}`} className="p-2"></td>
                    ))}
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
  const [rankingData, setRankingData] = useState<any[]>([])
  const [headerJornadas, setHeaderJornadas] = useState<any[]>([])

  useEffect(() => {
    async function getFullRanking() {
      const { data: mDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('competition_key').order('display_order')
      const { data: matches } = await supabase.from('matches').select('id, matchday_id, winner_team_id').not('winner_team_id', 'is', null)
      const { data: preds } = await supabase.from('predictions').select('*')
      const { data: users } = await supabase.from('app_users').select('id, username').neq('role', 'admin')

      if (!mDays || !matches || !preds || !users) return

      const headers = mDays.map(d => {
        const suffix = d.competition_key === 'kings' ? 'K' : 'Q'
        const matchNum = d.name.match(/\d+/)
        return { id: d.id, label: matchNum ? `J${matchNum[0]}${suffix}` : `${d.name.toUpperCase()} ${suffix}` }
      })
      setHeaderJornadas(headers)

      const scores = users.map(u => {
        let totalScore = 0
        const breakdown: Record<string, number> = {}
        mDays.forEach((day, index) => {
          const headerObj = headers[index]
          const points = matches
            .filter(m => m.matchday_id === day.id)
            .reduce((acc, m) => {
              const p = preds.find(p => p.user_id === u.id && p.match_id === m.id)
              return (p && p.predicted_team_id === m.winner_team_id) ? acc + 1 : acc
            }, 0)
          breakdown[headerObj.label] = points
          totalScore += points
        })
        return { username: u.username, breakdown, total: totalScore }
      })

      setRankingData(scores.sort((a, b) => b.total - a.total))
    }
    getFullRanking()
  }, [])

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-3 sm:p-6 border border-slate-800">
      <h2 className="text-lg sm:text-xl font-black italic text-center mb-4 text-white">CLASIFICACIÓN GENERAL</h2>
      
      <div className="overflow-x-auto -mx-3 sm:-mx-6">
        <table className="w-full text-[10px] sm:text-xs">
          <thead>
            <tr className="border-b-2 border-slate-700">
              <th className="p-2 text-left font-black text-slate-400 sticky left-0 bg-slate-900/95 z-10">Pos</th>
              <th className="p-2 text-left font-black text-slate-400 min-w-[120px] sm:min-w-[150px]">Participante</th>
              {headerJornadas.map(h => (
                <th key={h.id} className="p-2 text-center font-black text-slate-400 whitespace-nowrap">{h.label}</th>
              ))}
              <th className="p-2 text-center font-black text-[#ffd300]">Total</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((row, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="p-2 font-bold sticky left-0 bg-slate-900/95 z-10">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-500">{i + 1}º</span>}
                </td>
                <td className="p-2 font-bold text-white truncate">{row.username}</td>
                {headerJornadas.map(h => (
                  <td key={h.label} className="p-2 text-center text-slate-300">{row.breakdown[h.label]}</td>
                ))}
                <td className="p-2 text-center font-black text-[#ffd300] text-sm">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}