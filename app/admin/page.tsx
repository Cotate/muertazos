'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
    const router = useRouter()
    const [tab, setTab] = useState<'kings' | 'queens' | 'ranking' | 'simulator'>('kings')

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
            <header className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-8 lg:px-12 h-24 sticky top-0 z-50">
                <div className="flex gap-10 lg:gap-20 flex-1 justify-end pr-8 lg:pr-16">
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

                <div className="flex-shrink-0 flex justify-center items-center">
                    <div className="relative w-40 h-14 lg:w-48 lg:h-16 hover:scale-105 transition-transform duration-500 cursor-pointer">
                        <Image
                            src="/Muertazos.png"
                            alt="Muertazos Logo" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="flex gap-10 lg:gap-20 flex-1 pl-8 lg:pl-16 items-center">
                    <TabBtn 
                        label="RANKING" 
                        active={tab === 'ranking'} 
                        onClick={() => setTab('ranking')} 
                        activeColor="#FFFFFF" 
                    />
                    <TabBtn 
                        label="SIMULADOR" 
                        active={tab === 'simulator'} 
                        onClick={() => setTab('simulator')} 
                        activeColor="#FF5733" 
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

            <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                {tab === 'ranking' ? (
                    <RankingView />
                ) : tab === 'simulator' ? (
                    <SimulatorView />
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
            className="h-24 px-2 lg:px-6 font-black italic tracking-tighter transition-all uppercase text-lg lg:text-xl hover:text-white"
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
            mData.forEach(day => { 
                if(day.matches) {
                    day.matches.sort((a: any, b: any) => {
                        if (a.match_order !== b.match_order) {
                            return (a.match_order ?? 99) - (b.match_order ?? 99);
                        }
                        return a.id - b.id;
                    });
                }
            }); 
            setMatchdays(mData) 
            setActiveMatchdayId(prev => {
                const publicDay = mData.find(d => d.is_visible === true);
                if (!prev) return publicDay ? publicDay.id : (mData.length > 0 ? mData[0].id : null);
                if (prev && !mData.find(d => d.id === prev)) return publicDay ? publicDay.id : (mData.length > 0 ? mData[0].id : null);
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

    const toggleVisible = async (id: number, currentVal: boolean) => {
        if (!id) return;
        const newVal = !currentVal;

        if (newVal === true) {
            await supabase
                .from('matchdays')
                .update({ is_visible: false })
                .eq('competition_key', competitionKey);
        }

        await supabase
            .from('matchdays')
            .update({ is_visible: newVal })
            .eq('id', id);

        load();
    }

    const toggleLock = async (id: number, val: boolean) => {
        if (!id) return;
        await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); 
        load();
    }

    const setWinner = async (matchId: number, teamId: number | null) => {
        await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); 
        load();
    }

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
    const totalPages = pageChunks.length;
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setActiveMatchdayId(day.id)}
                        className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider transition-all rounded border shadow-sm ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {day.name.replace(/Jornada\s*/i, 'J')}
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
            
            userScores?.sort((a, b) => {
                if (b.total !== a.total) return b.total - a.total;
                return a.username.localeCompare(b.username);
            });
            
            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>

    const allUsers = rankingData.users;
    const totalUsers = allUsers.length;
    
    const pageChunks: number[][] = [];
    for (let i = 0; i < totalUsers; i += 15) {
        pageChunks.push([i, Math.min(i + 15, totalUsers)]);
    }

    const totalPages = pageChunks.length || 1;
    const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
    const currentChunk = pageChunks[safeCurrentPage] || [0, 0];
    const paginatedUsers = allUsers.slice(currentChunk[0], currentChunk[1]);

    return (
        <div className="w-full flex flex-col items-center py-2 px-6">
            
            <div className="w-full flex items-center justify-between mb-4 px-4 md:px-12">
                <div className="flex-1 flex justify-start">
                    <button 
                        onClick={() => setShowFull(!showFull)} 
                        className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}
                    >
                        {showFull ? '← VOLVER' : 'DESGLOSE'}
                    </button>
                </div>

                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center px-4 shrink-0">
                    <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
                </h2>
                
                <div className="flex-1 flex justify-end">
                    {totalPages > 1 && (
                        <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                            <button 
                                disabled={safeCurrentPage === 0} 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${safeCurrentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            >
                                ◀
                            </button>
                            <button 
                                disabled={safeCurrentPage === totalPages - 1} 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                className={`px-5 py-2 text-xs font-black transition-colors ${safeCurrentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            >
                                ▶
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-fit mx-auto">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="border-collapse table-auto">
                        <tbody>
                            {paginatedUsers.map((user, idx) => {
                                const globalPos = currentChunk[0] + idx + 1;
                                const isFirst = globalPos === 1;

                                return (
                                    <tr key={user.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''}`}>
                                        <td className="w-10 px-2 py-1 text-center border-r border-white/5 font-black italic text-[10px]">
                                            {isFirst ? (
                                                <span className="text-lg drop-shadow-[0_0_8px_rgba(255,211,0,0.6)]">👑</span>
                                            ) : (
                                                <span className="text-slate-600 group-hover:text-slate-400">{globalPos}</span>
                                            )}
                                        </td>
                                        
                                        <td className="w-[130px] px-2 py-1 border-r border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 shadow-md flex items-center justify-center bg-slate-800 font-bold text-[10px] ${isFirst ? 'border-[#FFD300]' : 'border-white/10 text-slate-400'}`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                    <Image 
                                                        key={`${currentPage}-${user.username}`}
                                                        src={`/usuarios/${user.username}.jpg`} 
                                                        alt={user.username} 
                                                        fill 
                                                        sizes="28px" 
                                                        className="object-cover z-10" 
                                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                                    />
                                                </div>
                                                <span className={`uppercase text-[10px] tracking-[0.1em] truncate block w-full ${isFirst ? 'text-[#FFD300] font-black' : 'text-slate-300 font-medium group-hover:text-white'}`}>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function SimulatorView() {
    const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings')
    const [matchdays, setMatchdays] = useState<any[]>([])
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
    const [teams, setTeams] = useState<any[]>([])
    
    // Resultados por defecto para Jornadas 1, 2 y 3
    const defaultScores: Record<number, { hg: string, ag: string, hp: string, ap: string }> = {
        // Debes reemplazar los números '1', '2', etc., por los IDs reales de tus partidos de la base de datos
        // Jornada 1
        1: { hg: '12', ag: '4', hp: '', ap: '' },
        2: { hg: '6', ag: '7', hp: '', ap: '' },
        3: { hg: '5', ag: '4', hp: '', ap: '' },
        4: { hg: '7', ag: '5', hp: '', ap: '' },
        5: { hg: '7', ag: '0', hp: '', ap: '' },
        6: { hg: '3', ag: '5', hp: '', ap: '' },
        // Jornada 2
        7: { hg: '7', ag: '3', hp: '', ap: '' },
        8: { hg: '3', ag: '4', hp: '', ap: '' },
        9: { hg: '3', ag: '7', hp: '', ap: '' },
        10: { hg: '9', ag: '6', hp: '', ap: '' },
        11: { hg: '4', ag: '2', hp: '', ap: '' },
        12: { hg: '6', ag: '9', hp: '', ap: '' },
        // Jornada 3
        13: { hg: '6', ag: '3', hp: '', ap: '' },
        14: { hg: '2', ag: '8', hp: '', ap: '' },
        15: { hg: '6', ag: '9', hp: '', ap: '' },
        16: { hg: '12', ag: '5', hp: '', ap: '' },
        17: { hg: '6', ag: '7', hp: '', ap: '' },
        18: { hg: '4', ag: '8', hp: '', ap: '' },
    };

    const [scores, setScores] = useState<Record<number, { hg: string, ag: string, hp: string, ap: string }>>(defaultScores)

    const folder = compKey === 'kings' ? 'Kings' : 'Queens'
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio')
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54

    // Función para obtener el color de la fila según posición
    const getRowColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-500'; // 1er lugar (Semifinal)
        if (idx >= 1 && idx <= 5) return 'bg-blue-500'; // 2 al 6 (Cuartos)
        if (idx >= 6 && idx <= 9) return 'bg-red-500'; // 7 al 10 (Play-in)
        return 'bg-transparent';
    }

    useEffect(() => {
        const saved = localStorage.getItem('muertazos_simulator_scores')
        if (saved) setScores(JSON.parse(saved))
    }, [])

    useEffect(() => {
        const load = async () => {
            const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey)
            if (tData) setTeams(tData)

            const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', compKey).order('display_order')
            if (mData) {
                mData.forEach(day => {
                    if (day.matches) {
                        day.matches.sort((a: any, b: any) => (a.match_order ?? 99) - (b.match_order ?? 99) || a.id - b.id);
                    }
                })
                setMatchdays(mData)
                setActiveMatchdayId(mData.length > 0 ? mData[0].id : null)
            }
        }
        load()
    }, [compKey])

    const updateScore = (matchId: number, field: 'hg' | 'ag' | 'hp' | 'ap', value: string) => {
        const newScores = { ...scores }
        if (!newScores[matchId]) newScores[matchId] = { hg: '', ag: '', hp: '', ap: '' }
        if (value !== '' && !/^\d+$/.test(value)) return;
        newScores[matchId][field] = value
        setScores(newScores)
        localStorage.setItem('muertazos_simulator_scores', JSON.stringify(newScores))
    }

    const clearScores = () => {
        if (confirm('¿Estás seguro de borrar todos los marcadores del simulador?')) {
            setScores({})
            localStorage.removeItem('muertazos_simulator_scores')
        }
    }

    const standings = teams.map(team => {
        let w = 0, l = 0, gf = 0, gc = 0;
        matchdays.forEach(md => {
            md.matches?.forEach((m: any) => {
                const s = scores[m.id]
                if (!s || s.hg === '' || s.ag === '') return;
                const homeG = parseInt(s.hg), awayG = parseInt(s.ag)
                if (m.home_team_id === team.id) {
                    gf += homeG; gc += awayG;
                    if (homeG > awayG) w++; else if (homeG < awayG) l++;
                    else if (s.hp !== '' && s.ap !== '' && parseInt(s.hp) > parseInt(s.ap)) w++; else if (s.hp !== '' && s.ap !== '') l++;
                } else if (m.away_team_id === team.id) {
                    gf += awayG; gc += homeG;
                    if (awayG > homeG) w++; else if (awayG < homeG) l++;
                    else if (s.hp !== '' && s.ap !== '' && parseInt(s.ap) > parseInt(s.hp)) w++; else if (s.hp !== '' && s.ap !== '') l++;
                }
            })
        })
        return { ...team, w, l, gf, gc, dg: gf - gc }
    }).sort((a, b) => (b.w !== a.w) ? b.w - a.w : (b.dg !== a.dg) ? b.dg - a.dg : b.gf - a.gf)

    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex justify-center gap-4 py-4">
                <button onClick={() => setCompKey('kings')} className={`px-6 py-2 rounded-full text-xs font-black italic tracking-widest uppercase border ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Kings</button>
                <button onClick={() => setCompKey('queens')} className={`px-6 py-2 rounded-full text-xs font-black italic tracking-widest uppercase border ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Queens</button>
            </div>

            <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button key={day.id} onClick={() => setActiveMatchdayId(day.id)} className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider rounded border ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'bg-[#FFD300] text-black' : 'bg-[#01d6c3] text-black') : 'bg-black/40 text-slate-400'}`}>
                        {day.name}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 px-6 py-8">
                <div className="flex-1">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 text-center">{activeMatchday?.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeMatchday?.matches?.map((m: any) => {
                            const s = scores[m.id] || { hg: '', ag: '', hp: '', ap: '' }
                            const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag
                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center flex-1">{m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />}</div>
                                        <div className="flex items-center gap-3">
                                            <input type="text" value={s.hg} onChange={(e) => updateScore(m.id, 'hg', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                            <span className="text-sm font-black text-slate-600 italic">VS</span>
                                            <input type="text" value={s.ag} onChange={(e) => updateScore(m.id, 'ag', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        </div>
                                        <div className="flex flex-col items-center flex-1">{m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />}</div>
                                    </div>
                                    {isTie && (
                                        <div className="w-full flex items-center justify-center gap-4 pt-3 border-t border-white/5">
                                            <span className="text-[10px] font-black italic text-slate-500 uppercase">Penales</span>
                                            <input type="text" value={s.hp} onChange={(e) => updateScore(m.id, 'hp', e.target.value)} className="w-8 h-8 text-center bg-black border border-[#FFD300]/50 rounded text-[#FFD300] font-black" maxLength={2} />
                                            <input type="text" value={s.ap} onChange={(e) => updateScore(m.id, 'ap', e.target.value)} className="w-8 h-8 text-center bg-black border border-[#FFD300]/50 rounded text-[#FFD300] font-black" maxLength={2} />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="w-full xl:w-[450px]">
                    <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-center text-sm">
                            <thead>
                                <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                                    <th className="py-2 w-8">#</th>
                                    <th className="py-2 text-left pl-2">Equipo</th>
                                    <th className="py-2 w-8">V</th>
                                    <th className="py-2 w-8">D</th>
                                    <th className="py-2 w-8">DG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((t, idx) => (
                                    <tr key={t.id} className="border-b border-white/5">
                                        <td className="relative py-2 font-black">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>
                                            {idx + 1}
                                        </td>
                                        <td className="py-2 pl-2 text-left flex items-center gap-2">
                                            <Image src={`/logos/${folder}/${t.logo_file}`} width={24} height={24} alt={t.name} />
                                            <span className="text-[11px] font-bold uppercase">{t.name}</span>
                                        </td>
                                        <td className="py-2 font-black text-green-400">{t.w}</td>
                                        <td className="py-2 font-black text-red-400">{t.l}</td>
                                        <td className="py-2 font-black text-white">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Leyenda de colores */}
                    <div className="mt-4 grid grid-cols-1 gap-2 p-3 bg-black/20 rounded text-[10px] uppercase font-bold text-slate-400">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500"></div> 1º Semifinal</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500"></div> 2º - 6º Cuartos</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500"></div> 7º - 10º Play-in</div>
                    </div>
                </div>
            </div>
        </div>
    )
}