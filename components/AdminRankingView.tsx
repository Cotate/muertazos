// components/AdminRankingView.tsx
'use client'
import { useEffect, useState } from 'react'
import {{ supabase }} from '@/lib/supabase'

export default function AdminRankingView() {
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

