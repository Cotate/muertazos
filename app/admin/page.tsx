'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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
            {/* HEADER ESTILO LAYOUT ORIGINAL PERSONALIZADO */}
            <header className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-12 h-24 sticky top-0 z-50">
                
                {/* Izquierda: Ligas */}
                <div className="flex gap-20 flex-1 justify-end pr-16">
                    <TabBtn 
                        label="KINGS" 
                        active={tab === 'kings'} 
                        onClick={() => setTab('kings')} 
                        activeColor="#ffd300" 
                    />
                    <TabBtn 
                        label="QUEENS" 
                        active={tab === 'queens'} 
                        onClick={() => setTab('queens')} 
                        activeColor="#01d6c3" 
                    />
                </div>

                {/* Centro: Logo */}
                <div className="flex-shrink-0 flex justify-center items-center">
                    <div className="relative w-48 h-16 hover:scale-105 transition-transform duration-500 cursor-pointer">
                        <Image
                            src="/Muertazos.png"
                            alt="Muertazos Logo" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Derecha: Ranking y Salir */}
                <div className="flex gap-20 flex-1 pl-16 items-center">
                    <TabBtn 
                        label="RANKING" 
                        active={tab === 'ranking'} 
                        onClick={() => setTab('ranking')} 
                        activeColor="#FFFFFF" 
                    />
                    
                    <button
                        onClick={() => {
                            localStorage.removeItem('muertazos_user');
                            router.push('/');
                        }} 
                        className="ml-auto bg-red-600/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-md font-black hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase italic tracking-[0.2em]"
                    >
                        SALIR
                    </button>
                </div>
            </header>

            {/* Contenido Principal */}
            <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                {tab === 'ranking' ? (
                    <RankingView />
                ) : (
                    <CompetitionAdmin key={tab} competitionKey={tab} />
                )}
            </div>
        </div>
    )
}

function TabBtn({ label, active, onClick, activeColor }: any) {
    return (
        <button
            onClick={onClick}
            style={{ 
                color: active ? activeColor : '#475569',
                borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent'
            }}
            className="h-24 px-6 font-black italic tracking-tighter transition-all uppercase text-sm hover:text-white"
        >
            {label}
        </button>
    )
}

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
    const [matchdays, setMatchdays] = useState<any[]>([])
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
    const [users, setUsers] = useState<any[]>([])
    const [allPreds, setAllPreds] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const [pageChunks, setPageChunks] = useState<number[][]>([])
    
    const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio')
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54

    const load = async () => {
        const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')
        
        if (mData) { 
            mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) }); 
            setMatchdays(mData) 
            setActiveMatchdayId(prev => {
                if (!prev && mData.length > 0) return mData[0].id;
                if (prev && !mData.find(d => d.id === prev)) return mData[0].id;
                return prev;
            })
        }
        
        const fetchedUsers = uData || []
        setUsers(fetchedUsers)
        setAllPreds(pData || [])

        if (fetchedUsers.length > 0) {
            const targetPerPage = 12;
            const pages = Math.ceil(fetchedUsers.length / targetPerPage);
            const base = Math.floor(fetchedUsers.length / pages);
            const remainder = fetchedUsers.length % pages;
            
            let chunks = [];
            let start = 0;
            for(let i=0; i<pages; i++) {
                let size = base + (i < remainder ? 1 : 0);
                chunks.push([start, start + size]);
                start += size;
            }
            setPageChunks(chunks)
            setCurrentPage(prev => Math.min(prev, Math.max(0, chunks.length - 1)))
        }
    }
    
    useEffect(() => { load() }, [competitionKey])

    const toggleVisible = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load() }
    const toggleLock = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load() }
    const setWinner = async (matchId: number, teamId: number | null) => { await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load() }

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
    const totalPages = pageChunks.length;
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-center flex-wrap gap-3 p-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setActiveMatchdayId(day.id)}
                        className={`px-5 py-2.5 text-[11px] font-black italic uppercase tracking-wider transition-all rounded-lg border shadow-sm ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {day.name}
                    </button>
                ))}
            </div>

            {activeMatchday && (
                <div className="relative group w-full mb-8">
                    <div className="w-full px-10 py-4 grid grid-cols-3 items-center bg-slate-900/40 border-b border-white/5">
                        <div className="flex justify-start">
                            {totalPages > 1 && (
                                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                                    <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className={`px-5 py-2 text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center">
                            <h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }} className="text-3xl font-black italic uppercase tracking-tighter">
                                {activeMatchday.name}
                            </h3>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={()=>toggleVisible(activeMatchday.id, activeMatchday.is_visible)} className={`px-6 py-2 text-xs font-black rounded-full border ${activeMatchday.is_visible ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{activeMatchday.is_visible ? 'PÚBLICO' : 'OCULTO'}</button>
                            <button onClick={()=>toggleLock(activeMatchday.id, activeMatchday.is_locked)} className={`px-6 py-2 text-xs font-black rounded-full border ${activeMatchday.is_locked ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'}`}>{activeMatchday.is_locked ? 'BLOQUEADO' : 'ABIERTO'}</button>
                        </div>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full border-collapse table-fixed text-center">
                            <thead>
                                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                                    <th className="w-[180px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-lg">
                                                    {u.username.charAt(0).toUpperCase()}
                                                    <Image src={`/usuarios/${u.username}.jpg`} alt={u.username} fill sizes="48px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                                <span className="text-[10px] leading-tight truncate w-full px-1">{u.username}</span>
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
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} 
                                                    className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center 
                                                    ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 
                                                      m.winner_team_id === null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />}
                                                </button>
                                                <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} 
                                                    className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center 
                                                    ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 
                                                      m.winner_team_id === null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />}
                                                </button>
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
                                                                src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                width={getLogoSize(pred.predicted_team.logo_file)} 
                                                                height={getLogoSize(pred.predicted_team.logo_file)} 
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

