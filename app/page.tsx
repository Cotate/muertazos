'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import html2canvas from 'html2canvas'

// ==========================================
// 1. DATOS CONSTANTES (PIZARRA)
// ==========================================
const PLAYERS_DATA: Record<string, string[]> = {
  "1K FC": ["Achraf Laiti.png", "Cristian Faura.png", "Erik Beattie.png", "Gerard Verge.png", "Guelmi Pons.png", "Isma Reguia.png", "Iván Rivera.png", "Joel Paredes.png", "Joel Navas.png", "Karim Moya.png", "Michel Owono.png", "Pau 'ZZ' Ruiz.png", "Pol Lechuga.png"],
  "El Barrio": ["Carlos Val.png", "Cristian Ubón.png", "Haitam Babia.png", "Gerard Puigvert.png", "Hugo Eyre.png", "Joel Bañuls.png", "Pablo Saborido.png", "Pau Fernández.png", "Pol Molés.png", "Robert Vallribera.png", "Sergio Fernández.png", "Sergio Herrero.png", "Ñito Martín.png"],
  "Jijantes FC": ["Cristian Lobato.png", "Dani Martí.png", "Daniel Plaza.png", "David Toro.png", "Iker Hernández.png", "Ion Vázquez.png", "José Segovia.png", "Juanpe Nzo.png", "Mario León.png", "Michel Herrero.png", "Pau Fer.png", "Sergi Torres.png", "Víctor Pérez Bello.png", "Álex Cañero.png"],
  "La Capital CF": ["Antoni Hernández.png", "Daniel Pérez.png", "Daouda Bamma.png", "Iñaki Villalba.png", "Julen Álvarez.png", "Manel Jiménez.png", "Manuel Martín.png", "Mario Victorio.png", "Omar Dambelleh.png", "Pablo Beguer.png", "Sergi Vives.png", "Sohaib Rektout.png"],
  "Los Troncos FC": ["Alex Cubedo.png", "Carles Planas.png", "Carlos Contreras.png", "Daniel Tamayo.png", "David Reyes.png", "Eloy Amoedo.png", "Joan Oriol.png", "Mark Sorroche.png", "Masi Dabo.png", "Sagar Escoto Majó.png", "Victor Oribe.png", "Yaroslav Toporkov.png", "Álvaro Arché.png"],
  "PIO FC": ["Adri Espinar.png", "Adrián Frutos.png", "Manel Beneite.png", "Fernando Velillas.png", "Iker Bartolomé.png", "Sergio Mulero.png", "Joan Luque.png", "Luis García.png", "Marc Briones.png", "Marc Grifell.png", "Pol Benito.png", "Yeray Muñoz.png", "Álex Sánchez.png"],
  "Porcinos FC": ["Aitor Vives.png", "Dani Pérez.png", "Gerard Gómez.png", "David Soriano.png", "Edgar Alvaro.png", "Fouad El Amrani.png", "Marc Pelaz.png", "Nadir Louah.png", "Nico Santos.png", "Oscar Coll.png", "Ricard Pujol.png", "Roger Carbó.png", "Tomeu Nadal.png", "Victor Nofuentes.png"],
  "Rayo de Barcelona": ["Abde Bakkali.png", "Adrià Escribano.png", "Nil Pradas.png", "Carlos Heredia.png", "Carlos Omabegho.png", "David Moreno.png", "Gerard Oliva.png", "Guillem 'ZZ' Ruiz.png", "Ismael González.png", "Iván Torres.png", "Jordi Gómez.png", "Jorge Ibáñez.png", "Roc Bancells.png"],
  "Saiyans FC": ["Albert Garcia.png", "Borja Montejo.png", "Dani Santiago.png", "Diego Jiménez.png", "Feliu Torrus.png", "Gerard Vacas.png", "Gio Ferinu.png", "Isaac Maldonado.png", "Iván Fajardo.png", "Juanan Gallego.png", "Pablo Fernández.png", "Sergi Gestí.png"],
  "Skull FC": ["Alberto Arnalot.png", "Dani Santos.png", "Samuel Aparicio.png", "David Asensio.png", "Jorge Escobar.png", "Kevin Zárate.png", "Koke Navares.png", "Nano Modrego.png", "Pablo de Castro.png", "Raúl Escobar.png", "Víctor Mongil.png", "Álex Salas.png"],
  "Ultimate Mostoles": ["Aleix Hernando.png", "Aleix Lage.png", "Josep Riart.png", "Aleix Martí.png", "Alex 'Capi' Domingo.png", "David Grifell.png", "Eloy Pizarro.png", "Ferran Corominas.png", "Javi Espinosa.png", "Juan Lorente.png", "Marc Granero.png", "Mikhail Prokopev.png", "Víctor Vidal.png"],
  "xBuyer Team": ["Aleix Ruiz.png", "Eric Sánchez.png", "Galde Hugue.png", "Jacobo Liencres.png", "Javier Comas.png", "Joel Espinosa.png", "Juanma González.png", "Mario Reyes.png", "Sergio 'Chechi' Costa.png", "Víctor Vargas.png", "Xavier Cabezas.png", "Álex Romero.png", "Eric Pérez.png"],
}

