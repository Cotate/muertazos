/**
 * useTierListData — fetches Tier List data from Supabase.
 *
 * REQUIRED SUPABASE TABLES
 * ─────────────────────────────────────────────────────────────────────────
 * `teams` (already exists):
 *   id            number
 *   competition_key  'kings' | 'queens'
 *   name          string
 *   logo_file     string  (filename only, e.g. "1K FC.webp")
 *   country       'spain' | 'brazil' | 'mexico'
 *
 * `players` (NEW — run this SQL once ready):
 *   CREATE TABLE players (
 *     id            serial PRIMARY KEY,
 *     team_id       int REFERENCES teams(id),
 *     team_name     text NOT NULL,
 *     name          text NOT NULL,
 *     country       text NOT NULL DEFAULT 'spain',
 *     competition_key text NOT NULL DEFAULT 'kings'
 *   );
 *   -- Indexes for performance:
 *   CREATE INDEX ON players (competition_key, country);
 * ─────────────────────────────────────────────────────────────────────────
 */
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTeamLogoPath, getPlayerImagePath } from '@/lib/utils'

export type Competition = 'kings' | 'queens'
export type Country     = 'spain' | 'mexico' | 'brazil'
export type PlayerScope = 'league' | 'team'
export interface Chip { id: string; name: string; imageSrc: string }

