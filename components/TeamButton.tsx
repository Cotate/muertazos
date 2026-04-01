// components/TeamButton.tsx
'use client'
import Image from 'next/image'

export default function TeamButton({ team, league, isSelected, anyPickInMatch, onClick, disabled }: any) {
    const folder = league === 'kings' ? 'Kings' : 'Queens';
    const appearanceClass = isSelected ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] grayscale-0 opacity-100 z-10" : (anyPickInMatch ? "grayscale opacity-30 scale-90" : "grayscale-0 opacity-100 scale-100");
    return (
        <button onClick={onClick} disabled={disabled} className={`relative flex items-center justify-center transition-all duration-500 bg-transparent ${appearanceClass} ${!disabled && !isSelected ? 'hover:scale-105' : ''}`}>
            <div className="relative w-24 h-24 md:w-28 md:h-28">
                <Image src={`/logos/${folder}/${team.logo_file}`} alt={team.name} fill className="object-contain" />
            </div>
        </button>
    )
}

// --- COMPONENTE DE SOLO LECTURA (TABLA DE RESULTADOS) ---
