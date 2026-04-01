// components/AdminSimulatorView.tsx
'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function AdminSimulatorView() {
    const [compKey, setCompKey] = useState<'kings' | 'queens'>('kings');
    const [matchdays, setMatchdays] = useState<any[]>([]);
    const [activeMatchdayId, setActiveMatchdayId] = useState<number | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    // Cambiamos el estado para manejar penaltyWinnerId en lugar de hp/ap
    const [scores, setScores] = useState<Record<number, { hg: string, ag: string, penaltyWinnerId: number | null }>>({});

    const folder = compKey === 'kings' ? 'Kings' : 'Queens';
    const isPio = (filename: string) => filename?.toLowerCase().includes('pio');
    const getLogoSize = (filename: string) => isPio(filename) ? 38 : 54;

    const getRowColor = (idx: number) => {
        if (idx === 0) return 'bg-yellow-500';
        if (idx >= 1 && idx <= 5) return 'bg-blue-500';
        if (idx >= 6 && idx <= 9) return 'bg-red-500';
        return 'bg-transparent';
    };

    // 1. CARGA DE DATOS
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

    // 2. ACTUALIZAR ESTADO LOCAL
    const handleLocalScoreChange = (matchId: number, field: 'hg' | 'ag', value: string) => {
        if (value !== '' && !/^\d+$/.test(value)) return;
        setScores(prev => {
            const current = prev[matchId] || { hg: '', ag: '', penaltyWinnerId: null };
            const newHg = field === 'hg' ? value : current.hg;
            const newAg = field === 'ag' ? value : current.ag;
            // Si deja de ser empate, reseteamos el ganador de penales
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

    // 3. GUARDAR JORNADA
    const saveActiveMatchday = async () => {
        if (!activeMatchday) return;

        const resultsToUpsert = activeMatchday.matches
            .filter((m: any) => scores[m.id]?.hg !== '' && scores[m.id]?.ag !== '')
            .map((m: any) => {
                const s = scores[m.id];
                const isTie = s.hg === s.ag;
                return {
                    match_id: m.id,
                    home_goals: parseInt(s.hg),
                    away_goals: parseInt(s.ag),
                    home_penalties: isTie ? (s.penaltyWinnerId === m.home_team_id ? 1 : 0) : null,
                    away_penalties: isTie ? (s.penaltyWinnerId === m.away_team_id ? 1 : 0) : null,
                };
            });

        if (resultsToUpsert.length === 0) return alert("No hay marcadores para guardar.");

        // Validar que si hay empate, se haya elegido un ganador
        const pendingPenalties = resultsToUpsert.some((r: any) => r.home_goals === r.away_goals && r.home_penalties === 0 && r.away_penalties === 0);
        if (pendingPenalties) return alert("Selecciona al ganador de los penales haciendo clic en su escudo.");

        const { error } = await supabase.from('match_results').upsert(resultsToUpsert, { onConflict: 'match_id' });
        if (error) alert("Error: " + error.message);
        else alert(`Jornada ${activeMatchday.name} guardada.`);
    };

    // 4. BORRAR JORNADA
    const deleteActiveMatchday = async () => {
        if (!activeMatchday || !confirm("¿Borrar resultados?")) return;
        const matchIds = activeMatchday.matches.map((m: any) => m.id);
        const { error } = await supabase.from('match_results').delete().in('match_id', matchIds);
        if (!error) {
            const newScores = { ...scores };
            matchIds.forEach((id: number) => delete newScores[id]);
            setScores(newScores);
        }
    };

    // 5. CLASIFICACIÓN (Incluye GF, GC y Lógica de Puntos)
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
            <div className="flex justify-center gap-4 py-4">
                <button onClick={() => setCompKey('kings')} className={`px-6 py-2 rounded-full text-xs font-black italic uppercase border ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Kings</button>
                <button onClick={() => setCompKey('queens')} className={`px-6 py-2 rounded-full text-xs font-black italic uppercase border ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700'}`}>Queens</button>
            </div>

            <div className="w-full flex justify-center flex-wrap gap-2 py-2 px-6 border-b border-white/5 bg-slate-900/20">
                {matchdays.map(day => (
                    <button key={day.id} onClick={() => setActiveMatchdayId(day.id)} className={`px-3 py-1 text-[11px] font-black italic uppercase rounded border ${activeMatchdayId === day.id ? (compKey === 'kings' ? 'bg-[#FFD300] text-black' : 'bg-[#01d6c3] text-black') : 'bg-black/40 text-slate-400'}`}>
                        {day.name}
                    </button>
                ))}
            </div>

            <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-8 px-6 py-8">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{activeMatchday?.name}</h3>
                        <div className="flex gap-2">
                            <button onClick={saveActiveMatchday} className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Guardar</button>
                            <button onClick={deleteActiveMatchday} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded text-[10px] font-black uppercase italic">Borrar</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeMatchday?.matches?.map((m: any) => {
                            const s = scores[m.id] || { hg: '', ag: '', penaltyWinnerId: null };
                            const isTie = s.hg !== '' && s.ag !== '' && s.hg === s.ag;
                            return (
                                <div key={m.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-col items-center flex-1">
                                            {m.home && (
                                                <button 
                                                    onClick={() => isTie && togglePenaltyWinner(m.id, m.home_team_id)}
                                                    className={`transition-all ${isTie && s.penaltyWinnerId === m.home_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                                                >
                                                    <Image src={`/logos/${folder}/${m.home.logo_file}`} width={getLogoSize(m.home.logo_file)} height={getLogoSize(m.home.logo_file)} alt="home" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="text" value={s.hg} onChange={(e) => handleLocalScoreChange(m.id, 'hg', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                            <span className="text-xs font-black text-slate-600 italic">VS</span>
                                            <input type="text" value={s.ag} onChange={(e) => handleLocalScoreChange(m.id, 'ag', e.target.value)} className="w-10 h-10 text-center bg-black border border-white/20 rounded-md font-black text-xl text-white focus:border-[#FFD300] focus:outline-none" maxLength={2} />
                                        </div>
                                        <div className="flex flex-col items-center flex-1">
                                            {m.away && (
                                                <button 
                                                    onClick={() => isTie && togglePenaltyWinner(m.id, m.away_team_id)}
                                                    className={`transition-all ${isTie && s.penaltyWinnerId === m.away_team_id ? 'drop-shadow-[0_0_10px_#FFD300] scale-110' : isTie ? 'opacity-30 grayscale' : ''}`}
                                                >
                                                    <Image src={`/logos/${folder}/${m.away.logo_file}`} width={getLogoSize(m.away.logo_file)} height={getLogoSize(m.away.logo_file)} alt="away" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isTie && <p className="text-[9px] font-black text-yellow-500 uppercase animate-pulse">Clic en el escudo del ganador</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>

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
                </div>
            </div>
        </div>
    );
}