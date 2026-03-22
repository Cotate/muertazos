'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

/* ══════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
══════════════════════════════════════════════════════ */
export default function AdminDashboard() {
    const router = useRouter()
    const [tab, setTab]           = useState<'kings' | 'queens' | 'ranking' | 'simulator'>('kings')
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
        if (user.role !== 'admin') { router.push('/'); return }
        document.body.style.backgroundColor = '#0a0a0a'
        return () => { document.body.style.backgroundColor = '' }
    }, [router])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white w-full overflow-x-hidden">
            {/* HEADER */}
            <header className="w-full h-16 md:h-20 flex items-center justify-between bg-slate-950 border-b border-slate-800 shadow-lg px-4 md:px-8 sticky top-0 z-50">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-1.5 rounded-lg hover:bg-white/10" aria-label="Menú">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                        </svg>
                    </button>
                    <nav className="hidden lg:flex items-center gap-8 h-full">
                        <TabBtn label="KINGS"  active={tab === 'kings'}  onClick={() => setTab('kings')}  activeColor="#ffd300" />
                        <TabBtn label="QUEENS" active={tab === 'queens'} onClick={() => setTab('queens')} activeColor="#01d6c3" />
                    </nav>
                </div>
                <div className="flex-shrink-0">
                    <div className="relative w-32 h-9 md:w-44 md:h-12 hover:scale-105 transition-transform cursor-pointer">
                        <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <nav className="hidden lg:flex items-center gap-8 h-full">
                        <TabBtn label="RANKING"   active={tab === 'ranking'}   onClick={() => setTab('ranking')}   activeColor="#FFFFFF" />
                        <TabBtn label="SIMULADOR" active={tab === 'simulator'} onClick={() => setTab('simulator')} activeColor="#FF5733" />
                    </nav>
                    <button onClick={() => { localStorage.removeItem('muertazos_user'); router.push('/') }}
                        className="bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-1.5 md:px-6 md:py-2 rounded-lg font-black hover:bg-red-600 hover:text-white transition-all text-[9px] md:text-[10px] uppercase italic tracking-[0.15em]">
                        SALIR
                    </button>
                </div>
            </header>

            {/* MENÚ MÓVIL */}
            {menuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                        <div className="h-16 flex items-center px-6 border-b border-slate-800">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">ADMIN PANEL</span>
                        </div>
                        <nav className="flex-1 flex flex-col gap-1 p-4">
                            {([
                                { label: 'KINGS', val: 'kings' as const, color: '#ffd300' },
                                { label: 'QUEENS', val: 'queens' as const, color: '#01d6c3' },
                                { label: 'RANKING', val: 'ranking' as const, color: '#ffffff' },
                                { label: 'SIMULADOR', val: 'simulator' as const, color: '#FF5733' },
                            ] as const).map(item => (
                                <button key={item.val} onClick={() => { setTab(item.val); setMenuOpen(false) }}
                                    style={{ color: tab === item.val ? item.color : undefined }}
                                    className={`text-left px-4 py-3 rounded-xl font-black italic text-lg uppercase ${tab === item.val ? 'bg-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'}`}>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* CONTENIDO */}
            <div className="w-full overflow-x-hidden">
                {tab === 'ranking'   ? <RankingView />
               : tab === 'simulator' ? <SimulatorView />
               : <CompetitionAdmin key={tab} competitionKey={tab} />}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════
   TAB BUTTON
══════════════════════════════════════════════════════ */
function TabBtn({ label, active, onClick, activeColor }: { label: string; active: boolean; onClick: () => void; activeColor: string }) {
    return (
        <button onClick={onClick}
            style={{ color: active ? activeColor : '#475569', borderBottom: active ? `3px solid ${activeColor}` : '3px solid transparent' }}
            className="h-16 md:h-20 px-2 font-black italic tracking-tighter transition-all uppercase text-base md:text-lg hover:text-white">
            {label}
        </button>
    )
}

/* ══════════════════════════════════════════════════════
   COMPETITION ADMIN  (Kings / Queens)
══════════════════════════════════════════════════════ */
function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
    const [matchdays, setMatchdays]               = useState<any[]>([])
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
    const [users, setUsers]                       = useState<any[]>([])
    const [rawUsers, setRawUsers]                 = useState<any[]>([])
    const [allPreds, setAllPreds]                 = useState<any[]>([])
    const [currentPage, setCurrentPage]           = useState(0)
    const [pageChunks, setPageChunks]             = useState<number[][]>([])
    const [usersPerPage, setUsersPerPage]         = useState(12)

    const folder      = competitionKey === 'kings' ? 'Kings' : 'Queens'
    const isPio       = (f: string) => f?.toLowerCase().includes('pio')
    const getLogoSize = (f: string) => isPio(f) ? 38 : 54

    /* Página responsiva según ancho de pantalla */
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth
            setUsersPerPage(w < 640 ? 3 : w < 1024 ? 6 : 12)
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    /* Re-paginar cuando cambian usuarios o tamaño de página */
    useEffect(() => {
        if (rawUsers.length === 0) return
        const perPage   = usersPerPage
        const pages     = Math.ceil(rawUsers.length / perPage)
        const base      = Math.floor(rawUsers.length / pages)
        const remainder = rawUsers.length % pages
        let chunks: number[][] = [], start = 0
        for (let i = 0; i < pages; i++) {
            const size = base + (i < remainder ? 1 : 0)
            chunks.push([start, start + size])
            start += size
        }
        setPageChunks(chunks)
        setUsers(rawUsers)
        setCurrentPage(p => Math.min(p, Math.max(0, chunks.length - 1)))
    }, [rawUsers, usersPerPage])

    /* Carga inicial */
    const load = async () => {
        const { data: mData } = await supabase
            .from('matchdays')
            .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
            .eq('competition_key', competitionKey).order('display_order')
        const { data: uData } = await supabase
            .from('app_users').select('id, username').neq('role', 'admin').order('username')

        if (mData) {
            mData.forEach(day => {
                if (day.matches) day.matches.sort((a: any, b: any) =>
                    a.match_order !== b.match_order ? (a.match_order ?? 99) - (b.match_order ?? 99) : a.id - b.id)
            })
            setMatchdays(mData)
            setActiveMatchdayId(prev => {
                const vis = mData.find((d: any) => d.is_visible === true)
                if (!prev) return vis ? vis.id : mData.length > 0 ? mData[0].id : null
                if (!mData.find((d: any) => d.id === prev)) return vis ? vis.id : mData.length > 0 ? mData[0].id : null
                return prev
            })
        }
        setRawUsers(uData || [])
    }

    useEffect(() => { load() }, [competitionKey])

    /* Predicciones de la jornada activa */
    useEffect(() => {
        const fetchPreds = async () => {
            if (!activeMatchdayId || matchdays.length === 0) return
            const activeDay = matchdays.find(d => d.id === activeMatchdayId)
            if (!activeDay?.matches?.length) { setAllPreds([]); return }
            const matchIds = activeDay.matches.map((m: any) => m.id)
            const { data, error } = await supabase
                .from('predictions').select('*, predicted_team:predicted_team_id(logo_file)').in('match_id', matchIds)
            if (!error && data) setAllPreds(data)
        }
        fetchPreds()
    }, [activeMatchdayId, matchdays])

    const toggleVisible = async (id: number, cur: boolean) => {
        if (!id) return
        if (!cur) await supabase.from('matchdays').update({ is_visible: false }).eq('competition_key', competitionKey)
        await supabase.from('matchdays').update({ is_visible: !cur }).eq('id', id)
        load()
    }
    const toggleLock = async (id: number, val: boolean) => {
        if (!id) return
        await supabase.from('matchdays').update({ is_locked: !val }).eq('id', id)
        load()
    }
    const setWinner = async (matchId: number, teamId: number | null) => {
        await supabase.from('matches').update({ winner_team_id: teamId }).eq('id', matchId)
        load()
    }

    const totalPages     = pageChunks.length
    const paginatedUsers = pageChunks.length > 0 ? users.slice(pageChunks[currentPage][0], pageChunks[currentPage][1]) : []
    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

    return (
        <div className="w-full flex flex-col items-center overflow-x-hidden">

            {/* Selector de jornada */}
            <div className="w-full flex justify-center flex-wrap gap-2 py-3 px-4 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button key={day.id} onClick={() => setActiveMatchdayId(day.id)}
                        className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider transition-all rounded border shadow-sm ${
                            activeMatchdayId === day.id
                                ? (competitionKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                        }`}
                    >{day.name.replace(/Jornada\s*/i, 'J')}</button>
                ))}
            </div>

            {activeMatchday && (
                <div className="w-full mb-8">

                    {/* BARRA DE CONTROL — apilada en mobile */}
                    <div className="w-full px-4 py-2 bg-slate-900/40 border-b border-white/5 flex flex-col gap-2">
                        {/* Fila superior: nombre de jornada centrado */}
                        <div className="flex justify-center">
                            <h3 style={{ color: competitionKey === 'kings' ? '#ffd300' : '#01d6c3' }}
                                className="text-lg md:text-3xl font-black italic uppercase tracking-tighter">
                                {activeMatchday.name}
                            </h3>
                        </div>
                        {/* Fila inferior: paginación izq · estado der */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-shrink-0 min-w-[80px]">
                                {totalPages > 1 && (
                                    <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                        <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}
                                            className={`px-3 py-1.5 text-xs font-black border-r border-white/10 ${currentPage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                                        <span className="px-2 text-[9px] text-slate-500 font-bold tabular-nums">{currentPage + 1}/{totalPages}</span>
                                        <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}
                                            className={`px-3 py-1.5 text-xs font-black border-l border-white/10 ${currentPage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => toggleVisible(activeMatchday.id, activeMatchday.is_visible)}
                                    className={`px-3 md:px-5 py-1 text-[9px] md:text-[10px] font-black rounded-full border whitespace-nowrap ${activeMatchday.is_visible ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    {activeMatchday.is_visible ? 'PÚBLICO' : 'OCULTO'}
                                </button>
                                <button onClick={() => toggleLock(activeMatchday.id, activeMatchday.is_locked)}
                                    className={`px-3 md:px-5 py-1 text-[9px] md:text-[10px] font-black rounded-full border whitespace-nowrap ${activeMatchday.is_locked ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                    {activeMatchday.is_locked ? 'BLOQUEADO' : 'ABIERTO'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de predicciones */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse table-fixed text-center" style={{ minWidth: 280 }}>
                            <thead>
                                <tr className="bg-black/60 text-[11px] text-slate-500 font-black uppercase tracking-tighter border-b border-white/5">
                                    <th className="w-[110px] sm:w-[150px] p-2 border-r border-white/5 align-middle">PARTIDO</th>
                                    {paginatedUsers.map(u => (
                                        <th key={u.id} className="py-2 px-0.5 border-r border-white/5 bg-black/20 align-middle">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 flex items-center justify-center text-slate-500 font-black text-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                    <Image src={`/usuarios/${u.username}.jpg`} alt={u.username} fill sizes="44px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                                <span className="text-[8px] leading-tight truncate w-full px-0.5 text-slate-200">{u.username}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {activeMatchday.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                        <td className="py-1 px-1 border-r border-white/5 bg-slate-900/30">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)}
                                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${m.winner_team_id === m.home_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />}
                                                </button>
                                                <span className="text-[7px] font-black text-slate-600 italic">VS</span>
                                                <button onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)}
                                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${m.winner_team_id === m.away_team_id ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : m.winner_team_id === null ? 'opacity-100 hover:scale-105' : 'opacity-20 grayscale scale-90'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />}
                                                </button>
                                            </div>
                                        </td>
                                        {paginatedUsers.map(u => {
                                            const pred   = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit  = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            const hasWin = m.winner_team_id !== null
                                            return (
                                                <td key={u.id} className="p-0.5 border-r border-white/5">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <div className="flex justify-center">
                                                            <Image src={`/logos/${folder}/${pred.predicted_team.logo_file}`}
                                                                width={getLogoSize(pred.predicted_team.logo_file)} height={getLogoSize(pred.predicted_team.logo_file)} alt="p"
                                                                className={`transition-all duration-500 ${hasWin ? (isHit ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,211,0,0.4)] scale-110' : 'opacity-15 grayscale scale-90') : 'opacity-100'}`} />
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

/* ══════════════════════════════════════════════════════
   RANKING VIEW
══════════════════════════════════════════════════════ */
function RankingView() {
    const [rankingData, setRankingData] = useState<{ users: any[]; days: any[] }>({ users: [], days: [] })
    const [showFull, setShowFull]       = useState(false)
    const [loading, setLoading]         = useState(true)
    const [currentPage, setCurrentPage] = useState(0)

    useEffect(() => {
        const fetchRanking = async () => {
            const { data: lockedDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('display_order')
            if (!lockedDays?.length) { setRankingData({ users: [], days: [] }); setLoading(false); return }
            const { data: matches }     = await supabase.from('matches').select('id, winner_team_id, matchday_id').in('matchday_id', lockedDays.map(d => d.id)).not('winner_team_id', 'is', null)
            const { data: predictions } = await supabase.from('predictions').select('user_id, match_id, predicted_team_id').in('match_id', matches?.map(m => m.id) || [])
            const { data: appUsers }    = await supabase.from('app_users').select('id, username').neq('role', 'admin')
            const userScores = appUsers?.map(u => {
                let total = 0; const dayBreakdown: any = {}
                lockedDays.forEach(day => {
                    let dayHits = 0
                    matches?.filter(m => m.matchday_id === day.id).forEach(m => {
                        const up = predictions?.find(p => p.user_id === u.id && p.match_id === m.id)
                        if (up && up.predicted_team_id === m.winner_team_id) dayHits++
                    })
                    dayBreakdown[day.id] = dayHits; total += dayHits
                })
                return { username: u.username, total, dayBreakdown }
            })
            userScores?.sort((a, b) => b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username))
            setRankingData({ users: userScores || [], days: lockedDays }); setLoading(false)
        }
        fetchRanking()
    }, [])

    if (loading) return <div className="py-20 text-center animate-pulse text-slate-500 font-black italic uppercase">Generando tabla...</div>

    const allUsers   = rankingData.users
    const pageChunks: number[][] = []
    for (let i = 0; i < allUsers.length; i += 15) pageChunks.push([i, Math.min(i + 15, allUsers.length)])
    const totalPages = pageChunks.length || 1
    const safePage   = Math.min(currentPage, totalPages - 1)
    const chunk      = pageChunks[safePage] || [0, 0]
    const paginated  = allUsers.slice(chunk[0], chunk[1])

    return (
        <div className="w-full flex flex-col items-center py-4 px-4 overflow-x-hidden">

            {/* Controles: apilados en mobile, bien centrados */}
            <div className="w-full flex flex-col items-center gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-center">
                    <span className="text-white">TABLA DE</span> <span className="text-[#FFD300]">POSICIONES</span>
                </h2>
                <div className="flex items-center justify-center gap-4 w-full max-w-xs">
                    <button onClick={() => setShowFull(!showFull)}
                        className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic transition-all border flex-shrink-0 ${showFull ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-[#FFD300] hover:text-[#FFD300]'}`}>
                        {showFull ? '← VOLVER' : 'DESGLOSE'}
                    </button>
                    {totalPages > 1 && (
                        <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden flex-shrink-0">
                            <button disabled={safePage === 0} onClick={() => setCurrentPage(p => p - 1)}
                                className={`px-3 py-2 text-xs font-black border-r border-white/10 ${safePage === 0 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>◀</button>
                            <span className="px-2 text-[9px] text-slate-500 font-bold tabular-nums">{safePage + 1}/{totalPages}</span>
                            <button disabled={safePage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}
                                className={`px-3 py-2 text-xs font-black border-l border-white/10 ${safePage === totalPages - 1 ? 'opacity-20' : 'hover:bg-white/10 text-[#FFD300]'}`}>▶</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-fit mx-auto max-w-full overflow-x-auto">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl overflow-hidden">
                    <table className="border-collapse table-auto">
                        <tbody>
                            {paginated.map((user, idx) => {
                                const globalPos = chunk[0] + idx + 1
                                const isFirst   = globalPos === 1
                                return (
                                    <tr key={user.username} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${isFirst ? 'bg-[#FFD300]/5' : ''}`}>
                                        <td className="w-10 px-2 py-1.5 text-center border-r border-white/5 font-black italic text-[10px]">
                                            {isFirst ? <span className="text-lg drop-shadow-[0_0_8px_rgba(255,211,0,0.6)]">👑</span> : <span className="text-slate-600 group-hover:text-slate-400">{globalPos}</span>}
                                        </td>
                                        <td className="w-[130px] px-2 py-1.5 border-r border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`relative w-7 h-7 rounded-full overflow-hidden border shrink-0 bg-slate-800 font-bold text-[10px] flex items-center justify-center ${isFirst ? 'border-[#FFD300]' : 'border-white/10 text-slate-400'}`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                    <Image key={`${currentPage}-${user.username}`} src={`/usuarios/${user.username}.jpg`} alt={user.username} fill sizes="28px" className="object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </div>
                                                <span className={`uppercase text-[10px] tracking-[0.1em] truncate block w-full ${isFirst ? 'text-[#FFD300] font-black' : 'text-slate-300 font-medium group-hover:text-white'}`}>{user.username}</span>
                                            </div>
                                        </td>
                                        {showFull && rankingData.days.map(day => (
                                            <td key={day.id} className={`px-1 py-1.5 text-center border-l border-white/5 text-[10px] font-mono w-8 ${day.competition_key === 'kings' ? 'bg-[#FFD300]/5' : 'bg-[#01d6c3]/5'}`}>
                                                <span className={user.dayBreakdown[day.id] > 0 ? 'text-slate-200' : 'text-slate-800'}>{user.dayBreakdown[day.id] || 0}</span>
                                            </td>
                                        ))}
                                        <td className={`w-16 px-2 py-1.5 text-center border-l border-white/10 font-black text-base italic ${isFirst ? 'bg-[#FFD300] text-black' : 'bg-[#FFD300]/5 text-[#FFD300]'}`}>{user.total}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════
   SIMULATOR VIEW  — mismo look que usuario + inputs admin
══════════════════════════════════════════════════════ */
function SimulatorView() {
    const [compKey, setCompKey]                   = useState<'kings' | 'queens'>('kings')
    const [matchdays, setMatchdays]               = useState<any[]>([])
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null)
    const [teams, setTeams]                       = useState<any[]>([])
    const [scores, setScores]                     = useState<Record<number, { hg: string; ag: string; penaltyWinnerId: number | null }>>({})

    const folder      = compKey === 'kings' ? 'Kings' : 'Queens'
    const isPio       = (f: string) => f?.toLowerCase().includes('pio')
    const getLogoSize = (f: string) => isPio(f) ? 38 : 54
    const getRowColor = (idx: number) => idx === 0 ? 'bg-yellow-500' : idx <= 5 ? 'bg-blue-500' : idx <= 9 ? 'bg-red-500' : 'bg-transparent'

    /* Cambiar competición — limpiar estado para no mostrar datos sucios */
    const switchComp = (key: 'kings' | 'queens') => {
        setCompKey(key)
        setActiveMatchdayId(null)
        setMatchdays([])
        setTeams([])
        setScores({})
    }

    useEffect(() => {
        const load = async () => {
            const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey)
            if (tData) setTeams(tData)

            const { data: mData } = await supabase
                .from('matchdays').select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
                .eq('competition_key', compKey).order('display_order')
            const { data: rData } = await supabase.from('match_results').select('*')

            if (mData) {
                const loadedScores: any = {}
                const allMatches = mData.flatMap((d: any) => d.matches || [])
                if (rData) {
                    rData.forEach((res: any) => {
                        let pWinner = null
                        if (res.home_goals === res.away_goals) {
                            const mm = allMatches.find((m: any) => m.id === res.match_id)
                            if (res.home_penalties > res.away_penalties) pWinner = mm?.home_team_id ?? null
                            if (res.away_penalties > res.home_penalties) pWinner = mm?.away_team_id ?? null
                        }
                        loadedScores[res.match_id] = {
                            hg: res.home_goals != null ? String(res.home_goals) : '',
                            ag: res.away_goals != null ? String(res.away_goals) : '',
                            penaltyWinnerId: pWinner,
                        }
                    })
                }
                setScores(loadedScores)
                setMatchdays(mData)
                /* Siempre apuntar a la primera jornada de la nueva competición */
                setActiveMatchdayId(mData.length > 0 ? mData[0].id : null)
            }
        }
        load()
    }, [compKey])

    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId)

    const handleScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
        if (value !== '' && !/^\d+$/.test(value)) return
        setScores(prev => {
            const cur   = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }
            const newHg = field === 'hg' ? value : cur.hg
            const newAg = field === 'ag' ? value : cur.ag
            return { ...prev, [matchId]: { ...cur, [field]: value, penaltyWinnerId: newHg === newAg ? cur.penaltyWinnerId : null } }
        })
    }
    const togglePenalty = (matchId: number, teamId: number) =>
        setScores(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId } }))

    const saveMatchday = async () => {
        if (!activeMatchday) return
        const rows = activeMatchday.matches
            .filter((m: any) => scores[m.id]?.hg !== '' && scores[m.id]?.ag !== '')
            .map((m: any) => {
                const s = scores[m.id]; const isTie = s.hg === s.ag
                return { match_id: m.id, home_goals: parseInt(s.hg), away_goals: parseInt(s.ag), home_penalties: isTie ? (s.penaltyWinnerId === m.home_team_id ? 1 : 0) : null, away_penalties: isTie ? (s.penaltyWinnerId === m.away_team_id ? 1 : 0) : null }
            })
        if (!rows.length) return alert('No hay marcadores para guardar.')
        if (rows.some((r: any) => r.home_goals === r.away_goals && r.home_penalties === 0 && r.away_penalties === 0))
            return alert('Selecciona al ganador de penales.')
        const { error } = await supabase.from('match_results').upsert(rows, { onConflict: 'match_id' })
        error ? alert('Error: ' + error.message) : alert(`${activeMatchday.name} guardada.`)
    }

    const deleteMatchday = async () => {
        if (!activeMatchday || !confirm('¿Borrar resultados?')) return
        const ids = activeMatchday.matches.map((m: any) => m.id)
        const { error } = await supabase.from('match_results').delete().in('match_id', ids)
        if (!error) { const ns = { ...scores }; ids.forEach((id: number) => delete ns[id]); setScores(ns) }
    }

    const standings = teams.map(team => {
        let w = 0, l = 0, gf = 0, gc = 0
        matchdays.forEach(md => md.matches?.forEach((m: any) => {
            const s = scores[m.id]; if (!s || s.hg === '' || s.ag === '') return
            const hG = parseInt(s.hg), aG = parseInt(s.ag)
            if (m.home_team_id === team.id) { gf += hG; gc += aG; (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) ? w++ : l++ }
            else if (m.away_team_id === team.id) { gf += aG; gc += hG; (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) ? w++ : l++ }
        }))
        return { ...team, w, l, gf, gc, dg: gf - gc }
    }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf)

    return (
        <div className="w-full flex flex-col items-center overflow-x-hidden">

            {/* BARRA DE CONTROLES UNIFICADA — mismo estilo que sección Kings */}
            <div className="w-full flex justify-center items-center flex-wrap gap-3 py-3 px-4 border-b border-white/5 bg-slate-900/20">
                {/* Kings / Queens — mismo estilo que Kings section */}
                <div className="flex gap-2">
                    {(['kings', 'queens'] as const).map(k => (
                        <button key={k} onClick={() => switchComp(k)}
                            className={`px-4 py-1 text-[11px] font-black italic uppercase tracking-wider rounded border shadow-sm transition-all ${
                                compKey === k
                                    ? (k === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                    : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                            }`}>
                            {k === 'kings' ? 'KINGS' : 'QUEENS'}
                        </button>
                    ))}
                </div>

                <div className="hidden sm:block h-5 w-px bg-white/10" />

                {/* Jornadas — mismo estilo que Kings section */}
                <div className="flex flex-wrap justify-center gap-2">
                    {matchdays.map(day => (
                        <button key={day.id} onClick={() => setActiveMatchdayId(day.id)}
                            className={`px-3 py-1 text-[11px] font-black italic uppercase tracking-wider rounded border shadow-sm transition-all ${
                                activeMatchdayId === day.id
                                    ? (compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300] scale-105' : 'bg-[#01d6c3] text-black border-[#01d6c3] scale-105')
                                    : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                            }`}>
                            {day.name.replace(/Jornada\s*/i, 'J')}
                        </button>
                    ))}
                </div>

                <div className="hidden sm:block h-5 w-px bg-white/10" />

                {/* Guardar / Borrar */}
                <div className="flex gap-2">
                    <button onClick={saveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1 rounded text-[10px] font-black uppercase italic">Guardar</button>
                    <button onClick={deleteMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1 rounded text-[10px] font-black uppercase italic">Borrar</button>
                </div>
            </div>

            {/* Contenido */}
            <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 px-4 md:px-6 py-8">
                {/* Partidos */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMatchday?.matches?.map((m: any) => {
                        const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null }
                        const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag
                        return (
                            <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                                <div className="w-full flex items-center justify-between gap-2">
                                    <div className="flex flex-col items-center flex-1">
                                        {m.home && <button onClick={() => isTie && togglePenalty(m.id, m.home_team_id)}
                                            className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                            <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="h" />
                                        </button>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={s.hg} onChange={e => handleScoreChange(m.id, 'hg', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        <span className="text-[10px] font-black text-slate-600 italic">VS</span>
                                        <input type="text" value={s.ag} onChange={e => handleScoreChange(m.id, 'ag', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        {m.away && <button onClick={() => isTie && togglePenalty(m.id, m.away_team_id)}
                                            className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                            <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="a" />
                                        </button>}
                                    </div>
                                </div>
                                {isTie && <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>}
                            </div>
                        )
                    })}
                    {!activeMatchday && (
                        <p className="text-slate-600 italic text-sm col-span-2 text-center py-10">Selecciona una jornada</p>
                    )}
                </div>

                {/* Clasificación */}
                <div className="w-full xl:w-[480px]">
                    <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-center text-sm">
                            <thead>
                                <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                                    <th className="py-3 w-8">#</th><th className="py-3 text-left pl-2">Equipo</th>
                                    <th className="py-3 w-8">V</th><th className="py-3 w-8">D</th>
                                    <th className="py-3 w-8">GF</th><th className="py-3 w-8">GC</th>
                                    <th className="py-3 w-10 bg-white/5">DG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((t, idx) => (
                                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="relative py-2.5 font-black text-xs">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`} />{idx + 1}
                                        </td>
                                        <td className="py-2.5 pl-2 text-left flex items-center gap-2">
                                            <Image src={`/logos/${folder}/${t.logo_file}`} width={22} height={22} alt={t.name} />
                                            <span className="text-[10px] font-bold uppercase truncate max-w-[110px]">{t.name}</span>
                                        </td>
                                        <td className="py-2.5 font-black text-green-400 text-xs">{t.w}</td>
                                        <td className="py-2.5 font-black text-red-400 text-xs">{t.l}</td>
                                        <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gf}</td>
                                        <td className="py-2.5 font-bold text-slate-400 text-[10px]">{t.gc}</td>
                                        <td className="py-2.5 font-black text-white text-xs bg-white/5">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
