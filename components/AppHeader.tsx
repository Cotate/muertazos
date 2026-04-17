'use client'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronDown, ChevronUp,
  BarChart3, Users,
  Trophy, Zap, CreditCard, Crown,
} from 'lucide-react'

export interface NavItem {
  label: string
  active?: boolean
  activeColor?: string
  onClick: () => void
}

interface AppHeaderProps {
  navItems?: NavItem[]
  onLogout?: () => void
  userAvatar?: string
  username?: string
  userRole?: string
  variant?: 'minimal' | 'nav'
  backTo?: string
  onLoginClick?: () => void
}

type MenuEntry =
  | { type: 'route'; label: string; href: string }
  | { type: 'view'; label: string; viewKey: string }
  | { type: 'action'; label: string; action: 'logout' }

const USER_MENU: MenuEntry[] = [
  { type: 'route', label: 'KINGS',     href: '/dashboard?tab=kings' },
  { type: 'route', label: 'QUEENS',    href: '/dashboard?tab=queens' },
  { type: 'route', label: 'RANKING',   href: '/ranking' },
  { type: 'route', label: 'PICKS',     href: '/dashboard?tab=picks' },
  { type: 'route', label: 'PIZARRA',   href: '/pizarra' },
  { type: 'route', label: 'TIER LIST', href: '/tierlist' },
  { type: 'route', label: 'SIMULADOR', href: '/simulator' },
  { type: 'route', label: 'AJUSTES',   href: '/dashboard?tab=settings' },
]

// ─── Admin hierarchical nav ───────────────────────────────────────────────────

const LEAGUE_ITEMS = [
  { key: 'espana', label: 'España', dotColor: '#c60b1e', color: '#FFD300', jugLabel: 'Jugadores' },
  { key: 'mexico', label: 'México', dotColor: '#006847', color: '#FFD300', jugLabel: 'Jugadores' },
  { key: 'brasil', label: 'Brasil', dotColor: '#009c3b', color: '#FFD300', jugLabel: 'Jugadores' },
  { key: 'queens', label: 'Queens', dotColor: '#01d6c3', color: '#01d6c3', jugLabel: 'Jugadoras' },
] as const

