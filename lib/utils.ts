export type Country = 'spain' | 'mexico' | 'brazil'

export const COUNTRIES: { key: Country; flag: string; name: string }[] = [
  { key: 'spain',  flag: '🇪🇸', name: 'España' },
  { key: 'mexico', flag: '🇲🇽', name: 'México' },
  { key: 'brazil', flag: '🇧🇷', name: 'Brasil' },
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
  'Ultimate Mostoles.webp': 'Ultimate Móstoles.webp',
}

export function getTeamLogoPath(league: string, logoFile: string, country = 'spain'): string {
  const leagueFolder = league === 'queens' ? 'QUEENS' : 'KINGS'
  const countryFolder = COUNTRY_FOLDER[country] ?? 'España'
  let webpFile = logoFile.replace(/\.(png|jpg|jpeg)$/i, '.webp')
  webpFile = LOGO_FILE_FIXES[webpFile] ?? webpFile
  return `/MUERTAZOS ESTRUCTURA/${leagueFolder}/${countryFolder}/Equipos/${webpFile}`
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
