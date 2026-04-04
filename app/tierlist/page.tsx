'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd'
import AppHeader from '@/components/AppHeader'

// ── Types ───────────────────────────────────────────────────────────────────
type Competition = 'kings' | 'queens'
type Country     = 'spain' | 'mexico' | 'brazil'
type Category    = 'teams' | 'players' | 'jerseys'
type PlayerScope = 'league' | 'team'

interface Chip    { id: string; name: string; imageSrc: string }
interface TierRow { id: string; label: string; color: string; chips: Chip[] }

const BENCH_ID = '__bench__'

// ── Full PLAYERS_DATA (all Kings Spain teams) ────────────────────────────────
const PLAYERS_DATA: Record<string, string[]> = {
  '1K FC':            ['Achraf Laiti','Cristian Faura','Erik Beattie','Gerard Verge','Guelmi Pons','Isma Reguia','Iván Rivera','Joel Paredes','Joel Navas','Karim Moya','Michel Owono',"Pau 'ZZ' Ruiz",'Pol Lechuga'],
  'El Barrio':        ['Carlos Val','Cristian Ubón','Haitam Babia','Gerard Puigvert','Hugo Eyre','Joel Bañuls','Pablo Saborido','Pau Fernández','Pol Molés','Robert Vallribera','Sergio Fernández','Sergio Herrero','Ñito Martín'],
  'Jijantes FC':      ['Cristian Lobato','Dani Martí','Daniel Plaza','David Toro','Iker Hernández','Ion Vázquez','José Segovia','Juanpe Nzo','Mario León','Michel Herrero','Pau Fer','Sergi Torres','Víctor Pérez Bello','Álex Cañero'],
  'La Capital CF':    ['Antoni Hernández','Daniel Pérez','Daouda Bamma','Iñaki Villalba','Julen Álvarez','Manel Jiménez','Manuel Martín','Mario Victorio','Omar Dambelleh','Pablo Beguer','Sergi Vives','Sohaib Rektout'],
  'Los Troncos FC':   ['Alex Cubedo','Carles Planas','Carlos Contreras','Daniel Tamayo','David Reyes','Eloy Amoedo','Joan Oriol','Mark Sorroche','Masi Dabo','Sagar Escoto Majó','Victor Oribe','Yaroslav Toporkov','Álvaro Arché'],
  'PIO FC':           ['Adri Espinar','Adrián Frutos','Manel Beneite','Iker Bartolomé','Sergio Mulero','Joan Luque','Luis García','Marc Briones','Marcos Ibáñez','Pol Benito','Yeray Muñoz','Álex Sánchez'],
  'Porcinos FC':      ['Aitor Vives','Dani Pérez','Gerard Gómez','David Soriano','Edgar Alvaro','Fouad El Amrani','Marc Pelaz','Nadir Louah','Nico Santos','Oscar Coll','Ricard Pujol','Roger Carbó','Tomeu Nadal','Victor Nofuentes'],
  'Rayo de Barcelona':['Abde Bakkali','Adrià Escribano','Nil Pradas','Carlos Heredia','Carlos Omabegho','David Moreno','Gerard Oliva',"Guillem 'ZZ' Ruiz",'Ismael González','Iván Torres','Jordi Gómez','Jorge Ibáñez','Roc Bancells'],
  'Saiyans FC':       ['Albert Garcia','Borja Montejo','Dani Santiago','Diego Jiménez','Feliu Torrus','Gerard Vacas','Gio Ferinu','Isaac Maldonado','Iván Fajardo','Juanan Gallego','Pablo Fernández','Sergi Gestí'],
  'Skull FC':         ['Alberto Arnalot','Dani Santos','Samuel Aparicio','David Asensio','Jorge Escobar','Kevin Zárate','Koke Navares','Nano Modrego','Pablo de Castro','Raúl Escobar','Víctor Mongil','Álex Salas'],
  'Ultimate Mostoles':['Aleix Hernando','Aleix Lage','Josep Riart','Aleix Martí',"Alex 'Capi' Domingo",'David Grifell','Eloy Pizarro','Ferran Corominas','Javi Espinosa','Juan Lorente','Marc Granero','Mikhail Prokopev','Víctor Vidal'],
  'xBuyer Team':      ['Aleix Ruiz','Eric Sánchez','Galde Hugue','Jacobo Liencres','Javier Comas','Joel Espinosa','Juanma González','Mario Reyes',"Sergio 'Chechi' Costa",'Víctor Vargas','Xavier Cabezas','Álex Romero','Eric Pérez'],
}

