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
            
            userScores?.sort((a, b) => {
                if (b.total !== a.total) return b.total - a.total;
                return a.username.localeCompare(b.username);
            });
            
            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>

    const totalPages = Math.ceil(rankingData.users.length / USERS_PER_PAGE_RANKING);
    const paginatedUsers = rankingData.users.slice(currentPage * USERS_PER_PAGE_RANKING, (currentPage + 1) * USERS_PER_PAGE_RANKING);

    return (
        <div className="w-full flex flex-col items-center py-8 px-6">
            
            {/* Header de la Tabla: Botón Izq | Título | Flechas Der */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                
                {/* Lado Izquierdo: Botón Desglose */}
                <div className="flex-1 flex justify-start">
                    <button 
                        onClick={() => setShowFull(!showFull)} 
                        className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 border ${showFull ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}
                    >
                        {showFull ? '← VOLVER' : 'VER DESGLOSE JORNADAS'}
                    </button>
                </div>

                {/* Centro: Título */}
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center px-8 shrink-0">
                    <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
                </h2>
                
                {/* Lado Derecho: Paginación */}
                <div className="flex-1 flex justify-end">
                    {totalPages > 1 && (
                        <div className="flex items-center bg-slate-900/60 rounded-lg border border-white/10 overflow-hidden h-[38px] shadow-lg">
                            <button 
                                disabled={currentPage === 0} 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                className={`px-4 h-full text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            >
                                ◀
                            </button>
                            <button 
                                disabled={currentPage === totalPages - 1} 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                className={`px-4 h-full text-xs font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                            >
                                ▶
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-2xl">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse table-auto">
                        <tbody>
                            {paginatedUsers.map((user, idx) => {
                                const globalIdx = (currentPage * USERS_PER_PAGE_RANKING) + idx;
                                const isFirst = globalIdx === 0;

                                return (
                                    <tr key={idx} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5 border-l-4 border-l-[#FFD300]' : ''}`}>
                                        <td className={`w-8 px-2 py-1.5 text-center border-r border-white/5 font-black italic text-xs ${isFirst ? 'text-[#FFD300]' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                            {globalIdx + 1}
                                        </td>
                                        <td className="w-[180px] max-w-[180px] px-4 py-1.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-md flex items-center justify-center bg-slate-800 font-bold text-sm border ${isFirst ? 'border-[#FFD300]' : 'border-white/10 text-slate-400'}`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                    <Image src={`/usuarios/${user.username}.jpg`} alt={user.username} fill sizes="32px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                                <span className={`font-medium uppercase text-sm tracking-widest truncate block ${isFirst ? 'text-[#FFD300] font-black' : 'text-slate-300 group-hover:text-white'}`}>
                                                    {isFirst && <span className="mr-1">👑</span>}
                                                    {user.username}
                                                </span>
                                            </div>
                                        </td>
                                        {showFull && rankingData.days.map(day => (
                                            <td key={day.id} className={`px-1 py-1.5 text-center border-l border-white/5 text-[10px] font-mono w-8 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                                <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                                            </td>
                                        ))}
                                        <td className={`w-12 px-2 py-1.5 text-center border-l border-white/10 font-black text-sm italic ${isFirst ? 'bg-[#FFD300] text-black' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>
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