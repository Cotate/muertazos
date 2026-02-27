'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

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
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full font-sans">
        
        {/* HEADER PRINCIPAL */}
        <header className="w-full h-28 flex justify-between items-center px-12 bg-black border-b border-white/5 shadow-2xl relative z-50">
            
            {/* Izquierda: Ligas con más tamaño y separación */}
            <div className="flex gap-16 flex-1 justify-end pr-20">
                <TabBtn label="KINGS" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
                <TabBtn label="QUEENS" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            </div>

            {/* Centro: Logo */}
            <div className="flex-shrink-0 flex justify-center items-center">
                <div className="relative w-64 h-20 hover:scale-105 transition-transform duration-500 cursor-pointer">
                    <Image 
                      src="/Muertazos.png" 
                      alt="Muertazos Logo" 
                      fill 
                      className="object-contain"
                      priority 
                    />
                </div>
            </div>

            {/* Derecha: Ranking y Salir */}
            <div className="flex gap-16 flex-1 pl-20 items-center">
                <TabBtn label="RANKING" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
                
                <button 
                    onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                    className="ml-auto bg-red-600/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-full font-black hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase italic tracking-[0.2em] shadow-lg"
                >
                    SALIR
                </button>
            </div>
        </header>

        {/* CONTENIDO PESTAÑAS */}
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
            style={{ color: active ? activeColor : '#334155' }} 
            className={`relative py-2 font-black italic tracking-[0.25em] transition-all duration-300 uppercase text-[16px] hover:text-white ${active ? 'scale-110' : 'scale-100'}`}
        >
            {label}
            <span 
                className={`absolute -bottom-2 left-0 h-[4px] rounded-full transition-all duration-500 ${active ? 'w-full opacity-100' : 'w-0 opacity-0'}`} 
                style={{backgroundColor: activeColor, boxShadow: `0 0 20px ${activeColor}`}}
            />
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
    
    const getLogoSize = (filename: string) => filename?.toLowerCase().includes('pio') ? 40 : 54

    const load = async () => {
        const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')
        
        if (mData) { 
            mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) }); 
            setMatchdays(mData) 
            setActiveMatchdayId(prev => prev || (mData.length > 0 ? mData[0].id : null))
        }
        setUsers(uData || [])
        setAllPreds(pData || [])

        if (uData && uData.length > 0) {
            const targetPerPage = 12;
            const pages = Math.ceil(uData.length / targetPerPage);
            let chunks = []; 
            for(let i=0; i<pages; i++) {
                chunks.push([i * targetPerPage, (i + 1) * targetPerPage]);
            }
            setPageChunks(chunks)
        }
    }
    
    useEffect(() => { load() }, [competitionKey])

    const toggleVisible = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load() }
    const toggleLock = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load() }
    const setWinner = async (matchId: number, teamId: number | null) => { await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load() }

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    return (
        <div className="w-full flex flex-col items-center">
            
            {/* SECTOR JORNADAS COMPACTO */}
            <div className="w-full flex justify-center gap-8 py-3 bg-black/40 border-b border-white/5">
                {matchdays.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setActiveMatchdayId(day.id)}
                        className={`relative px-2 py-1 text-[13px] font-black italic transition-all duration-300 ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'text-[#FFD300]' : 'text-[#01d6c3]')
                                : 'text-slate-600 hover:text-slate-400'
                        }`}
                    >
                        {day.name.replace(/jornada\s*/i, 'J')}
                        {activeMatchdayId === day.id && (
                            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-current" />
                        )}
                    </button>
                ))}
            </div>

            {activeMatchday && (
                <div className="w-full">
                    {/* CONTROLES DE JORNADA */}
                    <div className="w-full px-10 py-3 grid grid-cols-3 items-center bg-white/[0.02] border-b border-white/5">
                        <div className="flex gap-2">
                            {pageChunks.length > 1 && (
                                <>
                                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 rounded border border-white/10 disabled:opacity-20 hover:bg-white/5">◀</button>
                                    <button disabled={currentPage === pageChunks.length - 1} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 rounded border border-white/10 disabled:opacity-20 hover:bg-white/5">▶</button>
                                </>
                            )}
                        </div>
                        <div className="text-center font-black italic text-xl tracking-tighter" style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }}>
                            {activeMatchday.name.toUpperCase()}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={()=>toggleVisible(activeMatchday.id, activeMatchday.is_visible)} className={`px-4 py-1 text-[9px] font-black rounded border transition-all ${activeMatchday.is_visible ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-slate-700 text-slate-500'}`}>
                                {activeMatchday.is_visible ? 'PÚBLICO' : 'OCULTO'}
                            </button>
                            <button onClick={()=>toggleLock(activeMatchday.id, activeMatchday.is_locked)} className={`px-4 py-1 text-[9px] font-black rounded border transition-all ${activeMatchday.is_locked ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10'}`}>
                                {activeMatchday.is_locked ? 'BLOQUEADO' : 'ABIERTO'}
                            </button>
                        </div>
                    </div>

                    {/* TABLA DE ADMINISTRACIÓN */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse table-fixed text-center">
                            <thead>
                                <tr className="text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5">
                                    <th className="w-[140px] p-4 bg-black/20">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="py-4 border-l border-white/5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="relative w-10 h-10 rounded-full border border-white/10 bg-slate-900 overflow-hidden">
                                                    <Image src={`/usuarios/${u.username}.jpg`} alt="" fill className="object-cover" onError={(e:any) => e.target.style.display='none'} />
                                                    <span className="flex items-center justify-center h-full text-[10px] uppercase">{u.username[0]}</span>
                                                </div>
                                                <span className="truncate w-16 opacity-60 italic">{u.username}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activeMatchday.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-2 bg-black/30">
                                            <div className="flex items-center justify-center gap-1">
                                                <TeamBtn team={m.home} isWinner={m.winner_team_id === m.home_team_id} folder={folder} size={getLogoSize(m.home?.logo_file)} onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} />
                                                <span className="text-[8px] font-black text-slate-700 italic">VS</span>
                                                <TeamBtn team={m.away} isWinner={m.winner_team_id === m.away_team_id} folder={folder} size={getLogoSize(m.away?.logo_file)} onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} />
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            return (
                                                <td key={u.id} className="p-1 border-l border-white/5">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <div className={`flex justify-center transition-all duration-500 ${m.winner_team_id ? (isHit ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,211,0,0.4)]' : 'grayscale opacity-10 scale-75') : ''}`}>
                                                            <Image src={`/logos/${folder}/${pred.predicted_team.logo_file}`} width={getLogoSize(pred.predicted_team.logo_file)} height={getLogoSize(pred.predicted_team.logo_file)} alt="p" />
                                                        </div>
                                                    ) : <span className="text-slate-800">-</span>}
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

