// app/simulador/page.tsx  ← SIMULADOR PÚBLICO
'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function SimuladorPage() {
  const backBtn = (
    <Link
      href="/"
      className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
    >
      ← INICIO
    </Link>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Header leftAction={backBtn} />
      <main className="flex-1 w-full">
        <SimulatorView />
      </main>
    </div>
  )
}

function SimulatorView() {
    const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings');
    const [matchdays, setMatchdays] = useState<any[]>([]);
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<number, { hg: string, ag: string, penaltyWinnerId: number | null }>>({});

    const folder = compKey === 'kings' ? 'Kings' : 'Queens';
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio');
    const getLogoSize = (filename: string) => isPio(filename) ? 54 : 72;

    const getRowColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-500';          // 1er lugar (índice 0)
        if (idx >= 1 && idx <= 5) return 'bg-blue-500';  // 2do a 6to (índices 1, 2, 3, 4, 5)
        if (idx >= 6 && idx <= 9) return 'bg-red-500';   // 7mo a 10mo (índices 6, 7, 8, 9)
        return 'bg-transparent';
    };

    useEffect(() => {
        const load = async () => {
            const { data: tData } = await supabase.from('teams').select('*').eq('competition_key', compKey);
            if (tData) setTeams(tData);

            const { data: mData } = await supabase
                .from('matchdays')
                .select(`*, matches (*, home:home_team_id(*), away:away_team_id(*))`)
                .eq('competition_key', compKey)
                .order('display_order');

            const { data: rData } = await supabase.from('match_results').select('*');

            if (mData) {
                const loadedScores: any = {};
                if (rData) {
                    rData.forEach((res: any) => {
                        let pWinner = null;
                        if (res.home_goals === res.away_goals) {
                            if (res.home_penalties > res.away_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.home_team_id;
                            if (res.away_penalties > res.home_penalties) pWinner = mData.flatMap((d: any) => d.matches).find((m: any) => m.id === res.match_id)?.away_team_id;
                        }
                        loadedScores[res.match_id] = {
                            hg: res.home_goals != null ? String(res.home_goals) : '',
                            ag: res.away_goals != null ? String(res.away_goals) : '',
                            penaltyWinnerId: pWinner
                        };
                    });
                }
                setScores(loadedScores);
                setMatchdays(mData);
                if (!activeMatchdayId && mData.length > 0) setActiveMatchdayId(mData[0].id);
            }
        };
        load();
    }, [compKey]);

    const activeMatchday = matchdays.find(d => d.id === activeMatchdayId);

    const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
        if (value !== '' && !/^\d+$/.test(value)) return;
        setScores(prev => {
            const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null };
            const newHg = field === 'hg' ? value : current.hg;
            const newAg = field === 'ag' ? value : current.ag;
            const pWinner = newHg === newAg ? current.penaltyWinnerId : null;
            return { ...prev, [matchId]: { ...current, [field]: value, penaltyWinnerId: pWinner } };
        });
    };

    const togglePenaltyWinner = (matchId: number, teamId: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: { ...(prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null }), penaltyWinnerId: teamId }
        }));
    };

    const standings = teams.map(team => {
        let w = 0, l = 0, gf = 0, gc = 0;
        matchdays.forEach(md => {
            md.matches?.forEach((m: any) => {
                const s = scores[m.id];
                if (!s || s.hg === '' || s.ag === '') return;
                const hG = parseInt(s.hg), aG = parseInt(s.ag);
                if (m.home_team_id === team.id) {
                    gf += hG; gc += aG;
                    if (hG > aG || (hG === aG && s.penaltyWinnerId === m.home_team_id)) w++; else l++;
                } else if (m.away_team_id === team.id) {
                    gf += aG; gc += hG;
                    if (aG > hG || (aG === hG && s.penaltyWinnerId === m.away_team_id)) w++; else l++;
                }
            });
        });
        return { ...team, w, l, gf, gc, dg: gf - gc };
    }).sort((a, b) => b.w - a.w || b.dg - a.dg || b.gf - a.gf);

    return (
        <div className="w-full flex flex-col items-center">
            {/* Contenedor Unificado: Sin color de fondo para que se unifique */}
            <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-6 border-b border-white/5">
                
                {/* Botones Kings / Queens */}
                <div className="flex gap-2 border-r border-white/10 pr-4">
                    <button onClick={() => setCompKey('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Kings</button>
                    <button onClick={() => setCompKey('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Queens</button>
                </div>

                {/* Botones de Jornadas */}
                <div className="flex flex-wrap items-center gap-2">
                    {matchdays.map(day => {
                        const shortName = day.name.toUpperCase().replace('JORNADA', 'J').replace(/\s+/g, '');
                        const label = shortName.includes('J') ? shortName : `J${day.display_order || ''}`;

                        return (
                            <button 
                                key={day.id} 
                                onClick={() => setActiveMatchdayId(day.id)} 
                                className={`px-2 py-1.5 text-[11px] font-black italic uppercase border-b-2 transition-colors ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'border-[#FFD300] text-[#FFD300]' : 'border-[#01d6c3] text-[#01d6c3]') : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 py-8">
                {/* Título movido arriba para que la tabla y los partidos inicien a la misma altura */}
                <div className="mb-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-center xl:text-left">{activeMatchday?.name}</h3>
                </div>

                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Columna de Partidos */}
                    <div className="flex-1 flex flex-col gap-4">
                        {activeMatchday?.matches?.map((m: any) => {
                            const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null };
                            const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag;
                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center flex-1">
                                            {m.home && (
                                                <button onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                                    <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input type="text" value={s.hg} onChange={(e) => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-md font-black text-2xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                            <span className="text-sm font-black text-white italic">VS</span>
                                            <input type="text" value={s.ag} onChange={(e) => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-12 h-12 text-center bg-black border border-white/20 rounded-md font-black text-2xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            {m.away && (
                                                <button onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)} className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}>
                                                    <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Columna de Tabla de Posiciones */}
                    <div className="w-full xl:w-[480px]">
                        <div className="bg-slate-900/60 rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                            <table className="w-full text-center text-sm">
                                <thead>
                                    <tr className="bg-black/40 text-[10px] text-slate-400 font-black uppercase border-b border-white/5">
                                        <th className="py-3 w-8">#</th>
                                        <th className="py-3 text-left pl-2">Equipo</th>
                                        <th className="py-3 w-8">V</th>
                                        <th className="py-3 w-8">D</th>
                                        <th className="py-3 w-8">GF</th>
                                        <th className="py-3 w-8">GC</th>
                                        <th className="py-3 w-10 bg-white/5">DG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((t, idx) => (
                                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="relative py-2.5 font-black text-xs">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>
                                                {idx + 1}
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

                        {/* Leyenda de clasificación */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                <span>1º Semifinal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                <span>2º a 6º Cuartos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <span>7º a 10º Play In</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
/* COMPONENTE DE RANKING ADAPTADO PARA EL USUARIO */
