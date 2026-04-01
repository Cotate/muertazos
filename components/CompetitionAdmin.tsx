// components/CompetitionAdmin.tsx
'use client'
import {{ useEffect, useState }} from 'react'
import Image from 'next/image'
import {{ supabase }} from '@/lib/supabase'

export default function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
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
