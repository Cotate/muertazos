'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type SplitKey = 'spain' | 'brazil' | 'mexico'

const SPLIT_OPTIONS: { key: SplitKey; label: string; folder: string; split: string; dotColor: string }[] = [
  { key: 'spain',  label: 'SPLIT 6 ESPAÑA', folder: 'España', split: 'Split 6', dotColor: '#c60b1e' },
  { key: 'brazil', label: 'SPLIT 2 BRASIL', folder: 'Brazil', split: 'Split 2', dotColor: '#009c3b' },
  { key: 'mexico', label: 'SPLIT 4 MÉXICO', folder: 'México', split: 'Split 4', dotColor: '#006847' },
]

const SPAIN_PLAYERS_DATA: Record<string, string[]> = {
  '1K FC': ['Achraf Laiti', 'Cristian Faura', 'Eric Jiménez', 'Erik Beattie', 'Gerard Verge', 'Guelmi Pons', 'Isma Reguia', 'Iván Rivera', 'Joel Navas', 'Joel Paredes', 'Karim Moya', 'Michel Owono', "Pau 'ZZ' Ruiz", 'Pol Lechuga'],
  'El Barrio': ['Carlos Val', 'Cristian Ubón', 'Gerard Puigvert', 'Haitam Babia', 'Hugo Eyre', 'Joel Bañuls', 'Ñito Martín', 'Pablo Saborido', 'Pau Fernández', 'Pol Molés', 'Robert Vallribera', 'Sergio Fernández', 'Sergio Herrero'],
  'Jijantes FC': ['Álex Cañero', 'Cristian Gómez', 'Cristian Lobato', 'Dani Martí', 'Daniel Plaza', 'David Toro', 'Iker Hernández', 'Ion Vázquez', 'José Segovia', 'Juanpe Nzo', 'Marc Montejo', 'Mario León', 'Michel Herrero', 'Pau Fer', 'Sergi Torres', 'Víctor Pérez Bello'],
  'La Capital CF': ['Antoni Hernández', 'Daniel Pérez', 'Daouda Bamma', 'Iñaki Villalba', 'Julen Álvarez', 'Manel Jiménez', 'Manuel Martín', 'Mario Victorio', 'Omar Dambelleh', 'Pablo Beguer', 'Sergi Vives', 'Sohaib Rektout'],
  'Los Troncos FC': ['Aleix Semur', 'Alex Cubedo', 'Álvaro Arché', 'Carles Planas', 'Carlos Contreras', 'Daniel Tamayo', 'David Reyes', 'Eloy Amoedo', 'Joan Oriol', 'Mark Sorroche', 'Masi Dabo', 'Sagar Escoto', 'Victor Oribe', 'Yaroslav Toporkov'],
  'PIO FC': ['Adri Espinar', 'Adrián Frutos', 'Álex Sánchez', 'Fernando Velillas', 'Iker Bartolomé', 'Izan Grande', 'Joan Luque', 'Luis García', 'Marc Briones', 'Marc Grifell', 'Marcos Ibañez', 'Pol Benito', 'Sergio Mulero', 'Yeray Muñoz'],
  'Porcinos FC': ['Aitor Vives', 'Dani Pérez', 'David Soriano', 'Edgar Alvaro', 'Fouad El Amrani', 'Gerard Gómez', 'Marc Pelaz', 'Nadir Louah', 'Nico Santos', 'Oscar Coll', 'Ricard Pujol', 'Roger Carbó', 'Tomeu Nadal', 'Victor Nofuentes'],
  'Rayo de Barcelona': ['Abde Bakkali', 'Adrià Escribano', 'Alhagi Marie Touray', 'Carlos Heredia', 'Carlos Omabegho', 'David Moreno', 'Gerard Oliva', "Guillem 'ZZ' Ruiz", 'Ismael González', 'Iván Torres', 'Jordi Gómez', 'Jorge Ibáñez', 'Roc Bancells'],
  'Saiyans FC': ['Albert Garcia', 'Borja Montejo', 'Dani Santiago', 'Diego Jiménez', 'Feliu Torrus', 'Gerard Vacas', 'Gio Ferinu', 'Isaac Maldonado', 'Iván Fajardo', 'Juanan Gallego', 'Pablo Fernández', 'Sergi Gestí'],
  'Skull FC': ['Alberto Arnalot', 'Álex Salas', 'Dani Santos', 'David Asensio', "David 'Burrito' Ruiz", 'Jorge Escobar', 'José Hermosa', 'Kevin Zárate', 'Koke Navares', 'Manu García', 'Nano Modrego', 'Pablo de Castro', 'Raúl Escobar', 'Roberto Tobe', 'Samuel Aparicio', 'Víctor Mongil'],
  'Ultimate Móstoles': ['Aleix Hernando', 'Aleix Lage', 'Aleix Martí', "Alex 'Capi' Domingo", 'David Grifell', 'Eloy Pizarro', 'Ferran Corominas', 'Javi Espinosa', 'Josep Riart', 'Juan Lorente', 'Marc Granero', 'Mikhail Prokopev', 'Víctor Vidal'],
  'xBuyer Team': ['Aleix Ruiz', 'Álex Romero', 'Eric Pérez', 'Eric Sánchez', 'Galde Hugue', 'Jacobo Liencres', 'Javier Comas', 'Joel Espinosa', 'Juanma González', 'Mario Reyes', 'Sergio Campos', "Sergio 'Chechi' Costa", 'Víctor Vargas', 'Xavier Cabezas', 'Zaid Saban'],
}