const KINGS_TEAMS: Chip[] = [
  { id: 't-1k',       name: '1K FC',            imageSrc: '/logos/Kings/1K FC.webp' },
  { id: 't-barrio',   name: 'El Barrio',         imageSrc: '/logos/Kings/El Barrio.webp' },
  { id: 't-jijantes', name: 'Jijantes FC',       imageSrc: '/logos/Kings/Jijantes FC.webp' },
  { id: 't-capital',  name: 'La Capital',        imageSrc: '/logos/Kings/La Capital CF.webp' },
  { id: 't-troncos',  name: 'Los Troncos',       imageSrc: '/logos/Kings/Los Troncos FC.webp' },
  { id: 't-pio',      name: 'PIO FC',            imageSrc: '/logos/Kings/PIO FC.png' },
  { id: 't-porcinos', name: 'Porcinos FC',       imageSrc: '/logos/Kings/Porcinos FC.png' },
  { id: 't-rayo',     name: 'Rayo BCN',          imageSrc: '/logos/Kings/Rayo de Barcelona.png' },
  { id: 't-saiyans',  name: 'Saiyans FC',        imageSrc: '/logos/Kings/Saiyans FC.webp' },
  { id: 't-skull',    name: 'Skull FC',          imageSrc: '/logos/Kings/Skull FC.webp' },
  { id: 't-ultimate', name: 'Ultimate Móstoles', imageSrc: '/logos/Kings/Ultimate Mostoles.webp' },
  { id: 't-xbuyer',   name: 'xBuyer Team',       imageSrc: '/logos/Kings/xBuyer Team.webp' },
]

const QUEENS_TEAMS: Chip[] = [
  { id: 'q-1k',       name: '1K FC',            imageSrc: '/logos/Queens/1K FC.webp' },
  { id: 'q-barrio',   name: 'El Barrio',         imageSrc: '/logos/Queens/El Barrio.webp' },
  { id: 'q-jijantas', name: 'Jijantas FC',       imageSrc: '/logos/Queens/Jijantas FC.png' },
  { id: 'q-pilares',  name: 'Las Pilares FC',    imageSrc: '/logos/Queens/Las Pilares FC.png' },
  { id: 'q-troncas',  name: 'Las Troncas FC',    imageSrc: '/logos/Queens/Las Troncas FC.png' },
  { id: 'q-pio',      name: 'PIO FC',            imageSrc: '/logos/Queens/PIO FC.png' },
  { id: 'q-porcinas', name: 'Porcinas FC',       imageSrc: '/logos/Queens/Porcinas FC.png' },
  { id: 'q-rayo',     name: 'Rayo BCN',          imageSrc: '/logos/Queens/Rayo de Barcelona.png' },
  { id: 'q-saiyans',  name: 'Saiyans FC',        imageSrc: '/logos/Queens/Saiyans FC.webp' },
  { id: 'q-ultimate', name: 'Ultimate Móstoles', imageSrc: '/logos/Queens/Ultimate Mostoles.webp' },
]

