// app/pizarra/page.tsx  ← PIZARRA PÚBLICA
'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Header from '@/components/Header'
import Link from 'next/link'

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

export default function PizarraPage() {
  const availableTeams = Object.keys(PLAYERS_DATA)
  const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0] || '')
  const [selectedPlayer, setSelectedPlayer] = useState<string>(PLAYERS_DATA[availableTeams[0]]?.[0] || '')
  const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedTeam && PLAYERS_DATA[selectedTeam]) {
      setSelectedPlayer(PLAYERS_DATA[selectedTeam][0])
    }
  }, [selectedTeam])

  const addPlayerToPitch = (fileName: string) => {
    setPlayersOnPitch(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      team: selectedTeam,
      fileName,
      x: 50,
      y: 50,
      zIndex: prev.length + 1,
    }])
  }

  const addAllPlayers = () => {
    const players = PLAYERS_DATA[selectedTeam]
    if (!players) return
    const base = playersOnPitch.length
    setPlayersOnPitch(prev => [
      ...prev,
      ...players.map((fileName, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        team: selectedTeam,
        fileName,
        x: 50,
        y: 50,
        zIndex: base + i + 1,
      })),
    ])
  }

  const handlePointerDown = (id: string) => {
    setDraggingId(id)
    setPlayersOnPitch(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(p => p.zIndex)) : 0
      return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p)
    })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPlayersOnPitch(prev =>
      prev.map(p =>
        p.id === draggingId
          ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) }
          : p
      )
    )
  }

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

      <main className="flex-1 flex flex-col py-4 gap-3">

        {/* CONTROLES */}
        <div className="px-2 md:px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xl">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm"
              >
                {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jugador</label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm"
              >
                {PLAYERS_DATA[selectedTeam]?.map(p => (
                  <option key={p} value={p}>{p.replace('.png', '')}</option>
                ))}
                <option value="Nuevo.png">CREAR JUGADOR</option>
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => addPlayerToPitch(selectedPlayer)}
                className="bg-[#ffd300] text-black font-black italic px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex-1 sm:flex-none"
              >
                Añadir
              </button>
              <button
                onClick={addAllPlayers}
                className="bg-[#01d6c3] text-black font-black italic px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors flex-1 sm:flex-none"
              >
                Todos
              </button>
              <button
                onClick={() => setPlayersOnPitch([])}
                className="bg-red-500/10 text-red-500 border border-red-500/50 font-black italic px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* CAMPO — ocupa la mayor parte de la pantalla, márgenes mínimos */}
        <div className="px-2 md:px-4">
          <div
            ref={boardRef}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
            className="relative w-full aspect-video overflow-hidden touch-none"
            style={{
              backgroundImage: 'url(/Campo.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {playersOnPitch.map((player) => (
              <div
                key={player.id}
                onPointerDown={() => handlePointerDown(player.id)}
                onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(p => p.id !== player.id))}
                className="absolute w-10 h-10 md:w-20 lg:w-24 md:h-20 lg:h-24 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`,
                  zIndex: player.zIndex,
                  transition: draggingId === player.id ? 'none' : 'transform 0.1s',
                }}
              >
                <div className="relative w-full h-full drop-shadow-xl">
                  <Image
                    src={player.fileName === 'Nuevo.png' ? '/Nuevo.png' : `/jugadores/${player.team}/${player.fileName}`}
                    alt="jugador"
                    fill
                    className="object-contain pointer-events-none select-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] uppercase tracking-widest font-bold pb-4">
          * DOBLE CLIC PARA ELIMINAR
        </p>
      </main>
    </div>
  )
}