const BRAZIL_PLAYERS_DATA: Record<string, string[]> = {
  'Capim FC': ['Álex Guti', 'Breno Arantes', 'Dani Liñares', "Gabriel 'Dudu'", 'Gerard Nolla', 'Igo Canindé', 'Jeferson Titon', "Lucas 'Caroço'", 'Lucas Hector', "Marcos 'Bolivia'", 'Murillo Donato', 'Rafa Sousa', 'Thiago Santos', 'Wallace Rafael'],
  'Dendele FC': ['Bruninho Mandarino', "Cristhian 'Canhoto'", 'Gabriel Repulho', 'Gui Carvalho', 'Gustavo Húngaro', "Leonardo 'Belletti'", "Lucas 'L7'", "Luís Henrique 'Boolt'", 'Lyncoln Oliveira', 'Maikon Santos', 'Marquinhos Samora', 'Nicollas Nascimento', 'Ryan Soares'],
  'DesimpaiN': ['Andrey Profeta', 'Christian Santos', 'Danilo Alemão', 'Davi Ilario', 'Douglinha Melo', 'Gabriel Lopes', 'Gui Nascimento', 'Juvenal Oliveira', 'Kaiky Souza', 'Luisinho Alves', "Victor 'Bolt'", "Victor 'VB' Bueno", "Wellinton 'Gigante'", 'William Costa'],
  'Dibrados FC': ['Bruno Mota', 'Chay Medeiros', 'Daniel Ferreira', 'Edda Marcelino', 'Etinho Lima', 'Fael Magalhães', 'Gabriel Costa', 'Henrique Wruck', "Jonatas 'Batman'", 'Luan Teles', "Lucas 'Pulguinha'", 'Luiggi Longo', "Marcello 'Marcelinho' Junior", 'Matheus Bueno', "Matheus 'Índio'", 'Raphael Augusto', 'Ricardinho Filipe', 'Ruan Major', 'Sidney Pages'],
  'Fluxo FC': ['Bruno Ferreira', "Douglas 'Doth'", 'Gustavinho Henrique', 'Helber Júnior', 'Jheferson Falcão', 'João Pedro', "Marcos 'MV'", "Matheus 'Chaveirinho'", 'Murillo Pulino', "Paulo 'Pinguinho'", 'Renan Augusto', 'Tuco Magalhães', 'Well Andrade'],
  'Furia FC': ['Jeffinho Honorato', 'Jhow Love', 'João Pelegrini', 'Kenu Leandro', 'Leleti Garcia', 'Lipão Pinheiro', 'Lucas Nascimento', 'Luiz Camilo', "Matheus 'Dedo'", "Rafael 'Tambinha'", "Thiago 'Major'", 'Tiago Marinho', 'Victor Hugo', "Vitor 'Barba'"],
  'G3X FC': ['Andreas Vaz', 'Everton Felipe', 'Gabriel Braga', 'Gabriel Medeiros', 'Gabriel Messias', 'João Guimarães', 'Josildo Barata', 'Kelvin Oliveira', 'Marinho Filho', 'Matheus Rufino', 'Ryan Lima', "Thiago 'TH' Brito", 'Wembley Luiz'],
  'LOUD SC': ['Arthur Facas', 'Caio Felipe', 'Daniel Shiraishi', 'Esaú Nascimento', 'Felipe Cassiano', 'Felipe Viana', "Maicon 'Barata'", "Matheus 'Biro'", "Paulo 'Pulão'", 'Rafinha Cunha', 'Sam Silva', 'Walid Jaadi'],
  'Nyvelados FC': ['Ailton José', "Bruno 'Gan'", "Carlos 'Ferrão'", 'Daniel Coringa', 'Danilo Belém', 'Dieguinho Assis', "Everton 'Chiclete' Araújo", "Igor 'BB'", "Léo 'Gol'", "Luandrio 'Pé Fino'", "Lucas 'Japa'", 'Luisinho Barreiros', 'Maicon Macabeu', 'Matheus Klynsmann', "Vanderson 'Neguiim Jr'"],
  'Podpah Funkbol Clube': ['Caio Miranda', 'Gustavo Silva', 'Igor Campos', "João 'Choco'", 'Juninho Antunes', 'Leléo Moura', "Luan 'Mestre'", 'Martín Lara', "Rafão 'Portuga'", 'Ronaldinho Reis', 'Vini Alexandre', 'William Jesus', "Yan 'Coringa'"],
}

