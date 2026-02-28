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
        
        {/* HEADER DEL PRIMER CÓDIGO */}
        <header className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-12 h-24 sticky top-0 z-50">
            <div className="flex gap-20 flex-1 justify-end pr-16">
                <TabBtn label="KINGS" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
                <TabBtn label="QUEENS" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            </div>

            <div className="flex-shrink-0 flex justify-center items-center">
                <div className="relative w-48 h-16 hover:scale-105 transition-transform duration-500 cursor-pointer">
                    <Image 
                      src="/Muertazos.png" 
                      alt="Muertazos Logo" 
                      fill 
                      className="object-contain"
                      priority 
                    />
                </div>
            </div>

            <div className="flex gap-20 flex-1 pl-16 items-center">
                <TabBtn label="RANKING" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
                
                <button 
                    onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                    className="ml-auto bg-red-600/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-md font-black hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase italic tracking-[0.2em]"
                >
                    SALIR
                </button>
            </div>
        </header>

        {/* CONTENIDO Y LÓGICA DEL SEGUNDO CÓDIGO */}
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
            {tab === 'ranking' ? <RankingView /> : <CompetitionAdmin key={tab} competitionKey={tab} />}
        </div>
    </div>
  )
}

// TABBTN DEL PRIMER CÓDIGO (Necesario para el estilo del header)
function TabBtn({label, active, onClick, activeColor}: any) {
    return (
        <button 
            onClick={onClick} 
            style={{ color: active ? activeColor : '#64748b' }} 
            className={`relative py-2 font-black italic tracking-[0.25em] transition-all duration-300 uppercase text-[18px] hover:text-white ${active ? 'scale-110' : 'scale-100'}`}
        >
            {label}
            <span 
                className={`absolute -bottom-1 left-0 h-[3px] rounded-full transition-all duration-500 ${active ? 'w-full opacity-100' : 'w-0 opacity-0'}`} 
                style={{backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}`}}
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
    
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio')
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54

    const load = async () => {
        const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')
        
        if (mData) { 
            mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) }); 
            setMatchdays(mData) 
            
            setActiveMatchdayId(prev => {
                if (!prev && mData.length > 0) return mData[0].id;
                if (prev && !mData.find(d => d.id === prev)) return mData[0].id;
                return prev;
            })
        }
        
        const fetchedUsers = uData || []
        setUsers(fetchedUsers)
        setAllPreds(pData || [])

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

    const toggleVisible = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load() }
    const toggleLock = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load() }
    const setWinner = async (matchId: number, teamId: number | null) => { await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load() }

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];
    const totalPages = pageChunks.length;
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-center flex-wrap gap-3 p-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setActiveMatchdayId(day.id)}
                        className={`px-5 py-2.5 text-[11px] font-black italic uppercase tracking-wider transition-all rounded-lg border shadow-sm ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {day.name}
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

                    {paginatedUsers.length > 0 && (
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
                                                    <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} 
                                                        className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer relative
                                                        ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] z-10 grayscale-0' : 
                                                          m.winner_team_id ? 'opacity-40 grayscale' : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}`}>
                                                        {m.home?.logo_file && <Image src={`/logos/${folder}/${m.home.logo_file}`} alt="home" width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} className="object-contain" />}
                                                    </button>
                                                    
                                                    <span className="text-[10px] font-black text-slate-600 italic">VS</span>
                                                    
                                                    <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} 
                                                        className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer relative
                                                        ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] z-10 grayscale-0' : 
                                                          m.winner_team_id ? 'opacity-40 grayscale' : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}`}>
                                                        {m.away?.logo_file && <Image src={`/logos/${folder}/${m.away.logo_file}`} alt="away" width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} className="object-contain" />}
                                                    </button>
                                                </div>
                                            </td>
                                            
                                            {paginatedUsers.map((u: any) => {
                                                const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                                const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                                return (
                                                    <td key={u.id} className="p-1 border-r border-white/5 bg-black/20 align-middle">
                                                        {pred?.predicted_team?.logo_file ? (
                                                            <div className={`flex justify-center transition-all duration-500 ${m.winner_team_id ? (isHit ? 'scale-110 drop-shadow-[0_0_12px_rgba(255,211,0,0.6)]' : 'grayscale opacity-10 scale-75') : ''}`}>
                                                                <Image src={`/logos/${folder}/${pred.predicted_team.logo_file}`} width={getLogoSize(pred.predicted_team.logo_file)} height={getLogoSize(pred.predicted_team.logo_file)} alt="p" />
                                                            </div>
                                                        ) : <span className="text-slate-800 font-bold">-</span>}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function RankingView() {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [loading, setLoading] = useState(true)
    
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 10

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

    if (loading) return <div className="p-20 text-center animate-pulse italic text-slate-500 font-bold tracking-widest">CARGANDO TABLA...</div>

    const totalPages = Math.ceil(rankingData.users.length / itemsPerPage)
    const paginatedRanking = rankingData.users.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

    return (
        <div className="w-full flex flex-col items-center py-10 px-6">
            <h2 className="text-3xl font-black italic mb-8 tracking-tighter uppercase">RANKING <span className="text-[#FFD300]">OFICIAL</span></h2>
            
            {totalPages > 1 && (
                <div className="flex gap-4 items-center mb-4">
                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 disabled:opacity-30 hover:bg-slate-800 transition-colors font-bold">◀</button>
                    <span className="text-xs font-bold text-slate-500 tracking-widest">PÁGINA {currentPage + 1} DE {totalPages}</span>
                    <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 disabled:opacity-30 hover:bg-slate-800 transition-colors font-bold">▶</button>
                </div>
            )}

            <div className="w-full max-w-2xl bg-slate-950/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 w-24 text-center">POS</th>
                            <th className="px-6 py-4">USUARIO</th>
                            <th className="px-6 py-4 text-right w-32">PUNTOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRanking.map((u, i) => {
                            const globalPos = (currentPage * itemsPerPage) + i + 1;
                            return (
                                <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors">
                                    <td className="px-6 py-4 text-center font-black italic text-slate-500 text-lg">#{globalPos}</td>
                                    <td className="px-6 py-4 font-bold uppercase tracking-wider text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-8 h-8 rounded-full border border-slate-700 overflow-hidden bg-slate-900">
                                                <Image src={`/usuarios/${u.username}.jpg`} alt="" fill className="object-cover" onError={(e:any) => e.target.style.display='none'} />
                                            </div>
                                            <span className="text-white drop-shadow-sm">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-[#FFD300] text-xl drop-shadow-[0_0_5px_rgba(255,211,0,0.3)]">{u.total}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}