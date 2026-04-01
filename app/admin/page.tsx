/******************************************************************************
PRUEBA
*******************************************************************************/
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
            router.push('/login')
            return
        }
        document.body.style.backgroundColor = '#0a0a0a'
        return () => { document.body.style.backgroundColor = '' }
    }, [router])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
            <header className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 lg:px-8 h-14 sticky top-0 z-50">
                <div className="flex gap-4 lg:gap-10 flex-1 justify-end pr-4 lg:pr-8">
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
                    <div className="relative w-24 h-8 lg:w-32 lg:h-9 hover:scale-105 transition-transform duration-500 cursor-pointer">
                        <Image
                            src="/Muertazos.png"
                            alt="Muertazos Logo" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="flex gap-4 lg:gap-10 flex-1 pl-4 lg:pl-8 items-center">
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
                            router.push('/login');
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
                borderBottom: active ? `3px solid ${activeColor}` : '3px solid transparent'
            }}
            className="h-14 px-2 lg:px-4 font-black italic tracking-tighter transition-all uppercase text-sm lg:text-base hover:text-white"
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

    // 1. CARGA INICIAL (Solo Jornadas y Usuarios)
    const load = async () => {
        const { data: mData } = await supabase
            .from('matchdays')
            .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
            .eq('competition_key', competitionKey)
            .order('display_order')
            
        // Agregamos un limit alto por si tienes más de 1000 usuarios
        const { data: uData } = await supabase
            .from('app_users')
            .select('id, username')
            .neq('role', 'admin')
            .order('username')
            .limit(5000) 
        
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

        // Paginación de usuarios
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

    // 2. NUEVO HOOK: Cargar predicciones de la jornada activa Y página actual
    useEffect(() => {
        const fetchPredictions = async () => {
            if (!activeMatchdayId || matchdays.length === 0) return;

            const activeDay = matchdays.find(d => d.id === activeMatchdayId);
            
            if (!activeDay || !activeDay.matches || activeDay.matches.length === 0) {
                setAllPreds([]);
                return;
            }

            // Calculamos qué usuarios estamos viendo en la pantalla AHORA
            const currentUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
            const userIds = currentUsers.map(u => u.id);

            if (userIds.length === 0) return;

            const matchIds = activeDay.matches.map((m: any) => m.id);

            // Filtramos las predicciones tanto por partido como por los usuarios visibles
            // Esto evita sobrecargar la BD y saltarse el límite de Supabase
            const { data: pData, error } = await supabase
                .from('predictions')
                .select('*, predicted_team:predicted_team_id(logo_file)')
                .in('match_id', matchIds)
                .in('user_id', userIds); 

            if (!error && pData) {
                setAllPreds(pData);
            }
        };

        fetchPredictions();
    }, [activeMatchdayId, matchdays, currentPage, pageChunks, users]); // Se ejecuta al cambiar jornada o página

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
                                                <button onClick={() => setWinner(m.id, m.winner_team_id == m.home_team_id ? null : m.home_team_id)} 
                                                    className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center 
                                                    ${m.winner_team_id == m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 
                                                      m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />}
                                                </button>
                                                <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                                                <button onClick={() => setWinner(m.id, m.winner_team_id == m.away_team_id ? null : m.away_team_id)} 
                                                    className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center 
                                                    ${m.winner_team_id == m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 
                                                      m.winner_team_id == null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />}
                                                </button>
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            // 3. USO DE "==" Y PROTECCIÓN DE ARREGLOS
                                            const pred = allPreds.find(p => p.user_id == u.id && p.match_id == m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id == m.winner_team_id
                                            const hasWinner = m.winner_team_id !== null
                                            
                                            // Supabase puede devolver la tabla anidada como un array o como objeto. Nos preparamos para ambos:
                                            const logoFile = Array.isArray(pred?.predicted_team) 
                                                ? pred?.predicted_team[0]?.logo_file 
                                                : pred?.predicted_team?.logo_file;

                                            return (
                                                <td key={u.id} className="p-1 border-r border-white/5">
                                                    {logoFile ? (
                                                        <div className="flex justify-center">
                                                            <Image 
                                                                src={`/logos/${folder}/${logoFile}`} 
                                                                width={getLogoSize(logoFile)} 
                                                                height={getLogoSize(logoFile)} 
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

/* COMPONENTE DE RANKING OPTIMIZADO PARA ADMIN */
function RankingView() {
    const [rankingData, setRankingData] = useState<{ users: any[], days: any[] }>({ users: [], days: [] })
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);

            // 1. Obtenemos solo las jornadas bloqueadas (históricas/finalizadas)
            const { data: lockedDays } = await supabase
                .from('matchdays')
                .select('id, name, competition_key')
                .eq('is_locked', true)
                .order('display_order');

            if (!lockedDays || lockedDays.length === 0) {
                setRankingData({ users: [], days: [] });
                setLoading(false);
                return;
            }

            // 2. Obtenemos los usuarios (excluyendo admin)
            const { data: appUsers } = await supabase
                .from('app_users')
                .select('id, username')
                .neq('role', 'admin');

            // 3. Consultamos la tabla de puntos pre-calculados
            // Solo nos interesan los puntos de las jornadas que ya están bloqueadas
            const { data: pointsData } = await supabase
                .from('user_points')
                .select('user_id, matchday_id, points')
                .in('matchday_id', lockedDays.map(d => d.id));

            if (!appUsers) {
                setLoading(false);
                return;
            }

            // 4. Construimos el desglose por usuario de forma eficiente
            const userScores = appUsers.map(u => {
                let total = 0;
                const dayBreakdown: Record<number, number> = {};

                // Filtramos los puntos pre-calculados para este usuario
                const userPicks = pointsData?.filter(p => p.user_id === u.id) || [];

                userPicks.forEach(p => {
                    dayBreakdown[p.matchday_id] = p.points;
                    total += p.points;
                });

                return {
                    username: u.username,
                    total,
                    dayBreakdown
                };
            });

            // 5. Ordenamos por puntos totales desc y luego alfabético
            userScores.sort((a, b) => {
                if (b.total !== a.total) return b.total - a.total;
                return a.username.localeCompare(b.username);
            });

            setRankingData({
                users: userScores,
                days: lockedDays
            });
            setLoading(false);
        };

        fetchRanking();
    }, []);

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla optimizada...</div>

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
                                                    <img 
                                                        src={`/usuarios/${user.username}.jpg`} 
                                                        alt={user.username} 
                                                        className="absolute inset-0 object-cover w-full h-full z-10" 
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
                                                <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>
                                                    {user.dayBreakdown[day.id] || 0}
                                                </span>
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
    const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings');
    const [matchdays, setMatchdays] = useState<any[]>([]);
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    // Cambiamos el estado para manejar penaltyWinnerId en lugar de hp/ap
    const [scores, setScores] = useState<Record<number, { hg: string, ag: string, penaltyWinnerId: number | null }>>({});

    const folder = compKey === 'kings' ? 'Kings' : 'Queens';
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio');
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54;

    const getRowColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-500';
        if (idx >= 1 && idx <= 5) return 'bg-blue-500';
        if (idx >= 6 && idx <= 9) return 'bg-red-500';
        return 'bg-transparent';
    };

    // 1. CARGA DE DATOS
    useEffect(() => {
        const load = async () => {
            const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey);
            if (tData) setTeams(tData);

            const { data: mData } = await supabase
                .from('matchdays')
                .select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
                .eq('competition_key', compKey)
                .order('display_order');

            const { data: rData } = await supabase.from('match_results').select('*');

            if (mData) {
                const loadedScores: any = {};
                if (rData) {
                    rData.forEach((res: any) => {
                        let pWinner = null;
                        if (res.home_goals === res.away_goals) {
                            if (res.home_penalties > res.away_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.home_team_id;
                            if (res.away_penalties > res.home_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.away_team_id;
                        }

                        loadedScores[res.match_id] = {
                            hg: res.home_goals != null ? String(res.home_goals) : '',
                            ag: res.away_goals != null ? String(res.away_goals) : '',
                            penaltyWinnerId: pWinner
                        };
                    });
                }
                setScores(loadedScores);
                setMatchdays(mData);
                if (!activeMatchdayId && mData.length > 0) setActiveMatchdayId(mData[0].id);
            }
        };
        load();
    }, [compKey]);

    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    // 2. ACTUALIZAR ESTADO LOCAL
    const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
        if (value !== '' && !/^\d+$/.test(value)) return;
        setScores(prev => {
            const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null };
            const newHg = field === 'hg' ? value : current.hg;
            const newAg = field === 'ag' ? value : current.ag;
            // Si deja de ser empate, reseteamos el ganador de penales
            const pWinner = newHg === newAg ? current.penaltyWinnerId : null;
            return { ...prev, [matchId]: { ...current, [field]: value, penaltyWinnerId: pWinner } };
        });
    };

    const togglePenaltyWinner = (matchId: number, teamId: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId }
        }));
    };

    // 3. GUARDAR JORNADA
    const saveActiveMatchday = async () => {
        if (!activeMatchday) return;

        const resultsToUpsert = activeMatchday.matches
            .filter((m: any) => scores[m.id]?.hg !== '' && scores[m.id]?.ag !== '')
            .map((m: any) => {
                const s = scores[m.id];
                const isTie = s.hg === s.ag;
                return {
                    match_id: m.id,
                    home_goals: parseInt(s.hg),
                    away_goals: parseInt(s.ag),
                    home_penalties: isTie ? (s.penaltyWinnerId === m.home_team_id ? 1 : 0) : null,
                    away_penalties: isTie ? (s.penaltyWinnerId === m.away_team_id ? 1 : 0) : null,
                };
            });

        if (resultsToUpsert.length === 0) return alert("No hay marcadores para guardar.");

        // Validar que si hay empate, se haya elegido un ganador
        const pendingPenalties = resultsToUpsert.some((r: any) => r.home_goals === r.away_goals && r.home_penalties === 0 && r.away_penalties === 0);
        if (pendingPenalties) return alert("Selecciona al ganador de los penales haciendo clic en su escudo.");

        const { error } = await supabase.from('match_results').upsert(resultsToUpsert, { onConflict: 'match_id' });
        if (error) alert("Error: " + error.message);
        else alert(`Jornada ${activeMatchday.name} guardada.`);
    };

    // 4. BORRAR JORNADA
    const deleteActiveMatchday = async () => {
        if (!activeMatchday || !confirm("¿Borrar resultados?")) return;
        const matchIds = activeMatchday.matches.map((m: any) => m.id);
        const { error } = await supabase.from('match_results').delete().in('match_id', matchIds);
        if (!error) {
            const newScores = { ...scores };
            matchIds.forEach((id: number) => delete newScores[id]);
            setScores(newScores);
        }
    };

    // 5. CLASIFICACIÓN (Incluye GF, GC y Lógica de Puntos)
    const standings = teams.map(team => {
        let w = 0, l = 0, gf = 0, gc = 0;
        matchdays.forEach(md => {
            md.matches?.forEach((m: any) => {
                const s = scores[m.id];
                if (!s || s.hg === '' || s.ag === '') return;
                const hG = parseInt(s.hg), aG = parseInt(s.ag);
                if (m.home_team_id === team.id) {
                    gf += hG; gc += aG;
                    if (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) w++; else l++;
                } else if (m.away_team_id === team.id) {
                    gf += aG; gc += hG;
                    if (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) w++; else l++;
                }
            });
        });
        return { ...team, w, l, gf, gc, dg: gf - gc };
    }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex justify-center gap-4 py-4">
                <button onClick={() => setCompKey('kings')} className={`px-6 py-2 rounded-full text-xs font-black italic uppercase border ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Kings</button>
                <button onClick={() => setCompKey('queens')} className={`px-6 py-2 rounded-full text-xs font-black italic uppercase border ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Queens</button>
            </div>

            <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button key={day.id} onClick={() => setActiveMatchdayId(day.id)} className={`px-3 py-1 text-[11px] font-black italic uppercase rounded border ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'bg-[#FFD300] text-black' : 'bg-[#01d6c3] text-black') : 'bg-black/40 text-slate-400'}`}>
                        {day.name}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 px-6 py-8">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{activeMatchday?.name}</h3>
                        <div className="flex gap-2">
                            <button onClick={saveActiveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Guardar</button>
                            <button onClick={deleteActiveMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Borrar</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeMatchday?.matches?.map((m: any) => {
                            const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null };
                            const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag;
                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center flex-1">
                                            {m.home && (
                                                <button 
                                                    onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)}
                                                    className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                                                >
                                                    <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="text" value={s.hg} onChange={(e) => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                            <span className="text-xs font-black text-slate-600 italic">VS</span>
                                            <input type="text" value={s.ag} onChange={(e) => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            {m.away && (
                                                <button 
                                                    onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)}
                                                    className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                                                >
                                                    <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isTie && <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="w-full xl:w-[480px]">
                    <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-center text-sm">
                            <thead>
                                <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                                    <th className="py-3 w-8">#</th>
                                    <th className="py-3 text-left pl-2">Equipo</th>
                                    <th className="py-3 w-8">V</th>
                                    <th className="py-3 w-8">D</th>
                                    <th className="py-3 w-8">GF</th>
                                    <th className="py-3 w-8">GC</th>
                                    <th className="py-3 w-10 bg-white/5">DG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((t, idx) => (
                                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="relative py-2.5 font-black text-xs">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>
                                            {idx + 1}
                                        </td>
                                        <td className="py-2.5 pl-2 text-left flex items-center gap-2">
                                            <Image src={`/logos/${folder}/${t.logo_file}`} width={22} height={22} alt={t.name} />
                                            <span className="text-[10px] font-bold uppercase truncate max-w-[110px]">{t.name}</span>
                                        </td>
                                        <td className="py-2.5 font-black text-green-400 text-xs">{t.w}</td>
                                        <td className="py-2.5 font-black text-red-400 text-xs">{t.l}</td>
                                        <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gf}</td>
                                        <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gc}</td>
                                        <td className="py-2.5 font-black text-white text-xs bg-white/5">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}