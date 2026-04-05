'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
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
  '1K FC': ['Achraf Laiti.png', 'Cristian Faura.png', 'Erik Beattie.png', 'Gerard Verge.png', 'Isma Reguia.png', 'Iván Rivera.png', 'Joel Paredes.png', 'Joel Navas.png', 'Karim Moya.png', 'Michel Owono.png', "Pau 'ZZ' Ruiz.png", 'Pol Lechuga.png'],
  'El Barrio': ['Carlos Val.png', 'Cristian Ubón.png', 'Haitam Babia.png', 'Gerard Puigvert.png', 'Hugo Eyre.png', 'Joel Bañuls.png', 'Pablo Saborido.png', 'Pau Fernández.png', 'Pol Molés.png', 'Robert Vallribera.png', 'Sergio Fernández.png', 'Sergio Herrero.png', 'Ñito Martín.png', 'Marçal Ros.png'],
  'Jijantes FC': ['Cristian Lobato.png', 'Dani Martí.png', 'Daniel Plaza.png', 'Iker Hernández.png', 'Ion Vázquez.png', 'José Segovia.png', 'Juanpe Nzo.png', 'Mario León.png', 'Michel Herrero.png', 'Pau Fer.png', 'Sergi Torres.png', 'Víctor Pérez Bello.png', 'Álex Cañero.png'],
  'La Capital CF': ['Antoni Hernández.png', 'Daniel Pérez.png', 'Daouda Bamma.png', 'Iñaki Villalba.png', 'Julen Álvarez.png', 'Manel Jiménez.png', 'Manuel Martín.png', 'Mario Victorio.png', 'Omar Dambelleh.png', 'Pablo Beguer.png', 'Sergi Vives.png', 'Sohaib Rektout.png'],
  'Los Troncos FC': ['Alex Cubedo.png', 'Carles Planas.png', 'Carlos Contreras.png', 'Daniel Tamayo.png', 'David Reyes.png', 'Eloy Amoedo.png', 'Joan Oriol.png', 'Mark Sorroche.png', 'Masi Dabo.png', 'Sagar Escoto Majó.png', 'Victor Oribe.png', 'Yaroslav Toporkov.png', 'Álvaro Arché.png', 'Aleix Semur.png'],
  'PIO FC': ['Adri Espinar.png', 'Adrián Frutos.png', 'Manel Beneite.png', 'Iker Bartolomé.png', 'Sergio Mulero.png', 'Joan Luque.png', 'Luis García.png', 'Marc Briones.png', 'Marcos Ibáñez.png', 'Pol Benito.png', 'Yeray Muñoz.png', 'Álex Sánchez.png'],
  'Porcinos FC': ['Aitor Vives.png', 'Dani Pérez.png', 'Gerard Gómez.png', 'David Soriano.png', 'Edgar Alvaro.png', 'Fouad El Amrani.png', 'Marc Pelaz.png', 'Nadir Louah.png', 'Nico Santos.png', 'Oscar Coll.png', 'Ricard Pujol.png', 'Roger Carbó.png', 'Tomeu Nadal.png', 'Victor Nofuentes.png'],
  'Rayo de Barcelona': ['Abde Bakkali.png', 'Adrià Escribano.png', 'Nil Pradas.png', 'Carlos Heredia.png', 'Carlos Omabegho.png', 'David Moreno.png', 'Gerard Oliva.png', "Guillem 'ZZ' Ruiz.png", 'Ismael González.png', 'Iván Torres.png', 'Jordi Gómez.png', 'Jorge Ibáñez.png', 'Roc Bancells.png'],
  'Saiyans FC': ['Albert Garcia.png', 'Borja Montejo.png', 'Dani Santiago.png', 'Diego Jiménez.png', 'Feliu Torrus.png', 'Gerard Vacas.png', 'Gio Ferinu.png', 'Isaac Maldonado.png', 'Iván Fajardo.png', 'Juanan Gallego.png', 'Pablo Fernández.png', 'Sergi Gestí.png'],
  'Skull FC': ['Alberto Arnalot.png', 'Dani Santos.png', 'Samuel Aparicio.png', 'David Asensio.png', 'Jorge Escobar.png', 'Kevin Zárate.png', 'Nano Modrego.png', 'Pablo de Castro.png', 'Raúl Escobar.png', 'Víctor Mongil.png', 'Álex Salas.png', 'José Hermosa.png', 'Manu García.png'],
  'Ultimate Mostoles': ['Aleix Hernando.png', 'Aleix Lage.png', 'Aleix Martí.png', "Alex 'Capi' Domingo.png", 'David Grifell.png', 'Eloy Pizarro.png', 'Ferran Corominas.png', 'Javi Espinosa.png', 'Juan Lorente.png', 'Marc Granero.png', 'Mikhail Prokopev.png', 'Víctor Vidal.png'],
  'xBuyer Team': ['Aleix Ruiz.png', 'Eric Sánchez.png', 'Galde Hugue.png', 'Jacobo Liencres.png', 'Javier Comas.png', 'Joel Espinosa.png', 'Juanma González.png', 'Mario Reyes.png', "Sergio 'Chechi' Costa.png", 'Víctor Vargas.png', 'Xavier Cabezas.png', 'Álex Romero.png', 'Zaid Saban.png'],
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
  const [comp, setComp]         = useState<Competition | null>(null)
  const [country, setCountry]   = useState<Country>('spain')
  const [cat, setCat]           = useState<Category>('teams')
  // Players sub-step
  const [playerScope, setPlayerScope] = useState<PlayerScope>('league')
  const [playerTeam, setPlayerTeam]   = useState<string>('')

  // Accent color driven by competition
  const accent = comp === 'queens' ? '#01d6c3' : '#FFD300'

  // Board
  const [generated, setGenerated]       = useState(false)
  const [tiers, setTiers]               = useState<TierRow[]>(freshTiers())
  const [bench, setBench]               = useState<Chip[]>([])
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null)
  const [isSharing, setIsSharing]       = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)
  const shareTicketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Resolve chips from wizard selections
  function resolveChips(): Chip[] | null {
    if (!comp) return null
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
    setComp(null)
    setTiers(freshTiers())
    setBench([])
    setPlayerScope('league')
    setPlayerTeam('')
  }

  // Convert any CSS color (incl. oklch/lab) to rgb() via canvas — html2canvas safe
  function toSafeRgb(color: string): string {
    try {
      const cv = document.createElement('canvas')
      cv.width = cv.height = 1
      const ctx = cv.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return a === 0 ? 'rgba(0,0,0,0)' : `rgb(${r},${g},${b})`
    } catch {
      return color
    }
  }

  async function handleShareTierList() {
    if (!shareTicketRef.current || isSharing) return
    setIsSharing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const origEl = shareTicketRef.current
      const canvas = await html2canvas(origEl, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = 'tierlist-muertazos.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setIsSharing(false)
    }
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
    <div className={`${generated ? 'h-screen' : 'min-h-screen'} bg-[#0a0a0a] text-white flex flex-col overflow-hidden`}>
      <AppHeader
        onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />

      {/* ── WIZARD (full-screen, shown until generated) ── */}
      {!generated && (
        <div className="flex-1 flex flex-col items-center overflow-y-auto min-h-0 py-10 px-4">
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
            <Step num={1} activeStep={step} title="Competición" accent={accent} onStepClick={() => setStep(1)}>
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
            <Step num={2} activeStep={step} title="País" accent={accent} onStepClick={() => { if (step >= 2) setStep(2) }}>
              <div className="flex flex-col gap-2">
                {([
                  { key: 'spain'  as Country, code: 'ES', name: 'España',  soon: false },
                  { key: 'mexico' as Country, code: 'MX', name: 'México',  soon: true  },
                  { key: 'brazil' as Country, code: 'BR', name: 'Brasil',  soon: true  },
                ]).filter(c => comp === 'queens' ? c.key === 'spain' : true).map(({ key, code, name, soon }) => {
                  const isActive = country === key && step > 2
                  return (
                    <button
                      key={key}
                      disabled={soon}
                      onClick={() => { setCountry(key); setStep(3) }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border font-black italic uppercase tracking-tight transition-all text-sm
                        ${soon ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-400' : isActive ? 'border-current' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                      style={isActive ? { borderColor: accent, color: accent, backgroundColor: accent + '18' } : {}}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-black border border-current/30 rounded px-1 py-0.5 not-italic">{code}</span>
                        {name}
                      </span>
                      {soon && <span className="text-[9px] font-black text-slate-600 not-italic tracking-widest">PRÓXIMAMENTE</span>}
                    </button>
                  )
                })}
              </div>
            </Step>

            {/* STEP 3: Category */}
            <Step num={3} activeStep={step} title="Categoría" accent={accent} onStepClick={() => { if (step >= 3) setStep(3) }}>
              <div className="grid grid-cols-3 gap-2">
                {(['teams','players','jerseys'] as const).map(c => {
                  const isActive = cat === c
                  return (
                    <button
                      key={c}
                      onClick={() => { setCat(c); setStep(c === 'players' && comp === 'kings' ? 4 : 3) }}
                      className={`py-3 px-2 rounded-xl border font-black italic uppercase text-xs tracking-tight transition-all
                        ${isActive ? 'border-current' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                      style={isActive ? { borderColor: accent, color: accent, backgroundColor: accent + '18' } : {}}
                    >
                      {c === 'teams' ? 'Equipos' : c === 'players' ? (comp === 'queens' ? 'Jugadoras' : 'Jugadores') : 'Camisetas'}
                    </button>
                  )
                })}
              </div>
            </Step>

            {/* STEP 4: Player scope (only for Kings players) */}
            {needsPlayerStep && (
              <Step num={4} activeStep={step} title="¿Qué jugadores?" accent={accent} onStepClick={() => {}}>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setPlayerScope('league'); setPlayerTeam('') }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all
                      ${playerScope === 'league' ? 'border-current' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                    style={playerScope === 'league' ? { borderColor: accent, color: accent, backgroundColor: accent + '18' } : {}}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                    Liga
                  </button>
                  <button
                    onClick={() => setPlayerScope('team')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-black italic uppercase text-sm tracking-tight transition-all
                      ${playerScope === 'team' ? 'border-current' : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                    style={playerScope === 'team' ? { borderColor: accent, color: accent, backgroundColor: accent + '18' } : {}}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    Equipo
                  </button>

                  {playerScope === 'team' && (
                    <div className="grid grid-cols-2 gap-1 mt-1 max-h-52 overflow-y-auto pr-1">
                      {Object.keys(PLAYERS_DATA).map(team => {
                        const isActive = playerTeam === team
                        return (
                          <button
                            key={team}
                            onClick={() => setPlayerTeam(team)}
                            className={`text-left px-3 py-2 rounded-lg border text-[10px] font-black italic uppercase tracking-tight transition-all
                              ${isActive ? 'border-current' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'}`}
                            style={isActive ? { borderColor: accent, color: accent, backgroundColor: accent + '18' } : {}}
                          >
                            {team}
                          </button>
                        )
                      })}
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
                  className="w-full h-14 font-black italic uppercase tracking-tighter text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ backgroundColor: accent, color: '#0f172a' }}
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
        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 pb-2">
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
                  onClick={handleShareTierList}
                  disabled={isSharing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFD300]/10 border border-[#FFD300]/40 text-[#FFD300] hover:bg-[#FFD300]/20 font-black italic uppercase text-xs tracking-tight transition-all disabled:opacity-50"
                >
                  {isSharing ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  Compartir
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-white font-black italic uppercase text-xs tracking-tight transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Nueva Tier List
                </button>
              </div>
            </div>

            {/* Tier rows */}
            <div ref={captureRef} className="border border-slate-800 rounded-2xl overflow-hidden mb-4">
              {tiers.map((tier, tierIdx) => (
                <div key={tier.id} className="flex min-h-[104px] border-b border-slate-800 last:border-b-0">

                  {/* Label */}
                  <div className="w-[6rem] shrink-0 self-stretch flex items-center justify-center border-r border-slate-800 px-1 py-1"
                    style={{ backgroundColor: tier.color + '22' }}>
                    {editingTierId === tier.id ? (
                      <input autoFocus
                        className="w-full text-center bg-transparent border-b border-white/30 font-black text-xl text-white outline-none"
                        defaultValue={tier.label}
                        onBlur={e => { setTiers(p => p.map(t => t.id === tier.id ? { ...t, label: e.target.value || tier.id } : t)); setEditingTierId(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingTierId(tier.id)}
                        className="font-black italic hover:opacity-80 transition-opacity text-center w-full leading-tight"
                        style={{
                          color: tier.color,
                          fontSize: tier.label.length <= 2 ? '1.5rem'
                            : tier.label.length <= 5 ? '1.1rem'
                            : tier.label.length <= 10 ? '0.85rem'
                            : '0.7rem',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
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
                  <div className="w-10 shrink-0 flex items-center justify-center border-l border-slate-800 bg-slate-900/60 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === tier.id ? null : tier.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all font-bold text-xl leading-none"
                    >
                      ⋮
                    </button>
                    {openMenuId === tier.id && (
                      <div className={`absolute right-10 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 w-48 py-1 overflow-hidden
                        ${tierIdx >= tiers.length - 2 ? 'bottom-0' : 'top-0'}`}>
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
                  Banquillo
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

      {/* ── HIDDEN SHARE TICKET (off-screen, captured by html2canvas) ── */}
      {generated && (
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div ref={shareTicketRef} style={{ width: '580px', backgroundColor: '#060d1a', padding: '36px', fontFamily: 'sans-serif', borderRadius: '16px' }}>
            {/* Header: logo + username + title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <img src="/Muertazos.png" alt="Muertazos" style={{ width: '140px', height: '40px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right' }}>
                {user?.username && (
                  <div style={{ color: '#ffffff', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.12em', opacity: 0.45 }}>
                    {user.username}
                  </div>
                )}
                <div style={{ color: accent, fontWeight: 900, fontStyle: 'italic', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: '4px' }}>
                  {comp === 'kings' ? 'Kings' : 'Queens'} · {cat === 'teams' ? 'Equipos' : cat === 'players' ? (playerScope === 'team' && playerTeam ? playerTeam : 'Jugadores') : 'Camisetas'}
                </div>
              </div>
            </div>

            {/* Tier rows — unified solid table */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
              {tiers.filter(t => t.chips.length > 0).map((tier, i, arr) => (
                <div key={tier.id} style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  minHeight: '72px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  {/* Left accent bar */}
                  <div style={{ width: '5px', flexShrink: 0, backgroundColor: tier.color }} />
                  {/* Label column */}
                  <div style={{
                    width: '64px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: tier.color + '1a',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                    color: tier.color, fontWeight: 900, fontStyle: 'italic',
                    fontSize: tier.label.length <= 2 ? '26px' : tier.label.length <= 5 ? '15px' : '11px',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    padding: '8px 6px',
                  }}>
                    {tier.label}
                  </div>
                  {/* Chips area */}
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 10px', alignItems: 'center', alignContent: 'center', backgroundColor: '#0a1525' }}>
                    {tier.chips.map(chip => (
                      <img
                        key={chip.id}
                        src={chip.imageSrc}
                        alt={chip.name}
                        title={chip.name}
                        style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {tiers.every(t => t.chips.length === 0) && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#334155', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.2em', backgroundColor: '#0a1525' }}>
                  Sin clasificar
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#2d4a6b', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.45em' }}>
              MUERTAZOS.COM
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Step({ num, activeStep, title, children, onStepClick, accent = '#FFD300' }: {
  num: number; activeStep: number; title: string; children: React.ReactNode; onStepClick: () => void; accent?: string
}) {
  const isActive = activeStep >= num
  return (
    <div className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
      <button onClick={onStepClick} className="flex items-center gap-3 mb-3 w-full text-left group">
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 transition-colors"
          style={activeStep === num
            ? { backgroundColor: accent, color: '#0f172a' }
            : { backgroundColor: '#1e293b', color: '#64748b' }}
        >
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
