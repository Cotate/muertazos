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
    <div className="min-h-screen bg-[#0a0a0a] pb-20 px-4 max-w-7xl mx-auto text-white">
        
        {/* CABECERA */}
        <div className="relative flex items-center justify-center py-10">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase text-center">
                <span style={{ color: '#FFFFFF', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>PANEL CONTROL</span> 
                <span className="ml-2" style={{ color: '#FFD300', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>MUERTAZOS</span>
            </h1>
            
            <button 
                onClick={() => {localStorage.removeItem('muertazos_user'); router.push('/')}} 
                className="absolute right-0 bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all text-[10px]"
            >
                CERRAR SESIÓN
            </button>
        </div>
        
        {/* NAVEGACIÓN */}
        <div className="flex gap-4 mb-8 border-b border-slate-800 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabBtn label="KINGS LEAGUE" active={tab==='kings'} onClick={()=>setTab('kings')} activeColor="#ffd300" />
            <TabBtn label="QUEENS LEAGUE" active={tab==='queens'} onClick={()=>setTab('queens')} activeColor="#01d6c3" />
            <TabBtn label="RANKING GENERAL" active={tab==='ranking'} onClick={()=>setTab('ranking')} activeColor="#FFFFFF" />
        </div>

        {tab === 'ranking' ? <RankingView /> : <CompetitionAdmin key={tab} competitionKey={tab} />}
    </div>
  )
}

function TabBtn({label, active, onClick, activeColor}: any) {
    return (
        <button 
            onClick={onClick}
            style={{ 
                color: active ? activeColor : '#64748b',
                borderBottom: active ? `4px solid ${activeColor}` : '4px solid transparent',
            }}
            className="pb-4 px-4 font-black italic tracking-tighter transition-all uppercase text-sm"
        >
            {label}
        </button>
    )
}

function CompetitionAdmin({ competitionKey }: { competitionKey: string }) {
    const [matchdays, setMatchdays] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [allPreds, setAllPreds] = useState<any[]>([])
    const folder = competitionKey === 'kings' ? 'Kings' : 'Queens'

    const load = async () => {
        const { data: mData } = await supabase
            .from('matchdays')
            .select('*, matches(*, home:home_team_id(*), away:away_team_id(*))')
            .eq('competition_key', competitionKey)
            .order('display_order')

        const { data: uData } = await supabase.from('app_users').select('id, username').neq('role', 'admin').order('username')
        
        // CORRECCIÓN LOGOS: Traemos la relación del equipo predicho explícitamente
        const { data: pData } = await supabase
            .from('predictions')
            .select('*, predicted_team:predicted_team_id(logo_file)')

        if (mData) {
            mData.forEach(day => {
                if(day.matches) day.matches.sort((a: any, b: any) => a.id - b.id)
            })
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
        <div className="space-y-12">
            {matchdays.map(day => (
                <div key={day.id} className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-6 bg-slate-800/40 flex justify-between items-center border-b border-slate-700/50">
                        <div>
                            <h3 style={{ color: colorHex }} className="text-2xl font-black uppercase italic tracking-tight">{day.name}</h3>
                            <p className="text-[10px] text-slate-500 font-mono italic mt-1">{day.date_label || 'FECHA POR DEFINIR'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>toggleVisible(day.id, day.is_visible)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg border transition-all ${day.is_visible ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                {day.is_visible ? 'PÚBLICO' : 'OCULTO'}
                            </button>
                            <button onClick={()=>toggleLock(day.id, day.is_locked)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg border transition-all ${day.is_locked ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                                {day.is_locked ? 'CERRADO' : 'ABIERTO'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    <th className="p-4 text-left">Partido</th>
                                    {users.map(u => (
                                        <th key={u.id} className="p-4"><span className="bg-slate-800 px-2 py-1 rounded text-slate-300">{u.username}</span></th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {day.matches?.map((m: any) => (
                                    <tr key={m.id} className="border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} className={`p-2 rounded-xl border-2 transition-all ${m.winner_team_id === m.home_team_id ? 'border-green-500 bg-green-500/20' : 'border-transparent bg-slate-800 opacity-40 hover:opacity-100'}`}>
                                                    {m.home && <Image src={`/logos/${folder}/${m.home.logo_file}`} width={35} height={35} alt="h" className="object-contain" />}
                                                </button>
                                                <span className="text-xs font-black text-slate-600 italic">VS</span>
                                                <button onClick={()=>setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} className={`p-2 rounded-xl border-2 transition-all ${m.winner_team_id === m.away_team_id ? 'border-green-500 bg-green-500/20' : 'border-transparent bg-slate-800 opacity-40 hover:opacity-100'}`}>
                                                    {m.away && <Image src={`/logos/${folder}/${m.away.logo_file}`} width={35} height={35} alt="a" className="object-contain" />}
                                                </button>
                                            </div>
                                        </td>
                                        {users.map(u => {
                                            const pred = allPreds.find(p => p.user_id === u.id && p.match_id === m.id)
                                            const isHit = m.winner_team_id && pred && pred.predicted_team_id === m.winner_team_id
                                            return (
                                                <td key={u.id} className="p-2">
                                                    {pred?.predicted_team?.logo_file ? (
                                                        <Image src={`/logos/${folder}/${pred.predicted_team.logo_file}`} width={28} height={28} className={`mx-auto object-contain ${isHit ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] scale-110' : 'opacity-20 grayscale'}`} alt="p" />
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
            ))}
        </div>
    )
}

function RankingView() {
    const [rankingData, setRankingData] = useState<any[]>([])
    const [headerJornadas, setHeaderJornadas] = useState<any[]>([])

    useEffect(() => {
        async function getFullRanking() {
            const { data: mDays } = await supabase.from('matchdays').select('id, name, competition_key').eq('is_locked', true).order('competition_key').order('display_order')
            const { data: matches } = await supabase.from('matches').select('id, matchday_id, winner_team_id').not('winner_team_id', 'is', null)
            const { data: preds } = await supabase.from('predictions').select('*')
            const { data: users } = await supabase.from('app_users').select('id, username').neq('role', 'admin')
            
            if (!mDays || !matches || !preds || !users) return
            
            const headers = mDays.map(d => {
                const suffix = d.competition_key === 'kings' ? 'K' : 'Q'
                const matchNum = d.name.match(/\d+/)
                return { id: d.id, label: matchNum ? `J${matchNum[0]}${suffix}` : `${d.name.toUpperCase()} ${suffix}` }
            })
            setHeaderJornadas(headers)

            const scores = users.map(u => {
                let totalScore = 0
                const breakdown: Record<string, number> = {}
                mDays.forEach((day, index) => {
                    const headerObj = headers[index]
                    const points = matches
                        .filter(m => m.matchday_id === day.id)
                        .reduce((acc, m) => {
                            const p = preds.find(p => p.user_id === u.id && p.match_id === m.id)
                            return (p && p.predicted_team_id === m.winner_team_id) ? acc + 1 : acc
                        }, 0)
                    breakdown[headerObj.label] = points
                    totalScore += points
                })
                return { username: u.username, breakdown, total: totalScore }
            })
            setRankingData(scores.sort((a, b) => b.total - a.total))
        }
        getFullRanking()
    }, [])

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-10">
            <div className="p-10 bg-slate-800/40 border-b border-slate-700/50 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
                    <span style={{ color: '#FFFFFF' }}>CLASIFICACIÓN</span> 
                    <span className="ml-3" style={{ color: '#FFD300' }}>GENERAL</span>
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/60 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">
                            <th className="p-4 md:p-6 text-slate-500">Pos</th>
                            <th className="p-4 md:p-6 text-slate-200">Participante</th>
                            {headerJornadas.map(h => <th key={h.id} className="p-4 md:p-6 text-center text-slate-500">{h.label}</th>)}
                            <th className="p-4 md:p-6 text-right text-[#ffd300]">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {rankingData.map((row, i) => (
                            <tr key={row.username} className="hover:bg-white/[0.03] transition-colors">
                                <td className="p-4 md:p-6 font-black italic text-xl md:text-2xl text-slate-600">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                </td>
                                <td className="p-4 md:p-6 font-black uppercase text-base md:text-xl text-white tracking-tight">{row.username}</td>
                                {headerJornadas.map(h => <td key={h.id} className="p-4 md:p-6 text-center text-slate-400 font-mono text-base md:text-lg">{row.breakdown[h.label]}</td>)}
                                <td className="p-4 md:p-6 text-right font-black italic text-3xl md:text-5xl" style={{ color: i === 0 ? '#FFD300' : '#FFFFFF' }}>{row.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}