function TeamBtn({team, isWinner, folder, size, onClick}: any) {
    if (!team) return <div className="w-12 h-12" />
    return (
        <button onClick={onClick} className={`w-14 h-14 flex items-center justify-center rounded-lg transition-all ${isWinner ? 'bg-white/10 scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
            <Image src={`/logos/${folder}/${team.logo_file}`} width={size} height={size} alt="t" />
        </button>
    )
}

function RankingView() {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRanking = async () => {
            const { data: lockedDays } = await supabase.from('matchdays').select('id, name').eq('is_locked', true).order('display_order')
            const { data: matches } = await supabase.from('matches').select('id, winner_team_id, matchday_id').not('winner_team_id', 'is', null)
            const { data: predictions } = await supabase.from('predictions').select('user_id, match_id, predicted_team_id')
            const { data: appUsers } = await supabase.from('app_users').select('id, username').neq('role', 'admin')
            
            const userScores = appUsers?.map(u => {
                let total = 0
                lockedDays?.forEach(day => {
                    matches?.filter(m => m.matchday_id === day.id).forEach(m => {
                        const p = predictions?.find(pred => pred.user_id === u.id && pred.match_id === m.id)
                        if (p && p.predicted_team_id === m.winner_team_id) total++
                    })
                })
                return { username: u.username, total }
            }).sort((a, b) => b.total - a.total)
            
            setRankingData({ users: userScores || [], days: lockedDays || [] })
            setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="p-20 text-center animate-pulse italic text-slate-500">CARGANDO TABLA...</div>

    return (
        <div className="w-full flex flex-col items-center py-10 px-6">
            <h2 className="text-3xl font-black italic mb-8 tracking-tighter">RANKING <span className="text-[#FFD300]">OFICIAL</span></h2>
            <div className="w-full max-w-2xl bg-black border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="px-6 py-4 w-20 text-center">POS</th>
                            <th className="px-6 py-4">USUARIO</th>
                            <th className="px-6 py-4 text-right w-32">PUNTOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankingData.users.map((u, i) => (
                            <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                <td className="px-6 py-4 text-center font-black italic text-slate-500">#{i+1}</td>
                                <td className="px-6 py-4 font-bold uppercase tracking-wider text-sm">{u.username}</td>
                                <td className="px-6 py-4 text-right font-black text-[#FFD300] text-lg">{u.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}