// ── Hardcoded fallback player data (used until `players` table is populated) ──
// These mirror PizarraView.tsx by design; do NOT deduplicate.
export const SPAIN_PLAYERS_DATA: Record<string, string[]> = {
  '1K FC': ['Achraf Laiti', 'Cristian Faura', 'Eric Jiménez', 'Erik Beattie', 'Gerard Verge', 'Guelmi Pons', 'Isma Reguia', 'Iván Rivera', 'Joel Navas', 'Joel Paredes', 'Karim Moya', 'Michel Owono', "Pau 'ZZ' Ruiz", 'Pol Lechuga', 'Pol Requena'],
  'El Barrio': ['Carlos Val', 'Cristian Ubón', 'Gerard Puigvert', 'Haitam Babia', 'Hugo Eyre', 'Joel Bañuls', 'Naoufal Talkam', 'Ñito Martín', 'Pablo Saborido', 'Pau Fernández', 'Pol Molés', 'Robert Vallribera', 'Sergio Fernández', 'Sergio Herrero'],
  'Jijantes FC': ['Álex Cañero', 'Cristian Gómez', 'Cristian Lobato', 'Dani Martí', 'Daniel Plaza', 'David Toro', 'Iker Hernández', 'Ion Vázquez', 'José Segovia', 'Juanpe Nzo', 'Marc Montejo', 'Mario León', 'Michel Herrero', 'Pau Fer', 'Sergi Torres', 'Víctor Pérez Bello'],
  'La Capital CF': ['Antoni Hernández', 'Daniel Pérez', 'Daouda Bamma', 'Iñaki Villalba', 'Julen Álvarez', 'Manel Jiménez', 'Manuel Martín', 'Marc Montejo', 'Mario Victorio', 'Omar Dambelleh', 'Pablo Beguer', 'Roger García Hernández', 'Sergi Vives', 'Sohaib Rektout'],
  'Los Troncos FC': ['Aleix Semur', 'Alex Cubedo', 'Álvaro Arché', 'Carles Planas', 'Carlos Contreras', 'Daniel Tamayo', 'David Reyes', 'Eloy Amoedo', 'Joan Oriol', 'Mark Sorroche', 'Masi Dabo', 'Sagar Escoto', 'Victor Oribe', 'Yaroslav Toporkov'],
  'PIO FC': ['Adri Espinar', 'Adrián Frutos', 'Álex Sánchez', 'Fernando Velillas', 'Iker Bartolomé', 'Izan Grande', 'Joan Luque', 'Kike Ferreres', 'Luis García', 'Manel Beneite', 'Marc Briones', 'Marc Grifell', 'Marcos Ibañez', 'Pol Benito', 'Sergio Mulero', 'Yeray Muñoz'],
  'Porcinos FC': ['Aitor Vives', 'Dani Pérez', 'David Soriano', 'Edgar Alvaro', 'Fouad El Amrani', 'Gerard Gómez', 'Marc Pelaz', 'Nadir Louah', 'Nico Santos', 'Oscar Coll', 'Ricard Pujol', 'Roger Carbó', 'Tomeu Nadal', 'Victor Nofuentes'],
  'Rayo de Barcelona': ['Abde Bakkali', 'Adrià Escribano', 'Alhagi Marie Touray', 'Carlos Heredia', 'Carlos Omabegho', 'David Moreno', 'Gerard Oliva', "Guillem 'ZZ' Ruiz", 'Ismael González', 'Iván Torres', 'Jordi Gómez', 'Jorge Ibáñez', 'Nil Pradas', 'Roc Bancells'],
  'Saiyans FC': ['Albert Garcia', 'Alex Campuzano Bonilla', 'Borja Montejo', 'Dani Santiago', 'Diego Jiménez', 'Feliu Torrus', 'Gerard Vacas', 'Gio Ferinu', 'Isaac Maldonado', 'Iván Fajardo', 'Juanan Gallego', 'Pablo Fernández', 'Sergi Gestí'],
  'Skull FC': ['Alberto Arnalot', 'Álex Salas', 'Dani Santos', 'David Asensio', "David 'Burrito' Ruiz", 'Jorge Escobar', 'José Hermosa', 'Kevin Zárate', 'Koke Navares', 'Manu García', 'Marcelo Vieira', 'Nano Modrego', 'Pablo de Castro', 'Raúl Escobar', 'Roberto Tobe', 'Samuel Aparicio', 'Víctor Mongil'],
  'Ultimate Móstoles': ['Aleix Hernando', 'Aleix Lage', 'Aleix Martí', "Alex 'Capi' Domingo", 'David Grifell', 'Eloy Pizarro', 'Ferran Corominas', 'Javi Espinosa', 'Josep Riart', 'Juan Lorente', 'Marc Granero', 'Mikhail Prokopev', 'Pol Jansà', 'Víctor Vidal'],
  'xBuyer Team': ['Aleix Ruiz', 'Álex Romero', 'Antonio Domenech', 'Eric Pérez', 'Eric Sánchez', 'Galde Hugue', 'Jacobo Liencres', 'Javier Comas', 'Joel Espinosa', 'Juanma González', 'Mario Reyes', 'Sergio Campos', "Sergio 'Chechi' Costa", 'Víctor Vargas', 'Xavier Cabezas', 'Zaid Saban'],
}
export const BRAZIL_PLAYERS_DATA: Record<string, string[]> = {
  'Capim FC': ["Álex Guti", 'Breno Arantes', 'Dani Liñares', "Gabriel 'Dudu'", 'Gerard Nolla', 'Igo Canindé', 'Jeferson Titon', "Lucas 'Caroço'", 'Lucas Hector', "Marcos 'Bolivia'", 'Murillo Donato', 'Rafa Sousa', 'Thiago Santos', 'Wallace Rafael'],
  'Dendele FC': ['Bruninho Mandarino', "Cristhian 'Canhoto'", 'Gabriel Repulho', 'Gui Carvalho', 'Gustavo Húngaro', "Leonardo 'Belletti'", "Lucas 'L7'", "Luís Henrique 'Boolt'", 'Lyncoln Oliveira', 'Maikon Santos', 'Marquinhos Samora', 'Nicollas Nascimento', 'Ryan Soares'],
  'DesimpaiN': ['Andrey Profeta', 'Christian Santos', 'Danilo Alemão', 'Davi Ilario', 'Douglinha Melo', 'Gabriel Lopes', 'Gui Nascimento', 'Juvenal Oliveira', 'Kaiky Souza', 'Luisinho Alves', "Victor 'Bolt'", "Victor 'VB' Bueno", "Wellinton 'Gigante'", 'William Costa'],
  'Dibrados FC': ['Bruno Mota', 'Chay Medeiros', 'Daniel Ferreira', 'Edda Marcelino', 'Etinho Lima', 'Fael Magalhães', 'Gabriel Costa', 'Henrique Wruck', "Jonatas 'Batman'", 'Luan Teles', "Lucas 'Pulguinha'", 'Luiggi Longo', "Marcello 'Marcelinho' Junior", "Matheus 'Índio'", 'Matheus Bueno', 'Raphael Augusto', 'Ricardinho Filipe', 'Ruan Major', 'Sidney Pages'],
  'Fluxo FC': ['Bruno Ferreira', "Douglas 'Doth'", 'Gustavinho Henrique', 'Helber Júnior', 'Jheferson Falcão', 'João Pedro', "Marcos 'MV'", "Matheus 'Chaveirinho'", 'Murillo Pulino', "Paulo 'Pinguinho'", 'Renan Augusto', 'Tuco Magalhães', 'Well Andrade'],
  'Furia FC': ['Jeffinho Honorato', 'Jhow Love', 'João Pelegrini', 'Kenu Leandro', 'Leleti Garcia', 'Lipão Pinheiro', 'Lucas Nascimento', 'Luiz Camilo', "Matheus 'Dedo'", "Rafael 'Tambinha'", "Thiago 'Major'", 'Tiago Marinho', 'Victor Hugo', "Vitor 'Barba'"],
  'G3X FC': ['Andreas Vaz', 'Everton Felipe', 'Gabriel Braga', 'Gabriel Medeiros', 'Gabriel Messias', 'João Guimarães', 'Josildo Barata', 'Kelvin Oliveira', 'Marinho Filho', 'Matheus Rufino', 'Ryan Lima', "Thiago 'TH' Brito", 'Wembley Luiz'],
  'LOUD SC': ['Arthur Facas', 'Caio Felipe', 'Daniel Shiraishi', 'Esaú Nascimento', 'Felipe Cassiano', 'Felipe Viana', "Maicon 'Barata'", "Matheus 'Biro'", "Paulo 'Pulão'", 'Rafinha Cunha', 'Sam Silva', 'Walid Jaadi'],
  'Nyvelados FC': ['Ailton José', "Bruno 'Gan'", "Carlos 'Ferrão'", 'Daniel Coringa', 'Danilo Belém', 'Dieguinho Assis', "Everton 'Chiclete' Araújo", "Igor 'BB'", "Léo 'Gol'", "Luandrio 'Pé Fino'", "Lucas 'Japa'", 'Luisinho Barreiros', 'Maicon Macabeu', 'Matheus Klynsmann', "Vanderson 'Neguiim Jr'"],
  'Podpah Funkbol Clube': ['Caio Miranda', 'Gustavo Silva', 'Igor Campos', "João 'Choco'", 'Juninho Antunes', 'Leléo Moura', "Luan 'Mestre'", 'Martín Lara', "Rafão 'Portuga'", 'Ronaldinho Reis', 'Vini Alexandre', 'William Jesus', "Yan 'Coringa'"],
}
export const MEXICO_PLAYERS_DATA: Record<string, string[]> = {
  'Aniquiladores FC': ['Axur Quintero', 'Brayan González', 'Brayan Hernández', 'Brihan Gutiérrez', 'Daviz Junco', 'Denilson Lobón', 'Diego Martínez', 'Erik Fraire', "Jacob 'Lobo' Morales", "Martín 'Cani' Rodríguez", 'Nelson Velandia', "Patricio 'Pato' Arias"],
  'Atlético Parceros FC': ['Alexis Gómez', 'Andrés Osorno', 'Angellot Caro', 'Cristian Hernández', 'David Loaiza', 'Felipe Urán', 'Juan Tilano', 'Julio Perea', 'Kevin Mejía', 'Maicol Hernández', 'Marlon Ramírez', 'Simón Duque'],
  'Club de Cuervos': ['Adriano Nunes', 'Ángel Ayala', 'Armando Chávez', 'Baruc Ochoa', 'Brandon Magaña', 'César Romo', 'Diego Velázquez', 'Edder Vargas', 'Edson González', 'Fausto Alemán', 'Hugo Murga', 'Jorge Escamilla', 'José Askenazi', 'Luis Valdés', 'Roberto Uribe'],
  'Galácticos del Caribe': ["Alejandro 'Maro' Ortega", 'Daniel Mendoza', 'Diego Franco', 'Erick Guzmán', 'Erick Madrigal', 'Iván Muñoz', 'Jairo Tapie', 'Jesús Carbajal', 'José Hernández', 'Kevin Cardona', 'Pabel Montes', 'Pablo Gómez'],
  'Guerrilla FC': ['Abraham Morales', 'Adrián Mora', 'Alain Villanueva', 'Albano Rodríguez', 'Eduardo Velarde', 'Gerardo Ramírez', "Gustavo 'Furby' Guillén", 'Isaac Zepeda', 'Jair Peláez', 'Juan Carlos Silva', 'Miguel Lizardo', 'Morrison Palma', 'Omar Láscari', 'Rafael Cid', 'Said Zamora', 'Yudier Prado'],
  'KRÜ FC': ['Aaron Martínez', 'Alberto García', 'Christopher Pedraza', 'Dago Campari', 'Edson Trejo', 'Erik Lugo', 'Facu Romero', 'Gonzalo Lescano', 'Jeancob Ramírez', 'Mauricio Reyna', 'Santiago Rotemberg', 'Tomás Sandoval'],
  'Los Aliens FC': ['Alan Mendoza', 'Brayam Nazarit', 'Daniel Ríos', 'David Ortiz', 'Diego Abella', 'Erik Vera', 'James Hernández', "Jesús 'Chuy' Pérez", 'Jorge Meléndez', 'Juan Ramírez', 'Julio Torres', 'Ricardo Valencia'],
  'Los Chamos FC': ['Alexis López', 'Álvaro Bocanegra', 'Carlos Escalona', 'Christian Lagunas', 'Cristian Hernández', 'Genaro Castillo', 'Gustavo Miranda', 'Irvin Mojica', 'Jesús López', 'Juan Cisneros', 'Román Ramírez', 'Salvador Navarro', 'Tonatiuh Mejía', 'Uriel Zuart'],
  'Peluche Caligari': ['Aarón Del Real', 'Aldair Giorgana', "Ángel 'Curry' Castro", 'César Vallejo', 'Christian Gimenez', 'Daniel Quiroz', 'Eddie Sánchez', 'Eder Giorgana', 'Fernando Morales', 'Hugo Rodríguez', 'Josecarlos Van Rankin', 'Mauricio Huitrón', "Michelle 'Chucky' Castro", 'Moisés Dabbah', 'Pablo Barrera', 'Santiago Lagarde'],
  'Persas FC': ['Antonio Monterde', 'Diego Rodríguez', 'Doido Santos', 'Gustavo Ramos', 'Iván Monroy', 'José Rochín', 'Kevin Valdez', 'Luis Amador', 'Marco Granados', 'Obed Martínez', 'Óscar Gómez', 'Rodrigo González', 'Yair Arias'],
  'Raniza FC': ['Alexis Silva', 'Alfonso Nieto', 'Donovan Martínez', 'Eder López', 'Ezequiel Luna', 'Héctor de la Fuente', 'Jonathan Sánchez', 'Juan Araya', 'Juande Martínez', 'Lautaro Martínez', 'Mathías Vidangossy', 'Matías Herrera'],
  'Simios FC': ['Andrés Suárez', 'Cristian González', 'Erick Sámano', 'George Corral', 'Gerson García', 'Hatzel Roque', 'Jorge Lima', "José 'Shaggy' Martínez", 'Luis Olascoaga', 'Miguel Rebollo', 'Óscar Medina', 'Roberto Pérez', 'Sebastián Sáez'],
}