// Build player chips for a specific team or the full league
function buildPlayerChips(teamName?: string): Chip[] {
  const teams = teamName ? { [teamName]: PLAYERS_DATA[teamName] ?? [] } : PLAYERS_DATA
  return Object.entries(teams).flatMap(([team, players]) =>
    players.map(name => ({
      id: `p-${team}-${name}`.replace(/\s+/g, '-').toLowerCase(),
      name,
      imageSrc: `/jugadores/${team}/${name}.png`,
    }))
  )
}

const DEFAULT_TIERS: Omit<TierRow, 'chips'>[] = [
  { id: 'S', label: 'S', color: '#FF5733' },
  { id: 'A', label: 'A', color: '#FF9500' },
  { id: 'B', label: 'B', color: '#FFD300' },
  { id: 'C', label: 'C', color: '#A4C639' },
  { id: 'D', label: 'D', color: '#01d6c3' },
]

let tierCounter = 5

function freshTiers(): TierRow[] {
  return DEFAULT_TIERS.map(t => ({ ...t, chips: [] }))
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TierListPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Wizard
  const [step, setStep]         = useState<1 | 2 | 3 | 4>(1)
  const [comp, setComp]         = useState<Competition>('kings')
  const [country, setCountry]   = useState<Country>('spain')
  const [cat, setCat]           = useState<Category>('teams')
  // Players sub-step
  const [playerScope, setPlayerScope] = useState<PlayerScope>('league')
  const [playerTeam, setPlayerTeam]   = useState<string>('')

  // Board
  const [generated, setGenerated]       = useState(false)
  const [tiers, setTiers]               = useState<TierRow[]>(freshTiers())
  const [bench, setBench]               = useState<Chip[]>([])
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Resolve chips from wizard selections
  function resolveChips(): Chip[] | null {
    if (country !== 'spain') return null
    if (cat === 'jerseys') return null
    if (cat === 'teams') return comp === 'kings' ? KINGS_TEAMS : QUEENS_TEAMS
    if (cat === 'players' && comp === 'kings') {
      return playerScope === 'team' && playerTeam
        ? buildPlayerChips(playerTeam)
        : buildPlayerChips()
    }
    return null // queens players not yet available
  }

  function handleGenerate() {
    const chips = resolveChips()
    if (!chips) return
    setTiers(freshTiers())
    setBench([...chips])
    setGenerated(true)
  }

  function handleReset() {
    setGenerated(false)
    setStep(1)
    setTiers(freshTiers())
    setBench([])
    setPlayerScope('league')
    setPlayerTeam('')
  }

  function addRow() {
    tierCounter++
    const colors = ['#e879f9','#38bdf8','#4ade80','#fb923c','#f472b6']
    const color = colors[tierCounter % colors.length]
    setTiers(prev => [...prev, { id: `tier-${tierCounter}`, label: '?', color, chips: [] }])
  }

  function addRowBelow(afterId: string) {
    tierCounter++
    const colors = ['#e879f9','#38bdf8','#4ade80','#fb923c','#f472b6']
    const color = colors[tierCounter % colors.length]
    const newRow = { id: `tier-${tierCounter}`, label: '?', color, chips: [] }
    setTiers(prev => {
      const idx = prev.findIndex(t => t.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, newRow)
      return next
    })
  }

  function removeRow(id: string) {
    setTiers(prev => {
      const row = prev.find(t => t.id === id)
      if (row) setBench(b => [...b, ...row.chips])
      return prev.filter(t => t.id !== id)
    })
  }

  // DnD
  const onDragEnd = useCallback((result: DropResult) => {
    const { source: src, destination: dst } = result
    if (!dst) return
    if (src.droppableId === dst.droppableId && src.index === dst.index) return

    const getList = (id: string) =>
      id === BENCH_ID ? bench : (tiers.find(t => t.id === id)?.chips ?? [])

    const setList = (id: string, items: Chip[]) => {
      if (id === BENCH_ID) setBench(items)
      else setTiers(prev => prev.map(t => t.id === id ? { ...t, chips: items } : t))
    }

    const srcList = [...getList(src.droppableId)]
    const [moved] = srcList.splice(src.index, 1)

    if (src.droppableId === dst.droppableId) {
      srcList.splice(dst.index, 0, moved)
      setList(src.droppableId, srcList)
    } else {
      const dstList = [...getList(dst.droppableId)]
      dstList.splice(dst.index, 0, moved)
      setList(src.droppableId, srcList)
      setList(dst.droppableId, dstList)
    }
  }, [bench, tiers])

  const canGenerate = resolveChips() !== null && (
    cat !== 'players' || comp !== 'kings' || step >= 4
      ? true
      : false
  )

  const selectedChips = resolveChips()
  const needsPlayerStep = cat === 'players' && comp === 'kings'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <AppHeader
        onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />

      {/* ── WIZARD (full-screen, shown until generated) ── */}
      {!generated && (
        <div className="flex-1 flex flex-col items-center overflow-y-auto py-10 px-4">
          <div className="w-full max-w-lg flex flex-col gap-8">

            <div>
              <h1 className="font-black italic text-2xl uppercase tracking-tighter">
                Tier List <span className="text-[#FFD300]">Maker</span>
              </h1>
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-1">
                Configura y genera tu ranking visual
              </p>
            </div>

            {/* STEP 1: Competition */}
            <Step num={1} activeStep={step} title="Competición" onStepClick={() => setStep(1)}>
              <div className="grid grid-cols-2 gap-3">
                <SelectCard active={comp === 'kings'} accent="#FFD300" label="Kings"
                  icon={
                    /* Crown with 3 sharp points — classic king's crown */
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.5h18M3 18.5l2-8 4 4 3-7.5 3 7.5 4-4 2 8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.5v1.5h18v-1.5" />
                    </svg>
                  }
                  onClick={() => { setComp('kings'); setStep(2) }} />
                <SelectCard active={comp === 'queens'} accent="#01d6c3" label="Queens"
                  icon={
                    /* Crown with 3 points + centre jewel — queen's crown */
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.5h18M3 18.5l2-8 4 4 3-7.5 3 7.5 4-4 2 8" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.5v1.5h18v-1.5" />
                      <circle cx="12" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  }
                  onClick={() => { setComp('queens'); setStep(2) }} />
              </div>
            </Step>

            {/* STEP 2: Country */}
            <Step num={2} activeStep={step} title="País" onStepClick={() => { if (step >= 2) setStep(2) }}>
              <div className="flex flex-col gap-2">
                {([
                  { key: 'spain'  as Country, code: 'ES', name: 'España',  soon: false },
                  { key: 'mexico' as Country, code: 'MX', name: 'México',  soon: true  },
                  { key: 'brazil' as Country, code: 'BR', name: 'Brasil',  soon: true  },
                ]).map(({ key, code, name, soon }) => (
                  <button
                    key={key}
                    disabled={soon}
                    onClick={() => { setCountry(key); setStep(3) }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border font-black italic uppercase tracking-tight transition-all text-sm
                      ${country === key && step > 2 ? 'border-[#ffd300] bg-[#ffd300]/10 text-[#ffd300]' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}
                      ${soon ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-black border border-current/30 rounded px-1 py-0.5 not-italic">{code}</span>
                      {name}
                    </span>
                    {soon && <span className="text-[9px] font-black text-slate-600 not-italic tracking-widest">PRÓXIMAMENTE</span>}
                  </button>
                ))}
              </div>
            </Step>

            {/* STEP 3: Category */}
            <Step num={3} activeStep={step} title="Categoría" onStepClick={() => { if (step >= 3) setStep(3) }}>
              <div className="grid grid-cols-3 gap-2">
                {(['teams','players','jerseys'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => { setCat(c); setStep(c === 'players' && comp === 'kings' ? 4 : 3) }}
                    className={`py-3 px-2 rounded-xl border font-black italic uppercase text-xs tracking-tight transition-all
                      ${cat === c ? 'border-[#ffd300] bg-[#ffd300]/10 text-[#ffd300]' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                  >
                    {c === 'teams' ? 'Equipos' : c === 'players' ? 'Jugadores' : 'Camisetas'}
                  </button>
                ))}
              </div>
            </Step>

            {/* STEP 4: Player scope (only for Kings players) */}
            {needsPlayerStep && (
              <Step num={4} activeStep={step} title="¿Qué jugadores?" onStepClick={() => {}}>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setPlayerScope('league'); setPlayerTeam('') }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all
                      ${playerScope === 'league' ? 'border-[#ffd300] bg-[#ffd300]/10 text-[#ffd300]' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                    Liga Entera
                  </button>
                  <button
                    onClick={() => setPlayerScope('team')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all
                      ${playerScope === 'team' ? 'border-[#ffd300] bg-[#ffd300]/10 text-[#ffd300]' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    Equipo Específico
                  </button>

                  {playerScope === 'team' && (
                    <div className="grid grid-cols-2 gap-1 mt-1 max-h-52 overflow-y-auto pr-1">
                      {Object.keys(PLAYERS_DATA).map(team => (
                        <button
                          key={team}
                          onClick={() => setPlayerTeam(team)}
                          className={`text-left px-3 py-2 rounded-lg border text-[10px] font-black italic uppercase tracking-tight transition-all
                            ${playerTeam === team ? 'border-[#ffd300] text-[#ffd300] bg-[#ffd300]/10' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                        >
                          {team}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Step>
            )}

            {/* CTA */}
            {step >= 3 && (
              selectedChips === null ? (
                <div className="text-center py-4">
                  <p className="text-slate-600 font-black italic uppercase text-sm tracking-widest">PRÓXIMAMENTE</p>
                  <p className="text-slate-700 text-xs mt-1">Esta combinación aún no está disponible</p>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={needsPlayerStep && playerScope === 'team' && !playerTeam}
                  className="w-full h-14 bg-[#FFD300] text-slate-900 font-black italic uppercase tracking-tighter text-lg rounded-2xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                >
                  GENERAR TIER LIST →
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ── BOARD (full-screen, shown after generate) ── */}
      {generated && (
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <DragDropContext onDragEnd={onDragEnd}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-black italic uppercase text-xl tracking-tighter">
                  {comp === 'kings' ? 'Kings' : 'Queens'}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">
                  España · {cat === 'teams' ? 'Equipos' : cat === 'players' ? (playerScope === 'team' ? playerTeam : 'Todos los jugadores') : 'Camisetas'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-white font-black italic uppercase text-xs tracking-tight transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Reconfigurar
                </button>
              </div>
            </div>

            {/* Tier rows */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden mb-4">
              {tiers.map(tier => (
                <div key={tier.id} className="flex min-h-[104px] border-b border-slate-800 last:border-b-0">

                  {/* Label */}
                  <div className="w-16 shrink-0 flex items-center justify-center border-r border-slate-800"
                    style={{ backgroundColor: tier.color + '22' }}>
                    {editingTierId === tier.id ? (
                      <input autoFocus
                        className="w-12 text-center bg-transparent border-b border-white/30 font-black text-2xl text-white outline-none"
                        defaultValue={tier.label}
                        onBlur={e => { setTiers(p => p.map(t => t.id === tier.id ? { ...t, label: e.target.value || tier.id } : t)); setEditingTierId(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      />
                    ) : (
                      <button onClick={() => setEditingTierId(tier.id)}
                        className="font-black text-2xl italic hover:opacity-80 transition-opacity" style={{ color: tier.color }}>
                        {tier.label}
                      </button>
                    )}
                  </div>

                  {/* Dropzone */}
                  <Droppable droppableId={tier.id} direction="horizontal">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={`flex-1 flex flex-wrap gap-2 p-2 content-start items-start min-h-[104px] transition-colors
                          ${snapshot.isDraggingOver ? 'bg-white/5' : 'bg-transparent'}`}>
                        {tier.chips.map((chip, idx) => (
                          <ImageChip key={chip.id} chip={chip} index={idx} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Kebab menu */}
                  <div className="w-10 shrink-0 flex items-center justify-center border-l border-slate-800 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === tier.id ? null : tier.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/10 rounded-lg transition-all text-lg leading-none"
                    >
                      ⋮
                    </button>
                    {openMenuId === tier.id && (
                      <div className="absolute right-10 top-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 w-48 py-1 overflow-hidden">
                        {/* Color picker row */}
                        <label className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 cursor-pointer transition-colors">
                          <span className="w-4 h-4 rounded-full border border-slate-600 shrink-0 overflow-hidden relative" style={{ backgroundColor: tier.color }}>
                            <input type="color" value={tier.color}
                              onChange={e => setTiers(p => p.map(t => t.id === tier.id ? { ...t, color: e.target.value } : t))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </span>
                          Cambiar color
                        </label>
                        <button
                          onClick={() => { setEditingTierId(tier.id); setOpenMenuId(null) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 9" /></svg>
                          Cambiar nombre
                        </button>
                        <button
                          onClick={() => { addRowBelow(tier.id); setOpenMenuId(null) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          Añadir fila abajo
                        </button>
                        <div className="border-t border-slate-800 my-1" />
                        <button
                          onClick={() => { removeRow(tier.id); setOpenMenuId(null) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          Eliminar fila
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bench */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h3 className="font-black italic uppercase text-sm text-slate-400 tracking-tighter">
                  Banquillo <span className="text-[#FFD300]">/ {bench.length} restantes</span>
                </h3>
              </div>
              <Droppable droppableId={BENCH_ID} direction="horizontal">
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`flex flex-wrap gap-2 p-3 min-h-[120px] transition-colors
                      ${snapshot.isDraggingOver ? 'bg-white/5' : 'bg-slate-950/40'}`}>
                    {bench.map((chip, idx) => (
                      <ImageChip key={chip.id} chip={chip} index={idx} />
                    ))}
                    {provided.placeholder}
                    {bench.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-slate-700 text-xs font-black italic uppercase tracking-widest">
                        ¡Todo clasificado!
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        </main>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Step({ num, activeStep, title, children, onStepClick }: {
  num: number; activeStep: number; title: string; children: React.ReactNode; onStepClick: () => void
}) {
  const isActive = activeStep >= num
  return (
    <div className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
      <button onClick={onStepClick} className="flex items-center gap-3 mb-3 w-full text-left group">
        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0
          ${activeStep === num ? 'bg-[#ffd300] text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
          {num}
        </span>
        <h2 className="font-black italic uppercase text-base tracking-tight text-slate-300 group-hover:text-white transition-colors">
          {title}
        </h2>
      </button>
      {children}
    </div>
  )
}

function SelectCard({ active, accent, onClick, label, icon }: {
  active: boolean; accent: string; onClick: () => void; label: string; icon: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all font-black italic uppercase text-xs tracking-tight overflow-hidden
        ${active ? 'border-current' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
      style={active ? { borderColor: accent, color: accent, backgroundColor: accent + '15' } : {}}>
      <span className="not-italic">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// Image-only chip — no border, no background, pure transparent image
function ImageChip({ chip, index }: { chip: Chip; index: number }) {
  return (
    <Draggable draggableId={chip.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={chip.name}
          className={`relative w-24 h-24 cursor-grab active:cursor-grabbing select-none transition-all
            ${snapshot.isDragging ? 'scale-110 rotate-2 z-50 opacity-90' : 'hover:scale-110'}`}
        >
          <Image
            src={chip.imageSrc}
            alt={chip.name}
            fill
            className="object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2' }}
          />
        </div>
      )}
    </Draggable>
  )
}
