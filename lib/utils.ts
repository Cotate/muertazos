export type Country = 'spain' | 'mexico' | 'brazil'

export const COUNTRIES: { key: Country; flag: string; name: string }[] = [
  { key: 'spain',  flag: '🇪🇸', name: 'España' },
  { key: 'mexico', flag: '🇲🇽', name: 'México' },
  { key: 'brazil', flag: '🇧🇷', name: 'Brasil' },
]

export function getCompFolder(compKey: string): 'Kings' | 'Queens' {
  return compKey === 'queens' ? 'Queens' : 'Kings'
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
