// components/UserRankingView.tsx
'use client'
import { useEffect, useState } from 'react'
import {{ supabase }} from '@/lib/supabase'

export default function UserRankingView({ user }: { user: any }) {
    // Agregamos activeDays al estado para saber qué jornadas ya pasaron/tienen predicciones
    const [rankingData, setRankingData] = useState<{ users: any[], days: any[], activeDays: Set<number> }>({ 
        users: [], 
        days: [],
        activeDays: new Set()
    })
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);

            // 1. Obtenemos los usuarios reales
            const { data: appUsers } = await supabase
                .from('app_users')
                .select('id, username')
                .neq('role', 'admin');

            // 2. Obtenemos todas las jornadas configuradas
            const { data: matchdays } = await supabase
                .from('matchdays')
                .select('id, name, competition_key')
                .order('display_order');

            // 3. Consultamos la tabla de puntos pre-calculados
            const { data: pointsData } = await supabase
                .from('user_points')
                .select('user_id, matchday_id, points');

            if (!appUsers) {
                setLoading(false);
                return;
            }

            // Recopilamos los IDs de las jornadas que ya tienen al menos un registro de puntos
            // (Para no marcar a la gente en rojo por jornadas del futuro que aún no se juegan)
            const activeDays = new Set<number>(pointsData?.map(p => p.matchday_id) || []);

            // 4. Construimos el desglose por usuario
            const userScores = appUsers.map(u => {
                let total = 0;
                const dayBreakdown: Record<number, number> = {};

                // Filtramos los puntos que pertenecen a este usuario
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
                days: matchdays || [],
                activeDays
            });
            setLoading(false);
        };

        fetchRanking();
    }, []);

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Sincronizando posiciones...</div>

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
        <div className="w-full flex flex-col items-center py-2 px-2">
            {/* Header Responsivo */}
            <div className="w-full flex flex-col md:grid md:grid-cols-3 items-center mb-6 px-2 md:px-8 gap-4">
                <div className="w-full flex justify-center md:justify-start">
                    <button
                        onClick={() => setShowFull(!showFull)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                    >
                        {showFull ? '← VOLVER' : 'DESGLOSE'}
                    </button>
                </div>

                <h2 className="text-xl font-black italic uppercase tracking-tighter text-center order-first md:order-none w-full">
                    <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
                </h2>

                <div className="w-full flex justify-center md:justify-end">
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

            {/* Contenedor de Tabla */}
            <div className="w-fit mx-auto">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="border-collapse table-auto">
                        <tbody>
                            {paginatedUsers.map((u, idx) => {
                                const globalPos = currentChunk[0] + idx + 1;
                                const isFirst = globalPos === 1;
                                const isMe = u.username === user?.username;
                                const hasError = imageErrors[u.username];
                                
                                // Evaluamos si el usuario faltó en alguna jornada que YA está activa
                                const missedAny = rankingData.days.some(day => 
                                    rankingData.activeDays.has(day.id) && u.dayBreakdown[day.id] === undefined
                                );

                                // Determinamos el color del nombre de usuario
                                const usernameColor = missedAny 
                                    ? 'text-red-500' 
                                    : isFirst 
                                        ? 'text-[#FFD300]' 
                                        : isMe 
                                            ? 'text-white' 
                                            : 'text-slate-300';

                                return (
                                    <tr key={u.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''} ${isMe ? 'bg-blue-500/10' : ''}`}>
                                        <td className="w-10 px-2 py-1 text-center border-r border-white/5 font-black italic text-[11px]">
                                            {isFirst ? <span className="text-xl">👑</span> : <span className={`${isMe ? 'text-white' : 'text-slate-600'}`}>{globalPos}</span>}
                                        </td>

                                        <td className="w-[120px] px-3 py-1 border-r border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 shadow-md flex items-center justify-center bg-slate-800 ${isFirst ? 'border-[#FFD300]' : isMe ? 'border-white' : 'border-white/10'}`}>
                                                    {!hasError ? (
                                                        <img 
                                                            src={`/usuarios/${u.username}.jpg`} 
                                                            alt={u.username} 
                                                            className="object-cover w-full h-full"
                                                            onError={() => setImageErrors(prev => ({...prev, [u.username]: true}))}
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-white uppercase">
                                                            {u.username.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`uppercase text-[10px] tracking-[0.1em] font-black ${usernameColor}`}>
                                                    {u.username}
                                                </span>
                                            </div>
                                        </td>

                                        {showFull && rankingData.days.map(day => {
                                            const isActive = rankingData.activeDays.has(day.id);
                                            const didNotSubmit = isActive && u.dayBreakdown[day.id] === undefined;

                                            return (
                                                <td key={day.id} className={`px-2 py-1 text-center border-l border-white/5 text-[10px] font-mono w-9 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                                    {didNotSubmit ? (
                                                        // Si no envió en una jornada pasada, ponemos una marca roja
                                                        <span className="text-red-500 font-bold">-</span>
                                                    ) : (
                                                        // Si envió (incluso si fue 0 puntos), o si es jornada futura, muestra sus puntos o vacío
                                                        <span className={u.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>
                                                            {u.dayBreakdown[day.id] !== undefined ? u.dayBreakdown[day.id] : ''}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        <td className={`w-16 px-4 py-1 text-center border-l border-white/10 font-black text-[14px] italic ${isFirst ? 'bg-[#FFD300] text-black' : isMe ? 'bg-white/10 text-white' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
                                            {u.total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