/** Inner component — needs Suspense because it calls useSearchParams */
function AdminNavContent({ onClose }: { onClose: () => void }) {
  const searchParams = useSearchParams()
  const pathname     = usePathname()

  const rawSection = searchParams.get('section')
  const rawSub     = searchParams.get('sub')
  const legacyTab  = searchParams.get('tab')

  // Resolve current section (support legacy ?tab= params too)
  const currentSection =
    rawSection ??
    (legacyTab === 'queens'   ? 'queens'   :
     legacyTab === 'ranking'  ? 'ranking'  :
     legacyTab === 'simulator'? 'simulator':
     legacyTab               ? 'espana'   : null)

  const currentSub = rawSub   // null | 'picks' | 'jugadores' | 'jugadoras'

  const isLeague = LEAGUE_ITEMS.some(l => l.key === currentSection)

  // Auto-open the active league section; allow toggling others
  const [openSections, setOpenSections] = useState<Set<string>>(() =>
    currentSection && isLeague ? new Set([currentSection]) : new Set()
  )

  const toggle = (key: string) =>
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const subActive = (section: string, sub: string) =>
    pathname === '/admin' && currentSection === section &&
    (currentSub === sub || (sub === 'picks' && !currentSub))

  const flatActive = (section: string) =>
    pathname === '/admin' && currentSection === section

  return (
    <>
      {/* ── League sections with accordion ── */}
      {LEAGUE_ITEMS.map(league => {
        const isOpen   = openSections.has(league.key)
        const isActive = pathname === '/admin' && currentSection === league.key

        return (
          <div key={league.key}>
            <button
              onClick={() => toggle(league.key)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
                ${isActive
                  ? 'bg-white/5 border-white/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={isActive ? { color: league.color } : {}}
            >
              <span className="flex items-center gap-2.5">
                {league.key === 'queens'
                  ? <Crown size={13} className="flex-shrink-0" style={{ color: league.color }} />
                  : <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block" style={{ backgroundColor: league.dotColor }} />
                }
                <span>{league.label}</span>
              </span>
              {isOpen
                ? <ChevronUp size={15} className="flex-shrink-0 opacity-60" />
                : <ChevronDown size={15} className="flex-shrink-0 opacity-60" />
              }
            </button>

            {/* Sub-items — animated with max-height */}
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{ maxHeight: isOpen ? '120px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <div className="pl-10 pr-3 pt-0.5 pb-2 flex flex-col gap-0.5">
                {/* Picks */}
                <Link
                  href={`/admin?section=${league.key}&sub=picks`}
                  onClick={onClose}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                    ${subActive(league.key, 'picks')
                      ? 'bg-white/[0.07] border border-white/10'
                      : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  style={subActive(league.key, 'picks') ? { color: league.color } : {}}
                >
                  <BarChart3 size={13} className="flex-shrink-0" />
                  Picks
                </Link>

                {/* Jugadores / Jugadoras */}
                <Link
                  href={`/admin?section=${league.key}&sub=jugadores`}
                  onClick={onClose}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                    ${subActive(league.key, 'jugadores')
                      ? 'bg-white/[0.07] border border-white/10'
                      : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  style={subActive(league.key, 'jugadores') ? { color: league.color } : {}}
                >
                  <Users size={13} className="flex-shrink-0" />
                  {league.jugLabel}
                </Link>
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Divider ── */}
      <div className="my-1.5 border-t border-slate-800/50" />

      {/* Ranking */}
      <Link
        href="/admin?section=ranking"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${flatActive('ranking')
            ? 'text-white bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Trophy size={16} className="flex-shrink-0" />
        Ranking
      </Link>

      {/* Simulador */}
      <Link
        href="/admin?section=simulator"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${flatActive('simulator')
            ? 'text-[#FF5733] bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Zap size={16} className="flex-shrink-0" />
        Simulador
      </Link>

      {/* Carta */}
      <Link
        href="/card-generator"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${pathname === '/card-generator'
            ? 'text-[#FFD300] bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <CreditCard size={16} className="flex-shrink-0" />
        Carta
      </Link>
    </>
  )
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

export default function AppHeader({
  navItems = [],
  onLogout,
  userAvatar,
  username,
  userRole,
  variant = 'nav',
  backTo,
  onLoginClick,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  if (variant === 'minimal') {
    return (
      <header className="w-full h-16 shrink-0 flex items-center justify-between px-4 bg-slate-950/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="w-24 md:w-32" />
        <div className="flex items-center gap-1">
          <div className="relative w-36 h-10">
            <Image src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" fill className="object-contain" priority />
          </div>
        </div>
        <div className="w-24 md:w-32 flex justify-end">
          {onLoginClick && (
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 bg-[#FFD300] text-black font-black italic uppercase text-xs tracking-tight rounded-xl hover:bg-white transition-colors whitespace-nowrap"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>
    )
  }

  const isPublicOnly = !username && !!backTo

  return (
    <>
      <header className="w-full h-14 shrink-0 flex items-center justify-between bg-slate-950/95 border-b border-slate-800 px-3 md:px-5 sticky top-0 z-50 backdrop-blur-md">

        {isPublicOnly ? (
          <Link
            href={backTo!}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors font-black italic uppercase text-xs tracking-tight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        ) : (
          <button
            onClick={() => setMenuOpen(true)}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <a
          href="https://polymarket.com?via=muertazos"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 hover:scale-105 transition-transform duration-200"
        >
          <div className="relative w-28 h-9">
            <Image src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" fill className="object-contain" priority />
          </div>
        </a>

        <div className="w-10" />
      </header>

      {!isPublicOnly && menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#070b12] border-r border-slate-800 flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="relative w-28 h-9">
                <Image src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" fill className="object-contain" />
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav content */}
            <nav className="flex flex-col p-3 gap-0.5 flex-1 overflow-y-auto">
              {userRole === 'admin' ? (
                /* ── Hierarchical admin nav ── */
                <Suspense fallback={
                  <div className="p-4 text-slate-700 text-xs font-bold uppercase tracking-widest text-center">
                    Cargando...
                  </div>
                }>
                  <AdminNavContent onClose={() => setMenuOpen(false)} />
                </Suspense>
              ) : (
                /* ── Flat user nav (unchanged) ── */
                <>
                  {USER_MENU.map((entry, i) => {
                    if (entry.type !== 'route') return null
                    const isActive = pathname === entry.href.split('?')[0] && !entry.href.includes('?')
                    return (
                      <Link
                        key={i}
                        href={entry.href}
                        onClick={() => setMenuOpen(false)}
                        className={`py-3.5 px-4 rounded-xl font-black italic text-lg uppercase tracking-tight transition-all
                          ${isActive
                            ? 'text-[#ffd300] bg-white/5 border border-white/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                      >
                        {entry.label}
                      </Link>
                    )
                  })}

                  {navItems.length > 0 && (
                    <>
                      <div className="my-2 border-t border-slate-800/60" />
                      {navItems.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => { item.onClick(); setMenuOpen(false) }}
                          style={{ color: item.active ? (item.activeColor || '#fff') : undefined }}
                          className={`text-left py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all
                            ${item.active
                              ? 'bg-white/5 border border-white/10'
                              : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Footer: user info + logout */}
            {(username || onLogout) && (
              <div className="p-4 border-t border-slate-800">
                {username && (
                  <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex-shrink-0">
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-400">
                        {username.charAt(0).toUpperCase()}
                      </span>
                      {userAvatar && (
                        <Image
                          src={userAvatar}
                          alt={username}
                          fill
                          className="object-cover z-10"
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </div>
                    <span className="text-sm font-black uppercase text-slate-300 tracking-wider">{username}</span>
                  </div>
                )}
                {onLogout && (
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false) }}
                    className="w-full bg-red-600/10 text-red-500 border border-red-500/30 px-5 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-red-600 hover:text-white transition-all"
                  >
                    CERRAR SESIÓN
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
