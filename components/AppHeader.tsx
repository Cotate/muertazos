'use client'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  ChevronDown, ChevronUp,
  Trophy, Zap, CreditCard, Crown,
  Target, ClipboardList, Settings, Layers, Layout, Users,
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

// ─── Shared league rows ───────────────────────────────────────────────────────

const LEAGUE_ROWS = [
  { key: 'espana',  label: 'España',  dotColor: '#c60b1e', queenKey: 'spain'  },
  { key: 'mexico',  label: 'México',  dotColor: '#006847', queenKey: 'mexico' },
  { key: 'brasil',  label: 'Brasil',  dotColor: '#009c3b', queenKey: 'brazil' },
  { key: 'queens',  label: 'Queens',  isQueens: true,      queenKey: 'spain'  },
] as const

// ─── Admin feature-first nav ──────────────────────────────────────────────────

const ADMIN_FEATURES = [
  {
    key: 'picks',
    label: 'Picks',
    Icon: ClipboardList,
    activeColor: '#FFD300',
    leagues: [
      { key: 'espana', label: 'España', href: '/admin?section=espana&sub=picks',  dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México', href: '/admin?section=mexico&sub=picks',  dotColor: '#006847' },
      { key: 'brasil', label: 'Brasil', href: '/admin?section=brasil&sub=picks',  dotColor: '#009c3b' },
      { key: 'queens', label: 'Queens', href: '/admin?section=queens&sub=picks',  isQueens: true      },
    ],
  },
  {
    key: 'jugadores',
    label: 'Jugadores',
    Icon: Users,
    activeColor: '#FFD300',
    leagues: [
      { key: 'espana', label: 'España',    href: '/admin?section=espana&sub=jugadores',  dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México',    href: '/admin?section=mexico&sub=jugadores',  dotColor: '#006847' },
      { key: 'brasil', label: 'Brasil',    href: '/admin?section=brasil&sub=jugadores',  dotColor: '#009c3b' },
      { key: 'queens', label: 'Jugadoras', href: '/admin?section=queens&sub=jugadores',  isQueens: true      },
    ],
  },
  {
    key: 'simulator',
    label: 'Simulador',
    Icon: Zap,
    activeColor: '#FF5733',
    leagues: [
      { key: 'spain',  label: 'España', href: '/admin?section=simulator&country=spain',  dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México', href: '/admin?section=simulator&country=mexico', dotColor: '#006847' },
      { key: 'brazil', label: 'Brasil', href: '/admin?section=simulator&country=brazil', dotColor: '#009c3b' },
      { key: 'queens', label: 'Queens', href: '/admin?section=simulator&league=queens',  isQueens: true      },
    ],
  },
] as const

function AdminNavContent({ onClose }: { onClose: () => void }) {
  const searchParams = useSearchParams()
  const pathname     = usePathname()

  const rawSection = searchParams.get('section')
  const legacyTab  = searchParams.get('tab')
  const currentSection =
    rawSection ??
    (legacyTab === 'queens'    ? 'queens'    :
     legacyTab === 'ranking'   ? 'ranking'   :
     legacyTab === 'simulator' ? 'simulator' :
     legacyTab                 ? 'espana'    : 'espana')

  const currentSub     = searchParams.get('sub')
  const currentCountry = searchParams.get('country')
  const currentLeague  = searchParams.get('league')

  const isLeagueSection = ['espana', 'mexico', 'brasil', 'queens'].includes(currentSection)
  const isPicksActive   = isLeagueSection && (currentSub === 'picks' || !currentSub)
  const isJugActive     = isLeagueSection && currentSub === 'jugadores'
  const isSimActive     = currentSection === 'simulator'
  const isRankingActive = currentSection === 'ranking'

  const featureIsActive = (key: string) =>
    key === 'picks' ? isPicksActive : key === 'jugadores' ? isJugActive : isSimActive

  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>()
    if (isPicksActive) s.add('picks')
    if (isJugActive)   s.add('jugadores')
    if (isSimActive)   s.add('simulator')
    return s
  })

  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  const subIsActive = (featureKey: string, leagueKey: string) => {
    if (pathname !== '/admin') return false
    if (featureKey === 'picks')
      return currentSection === leagueKey && (currentSub === 'picks' || !currentSub)
    if (featureKey === 'jugadores')
      return currentSection === leagueKey && currentSub === 'jugadores'
    // simulator
    if (leagueKey === 'queens')
      return currentSection === 'simulator' && currentLeague === 'queens'
    return currentSection === 'simulator' && currentCountry === leagueKey && !currentLeague
  }

  return (
    <>
      {ADMIN_FEATURES.map(f => {
        const isOpen   = open.has(f.key)
        const isActive = featureIsActive(f.key)
        const Icon     = f.Icon
        return (
          <div key={f.key}>
            <button
              onClick={() => toggle(f.key)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
                ${isActive
                  ? 'bg-white/5 border-white/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={isActive ? { color: f.activeColor } : {}}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={15} className="flex-shrink-0" />
                {f.label}
              </span>
              {isOpen
                ? <ChevronUp size={15} className="flex-shrink-0 opacity-60" />
                : <ChevronDown size={15} className="flex-shrink-0 opacity-60" />}
            </button>

            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{ maxHeight: isOpen ? '160px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <div className="pl-10 pr-3 pt-0.5 pb-2 flex flex-col gap-0.5">
                {f.leagues.map(league => {
                  const active     = subIsActive(f.key, league.key)
                  const dotColor   = (league as any).dotColor as string | undefined
                  const isQueens   = !!(league as any).isQueens
                  const itemColor  = isQueens ? '#01d6c3' : f.activeColor
                  return (
                    <Link
                      key={league.key}
                      href={league.href}
                      onClick={onClose}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                        ${active
                          ? 'bg-white/[0.07] border border-white/10'
                          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                      style={active ? { color: itemColor } : {}}
                    >
                      {isQueens
                        ? <Crown size={11} className="flex-shrink-0" style={{ color: active ? itemColor : undefined }} />
                        : <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ backgroundColor: dotColor }} />}
                      {league.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      <div className="my-1.5 border-t border-slate-800/50" />

      <Link
        href="/admin?section=ranking"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${isRankingActive
            ? 'text-white bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Trophy size={16} className="flex-shrink-0" />
        Ranking
      </Link>

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

// ─── User feature-first nav ───────────────────────────────────────────────────

const USER_FEATURES = [
  {
    key: 'predis',
    label: 'Predis',
    Icon: Target,
    activeColor: '#FFD300',
    leagues: [
      { key: 'espana', label: 'España', href: '/predis?league=kings&country=spain',   dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México', href: '/predis?league=kings&country=mexico',  dotColor: '#006847' },
      { key: 'brasil', label: 'Brasil', href: '/predis?league=kings&country=brazil',  dotColor: '#009c3b' },
      { key: 'queens', label: 'Queens', href: '/predis?league=queens&country=spain',  isQueens: true      },
    ],
  },
  {
    key: 'picks',
    label: 'Picks',
    Icon: ClipboardList,
    activeColor: '#FFD300',
    leagues: [
      { key: 'espana', label: 'España', href: '/dashboard?tab=picks&league=kings&country=spain',   dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México', href: '/dashboard?tab=picks&league=kings&country=mexico',  dotColor: '#006847' },
      { key: 'brasil', label: 'Brasil', href: '/dashboard?tab=picks&league=kings&country=brazil',  dotColor: '#009c3b' },
      { key: 'queens', label: 'Queens', href: '/dashboard?tab=picks&league=queens&country=spain',  isQueens: true      },
    ],
  },
  {
    key: 'simulator',
    label: 'Simulador',
    Icon: Zap,
    activeColor: '#FF5733',
    leagues: [
      { key: 'spain',  label: 'España', href: '/simulator?country=spain',  dotColor: '#c60b1e' },
      { key: 'mexico', label: 'México', href: '/simulator?country=mexico', dotColor: '#006847' },
      { key: 'brazil', label: 'Brasil', href: '/simulator?country=brazil', dotColor: '#009c3b' },
      { key: 'queens', label: 'Queens', href: '/simulator?league=queens',  isQueens: true      },
    ],
  },
] as const

function UserNavContent({ onClose }: { onClose: () => void }) {
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const tab          = searchParams.get('tab')
  const urlCountry   = searchParams.get('country')
  const urlLeague    = searchParams.get('league')

  const subIsActive = (href: string) => {
    const [hPath, hQuery] = href.split('?')
    if (pathname !== hPath) return false
    if (!hQuery) return true
    const params = new URLSearchParams(hQuery)
    for (const [k, v] of params.entries()) {
      if (searchParams.get(k) !== v) return false
    }
    return true
  }

  const featureHasActive = (f: typeof USER_FEATURES[number]) =>
    f.leagues.some(l => subIsActive(l.href))

  const defaultOpenKeys = USER_FEATURES
    .filter(f => featureHasActive(f))
    .map(f => f.key)

  const [open, setOpen] = useState<Set<string>>(() => new Set(
    defaultOpenKeys.length ? defaultOpenKeys : ['picks']
  ))

  const toggle = (k: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  return (
    <>
      {USER_FEATURES.map(f => {
        const isOpen   = open.has(f.key)
        const isActive = featureHasActive(f)
        const Icon     = f.Icon
        return (
          <div key={f.key}>
            <button
              onClick={() => toggle(f.key)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
                ${isActive
                  ? 'bg-white/5 border-white/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
              style={isActive ? { color: f.activeColor } : {}}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={15} className="flex-shrink-0" />
                {f.label}
              </span>
              {isOpen
                ? <ChevronUp size={15} className="flex-shrink-0 opacity-60" />
                : <ChevronDown size={15} className="flex-shrink-0 opacity-60" />}
            </button>

            <div
              className="overflow-hidden transition-all duration-200 ease-in-out"
              style={{ maxHeight: isOpen ? '160px' : '0px', opacity: isOpen ? 1 : 0 }}
            >
              <div className="pl-10 pr-3 pt-0.5 pb-2 flex flex-col gap-0.5">
                {f.leagues.map(league => {
                  const active   = subIsActive(league.href)
                  const dotColor = (league as any).dotColor as string | undefined
                  const isQueens = !!(league as any).isQueens
                  const color    = isQueens ? '#01d6c3' : f.activeColor
                  return (
                    <Link
                      key={league.key}
                      href={league.href}
                      onClick={onClose}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                        ${active
                          ? 'bg-white/[0.07] border border-white/10'
                          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                      style={active ? { color } : {}}
                    >
                      {isQueens
                        ? <Crown size={11} className="flex-shrink-0" style={{ color: active ? color : undefined }} />
                        : <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ backgroundColor: dotColor }} />}
                      {league.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      <div className="my-1.5 border-t border-slate-800/50" />

      <Link
        href="/ranking"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${pathname === '/ranking'
            ? 'text-white bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Trophy size={16} className="flex-shrink-0" />
        Ranking
      </Link>

      <Link
        href="/pizarra"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${pathname === '/pizarra'
            ? 'text-white bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Layout size={16} className="flex-shrink-0" />
        Pizarra
      </Link>

      <Link
        href="/tierlist"
        onClick={onClose}
        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl font-black italic text-base uppercase tracking-tight transition-all border
          ${pathname === '/tierlist'
            ? 'text-white bg-white/5 border-white/10'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
      >
        <Layers size={16} className="flex-shrink-0" />
        Tier List
      </Link>
    </>
  )
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

export default function AppHeader({
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
  const close = () => setMenuOpen(false)

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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />

          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#070b12] border-r border-slate-800 flex flex-col shadow-2xl">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <div className="relative w-28 h-9">
                <Image src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" fill className="object-contain" />
              </div>
              <button
                onClick={close}
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col p-3 gap-0.5 flex-1 overflow-y-auto min-h-0">
              <Suspense fallback={
                <div className="p-4 text-slate-700 text-xs font-bold uppercase tracking-widest text-center">
                  Cargando...
                </div>
              }>
                {userRole === 'admin'
                  ? <AdminNavContent onClose={close} />
                  : <UserNavContent onClose={close} />
                }
              </Suspense>
            </nav>

            <div className="shrink-0 border-t border-slate-800">
              {username && (
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
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
                  <span className="text-sm font-black uppercase text-slate-300 tracking-wider truncate flex-1">{username}</span>
                  {userRole !== 'admin' && (
                    <Link
                      href="/dashboard?tab=settings"
                      onClick={close}
                      title="Ajustes"
                      className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <Settings size={17} />
                    </Link>
                  )}
                </div>
              )}

              <div className="px-4 pb-4">
                {onLogout && (
                  <button
                    onClick={() => { onLogout(); close() }}
                    className="w-full bg-red-600/10 text-red-500 border border-red-500/30 px-5 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-red-600 hover:text-white transition-all"
                  >
                    Cerrar sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