function RankingView() {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0) 
    const USERS_PER_PAGE_RANKING = 10; 

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

    const totalPages = Math.ceil(rankingData.users.length / USERS_PER_PAGE_RANKING);
    const paginatedUsers = rankingData.users.slice(currentPage * USERS_PER_PAGE_RANKING, (currentPage + 1) * USERS_PER_PAGE_RANKING);

    return (
        <div className="w-full flex flex-col items-center py-8 px-6">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-6">
                <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
            </h2>
            
            <div className="flex gap-4 items-center mb-6">
                <button onClick={() => setShowFull(!showFull)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}>
                    {showFull ? '← VOLVER AL RANKING' : 'VER DESGLOSE POR JORNADAS'}
                </button>

                {totalPages > 1 && (
                    <div className="flex items-center bg-slate-900/60 rounded-full border border-white/10 overflow-hidden h-[42px] shadow-lg">
                        <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className={`px-6 h-full text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                        <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} className={`px-6 h-full text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                    </div>
                )}
            </div>

            <div className="w-full max-w-2xl">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse table-auto">
                        <tbody>
                            {paginatedUsers.map((user, idx) => (
                                <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                                    <td className="w-8 px-2 py-1.5 text-center border-r border-white/5 font-black italic text-xs text-slate-600 group-hover:text-slate-400">
                                        {(currentPage * USERS_PER_PAGE_RANKING) + idx + 1}
                                    </td>
                                    <td className="w-[180px] max-w-[180px] px-4 py-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-md flex items-center justify-center bg-slate-800 text-slate-400 font-bold text-sm">
                                                {user.username.charAt(0).toUpperCase()}
                                                <Image src={`/usuarios/${user.username}.jpg`} alt={user.username} fill sizes="32px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            </div>
                                            <span className="text-slate-300 font-medium uppercase text-sm tracking-widest group-hover:text-white truncate block">
                                                {user.username}
                                            </span>
                                        </div>
                                    </td>
                                    {showFull && rankingData.days.map(day => (
                                        <td key={day.id} className={`px-1 py-1.5 text-center border-l border-white/5 text-[10px] font-mono w-8 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                            <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                                        </td>
                                    ))}
                                    <td className="w-12 px-2 py-1.5 text-center bg-[#FFD300]/5 border-l border-white/10 font-black text-[#FFD300] text-sm italic">
                                        {user.total}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}