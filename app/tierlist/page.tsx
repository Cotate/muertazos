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

// ── Full SPAIN_PLAYERS_DATA (all Kings Spain teams — Split 6) ──────────────────────
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
  'Capim FC':             ["Álex Guti", 'Breno Arantes', 'Dani Liñares', "Gabriel 'Dudu'", 'Gerard Nolla', 'Igo Canindé', 'Jeferson Titon', "Lucas 'Caroço'", 'Lucas Hector', "Marcos 'Bolivia'", 'Murillo Donato', 'Rafa Sousa', 'Thiago Santos', 'Wallace Rafael'],
  'Dendele FC':           ['Bruninho Mandarino', "Cristhian 'Canhoto'", 'Gabriel Repulho', 'Gui Carvalho', 'Gustavo Húngaro', "Leonardo 'Belletti'", "Lucas 'L7'", "Luís Henrique 'Boolt'", 'Lyncoln Oliveira', 'Maikon Santos', 'Marquinhos Samora', 'Nicollas Nascimento', 'Ryan Soares'],
  'DesimpaiN':            ['Andrey Profeta', 'Christian Santos', 'Danilo Alemão', 'Davi Ilario', 'Douglinha Melo', 'Gabriel Lopes', 'Gui Nascimento', 'Juvenal Oliveira', 'Kaiky Souza', 'Luisinho Alves', "Victor 'Bolt'", "Victor 'VB' Bueno", "Wellinton 'Gigante'", 'William Costa'],
  'Dibrados FC':          ['Bruno Mota', 'Chay Medeiros', 'Daniel Ferreira', 'Edda Marcelino', 'Etinho Lima', 'Fael Magalhães', 'Gabriel Costa', 'Henrique Wruck', "Jonatas 'Batman'", 'Luan Teles', "Lucas 'Pulguinha'", 'Luiggi Longo', "Marcello 'Marcelinho' Junior", "Matheus 'Índio'", 'Matheus Bueno', 'Raphael Augusto', 'Ricardinho Filipe', 'Ruan Major', 'Sidney Pages'],
  'Fluxo FC':             ['Bruno Ferreira', "Douglas 'Doth'", 'Gustavinho Henrique', 'Helber Júnior', 'Jheferson Falcão', 'João Pedro', "Marcos 'MV'", "Matheus 'Chaveirinho'", 'Murillo Pulino', "Paulo 'Pinguinho'", 'Renan Augusto', 'Tuco Magalhães', 'Well Andrade'],
  'Furia FC':             ['Jeffinho Honorato', 'Jhow Love', 'João Pelegrini', 'Kenu Leandro', 'Leleti Garcia', 'Lipão Pinheiro', 'Lucas Nascimento', 'Luiz Camilo', "Matheus 'Dedo'", "Rafael 'Tambinha'", "Thiago 'Major'", 'Tiago Marinho', 'Victor Hugo', "Vitor 'Barba'"],
  'G3X FC':               ['Andreas Vaz', 'Everton Felipe', 'Gabriel Braga', 'Gabriel Medeiros', 'Gabriel Messias', 'João Guimarães', 'Josildo Barata', 'Kelvin Oliveira', 'Marinho Filho', 'Matheus Rufino', 'Ryan Lima', "Thiago 'TH' Brito", 'Wembley Luiz'],
  'LOUD SC':              ['Arthur Facas', 'Caio Felipe', 'Daniel Shiraishi', 'Esaú Nascimento', 'Felipe Cassiano', 'Felipe Viana', "Maicon 'Barata'", "Matheus 'Biro'", "Paulo 'Pulão'", 'Rafinha Cunha', 'Sam Silva', 'Walid Jaadi'],
  'Nyvelados FC':         ['Ailton José', "Bruno 'Gan'", "Carlos 'Ferrão'", 'Daniel Coringa', 'Danilo Belém', 'Dieguinho Assis', "Everton 'Chiclete' Araújo", "Igor 'BB'", "Léo 'Gol'", "Luandrio 'Pé Fino'", "Lucas 'Japa'", 'Luisinho Barreiros', 'Maicon Macabeu', 'Matheus Klynsmann', "Vanderson 'Neguiim Jr'"],
  'Podpah Funkbol Clube': ['Caio Miranda', 'Gustavo Silva', 'Igor Campos', "João 'Choco'", 'Juninho Antunes', 'Leléo Moura', "Luan 'Mestre'", 'Martín Lara', "Rafão 'Portuga'", 'Ronaldinho Reis', 'Vini Alexandre', 'William Jesus', "Yan 'Coringa'"],
}

