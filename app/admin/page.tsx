'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

// Ajustamos la cantidad para que se vea bien en pantalla completa
const USERS_PER_PAGE = 14; 

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
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full overflow-x-hidden">
        
        {/* CABECERA */}
        <div className="relative flex items-center justify-center py-8 border-b border-white/5 bg-black/40">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-center">
                <span style={{ color: '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>PANEL CONTROL</span> 
                <span className="ml-2" style={{ color: '#FFD300', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>MUERTAZOS</span>
            </h1>
            
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="absolute right-10 bg-red-600/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-[10px]"
            >
                CERRAR SESIÓN
            </button>
        </div>
        
        {/* TABS */}
        <div className="flex justify-center gap-10 border-b border-slate-800 bg-black/20">
            <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
            <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
        </div>

        {/* CONTENEDOR FULL WIDTH REAL */}
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
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
            className="py-5 px-6 font-black italic tracking-tighter transition-all uppercase text-sm hover:text-white"
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
        <div className="w-full">
            {matchdays.map(day => (
                <div key={day.id} className="w-full mb-10 border-b border-white/5">
                    
                    {/* BARRA DE HERRAMIENTAS INTEGRADA */}
                    <div className="w-full px-10 py-4 flex justify-between items-center bg-slate-900/40">
                        <div className="flex items-center gap-6">
                            <h3 style={{ color: colorHex }} className="text-2xl font-black italic uppercase tracking-tighter">{day.name}</h3>
                            <div className="text-[10px] font-mono text-slate-500 bg-black/30 px-3 py-1 rounded border border-white/5 uppercase">
                                {day.date_label || 'Sin Fecha'}
                            </div>
                        </div>

                        {/* NAVEGACIÓN Y ACCIONES */}
                        <div className="flex items-center gap-4">
                            {/* GRUPOS NAVEGACIÓN */}
                            {totalPages > 1 && (
                                <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-1 mr-4">
                                    <button 
                                        disabled={currentPage === 0}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className={`px-3 py-1 rounded ${currentPage === 0 ? 'text-slate-700' : 'text-white hover:bg-white/10'}`}
                                    >
                                        ◀
                                    </button>
                                    <span className="px-4 text-[10px] font-black italic text-slate-400 border-x border-white/5 uppercase tracking-widest">
                                        Grupo {currentPage + 1}
                                    </span>
                                    <button 
                                        disabled={currentPage === totalPages - 1}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages - 1 ? 'text-slate-700' : 'text-white hover:bg-white/10'}`}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}

                            <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-4 py-1.5 text-[10px] font-black rounded border transition-all ${day.is_visible ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                {day.is_visible ? 'PÚBLICO' : 'OCULTO'}
                            </button>
                            <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-4 py-1.5 text-[10px] font-black rounded border transition-all ${day.is_locked ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                {day.is_locked ? 'CERRADO' : 'ABIERTO'}
                            </button>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="w-full">
                        <table className="w-full border-collapse table-fixed">
                            <thead>
                                <tr className="bg-black/40 text-[10px] text-slate-500 font-black uppercase">
                                    <th className="w-[160px] p-4 text-left border-r border-white/5">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="p-2 border-r border-white/5 bg-black/10">
                                            {/* TEXTO EN DOBLE LÍNEA */}
                                            <div className="text-slate-300 text-center font-bold whitespace-normal break-words leading-tight px-1 min-h-[30px] flex items-center justify-center uppercase tracking-tighter">
                                                {u.username}
                                            </div>
                                        </th>
                                    ))}
                                    {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                                        <th key={`empty-${i}`} className="p-2 border-r border-white/5"></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {day.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 border-r border-white/5 bg-slate-900/20">
                                            <div className="flex items-center justify-between gap-2 px-1">
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-transparent opacity-20 grayscale'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={34} height={34} alt="h" className="object-contain" />}
                                                </button>
                                                <span className="text-[9px] font-black text-slate-700 italic">VS</span>
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-transparent opacity-20 grayscale'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={34} height={34} alt="a" className="object-contain" />}
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
                                                                width={42} height={42} 
                                                                className={`object-contain transition-all ${isHit ? 'drop-shadow-[0_0_10px_rgba(34,197,94,1)] scale-110' : 'opacity-10 grayscale'}`} 
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
            ))}
        </div>
    )
}

function RankingView() {
    return <div className="w-full text-center py-40 text-slate-700 font-black italic uppercase opacity-20">Clasificación General</div>
}