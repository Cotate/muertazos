'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const USERS_PER_PAGE = 22; // Página de 22 usuarios (11 arriba + 11 abajo)

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
    
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const paginatedUsers = users.slice(currentPage * USERS_PER_PAGE, (currentPage + 1) * USERS_PER_PAGE);

    // Dividimos los usuarios de la página actual en dos bloques de máximo 11
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

    const toggleVisible = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load() }
    const toggleLock = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load() }
    const setWinner = async (matchId: number, teamId: number | null) => { await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load() }

    return (
        <div className="w-full">
            {matchdays.map(day => (
                <div key={day.id} className="relative group w-full mb-8 border-y border-white/5">
                    {/* HEADER CON BOTONES DE NAVEGACIÓN */}
                    <div className="w-full px-10 py-5 grid grid-cols-3 items-center bg-slate-900/40">
                        <div className="flex justify-start">
                            {totalPages > 1 && (
                                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className={`px-4 py-2 text-xs ${currentPage === 0 ? 'opacity-10 text-slate-600' : 'hover:bg-white/10 text-white'}`}>◀</button>
                                    <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className={`px-4 py-2 text-xs border-l border-white/10 ${currentPage === totalPages - 1 ? 'opacity-10 text-slate-600' : 'hover:bg-white/10 text-white'}`}>▶</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center"><h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }} className="text-3xl font-black italic uppercase tracking-tighter">{day.name}</h3></div>
                        <div className="flex justify-end gap-4">
                            <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-6 py-2 text-xs font-black rounded-full border ${day.is_visible ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{day.is_visible ? 'PÚBLICO' : 'OCULTO'}</button>
                            <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-6 py-2 text-xs font-black rounded-full border ${day.is_locked ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'}`}>{day.is_locked ? 'BLOQUEADO' : 'ABIERTO'}</button>
                        </div>
                    </div>

                    {/* LAS DOS TABLAS (GRUPO 1 Y GRUPO 2) */}
                    <div className="flex flex-col gap-4">
                        {userGroups.map((group, groupIdx) => group.length > 0 && (
                            <div key={groupIdx} className="w-full overflow-hidden">
                                <table className="w-full border-collapse table-fixed text-center">
                                    <thead>
                                        <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter">
                                            <th className="w-[220px] p-6 border-r border-white/5">PARTIDO</th>
                                            {group.map(u => <th key={u.id} className="p-1 border-r border-white/5 bg-black/20 text-[10px] text-slate-200">{u.username}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {day.matches?.map((m: any) => (
                                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                                <td className="p-4 border-r border-white/5 bg-slate-900/30">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-14 h-14 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/10 scale-105' : m.winner_team_id === null ? 'border-transparent opacity-100 hover:scale-110' : 'border-transparent opacity-20 grayscale scale-90'}`}>
                                                            {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={42} height={42} alt="h" />}
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-700 italic">VS</span>
                                                        <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-14 h-14 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/10 scale-105' : m.winner_team_id === null ? 'border-transparent opacity-100 hover:scale-110' : 'border-transparent opacity-20 grayscale scale-90'}`}>
                                                            {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={42} height={42} alt="a" />}
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
                                                                <div className="flex justify-center">
                                                                    <Image 
                                                                        src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                        width={44} height={44} alt="p" 
                                                                        className={`transition-all duration-500 ${hasWinner ? (isHit ? 'opacity-100 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'opacity-10 grayscale scale-90') : 'opacity-100'}`} 
                                                                    />
                                                                </div>
                                                            ) : '-'}
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

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>

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
                    <th className="px-5 py-2.5 text-center bg-[#FFD300]/10 text-[#FFD300] w-16 border-l border-white/10 font-black italic">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {data.map((user, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <td className="px-4 py-2 text-center border-r border-white/5 font-black italic text-xs text-slate-600 group-hover:text-slate-400">{startIdx + idx + 1}</td>
                        <td className="px-4 py-2"><span className="text-slate-300 font-bold uppercase text-[11px] tracking-tight group-hover:text-white">{user.username}</span></td>
                        {isFull && rankingData.days.map(day => (
                            <td key={day.id} className={`px-2 py-2 text-center border-l border-white/5 text-[10px] font-mono ${day.competition_key === 'kings' ? 'bg-[#FFD300]/2' : 'bg-[#01d6c3]/2'}`}>
                                <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-700'}>{user.dayBreakdown[day.id] || 0}</span>
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
            <button onClick={() => setShowFull(!showFull)} className="mb-10 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] italic transition-all duration-500 border bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]">
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