const MEXICO_PLAYERS_DATA: Record<string, string[]> = {
  'Aniquiladores FC':      ['Axur Quintero', 'Brayan González', 'Brayan Hernández', 'Brihan Gutiérrez', 'Daviz Junco', 'Denilson Lobón', 'Diego Martínez', 'Erik Fraire', "Jacob 'Lobo' Morales", "Martín 'Cani' Rodríguez", 'Nelson Velandia', "Patricio 'Pato' Arias"],
  'Atlético Parceros FC':  ['Alexis Gómez', 'Andrés Osorno', 'Angellot Caro', 'Cristian Hernández', 'David Loaiza', 'Felipe Urán', 'Juan Tilano', 'Julio Perea', 'Kevin Mejía', 'Maicol Hernández', 'Marlon Ramírez', 'Simón Duque'],
  'Club de Cuervos':       ['Adriano Nunes', 'Ángel Ayala', 'Armando Chávez', 'Baruc Ochoa', 'Brandon Magaña', 'César Romo', 'Diego Velázquez', 'Edder Vargas', 'Edson González', 'Fausto Alemán', 'Hugo Murga', 'Jorge Escamilla', 'José Askenazi', 'Luis Valdés', 'Roberto Uribe'],
  'Galácticos del Caribe': ["Alejandro 'Maro' Ortega", 'Daniel Mendoza', 'Diego Franco', 'Erick Guzmán', 'Erick Madrigal', 'Iván Muñoz', 'Jairo Tapie', 'Jesús Carbajal', 'José Hernández', 'Kevin Cardona', 'Pabel Montes', 'Pablo Gómez'],
  'Guerrilla FC':          ['Abraham Morales', 'Adrián Mora', 'Alain Villanueva', 'Albano Rodríguez', 'Eduardo Velarde', 'Gerardo Ramírez', "Gustavo 'Furby' Guillén", 'Isaac Zepeda', 'Jair Peláez', 'Juan Carlos Silva', 'Miguel Lizardo', 'Morrison Palma', 'Omar Láscari', 'Rafael Cid', 'Said Zamora', 'Yudier Prado'],
  'KRÜ FC':                ['Aaron Martínez', 'Alberto García', 'Christopher Pedraza', 'Dago Campari', 'Edson Trejo', 'Erik Lugo', 'Facu Romero', 'Gonzalo Lescano', 'Jeancob Ramírez', 'Mauricio Reyna', 'Santiago Rotemberg', 'Tomás Sandoval'],
  'Los Aliens FC':         ['Alan Mendoza', 'Brayam Nazarit', 'Daniel Ríos', 'David Ortiz', 'Diego Abella', 'Erik Vera', 'James Hernández', "Jesús 'Chuy' Pérez", 'Jorge Meléndez', 'Juan Ramírez', 'Julio Torres', 'Ricardo Valencia'],
  'Los Chamos FC':         ['Alexis López', 'Álvaro Bocanegra', 'Carlos Escalona', 'Christian Lagunas', 'Cristian Hernández', 'Genaro Castillo', 'Gustavo Miranda', 'Irvin Mojica', 'Jesús López', 'Juan Cisneros', 'Román Ramírez', 'Salvador Navarro', 'Tonatiuh Mejía', 'Uriel Zuart'],
  'Peluche Caligari':      ['Aarón Del Real', 'Aldair Giorgana', "Ángel 'Curry' Castro", 'César Vallejo', 'Christian Gimenez', 'Daniel Quiroz', 'Eddie Sánchez', 'Eder Giorgana', 'Fernando Morales', 'Hugo Rodríguez', 'Josecarlos Van Rankin', 'Mauricio Huitrón', "Michelle 'Chucky' Castro", 'Moisés Dabbah', 'Pablo Barrera', 'Santiago Lagarde'],
  'Persas FC':             ['Antonio Monterde', 'Diego Rodríguez', 'Doido Santos', 'Gustavo Ramos', 'Iván Monroy', 'José Rochín', 'Kevin Valdez', 'Luis Amador', 'Marco Granados', 'Obed Martínez', 'Óscar Gómez', 'Rodrigo González', 'Yair Arias'],
  'Raniza FC':             ['Alexis Silva', 'Alfonso Nieto', 'Donovan Martínez', 'Eder López', 'Ezequiel Luna', 'Héctor de la Fuente', 'Jonathan Sánchez', 'Juan Araya', 'Juande Martínez', 'Lautaro Martínez', 'Mathías Vidangossy', 'Matías Herrera'],
  'Simios FC':             ['Andrés Suárez', 'Cristian González', 'Erick Sámano', 'George Corral', 'Gerson García', 'Hatzel Roque', 'Jorge Lima', "José 'Shaggy' Martínez", 'Luis Olascoaga', 'Miguel Rebollo', 'Óscar Medina', 'Roberto Pérez', 'Sebastián Sáez'],
}

