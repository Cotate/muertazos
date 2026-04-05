// Shared types, constants, and helpers used across the app

export type Country = 'spain' | 'mexico' | 'brazil'

export const COUNTRIES: { key: Country; flag: string; name: string }[] = [
  { key: 'spain',  flag: '🇪🇸', name: 'España' },
  { key: 'mexico', flag: '🇲🇽', name: 'México' },
  { key: 'brazil', flag: '🇧🇷', name: 'Brasil' },
]

/** Returns the logo folder name for a competition key */
export function getCompFolder(compKey: string): 'Kings' | 'Queens' {
  return compKey === 'queens' ? 'Queens' : 'Kings'
}

/** True if the team logo is PIO FC (needs smaller display size) */
export function isPio(filename: string): boolean {
  return !!filename?.toLowerCase().includes('pio')
}

/**
 * Returns the display size for a team logo.
 * @param filename  logo filename
 * @param large     use larger sizes (public/user views)
 */
export function getLogoSize(filename: string, large = false): number {
  if (large) return isPio(filename) ? 54 : 72
  return isPio(filename) ? 38 : 54
}

/** Sort matches array by match_order, falling back to id */
export function sortMatchesByOrder(matches: any[]): any[] {
  return [...matches].sort((a, b) => {
    const oA = a.match_order ?? a.id
    const oB = b.match_order ?? b.id
    return oA - oB
  })
}

/** Read the stored user from localStorage (client-side only) */
export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('muertazos_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
