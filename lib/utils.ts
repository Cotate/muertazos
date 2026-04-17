export type Country = 'spain' | 'mexico' | 'brazil'

export const COUNTRIES: { key: Country; flag: string; name: string; color: string }[] = [
  { key: 'spain',  flag: '', name: 'España', color: '#c60b1e' },
  { key: 'mexico', flag: '', name: 'México', color: '#006847' },
  { key: 'brazil', flag: '', name: 'Brasil', color: '#009c3b' },
]

const COUNTRY_FOLDER: Record<string, string> = {
  spain:  'España',
  mexico: 'México',
  brazil: 'Brazil',
}

const LEAGUE_SPLIT: Record<string, Record<string, string>> = {
  spain:  { kings: 'Split 6', queens: 'Split 6' },
  mexico: { kings: 'Split 4' },
  brazil: { kings: 'Split 2' },
}

export function getCompFolder(compKey: string): 'Kings' | 'Queens' {
  return compKey === 'queens' ? 'Queens' : 'Kings'
}

// Normalize known mismatches between DB logo_file values and actual filenames on disk
const LOGO_FILE_FIXES: Record<string, string> = {
  // España
  'Ultimate Mostoles.webp': 'Ultimate Móstoles.webp',
  // Brasil — casing mismatches
  'Desimpain.webp': 'DesimpaiN.webp',
  'DESIMPAIN.webp': 'DesimpaiN.webp',
  'Loud SC.webp': 'LOUD SC.webp',
  'loud SC.webp': 'LOUD SC.webp',
  // México — accent / special-char mismatches
  'KRU FC.webp': 'KRÜ FC.webp',
  'Kru FC.webp': 'KRÜ FC.webp',
  'Atletico Parceros FC.webp': 'Atlético Parceros FC.webp',
  'Atletico Parceros.webp': 'Atlético Parceros FC.webp',
  'Galacticos del Caribe.webp': 'Galácticos del Caribe.webp',
}

export function getTeamLogoPath(league: string, logoFile: string, country = 'spain'): string {
  const leagueFolder = league === 'queens' ? 'QUEENS' : 'KINGS'
  // Normalise the country value: accept both DB keys ('spain','brazil','mexico')
  // and the folder names themselves ('España','Brazil','México') so that team
  // rows whose `country` column still holds the default can be passed directly.
  const countryFolder = COUNTRY_FOLDER[country] ?? country
  let webpFile = logoFile.replace(/\.(png|jpg|jpeg)$/i, '.webp')
  webpFile = LOGO_FILE_FIXES[webpFile] ?? webpFile
  return `/MUERTAZOS ESTRUCTURA/${leagueFolder}/${countryFolder}/Equipos/${webpFile}`
}

/** Encoded variant for plain <img> tags (share tickets etc.) where the browser
 *  does NOT go through Next.js image optimisation and needs a valid URL. */
export function getTeamLogoPathEncoded(league: string, logoFile: string, country = 'spain'): string {
  return encodeURI(getTeamLogoPath(league, logoFile, country))
}

export function getPlayerImagePath(country: string, league: string, team: string, playerName: string): string {
  const leagueFolder = league === 'queens' ? 'QUEENS' : 'KINGS'
  const countryFolder = COUNTRY_FOLDER[country] ?? 'España'
  const split = LEAGUE_SPLIT[country]?.[league] ?? 'Split 6'
  return `/MUERTAZOS ESTRUCTURA/${leagueFolder}/${countryFolder}/${split}/${team}/${playerName}.webp`
}

export function isPio(filename: string): boolean {
  return !!filename?.toLowerCase().includes('pio')
}

export function getLogoSize(filename: string, large = false): number {
  if (large) return isPio(filename) ? 54 : 72
  return isPio(filename) ? 38 : 54
}

export function sortMatchesByOrder(matches: any[]): any[] {
  return [...matches].sort((a, b) => {
    const oA = a.match_order ?? a.id
    const oB = b.match_order ?? b.id
    return oA - oB
  })
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('muertazos_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