const KINGS_TEAMS: Chip[] = [
  { id: 't-1k',       name: '1K FC',            imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/1K FC.webp' },
  { id: 't-barrio',   name: 'El Barrio',         imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/El Barrio.webp' },
  { id: 't-jijantes', name: 'Jijantes FC',       imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Jijantes FC.webp' },
  { id: 't-capital',  name: 'La Capital',        imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/La Capital CF.webp' },
  { id: 't-troncos',  name: 'Los Troncos',       imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Los Troncos FC.webp' },
  { id: 't-pio',      name: 'PIO FC',            imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/PIO FC.webp' },
  { id: 't-porcinos', name: 'Porcinos FC',       imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Porcinos FC.webp' },
  { id: 't-rayo',     name: 'Rayo BCN',          imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Rayo de Barcelona.webp' },
  { id: 't-saiyans',  name: 'Saiyans FC',        imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Saiyans FC.webp' },
  { id: 't-skull',    name: 'Skull FC',          imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Skull FC.webp' },
  { id: 't-ultimate', name: 'Ultimate Móstoles', imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/Ultimate Móstoles.webp' },
  { id: 't-xbuyer',   name: 'xBuyer Team',       imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/España/Equipos/xBuyer Team.webp' },
]

const QUEENS_TEAMS: Chip[] = [
  { id: 'q-1k',       name: '1K FC',            imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/1K FC.webp' },
  { id: 'q-barrio',   name: 'El Barrio',         imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/El Barrio.webp' },
  { id: 'q-jijantas', name: 'Jijantas FC',       imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Jijantas FC.webp' },
  { id: 'q-pilares',  name: 'Las Pilares FC',    imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Las Pilares FC.webp' },
  { id: 'q-troncas',  name: 'Las Troncas FC',    imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Las Troncas FC.webp' },
  { id: 'q-pio',      name: 'PIO FC',            imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/PIO FC.webp' },
  { id: 'q-porcinas', name: 'Porcinas FC',       imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Porcinas FC.webp' },
  { id: 'q-rayo',     name: 'Rayo BCN',          imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Rayo de Barcelona.webp' },
  { id: 'q-saiyans',  name: 'Saiyans FC',        imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Saiyans FC.webp' },
  { id: 'q-ultimate', name: 'Ultimate Móstoles', imageSrc: '/MUERTAZOS ESTRUCTURA/QUEENS/España/Equipos/Ultimate Móstoles.webp' },
]

const BRAZIL_KINGS_TEAMS: Chip[] = [
  { id: 'b-capim',   name: 'Capim FC',              imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Capim FC.webp' },
  { id: 'b-dend',    name: 'Dendele FC',             imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Dendele FC.webp' },
  { id: 'b-desp',    name: 'DesimpaiN',              imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/DesimpaiN.webp' },
  { id: 'b-dibr',    name: 'Dibrados FC',            imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Dibrados FC.webp' },
  { id: 'b-fluxo',   name: 'Fluxo FC',               imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Fluxo FC.webp' },
  { id: 'b-furia',   name: 'Furia FC',               imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Furia FC.webp' },
  { id: 'b-g3x',     name: 'G3X FC',                 imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/G3X FC.webp' },
  { id: 'b-loud',    name: 'LOUD SC',                imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/LOUD SC.webp' },
  { id: 'b-nyv',     name: 'Nyvelados FC',           imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Nyvelados FC.webp' },
  { id: 'b-podpah',  name: 'Podpah Funkbol Clube',   imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/Brazil/Equipos/Podpah Funkbol Clube.webp' },
]

const MEXICO_KINGS_TEAMS: Chip[] = [
  { id: 'm-ani',   name: 'Aniquiladores FC',      imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Aniquiladores FC.webp' },
  { id: 'm-parc',  name: 'Atlético Parceros FC',  imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Atlético Parceros FC.webp' },
  { id: 'm-cuev',  name: 'Club de Cuervos',       imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Club de Cuervos.webp' },
  { id: 'm-gal',   name: 'Galácticos del Caribe', imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Galácticos del Caribe.webp' },
  { id: 'm-guer',  name: 'Guerrilla FC',          imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Guerrilla FC.webp' },
  { id: 'm-kru',   name: 'KRÜ FC',               imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/KRÜ FC.webp' },
  { id: 'm-ali',   name: 'Los Aliens FC',         imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Los Aliens FC.webp' },
  { id: 'm-cham',  name: 'Los Chamos FC',         imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Los Chamos FC.webp' },
  { id: 'm-pel',   name: 'Peluche Caligari',      imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Peluche Caligari.webp' },
  { id: 'm-per',   name: 'Persas FC',             imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Persas FC.webp' },
  { id: 'm-ran',   name: 'Raniza FC',             imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Raniza FC.webp' },
  { id: 'm-sim',   name: 'Simios FC',             imageSrc: '/MUERTAZOS ESTRUCTURA/KINGS/México/Equipos/Simios FC.webp' },
]

// Build player chips for a specific team or the full league
function buildPlayerChips(country: Country, teamName?: string): Chip[] {
  const data = country === 'brazil' ? BRAZIL_PLAYERS_DATA
    : country === 'mexico' ? MEXICO_PLAYERS_DATA
    : SPAIN_PLAYERS_DATA
  const countryFolder = country === 'brazil' ? 'Brazil' : country === 'mexico' ? 'México' : 'España'
  const splitFolder   = country === 'brazil' ? 'Split 2' : country === 'mexico' ? 'Split 4' : 'Split 6'
  const teams = teamName ? { [teamName]: data[teamName] ?? [] } : data
  return Object.entries(teams).flatMap(([team, players]) =>
    players.map(name => ({
      id: `p-${team}-${name}`.replace(/\s+/g, '-').toLowerCase(),
      name,
      imageSrc: `/MUERTAZOS ESTRUCTURA/KINGS/${countryFolder}/${splitFolder}/${team}/${name}.webp`,
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
    if (cat === 'jerseys') return null
    if (cat === 'teams') {
      if (comp === 'queens') return QUEENS_TEAMS
      if (country === 'spain')  return KINGS_TEAMS
      if (country === 'brazil') return BRAZIL_KINGS_TEAMS
      if (country === 'mexico') return MEXICO_KINGS_TEAMS
    }
    if (cat === 'players' && comp === 'kings') {
      return playerScope === 'team' && playerTeam
        ? buildPlayerChips(country, playerTeam)
        : buildPlayerChips(country)
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
                  { key: 'mexico' as Country, code: 'MX', name: 'México',  soon: false },
                  { key: 'brazil' as Country, code: 'BR', name: 'Brasil',  soon: false },
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
                      {Object.keys(
                        country === 'brazil' ? BRAZIL_PLAYERS_DATA
                        : country === 'mexico' ? MEXICO_PLAYERS_DATA
                        : SPAIN_PLAYERS_DATA
                      ).map(team => {
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
                  {comp === 'queens' ? 'España' : country === 'brazil' ? 'Brasil' : country === 'mexico' ? 'México' : 'España'} · {cat === 'teams' ? 'Equipos' : cat === 'players' ? (playerScope === 'team' ? playerTeam : 'Todos los jugadores') : 'Camisetas'}
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
              <img src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" style={{ width: '140px', height: '40px', objectFit: 'contain' }} />
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