// Build player chips from hardcoded fallback data
export function buildPlayerChipsFallback(country: Country, teamName?: string): Chip[] {
  const data = country === 'brazil' ? BRAZIL_PLAYERS_DATA
    : country === 'mexico' ? MEXICO_PLAYERS_DATA
    : SPAIN_PLAYERS_DATA
  const teams = teamName ? { [teamName]: data[teamName] ?? [] } : data
  return Object.entries(teams).flatMap(([team, players]) =>
    players.map(name => ({
      id: `p-${team}-${name}`.replace(/\s+/g, '-').toLowerCase(),
      name,
      imageSrc: getPlayerImagePath(country, 'kings', team, name),
    }))
  )
}

export function useTierListData(comp: Competition | null, country: Country) {
  const [dbTeams, setDbTeams] = useState<any[]>([])
  const [dbPlayers, setDbPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!comp) { setDbTeams([]); return }
    setLoading(true)
    supabase
      .from('teams')
      .select('*')
      .eq('competition_key', comp)
      .eq('country', country)
      .order('name')
      .then(({ data }) => {
        setDbTeams(data ?? [])
        setLoading(false)
      })
  }, [comp, country])

  useEffect(() => {
    if (!comp) { setDbPlayers([]); return }
    supabase
      .from('players')
      .select('id, name, team_name, country, competition_key')
      .eq('competition_key', comp)
      .eq('country', country)
      .then(({ data, error }) => {
        setDbPlayers(!error && data && data.length > 0 ? data : [])
      })
  }, [comp, country])

  // Team chips from DB
  const teamChips: Chip[] = dbTeams.map(t => ({
    id: `t-${t.id}`,
    name: t.name,
    imageSrc: getTeamLogoPath(comp!, t.logo_file, country),
  }))

  // Team names for wizard player-team selector
  const playerTeamNames: string[] = dbPlayers.length > 0
    ? [...new Set(dbPlayers.map((p: any) => p.team_name as string))]
    : Object.keys(
        country === 'brazil' ? BRAZIL_PLAYERS_DATA
        : country === 'mexico' ? MEXICO_PLAYERS_DATA
        : SPAIN_PLAYERS_DATA
      )

  function buildPlayerChips(scope: PlayerScope, teamName?: string): Chip[] {
    if (dbPlayers.length > 0) {
      const filtered = scope === 'team' && teamName
        ? dbPlayers.filter((p: any) => p.team_name === teamName)
        : dbPlayers
      return filtered.map((p: any) => ({
        id: `p-${p.id}`,
        name: p.name,
        imageSrc: getPlayerImagePath(p.country, comp!, p.team_name, p.name),
      }))
    }
    return buildPlayerChipsFallback(country, scope === 'team' ? teamName : undefined)
  }

  return { teamChips, playerTeamNames, buildPlayerChips, loading }
}