const MEXICO_PLAYERS_DATA: Record<string, string[]> = {
  'Aniquiladores FC': ['Axur Quintero', 'Brayan González', 'Brayan Hernández', 'Brihan Gutiérrez', 'Daviz Junco', 'Denilson Lobón', 'Diego Martínez', 'Erik Fraire', "Jacob 'Lobo' Morales", "Martín 'Cani' Rodríguez", 'Nelson Velandia', "Patricio 'Pato' Arias"],
  'Atlético Parceros FC': ['Alexis Gómez', 'Andrés Osorno', 'Angellot Caro', 'Cristian Hernández', 'David Loaiza', 'Felipe Urán', 'Juan Tilano', 'Julio Perea', 'Kevin Mejía', 'Maicol Hernández', 'Marlon Ramírez', 'Simón Duque'],
  'Club de Cuervos': ['Adriano Nunes', 'Ángel Ayala', 'Armando Chávez', 'Baruc Ochoa', 'Brandon Magaña', 'César Romo', 'Diego Velázquez', 'Edder Vargas', 'Edson González', 'Fausto Alemán', 'Hugo Murga', 'Jorge Escamilla', 'José Askenazi', 'Luis Valdés', 'Roberto Uribe'],
  'Galácticos del Caribe': ["Alejandro 'Maro' Ortega", 'Daniel Mendoza', 'Diego Franco', 'Erick Guzmán', 'Erick Madrigal', 'Iván Muñoz', 'Jairo Tapie', 'Jesús Carbajal', 'José Hernández', 'Kevin Cardona', 'Pabel Montes', 'Pablo Gómez'],
  'Guerrilla FC': ['Abraham Morales', 'Adrián Mora', 'Alain Villanueva', 'Albano Rodríguez', 'Eduardo Velarde', 'Gerardo Ramírez', "Gustavo 'Furby' Guillén", 'Isaac Zepeda', 'Jair Peláez', 'Juan Carlos Silva', 'Miguel Lizardo', 'Morrison Palma', 'Omar Láscari', 'Rafael Cid', 'Said Zamora', 'Yudier Prado'],
  'KRÜ FC': ['Aaron Martínez', 'Alberto García', 'Christopher Pedraza', 'Dago Campari', 'Edson Trejo', 'Erik Lugo', 'Facu Romero', 'Gonzalo Lescano', 'Jeancob Ramírez', 'Mauricio Reyna', 'Santiago Rotemberg', 'Tomás Sandoval'],
  'Los Aliens FC': ['Alan Mendoza', 'Brayam Nazarit', 'Daniel Ríos', 'David Ortiz', 'Diego Abella', 'Erik Vera', 'James Hernández', "Jesús 'Chuy' Pérez", 'Jorge Meléndez', 'Juan Ramírez', 'Julio Torres', 'Ricardo Valencia'],
  'Los Chamos FC': ['Alexis López', 'Álvaro Bocanegra', 'Carlos Escalona', 'Christian Lagunas', 'Cristian Hernández', 'Genaro Castillo', 'Gustavo Miranda', 'Irvin Mojica', 'Jesús López', 'Juan Cisneros', 'Román Ramírez', 'Salvador Navarro', 'Tonatiuh Mejía', 'Uriel Zuart'],
  'Peluche Caligari': ['Aarón Del Real', 'Aldair Giorgana', "Ángel 'Curry' Castro", "Carlos 'Camello' Valdez", 'César Vallejo', 'Christian Gimenez', 'Daniel Quiroz', 'Eddie Sánchez', 'Eder Giorgana', 'Fernando Morales', 'Hugo Rodríguez', 'Josecarlos Van Rankin', 'Mauricio Huitrón', "Michelle 'Chucky' Castro", 'Moisés Dabbah', 'Pablo Barrera', 'Santiago Lagarde'],
  'Persas FC': ['Antonio Monterde', 'Diego Rodríguez', 'Doido Santos', 'Gustavo Ramos', 'Iván Monroy', 'José Rochín', 'Kevin Valdez', 'Luis Amador', 'Marco Granados', 'Obed Martínez', 'Óscar Gómez', 'Rodrigo González', 'Yair Arias'],
  'Raniza FC': ['Alexis Silva', 'Alfonso Nieto', 'Donovan Martínez', 'Eder López', 'Ezequiel Luna', 'Héctor de la Fuente', 'Jonathan Sánchez', 'Juan Araya', 'Juande Martínez', 'Lautaro Martínez', 'Mathías Vidangossy', 'Matías Herrera'],
  'Simios FC': ['Andrés Suárez', 'Cristian González', 'Erick Sámano', 'George Corral', 'Gerson García', 'Hatzel Roque', 'Jorge Lima', "José 'Shaggy' Martínez", 'Luis Olascoaga', 'Miguel Rebollo', 'Óscar Medina', 'Roberto Pérez', 'Sebastián Sáez'],
}

