'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// Aumentamos los usuarios por página para que ocupen más espacio horizontal
const USERS_PER_PAGE = 15; 

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
    /* Eliminamos cualquier max-width y padding lateral del contenedor principal */
    <div className="min-h-screen bg-[#0a0a0a] pb-20 w-full text-white overflow-x-hidden">
        
        {/* CABECERA */}
        <div className="relative flex items-center justify-center py-8 w-full border-b border-white/5">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-center">
                <span style={{ color: '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>PANEL CONTROL</span> 
                <span className="ml-2" style={{ color: '#FFD300', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>MUERTAZOS</span>
            </h1>
            
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="absolute right-6 bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-[10px]"
            >
                CERRAR SESIÓN
            </button>
        </div>
        
        {/* NAVEGACIÓN TABS - Ahora ocupa todo el ancho también */}
        <div className="flex justify-center gap-12 border-b border-slate-800 w-full bg-black/20">
            <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
            <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
        </div>

        {/* CONTENEDOR DE CONTENIDO - Forzado a ocupar el 100% real */}
        <div className="w-full">
            {tab === 'ranking' ? <RankingView /> : <CompetitionAdmin key={tab} competitionKey={tab} />}
        </div>
    </div>
  )
}

function TabBtn({label, active, onClick, activeColor}: any) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                color: active ? activeColor : '#475569',
                borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent',
            }}
            className="py-5 px-4 font-black italic tracking-tighter transition-all uppercase text-sm hover:text-white"
        >
            {label}
        </button>
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

    const load = async () => {
        const { data: mData } = await supabase
            .from('matchdays')
            .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
            .eq('competition_key', competitionKey)
            .order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')

        if (mData) {
            mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) })
            setMatchdays(mData)
        }
        setUsers(uData || [])
        setAllPreds(pData || [])
    }

    useEffect(() => { load() }, [competitionKey])

    const toggleVisible = async (id: number, val: boolean) => {
        await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load()
    }
    const toggleLock = async (id: number, val: boolean) => {
        await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load()
    }
    const setWinner = async (matchId: number, teamId: number | null) => {
        await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load()
    }

    const colorHex = competitionKey === 'kings' ? '#ffd300' : '#01d6c3'

    return (
        <div className="w-full relative">
            {matchdays.map(day => (
                <div key={day.id} className="relative group w-full mb-1">
                    
                    {/* BOTONES LATERALES PEQUEÑOS Y FIJOS AL BORDE */}
                    {totalPages > 1 && (
                        <>
                            {currentPage > 0 && (
                                <button 
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] w-10 h-16 bg-black/60 backdrop-blur-md border border-white/10 rounded-r-xl flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                >
                                    <span className="text-lg">◀</span>
                                </button>
                            )}
                            {currentPage < totalPages - 1 && (
                                <button 
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] w-10 h-16 bg-black/60 backdrop-blur-md border border-white/10 rounded-l-xl flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                >
                                    <span className="text-lg">▶</span>
                                </button>
                            )}
                        </>
                    )}

                    <div className="w-full border-b border-slate-800 bg-slate-900/10">
                        {/* HEADER JORNADA - SIN MARGENES */}
                        <div className="w-full px-6 py-4 flex justify-between items-center bg-slate-800/20">
                            <div className="flex items-center gap-6">
                                <h3 style={{ color: colorHex }} className="text-2xl font-black italic uppercase tracking-tighter">{day.name}</h3>
                                {totalPages > 1 && (
                                    <div className="flex gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${currentPage === i ? 'bg-white' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-4 py-2 text-[11px] font-black rounded border transition-all ${day.is_visible ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    {day.is_visible ? 'PÚBLICO' : 'OCULTO'}
                                </button>
                                <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-4 py-2 text-[11px] font-black rounded border transition-all ${day.is_locked ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                    {day.is_locked ? 'CERRADO' : 'ABIERTO'}
                                </button>
                            </div>
                        </div>

                        {/* TABLA REALMENTE FULL WIDTH */}
                        <div className="w-full">
                            <table className="w-full border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-black/40 text-[10px] text-slate-500 font-black uppercase">
                                        <th className="w-[140px] p-4 text-left border-r border-white/5">PARTIDO</th>
                                        {paginatedUsers.map(u => (
                                            <th key={u.id} className="p-2 border-r border-white/5 truncate">
                                                <span className="text-slate-300">{u.username}</span>
                                            </th>
                                        ))}
                                        {/* Celdas vacías para mantener el ancho si hay pocos usuarios en la última página */}
                                        {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                                            <th key={`empty-${i}`} className="p-2 border-r border-white/5"></th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {day.matches?.map((m: any) => (
                                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-3 border-r border-white/5 bg-black/20">
                                                <div className="flex items-center justify-between">
                                                    <button onClick={()=>setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'border-transparent grayscale opacity-30 hover:opacity-100 hover:grayscale-0'}`}>
                                                        {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={32} height={32} alt="h" className="object-contain" />}
                                                    </button>
                                                    <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                                                    <button onClick={()=>setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'border-transparent grayscale opacity-30 hover:opacity-100 hover:grayscale-0'}`}>
                                                        {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={32} height={32} alt="a" className="object-contain" />}
                                                    </button>
                                                </div>
                                            </td>
                                            {paginatedUsers.map(u => {
                                                const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                                const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                                return (
                                                    <td key={u.id} className="p-2 text-center border-r border-white/5">
                                                        {pred?.predicted_team?.logo_file ? (
                                                            <div className="flex justify-center">
                                                                <Image 
                                                                    src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                    width={40} height={40} 
                                                                    className={`object-contain transition-all ${isHit ? 'drop-shadow-[0_0_8px_rgba(34,197,94,1)] scale-110' : 'opacity-10 grayscale'}`} 
                                                                    alt="p" 
                                                                />
                                                            </div>
                                                        ) : <span className="text-slate-800 font-bold text-xs">-</span>}
                                                    </td>
                                                )
                                            })}
                                            {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                                                <td key={`empty-td-${i}`} className="p-2 border-r border-white/5"></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function RankingView() {
    return <div className="w-full text-center py-20 text-slate-600 font-black italic uppercase">Sección de Ranking (Full Width)</div>
}