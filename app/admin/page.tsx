'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
        
        {/* CABECERA */}
        <div className="relative flex items-center justify-center py-10 border-b border-white/5 bg-black/40">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-center">
                <span style={{ color: '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>PANEL CONTROL</span> 
                <span className="ml-2" style={{ color: '#FFD300', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>MUERTAZOS</span>
            </h1>
            
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="absolute right-10 bg-red-600/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-xs"
            >
                CERRAR SESIÓN
            </button>
        </div>
        
        {/* NAVEGACIÓN TABS */}
        <div className="flex justify-center gap-10 border-b border-slate-800 bg-black/20">
            <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
            <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
        </div>

        {/* CONTENEDOR MÁGICO PARA FULL WIDTH */}
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
            className="py-6 px-6 font-black italic tracking-tighter transition-all uppercase text-base hover:text-white"
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
                <div key={day.id} className="relative group w-full mb-8 border-y border-white/5">
                    
                    {/* HEADER JORNADA */}
                    <div className="w-full px-10 py-5 flex justify-between items-center bg-slate-900/40">
                        <div className="flex items-center gap-6">
                            <h3 style={{ color: colorHex }} className="text-3xl font-black italic uppercase tracking-tighter">{day.name}</h3>
                            
                            {/* SOLO FLECHAS */}
                            {totalPages > 1 && (
                                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                    <button 
                                        disabled={currentPage === 0}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className={`px-4 py-2 text-xs transition-all ${currentPage === 0 ? 'opacity-10 cursor-not-allowed' : 'hover:bg-white/10 active:scale-90'}`}
                                    >
                                        ◀
                                    </button>
                                    <div className="w-[1px] h-4 bg-white/10"></div>
                                    <button 
                                        disabled={currentPage === totalPages - 1}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className={`px-4 py-2 text-xs transition-all ${currentPage === totalPages - 1 ? 'opacity-10 cursor-not-allowed' : 'hover:bg-white/10 active:scale-90'}`}
                                    >
                                        ▶
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-6 py-2 text-xs font-black rounded-full border transition-all ${day.is_visible ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                {day.is_visible ? 'PÚBLICO' : 'OCULTO'}
                            </button>
                            <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-6 py-2 text-xs font-black rounded-full border transition-all ${day.is_locked ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}>
                                {day.is_locked ? 'BLOQUEADO' : 'ABIERTO'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full overflow-hidden">
                        <table className="w-full border-collapse table-fixed">
                            <thead>
                                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter">
                                    {/* PARTIDO CENTRADO */}
                                    <th className="w-[200px] p-6 text-center border-r border-white/5">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        /* COLUMNAS MÁS DELGADAS PARA EVITAR SCROLL */
                                        <th key={u.id} className="p-1 border-r border-white/5 bg-black/20">
                                            <div className="text-slate-200 text-center font-bold whitespace-normal leading-tight break-words px-1 uppercase min-h-[40px] flex items-center justify-center text-[10px]">
                                                {u.username}
                                            </div>
                                        </th>
                                    ))}
                                    {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                                        <th key={`empty-${i}`} className="p-1 border-r border-white/5"></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {day.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                        <td className="p-4 border-r border-white/5 bg-slate-900/30">
                                            <div className="flex items-center justify-center gap-4 px-2">
                                                {/* ESCUDOS MÁS GRANDES (w-14 h-14) */}
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/20 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'border-transparent opacity-30 hover:opacity-100'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={42} height={42} alt="h" className="object-contain" />}
                                                </button>
                                                <span className="text-[10px] font-black text-slate-700 italic">VS</span>
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/20 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'border-transparent opacity-30 hover:opacity-100'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={42} height={42} alt="a" className="object-contain" />}
                                                </button>
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            return (
                                                <td key={u.id} className="p-1 text-center border-r border-white/5">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <div className="flex justify-center">
                                                            <Image 
                                                                src={`/logos/${folder}/${pred.predicted_team.logo_file}`} 
                                                                width={48} height={48} 
                                                                className={`object-contain transition-all duration-500 ${isHit ? 'drop-shadow-[0_0_12px_rgba(34,197,94,1)] scale-110' : 'opacity-10 grayscale hover:opacity-40'}`} 
                                                                alt="p" 
                                                            />
                                                        </div>
                                                    ) : <span className="text-slate-800 font-bold text-sm">-</span>}
                                                </td>
                                            )
                                        })}
                                        {[...Array(Math.max(0, USERS_PER_PAGE - paginatedUsers.length))].map((_, i) => (
                                            <td key={`empty-td-${i}`} className="p-1 border-r border-white/5"></td>
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
    return <div className="w-full text-center py-40 text-slate-700 font-black italic text-4xl uppercase opacity-20">Clasificación General</div>
}