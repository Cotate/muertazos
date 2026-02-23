'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
        <div className="flex justify-center items-center border-b border-slate-800 bg-black/20 px-10">
            <div className="flex items-center gap-2">
                <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
                <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
                <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
                <button onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} className="ml-6 bg-red-600/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-lg font-black hover:bg-red-600 hover:text-white transition-all text-[11px] uppercase italic tracking-tighter">CERRAR SESIÓN</button>
            </div>
        </div>
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
            {tab === 'ranking' ? <RankingView /> : <CompetitionAdmin key={tab} competitionKey={tab} />}
        </div>
    </div>
  )
}

function TabBtn({label, active, onClick, activeColor}: any) {
    return (
        <button onClick={onClick} style={{ color: active ? activeColor : '#475569', borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent'}} className="py-6 px-6 font-black italic tracking-tighter transition-all uppercase text-sm hover:text-white">{label}</button>
    )
}

// --- FUNCIÓN DE DESCARGA ULTRA-ROBUSTA ---
const handleDownloadImg = async (elementId: string, filename: string, setLoader: (val: string | null) => void) => {
    setLoader(elementId);
    const element = document.getElementById(elementId);
    if (!element) { setLoader(null); return; }
    
    try {
        const { default: html2canvas } = await import('html2canvas');
        
        // 1. Asegurar carga y permisos de imágenes
        const images = element.getElementsByTagName('img');
        const loadPromises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                if (img.complete) resolve(img);
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img);
                // Forzar CORS y bust de caché
                img.crossOrigin = "anonymous";
                const currentSrc = img.src.split('?')[0];
                img.src = `${currentSrc}?t=${new Date().getTime()}`;
            });
        });

        await Promise.all(loadPromises);

        // 2. Ejecutar captura
        const canvas = await html2canvas(element, {
            backgroundColor: '#0a0a0a',
            scale: 2,
            useCORS: true,
            allowTaint: false,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(elementId);
                if (el) {
                    const logos = el.querySelectorAll('.export-logo');
                    logos.forEach(l => (l as HTMLElement).style.display = 'flex');
                    el.style.padding = '30px';
                    el.style.width = 'fit-content';
                }
            }
        });
        
        // 3. Descarga vía Blob
        canvas.toBlob((blob) => {
            if (!blob) throw new Error("Canvas vacio");
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.9);

    } catch (err) {
        console.error('Error de renderizado:', err);
        alert('Error al generar imagen. Intenta recargar la página.');
    } finally {
        setLoader(null);
    }
};

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
    const [matchdays, setMatchdays] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [allPreds, setAllPreds] = useState<any[]>([])
    const [currentPage, setCurrentPage] = useState(0)
    const [pageChunks, setPageChunks] = useState<number[][]>([])
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'
    
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio')
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54

    const load = async () => {
        const { data: mData } = await supabase.from('matchdays').select('*, matches(*, home:home_team_id(*), away:away_team_id(*))').eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        const { data: pData } = await supabase.from('predictions').select('*, predicted_team:predicted_team_id(logo_file)')
        
        if (mData) { mData.forEach(day => { if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id) }); setMatchdays(mData) }
        setUsers(uData || []); setAllPreds(pData || [])

        if (uData && uData.length > 0) {
            const perPage = 12;
            const pages = Math.ceil(uData.length / perPage);
            let chunks = [];
            for(let i=0; i<pages; i++) { chunks.push([i * perPage, (i + 1) * perPage]); }
            setPageChunks(chunks); setCurrentPage(0);
        }
    }
    
    useEffect(() => { load() }, [competitionKey])

    const toggleVisible = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_visible: !val }).eq('id', id); load() }
    const toggleLock = async (id: number, val: boolean) => { await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id); load() }
    const setWinner = async (matchId: number, teamId: number | null) => { await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId); load() }

    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : [];

    return (
        <div className="w-full">
            {matchdays.map(day => (
                <div id={`capture-day-${day.id}`} key={day.id} className="relative w-full mb-8 border-y border-white/5 bg-[#0a0a0a]">
                    <div className="export-logo hidden w-full justify-center flex-col items-center gap-2 pb-6 pt-4">
                        <h1 className="text-4xl font-black text-white italic tracking-widest uppercase">MUERTAZOS</h1>
                    </div>
                    <div className="w-full px-10 py-4 grid grid-cols-3 items-center bg-slate-900/40">
                        <div className="flex justify-start" data-html2canvas-ignore="true">
                            {pageChunks.length > 1 && (
                                <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className={`px-5 py-2 text-xs font-black transition-colors border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                                    <button disabled={currentPage === pageChunks.length - 1} onClick={() => setCurrentPage(prev => prev + 1)} className={`px-5 py-2 text-xs font-black transition-colors ${currentPage === pageChunks.length - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center"><h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }} className="text-3xl font-black italic uppercase tracking-tighter">{day.name}</h3></div>
                        <div className="flex justify-end gap-3 items-center" data-html2canvas-ignore="true">
                            <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-4 py-2 text-[10px] font-black rounded-full border ${day.is_visible ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{day.is_visible ? 'PÚBLICO' : 'OCULTO'}</button>
                            <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-4 py-2 text-[10px] font-black rounded-full border ${day.is_locked ? 'bg-red-600/20 text-red-400 border-red-500/30' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'}`}>{day.is_locked ? 'BLOQUEADO' : 'ABIERTO'}</button>
                            <button onClick={() => handleDownloadImg(`capture-day-${day.id}`, `Jornada_${day.id}`, setDownloadingId)} disabled={!!downloadingId} className="ml-2 px-5 py-2 text-[10px] font-black rounded-full bg-white text-black hover:bg-[#FFD300] transition-colors uppercase disabled:opacity-50">
                                {downloadingId === `capture-day-${day.id}` ? '...' : '↓ JPG'}
                            </button>
                        </div>
                    </div>
                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse table-fixed text-center min-w-[800px]">
                            <thead>
                                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                                    <th className="w-[180px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="py-2 px-1 border-r border-white/5 bg-black/20 text-slate-200 align-middle">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                                                    <img src={`/usuarios/${u.username}.jpg`} alt={u.username} className="object-cover w-full h-full" crossOrigin="anonymous" />
                                                </div>
                                                <span className="text-[10px] leading-tight truncate w-full px-1">{u.username}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {day.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                        <td className="py-1 px-2 border-r border-white/5 bg-slate-900/30">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.home && <img src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" crossOrigin="anonymous" />}
                                                </button>
                                                <span className="text-[9px] font-black text-slate-600 italic">VS</span>
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110' : m.winner_team_id === null ? 'opacity-100' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.away && <img src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" crossOrigin="anonymous" />}
                                                </button>
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            const hasWinner = m.winner_team_id !== null
                                            return (
                                                <td key={u.id} className="p-1 border-r border-white/5">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <div className="flex justify-center">
                                                            <img src={`/logos/${folder}/${pred.predicted_team.logo_file}`} width={getLogoSize(pred.predicted_team.logo_file)} height={getLogoSize(pred.predicted_team.logo_file)} alt="p" crossOrigin="anonymous" className={`transition-all duration-500 ${hasWinner ? (isHit ? 'opacity-100 scale-110' : 'opacity-15 grayscale scale-90') : 'opacity-100'}`} />
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
            ))}
        </div>
    )
}

function RankingView() {
    const [rankingData, setRankingData] = useState<{users: any[], days: any[]}>({users: [], days: []})
    const [showFull, setShowFull] = useState(false)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0) 
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const USERS_PER_PAGE = 17; 

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
            userScores?.sort((a, b) => b.total - a.total)
            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>
    const paginatedUsers = rankingData.users.slice(currentPage * USERS_PER_PAGE, (currentPage + 1) * USERS_PER_PAGE);

    return (
        <div id="capture-ranking" className="w-full flex flex-col items-center py-12 px-6 bg-[#0a0a0a]">
            <div className="export-logo hidden w-full justify-center flex-col items-center gap-2 pb-6 pt-4 text-center">
                 <h1 className="text-4xl font-black text-white italic tracking-widest uppercase">MUERTAZOS</h1>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-8"><span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span></h2>
            <div data-html2canvas-ignore="true" className="flex gap-4 items-center mb-8">
                <button onClick={() => setShowFull(!showFull)} className="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest italic transition-all border border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]">
                    {showFull ? '← RANKING' : 'DESGLOSE'}
                </button>
                <button onClick={() => handleDownloadImg('capture-ranking', 'Ranking_General', setDownloadingId)} disabled={!!downloadingId} className="px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest italic bg-white text-black hover:bg-[#FFD300] disabled:opacity-50">
                    {downloadingId === 'capture-ranking' ? '...' : '↓ JPG'}
                </button>
            </div>
            <div className="w-full max-w-4xl bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse table-auto">
                    <tbody>
                        {paginatedUsers.map((user, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                                <td className="w-6 px-1 py-2.5 text-center border-r border-white/5 font-black italic text-[11px] text-slate-600">{(currentPage * USERS_PER_PAGE) + idx + 1}</td>
                                <td className="w-[160px] max-w-[160px] px-3 py-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                            <img src={`/usuarios/${user.username}.jpg`} alt={user.username} className="object-cover w-full h-full" crossOrigin="anonymous" />
                                        </div>
                                        <span className="text-slate-300 font-black uppercase text-[22px] tracking-tighter truncate block group-hover:text-white">{user.username}</span>
                                    </div>
                                </td>
                                {showFull && rankingData.days.map(day => (
                                    <td key={day.id} className="px-1 py-2.5 text-center border-l border-white/5 text-[10px] font-mono w-8">
                                        <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                                    </td>
                                ))}
                                <td className="w-12 px-2 py-2.5 text-center bg-[#FFD300]/5 border-l border-white/10 font-black text-[#FFD300] text-sm italic">{user.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}