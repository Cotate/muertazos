{/* Sección de escudos dentro del map de matches */}
<td className="p-4 border-r border-white/5 bg-slate-900/30">
    <div className="flex items-center justify-center gap-4 px-2">
        
        {/* ESCUDO LOCAL (HOME) */}
        <button 
            onClick={() => setWinner(m.id, m.winner_team_id === m.home_team_id ? null : m.home_team_id)} 
            className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 
                ${m.winner_team_id === m.home_team_id 
                    ? 'border-green-500 bg-green-500/20 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-10' 
                    : m.winner_team_id === null 
                        ? 'border-transparent opacity-100 hover:scale-105' // Visible si no hay ganador
                        : 'border-transparent opacity-20 grayscale scale-90' // Apagado si perdió
                }`}
        >
            {m.home && (
                <Image 
                    src={`/logos/${folder}/${m.home.logo_file}`} 
                    width={42} 
                    height={42} 
                    alt="h" 
                    className="object-contain" 
                />
            )}
        </button>

        <span className="text-[10px] font-black text-slate-700 italic">VS</span>

        {/* ESCUDO VISITANTE (AWAY) */}
        <button 
            onClick={() => setWinner(m.id, m.winner_team_id === m.away_team_id ? null : m.away_team_id)} 
            className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 
                ${m.winner_team_id === m.away_team_id 
                    ? 'border-green-500 bg-green-500/20 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-10' 
                    : m.winner_team_id === null 
                        ? 'border-transparent opacity-100 hover:scale-105' // Visible si no hay ganador
                        : 'border-transparent opacity-20 grayscale scale-90' // Apagado si perdió
                }`}
        >
            {m.away && (
                <Image 
                    src={`/logos/${folder}/${m.away.logo_file}`} 
                    width={42} 
                    height={42} 
                    alt="a" 
                    className="object-contain" 
                />
            )}
        </button>
        
    </div>
</td>