// ==========================================
// 2. COMPONENTE SIMULADOR
// ==========================================
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
        if (idx === 0) return 'bg-yellow-500';          
        if (idx >= 1 && idx <= 5) return 'bg-blue-500';  
        if (idx >= 6 && idx <= 9) return 'bg-red-500';   
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
        <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="w-full flex justify-center items-center flex-wrap gap-4 py-3 px-6 border-b border-white/5">
                <div className="flex gap-2 border-r border-white/10 pr-4">
                    <button onClick={() => setCompKey('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Kings</button>
                    <button onClick={() => setCompKey('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${compKey === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Queens</button>
                </div>
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
                <div className="mb-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-center xl:text-left text-white">{activeMatchday?.name}</h3>
                </div>

                <div className="flex flex-col xl:flex-row gap-8">
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
                                            <td className="relative py-2.5 font-black text-xs text-white">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRowColor(idx)}`}></div>
                                                {idx + 1}
                                            </td>
                                            <td className="py-2.5 pl-2 text-left flex items-center gap-2 text-white">
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

// ==========================================
// 3. COMPONENTE PIZARRA
// ==========================================
function PizarraView() {
    const availableTeams = Object.keys(PLAYERS_DATA);
    const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0] || "");
    const [selectedPlayer, setSelectedPlayer] = useState<string>(PLAYERS_DATA[availableTeams[0]]?.[0] || "");
    const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([]);
    const boardRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedTeam && PLAYERS_DATA[selectedTeam]) { 
            setSelectedPlayer(PLAYERS_DATA[selectedTeam][0]); 
        }
    }, [selectedTeam]);

    const addPlayerToPitch = (fileName: string) => {
        const newPlayer = { 
            id: Math.random().toString(36).substr(2, 9), 
            team: selectedTeam, 
            fileName: fileName, 
            x: 50, 
            y: 50, 
            zIndex: playersOnPitch.length + 1 
        };
        setPlayersOnPitch(prev => [...prev, newPlayer]);
    };

    const addAllPlayers = () => {
        const players = PLAYERS_DATA[selectedTeam];
        if (!players) return;
        const currentCount = playersOnPitch.length;
        
        const newPlayers = players.map((fileName, index) => ({
            id: Math.random().toString(36).substr(2, 9), 
            team: selectedTeam, 
            fileName: fileName, 
            x: 50, 
            y: 50, 
            zIndex: currentCount + index + 1
        }));
        setPlayersOnPitch(prev => [...prev, ...newPlayers]);
    };

    const handlePointerDown = (id: string) => {
        setDraggingId(id);
        setPlayersOnPitch(prev => {
            const maxZ = prev.length > 0 ? Math.max(...prev.map(pl => pl.zIndex)) : 0;
            return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p);
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingId || !boardRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPlayersOnPitch(prev => prev.map(p => 
            p.id === draggingId 
                ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) } 
                : p 
        ));
    };

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 p-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</label>
                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm">
                        {availableTeams.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jugador</label>
                    <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm">
                        {PLAYERS_DATA[selectedTeam]?.map(player => (
                            <option key={player} value={player}>{player.replace('.png', '')}</option>
                        ))}
                        <option value="Nuevo.png">CREAR JUGADOR</option>
                    </select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => addPlayerToPitch(selectedPlayer)} className="bg-[#ffd300] text-black font-black italic px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex-1 sm:flex-none">Añadir</button>
                    <button onClick={addAllPlayers} className="bg-[#01d6c3] text-black font-black italic px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors flex-1 sm:flex-none">Todos</button>
                    <button onClick={() => setPlayersOnPitch([])} className="bg-red-500/10 text-red-500 border border-red-500/50 font-black italic px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none">Limpiar</button>
                </div>
            </div>

            <div 
                ref={boardRef} 
                onPointerMove={handlePointerMove} 
                onPointerUp={() => setDraggingId(null)} 
                onPointerLeave={() => setDraggingId(null)} 
                className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl touch-none"
                style={{ backgroundImage: 'url(/Campo.jpg)', backgroundSize: '100% 100%' }}
            >
                {playersOnPitch.map((player) => (
                    <div 
                        key={player.id} 
                        onPointerDown={() => handlePointerDown(player.id)} 
                        onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(p => p.id !== player.id))}
                        className="absolute w-10 h-10 md:w-20 lg:w-24 md:h-20 lg:h-24 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                        style={{ left: `${player.x}%`, top: `${player.y}%`, zIndex: player.zIndex, transition: draggingId === player.id ? 'none' : 'transform 0.1s' }}
                    >
                        <div className="relative w-full h-full drop-shadow-xl">
                            <Image 
                                src={player.fileName === "Nuevo.png" ? "/Nuevo.png" : `/jugadores/${player.team}/${player.fileName}`} 
                                alt="jugador" 
                                fill 
                                className="object-contain pointer-events-none select-none" 
                            />
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">* DOBLE CLIC PARA ELIMINAR</p>
        </div>
    );
}

// ==========================================
// 4. PÁGINA PRINCIPAL / HOME (CONTENEDOR)
// ==========================================
export default function Home() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeView, setActiveView] = useState<'home' | 'simulator' | 'pizarra' | 'picks' | 'ranking' | 'all-picks'>('home');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        document.body.style.backgroundColor = '#0a0a0a';
        const localUser = localStorage.getItem('muertazos_user');
        if (localUser) {
            try {
                setUser(JSON.parse(localUser));
            } catch (e) {
                console.error("Error parsing user data");
            }
        }
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('muertazos_user');
        setUser(null);
        router.push('/login');
    };

    // Componente auxiliar para la navegación del Header
    const NavButton = ({ label, targetView }: { label: string, targetView: any, targetLeague?: string }) => (
        <button 
            onClick={() => { setActiveView(targetView); setMenuOpen(false); }}
            className={`font-black italic uppercase tracking-widest text-xs transition-colors hover:text-[#01d6c3] ${activeView === targetView ? 'text-[#01d6c3]' : 'text-slate-400'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] font-sans">
            {/* HEADER ADAPTATIVO */}
            <header className="w-full h-16 md:h-24 flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 md:px-10 sticky top-0 z-50">
                <div className="flex items-center flex-1">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                    <nav className="hidden lg:flex gap-6 h-full items-center">
                        <NavButton label="INICIO" targetView="home" />
                        <NavButton label="KINGS" targetView="picks" />
                        <NavButton label="QUEENS" targetView="picks" />
                        <NavButton label="RANKING" targetView="ranking" />
                    </nav>
                </div>

                <div className="relative w-28 h-8 md:w-44 md:h-12 flex-shrink-0 cursor-pointer" onClick={() => setActiveView('home')}>
                    <Image src="/Muertazos.png" alt="Logo" fill className="object-contain" priority />
                </div>

                <div className="flex items-center justify-end flex-1 gap-2 md:gap-6">
                    <nav className="hidden lg:flex gap-6 h-full items-center mr-6">
                        <NavButton label="PICKS" targetView="all-picks" />
                        <NavButton label="SIMULADOR" targetView="simulator" />
                        <NavButton label="PIZARRA" targetView="pizarra" />
                    </nav>

                    <div className="flex items-center gap-2 md:gap-4">
                        {user ? (
                            <>
                                <div className="relative w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl">
                                    <Image src={`/usuarios/${user.username}.jpg`} alt={user.username} fill className="object-cover" />
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="text-[10px] md:text-xs font-black italic uppercase text-red-500 hover:text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg"
                                >
                                    Salir
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => router.push('/login')}
                                className="bg-[#ffd300] text-black font-black italic uppercase px-4 md:px-6 py-2 rounded-xl text-xs hover:scale-105 transition-transform"
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MENÚ MÓVIL DESPLEGABLE */}
            {menuOpen && (
                <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-4 absolute w-full z-40 top-16 md:top-24">
                    <NavButton label="INICIO" targetView="home" />
                    <NavButton label="KINGS" targetView="picks" />
                    <NavButton label="QUEENS" targetView="picks" />
                    <NavButton label="RANKING" targetView="ranking" />
                    <NavButton label="PICKS" targetView="all-picks" />
                    <NavButton label="SIMULADOR" targetView="simulator" />
                    <NavButton label="PIZARRA" targetView="pizarra" />
                </div>
            )}

            {/* CONTENEDOR PRINCIPAL DINÁMICO */}
            <main className="flex-1 w-full">
                {activeView === 'home' && (
                    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in text-center">
                        <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter mb-4">
                            Bienvenido a <span className="text-[#ffd300]">Muertazos</span>
                        </h1>
                        <p className="text-slate-400 max-w-lg mb-10">Accede a las mejores herramientas. Simula resultados o diseña la estrategia de tu equipo en la pizarra interactiva.</p>
                        
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button onClick={() => setActiveView('simulator')} className="bg-[#01d6c3] text-black font-black italic px-8 py-4 rounded-2xl hover:scale-105 transition-transform uppercase tracking-wider">
                                Ir al Simulador
                            </button>
                            <button onClick={() => setActiveView('pizarra')} className="bg-transparent border-2 border-[#ffd300] text-[#ffd300] font-black italic px-8 py-4 rounded-2xl hover:bg-[#ffd300] hover:text-black transition-colors uppercase tracking-wider">
                                Abrir Pizarra
                            </button>
                        </div>
                    </div>
                )}

                {activeView === 'simulator' && <SimulatorView />}
                {activeView === 'pizarra' && <PizarraView />}
                
                {/* Vistas de relleno (para evitar romper tu nav) */}
                {['picks', 'ranking', 'all-picks'].includes(activeView) && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-500 font-bold uppercase italic">
                        Próximamente: {activeView}
                    </div>
                )}
            </main>
        </div>
    );
}