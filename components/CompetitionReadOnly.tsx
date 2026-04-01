// components/CompetitionReadOnly.tsx
'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function CompetitionReadOnly({ competitionKey }: { competitionKey: string }) {
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
        // --- FILTRO: OCULTOS (is_visible: false) Y CERRADOS (is_locked: true) ---
        const { data: mData } = await supabase
            .from('matchdays')
            .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
            .eq('competition_key', competitionKey)
            .eq('is_visible', false) 
            .eq('is_locked', true)
            .order('display_order')

        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        
        if (mData && mData.length > 0) { 
            mData.forEach(day => { 
                if(day.matches) {
                    day.matches.sort((a: any, b: any) => (a.match_order ?? 99) - (b.match_order ?? 99));
                }
            }); 
            setMatchdays(mData) 
            setActiveMatchdayId(mData[0].id)
        } else {
            setMatchdays([])
        }
        
        const fetchedUsers = uData || []
        setUsers(fetchedUsers)

        if (fetchedUsers.length > 0) {
            // Validación para asignar 8 por página en móviles o 12 en PC
            const targetPerPage = typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 12;
            const pages = Math.ceil(fetchedUsers.length / targetPerPage);
            let chunks = [];
            for(let i=0; i<pages; i++) {
                chunks.push([i * targetPerPage, (i + 1) * targetPerPage]);
            }
            setPageChunks(chunks)
        }
    }
    
    useEffect(() => { load() }, [competitionKey])

    // 2. NUEVO HOOK: Cargar predicciones SOLO de la jornada activa
    useEffect(() => {
        const fetchPredictions = async () => {
            // Si no hay jornada activa o aún no cargan las jornadas, salimos
            if (!activeMatchdayId || matchdays.length === 0) return;

            // Buscamos los datos de la jornada que estamos viendo
            const activeDay = matchdays.find(d => d.id === activeMatchdayId);
            
            // Si la jornada no tiene partidos, limpiamos las predicciones
            if (!activeDay || !activeDay.matches || activeDay.matches.length === 0) {
                setAllPreds([]);
                return;
            }

            // Extraemos un arreglo solo con los IDs de los partidos de ESTA jornada
            const matchIds = activeDay.matches.map((m: any) => m.id);

            // Le pedimos a Supabase las predicciones donde el match_id esté en nuestra lista
            const { data: pData, error } = await supabase
                .from('predictions')
                .select('*, predicted_team:predicted_team_id(logo_file)')
                .in('match_id', matchIds); 

            if (!error && pData) {
                setAllPreds(pData);
            }
        };

        fetchPredictions();
    }, [activeMatchdayId, matchdays]); // Se ejecuta cada que cambias de pestaña de jornada

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
    const totalPages = pageChunks.length;
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    if (matchdays.length === 0) return (
        <div className="w-full text-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-slate-600 font-black italic text-2xl uppercase tracking-widest">No hay jornadas cerradas para mostrar</p>
        </div>
    )

    return (
        <div className="w-full flex flex-col items-center">
            {/* BARRA DE NAVEGACIÓN DE JORNADAS */}
            <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-4 bg-black/40 border-b border-white/5">
                {matchdays.map(day => (
                    <button
                        key={day.id}
                        onClick={() => {
                            setActiveMatchdayId(day.id)
                            setCurrentPage(0) // Reiniciar la página al cambiar de jornada por si acaso
                        }}
                        className={`px-4 py-2 text-[12px] font-black italic uppercase tracking-wider transition-all rounded-lg border ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105 shadow-[0_0_15px_rgba(255,211,0,0.3)]' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105 shadow-[0_0_15px_rgba(1,214,195,0.3)]')
                                : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'
                        }`}
                    >
                        {day.name.replace(/Jornada\s*/i, 'J')}
                    </button>
                ))}
            </div>

            {activeMatchday && (
                <div className="w-full">
                    {/* TÍTULO DE LA JORNADA Y PAGINACIÓN DE USUARIOS */}
                    <div className="w-full px-6 py-8 flex flex-row justify-center items-center gap-4 md:gap-8 bg-gradient-to-b from-black/20 to-transparent relative">
                        {/* Controles de Paginación Flotantes (Solo flechas) */}
                        {totalPages > 1 && (
                            <div className="flex items-center bg-black/60 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                <button 
                                    disabled={currentPage === 0} 
                                    onClick={() => setCurrentPage(prev => prev - 1)} 
                                    className={`px-6 py-2 text-sm font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                                >
                                    ◀
                                </button>
                                <button 
                                    disabled={currentPage === totalPages - 1} 
                                    onClick={() => setCurrentPage(prev => prev + 1)} 
                                    className={`px-6 py-2 text-sm font-black transition-colors ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}
                                >
                                    ▶
                                </button>
                            </div>
                        )}

                        <h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }} 
                            className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter drop-shadow-2xl">
                            {activeMatchday.name}
                        </h3>
                    </div>

                    {/* TABLA DE CONTENIDO */}
                    <div className="w-full overflow-x-auto pb-10">
                        <table className="w-full border-collapse table-fixed text-center min-w-[800px]">
                            <thead>
                                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                                    <th className="w-[200px] p-4 border-r border-white/5 align-middle">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="py-4 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 font-black text-xl">
                                                    {u.username.charAt(0).toUpperCase()}
                                                    <Image 
                                                        src={`/usuarios/${u.username}.jpg`} 
                                                        alt={u.username} 
                                                        fill 
                                                        sizes="56px" 
                                                        className="object-cover z-10" 
                                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                                    />
                                                </div>
                                                <span className="text-[11px] leading-tight truncate w-full px-1">{u.username}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activeMatchday.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                        <td className="py-2 px-2 border-r border-white/5 bg-slate-900/30">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 italic">VS</span>
                                                <div className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />}
                                                </div>
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            const hasWinner = m.winner_team_id !== null
                                            return (
                                                <td key={u.id} className="p-2 border-r border-white/5">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <div className="flex justify-center">
                                                            <Image 
                                                                src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                width={getLogoSize(pred.predicted_team.logo_file)} 
                                                                height={getLogoSize(pred.predicted_team.logo_file)} 
                                                                alt="p" 
                                                                // Aquí se bajó la intensidad del brillo (drop-shadow) en isHit
                                                                className={`transition-all duration-500 ${hasWinner ? (isHit ? 'opacity-100 drop-shadow-[0_0_4px_rgba(255,211,0,0.3)] scale-110' : 'opacity-10 grayscale scale-75') : 'opacity-100'}`} 
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

