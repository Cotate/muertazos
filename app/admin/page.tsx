'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const USERS_PER_BLOCK = 12; // Cuántos usuarios ver por cada tabla dividida (2 tablas de 12 = 24 total por página)

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
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
        {/* NAVEGACIÓN CENTRADA */}
        <div className="flex justify-center items-center border-b border-slate-800 bg-black/20 px-10">
            <div className="flex items-center gap-2">
                <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
                <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
                <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
                <button onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} className="ml-6 bg-red-600/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-lg font-black hover:bg-red-600 hover:text-white transition-all text-[11px] uppercase italic tracking-tighter">CERRAR SESIÓN</button>
            </div>
        </div>
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
            {tab === 'ranking' ? <RankingView /> : <CompetitionAdmin key={tab} competitionKey={tab} />}
        </div>
    </div>
  )
}

function TabBtn({label, active, onClick, activeColor}: any) {
    return (
        <button onClick={onClick} style={{ color: active ? activeColor : '#475569', borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent'}} className="py-6 px-6 font-black italic tracking-tighter transition-all uppercase text-sm hover:text-white">{label}</button>
    )
}

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
    const [matchdays, setMatchdays] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [allPreds, setAllPreds] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    
    const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'
    
    // Paginación: Mostramos 2 bloques de USERS_PER_BLOCK por página
    const usersPerPage = USERS_PER_BLOCK * 2;
    const totalPages = Math.ceil(users.length / usersPerPage);
    const paginatedUsers = users.slice(currentPage * usersPerPage, (currentPage + 1) * usersPerPage);

    // División equitativa de los usuarios visibles en la página actual
    const midPoint = Math.ceil(paginatedUsers.length / 2);
    const userGroups = [paginatedUsers.slice(0, midPoint), paginatedUsers.slice(midPoint)];

    const load = async () => {
        const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')
        if (mData) { mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) }); setMatchdays(mData) }
        setUsers(uData || []); setAllPreds(pData || [])
    }
    useEffect(() => { load() }, [competitionKey])

    const setWinner = async (matchId: number, teamId: number | null) => {
        await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load()
    }

    return (
        <div className="w-full">
            {matchdays.map(day => (
                <div key={day.id} className="w-full mb-12 border-b border-white/5 pb-8">
                    {/* CABECERA JORNADA CON FLECHAS RECUPERADAS */}
                    <div className="w-full px-10 py-5 grid grid-cols-3 items-center bg-slate-900/40">
                        <div className="flex justify-start">
                            {totalPages > 1 && (
                                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden shadow-lg">
                                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className={`px-5 py-2 text-xs transition-colors ${currentPage === 0 ? 'opacity-10' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                                    <div className="w-[1px] h-4 bg-white/10"></div>
                                    <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className={`px-5 py-2 text-xs transition-colors ${currentPage === totalPages - 1 ? 'opacity-10' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center">
                            <h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }} className="text-3xl font-black italic uppercase tracking-tighter">{day.name}</h3>
                        </div>
                        <div className="flex justify-end gap-2 text-[10px] font-black text-slate-500 italic uppercase">
                            Página {currentPage + 1} de {totalPages || 1}
                        </div>
                    </div>

                    {/* TABLAS DIVIDIDAS */}
                    <div className="flex flex-col gap-6 mt-6">
                        {userGroups.map((group, groupIdx) => group.length > 0 && (
                            <div key={groupIdx} className="w-full overflow-hidden border-y border-white/[0.03]">
                                <table className="w-full border-collapse table-fixed text-center">
                                    <thead>
                                        <tr className="bg-black/40 text-[10px] text-slate-500 font-black uppercase">
                                            <th className="w-[180px] p-4 border-r border-white/5">PARTIDO</th>
                                            {group.map(u => (
                                                <th key={u.id} className="p-1 border-r border-white/5 bg-black/20 text-[9px] text-slate-300 truncate px-2 italic">{u.username}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {day.matches?.map((m: any) => (
                                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="p-2 border-r border-white/5 bg-slate-900/10">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/10 scale-105' : m.winner_team_id === null ? 'border-transparent hover:scale-110' : 'border-transparent opacity-20 grayscale scale-90'}`}>
                                                            {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={34} height={34} alt="h" />}
                                                        </button>
                                                        <span className="text-[8px] font-black text-slate-800">VS</span>
                                                        <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/10 scale-105' : m.winner_team_id === null ? 'border-transparent hover:scale-110' : 'border-transparent opacity-20 grayscale scale-90'}`}>
                                                            {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={34} height={34} alt="a" />}
                                                        </button>
                                                    </div>
                                                </td>
                                                {group.map(u => {
                                                    const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                                    const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                                    const hasWinner = m.winner_team_id !== null
                                                    return (
                                                        <td key={u.id} className="p-1 border-r border-white/5">
                                                            {pred?.predicted_team?.logo_file ? (
                                                                <Image 
                                                                    src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                    width={38} height={38} alt="p" 
                                                                    className={`mx-auto transition-all duration-300 ${hasWinner ? (isHit ? 'opacity-100 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'opacity-10 grayscale scale-90') : 'opacity-100'}`} 
                                                                />
                                                            ) : <span className="text-slate-900 font-bold">-</span>}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function RankingView() {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRanking = async () => {
            const { data: lockedDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('display_order')
            if (!lockedDays || lockedDays.length === 0) { setRankingData({users: [], days: []}); setLoading(false); return }
            const { data: matches } = await supabase.from('matches').select('id, winner_team_id, matchday_id').in('matchday_id', lockedDays.map(d => d.id)).not('winner_team_id', 'is', null)
            const { data: predictions } = await supabase.from('predictions').select('user_id, match_id, predicted_team_id').in('match_id', matches?.map(m => m.id) || [])
            const { data: appUsers } = await supabase.from('app_users').select('id, username').neq('role', 'admin')
            const userScores = appUsers?.map(u => {
                let total = 0; const dayBreakdown: any = {}
                lockedDays.forEach(day => {
                    const matchesInDay = matches?.filter(m => m.matchday_id === day.id) || []
                    let dayHits = 0
                    matchesInDay.forEach(m => {
                        const userPred = predictions?.find(p => p.user_id === u.id && p.match_id === m.id)
                        if (userPred && userPred.predicted_team_id === m.winner_team_id) dayHits++
                    })
                    dayBreakdown[day.id] = dayHits; total += dayHits
                })
                return { username: u.username, total, dayBreakdown }
            })
            userScores?.sort((a, b) => b.total - a.total)
            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase tracking-widest">Calculando Ranking...</div>

    const half = Math.ceil(rankingData.users.length / 2)
    const col1 = showFull ? rankingData.users : rankingData.users.slice(0, half)
    const col2 = rankingData.users.slice(half)

    const TableContent = ({ data, startIdx, isFull }: { data: any[], startIdx: number, isFull: boolean }) => (
        <table className="w-full text-left border-collapse table-auto">
            <thead>
                <tr className="bg-black/60 text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5">
                    <th className="px-4 py-2.5 w-12 text-center">POS</th>
                    <th className="px-4 py-2.5">USUARIO</th>
                    {isFull && rankingData.days.map(day => (
                        <th key={day.id} className={`px-2 py-2.5 text-center border-l border-white/5 w-14 ${day.competition_key === 'kings' ? 'text-[#FFD300]/70 bg-[#FFD300]/5' : 'text-[#01d6c3]/70 bg-[#01d6c3]/5'}`}>
                            {day.name.replace('JORNADA ', 'J')}
                        </th>
                    ))}
                    <th className="px-5 py-2.5 text-center bg-[#FFD300]/10 text-[#FFD300] w-16 border-l border-white/10 font-black tracking-tighter">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {data.map((user, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="px-4 py-2 text-center border-r border-white/5 font-black italic text-xs text-slate-600 group-hover:text-slate-400">{startIdx + idx + 1}</td>
                        <td className="px-4 py-2"><span className="text-slate-300 font-bold uppercase text-[11px] tracking-tight group-hover:text-white">{user.username}</span></td>
                        {isFull && rankingData.days.map(day => (
                            <td key={day.id} className={`px-2 py-2 text-center border-l border-white/5 text-[10px] font-mono ${day.competition_key === 'kings' ? 'bg-[#FFD300]/2' : 'bg-[#01d6c3]/2'}`}>
                                <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-300' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                            </td>
                        ))}
                        <td className="px-5 py-2 text-center bg-[#FFD300]/5 border-l border-white/10 font-black text-[#FFD300] text-sm italic">{user.total}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )

    return (
        <div className="w-full flex flex-col items-center py-12 px-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-8"><span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span></h2>
            <button onClick={() => setShowFull(!showFull)} className={`mb-10 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}>
                {showFull ? '← VOLVER AL RANKING' : 'VER DESGLOSE POR JORNADAS'}
            </button>
            <div className={`w-full transition-all duration-700 ease-in-out ${showFull ? 'max-w-4xl' : 'max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8'}`}>
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden self-start">
                    <TableContent data={col1} startIdx={0} isFull={showFull} />
                </div>
                {!showFull && rankingData.users.length > 1 && (
                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden self-start">
                        <TableContent data={col2} startIdx={half} isFull={false} />
                    </div>
                )}
            </div>
        </div>
    )
}