const DATA_BY_SPLIT: Record<SplitKey, Record<string, string[]>> = {
  spain:  SPAIN_PLAYERS_DATA,
  brazil: BRAZIL_PLAYERS_DATA,
  mexico: MEXICO_PLAYERS_DATA,
}

// Status icon sources keyed by field name
const STATUS_ICONS: Record<string, string> = {
  lesion:   '/MUERTAZOS ESTRUCTURA/lesion.png',
  tarjeta:  '/MUERTAZOS ESTRUCTURA/tarjeta.png',
  wildcard: '/MUERTAZOS ESTRUCTURA/wildcard.png',
}

interface PlayerStatus {
  lesion:    boolean
  tarjeta:   boolean
  wildcard:  boolean
  convocado: boolean
}

interface Props {
  fillViewport?: boolean
}

export default function PizarraView({ fillViewport: _fillViewport = false }: Props) {
  const [split, setSplit] = useState<SplitKey>('spain')
  const splitOpt = SPLIT_OPTIONS.find(s => s.key === split)!
  const playersData = DATA_BY_SPLIT[split]
  const availableTeams = Object.keys(playersData)

  const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0] || '')
  const [selectedPlayer, setSelectedPlayer] = useState<string>(playersData[availableTeams[0]]?.[0] || '')
  const [playersOnPitch, setPlayersOnPitch] = useState<any[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Player statuses from DB — key: `${country}_${teamName}_${playerName}`
  const [playerStatuses, setPlayerStatuses] = useState<Map<string, PlayerStatus>>(new Map())

  // country_id → SplitKey mapping (must match players_insert.sql)
  const COUNTRY_ID_TO_SPLIT: Record<number, SplitKey> = { 1: 'spain', 2: 'brazil', 3: 'mexico' }

  // Fetch all player statuses once — join teams to get team name
  useEffect(() => {
    supabase
      .from('players')
      .select('name, country_id, lesion, tarjeta, wildcard, convocado, teams(name)')
      .then(({ data, error }) => {
        if (error) {
          console.error('[PizarraView] status fetch error:', JSON.stringify(error))
          return
        }
        if (!data?.length) return
        const map = new Map<string, PlayerStatus>()
        data.forEach(p => {
          const splitKey = COUNTRY_ID_TO_SPLIT[p.country_id as number]
          const teamName = (p.teams as unknown as { name: string } | null)?.name
          if (!splitKey || !teamName) return
          const key = `${splitKey}_${teamName}_${p.name}`
          map.set(key, {
            lesion:    !!p.lesion,
            tarjeta:   !!p.tarjeta,
            wildcard:  !!p.wildcard,
            convocado: p.convocado !== false,
          })
        })
        setPlayerStatuses(map)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Returns the status for a player, defaulting to fully enabled if not in DB
  const getStatus = (splitKey: SplitKey, team: string, playerName: string): PlayerStatus => {
    return playerStatuses.get(`${splitKey}_${team}_${playerName}`) ?? {
      lesion: false, tarjeta: false, wildcard: false, convocado: true,
    }
  }

  // Whether a player is convocado (default: true if not in DB)
  const isConvocado = (splitKey: SplitKey, team: string, playerName: string) =>
    getStatus(splitKey, team, playerName).convocado

  // Returns overlay icon paths for a player based on their status
  const getOverlays = (splitKey: SplitKey, team: string, playerName: string): string[] => {
    const s = getStatus(splitKey, team, playerName)
    const icons: string[] = []
    if (s.lesion)   icons.push(STATUS_ICONS.lesion)
    if (s.tarjeta)  icons.push(STATUS_ICONS.tarjeta)
    if (s.wildcard) icons.push(STATUS_ICONS.wildcard)
    return icons
  }

  // Convocado-filtered player list for the active team/split
  const convocadoPlayers = (DATA_BY_SPLIT[split][selectedTeam] ?? []).filter(
    p => isConvocado(split, selectedTeam, p)
  )

  // Reset team/player dropdowns when split changes — board state is preserved intentionally
  useEffect(() => {
    const newData = DATA_BY_SPLIT[split]
    const teams = Object.keys(newData)
    setSelectedTeam(teams[0] || '')
    const firstPlayers = newData[teams[0]] ?? []
    const firstConvocado = firstPlayers.find(p => isConvocado(split, teams[0], p))
    setSelectedPlayer(firstConvocado ?? firstPlayers[0] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [split])

  // Reset player when team changes
  useEffect(() => {
    const allPlayers = DATA_BY_SPLIT[split][selectedTeam] ?? []
    const firstConvocado = allPlayers.find(p => isConvocado(split, selectedTeam, p))
    if (firstConvocado) setSelectedPlayer(firstConvocado)
    else if (allPlayers.length) setSelectedPlayer(allPlayers[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam, split])

  const buildImagePath = (team: string, fileName: string, splitKey: SplitKey) => {
    const opt = SPLIT_OPTIONS.find(s => s.key === splitKey)!
    return `/MUERTAZOS ESTRUCTURA/KINGS/${opt.folder}/${opt.split}/${team}/${fileName}.webp`
  }

  const addPlayerToPitch = (fileName: string) => {
    setPlayersOnPitch(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      team: selectedTeam,
      fileName,
      split,
      x: 50,
      y: 50,
      zIndex: prev.length + 1,
    }])
  }

  const addAllPlayers = () => {
    // Only add convocado players
    const players = (DATA_BY_SPLIT[split][selectedTeam] ?? []).filter(
      p => isConvocado(split, selectedTeam, p)
    )
    if (!players.length) return
    const currentCount = playersOnPitch.length
    setPlayersOnPitch(prev => [...prev, ...players.map((fileName, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      team: selectedTeam,
      fileName,
      split,
      x: 50,
      y: 50,
      zIndex: currentCount + index + 1,
    }))])
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDraggingId(id)
    setPlayersOnPitch(prev => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map(pl => pl.zIndex)) : 0
      return prev.map(p => p.id === id ? { ...p, zIndex: maxZ + 1 } : p)
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (draggingId !== id || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPlayersOnPitch(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) }
          : p
      )
    )
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap gap-3 items-end shadow-xl">
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Competición</label>
          <select
            value={split}
            onChange={e => setSplit(e.target.value as SplitKey)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm"
          >
            {SPLIT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo</label>
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm"
          >
            {availableTeams.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jugador</label>
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg p-2 outline-none text-sm"
          >
            {convocadoPlayers.map(player => (
              <option key={player} value={player}>{player}</option>
            ))}
            {/* If no convocado data yet, fall back to showing all */}
            {convocadoPlayers.length === 0 && playersData[selectedTeam]?.map(player => (
              <option key={player} value={player}>{player}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => addPlayerToPitch(selectedPlayer)} className="bg-[#ffd300] text-black font-black italic px-5 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex-1 sm:flex-none text-sm">Añadir</button>
          <button onClick={addAllPlayers} className="bg-[#01d6c3] text-black font-black italic px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors flex-1 sm:flex-none text-sm">Todos</button>
          <button onClick={() => setPlayersOnPitch([])} className="bg-red-500/10 text-red-500 border border-red-500/50 font-black italic px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex-1 sm:flex-none text-sm">Limpiar</button>
        </div>
      </div>

      {/* Pitch */}
      <div className="flex justify-center px-2 md:px-2">
        <div ref={boardRef} className="relative w-full max-w-[1200px] touch-none select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Campo.jpg"
            alt="campo"
            className="w-full h-auto md:h-[900px] md:object-fill block pointer-events-none select-none"
            draggable={false}
          />
          {playersOnPitch.map(player => (
            <div
              key={player.id}
              onPointerDown={e => handlePointerDown(e, player.id)}
              onPointerMove={e => handlePointerMove(e, player.id)}
              onPointerUp={() => setDraggingId(null)}
              onPointerCancel={() => setDraggingId(null)}
              onDoubleClick={() => setPlayersOnPitch(prev => prev.filter(p => p.id !== player.id))}
              className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
                zIndex: player.zIndex,
                width: 'clamp(52px, 10vw, 140px)',
                height: 'clamp(52px, 10vw, 140px)',
              }}
            >
              <div className="relative w-full h-full drop-shadow-xl">
                <Image
                  src={buildImagePath(player.team, player.fileName, player.split)}
                  alt="jugador"
                  fill
                  className="object-contain pointer-events-none select-none"
                />
                {/* Status overlays — stacked top-left, inset 4% from edges, 20% of token size */}
                {getOverlays(player.split, player.team, player.fileName).map((src, i) => (
                  <div
                    key={src}
                    className="absolute pointer-events-none"
                    style={{ left: '15%', top: `calc(8% + ${i * 22}%)`, width: '20%', height: '20%' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-contain drop-shadow-md"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-slate-500 text-[10px] uppercase tracking-widest font-bold">
        * DOBLE CLIC PARA ELIMINAR
      </p>
    </div>
  )
}
