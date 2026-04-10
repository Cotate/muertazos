'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

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
  { type: 'route',  label: 'KINGS',       href: '/dashboard?tab=kings' },
  { type: 'route',  label: 'QUEENS',      href: '/dashboard?tab=queens' },
  { type: 'route',  label: 'RANKING',     href: '/ranking' },
  { type: 'route',  label: 'PICKS',       href: '/dashboard?tab=picks' },
  { type: 'route',  label: 'PIZARRA',     href: '/pizarra' },
  { type: 'route',  label: 'TIER LIST',   href: '/tierlist' },
  { type: 'route',  label: 'SIMULADOR',   href: '/simulator' },
  { type: 'route',  label: 'AJUSTES',    href: '/dashboard?tab=settings' },
]

const ADMIN_MENU: MenuEntry[] = [
  { type: 'route',  label: 'KINGS',       href: '/admin?tab=kings' },
  { type: 'route',  label: 'QUEENS',      href: '/admin?tab=queens' },
  { type: 'route',  label: 'RANKING',     href: '/ranking' },
  { type: 'route',  label: 'SIMULADOR',   href: '/simulator' },
]

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

  const menuEntries = userRole === 'admin' ? ADMIN_MENU : USER_MENU
  const isPublicOnly = !username && !!backTo

  return (
    <>
      <header className="w-full h-14 shrink-0 flex items-center justify-between bg-slate-950/95 border-b border-slate-800 px-3 md:px-5 sticky top-0 z-50 backdrop-blur-md">

        {isPublicOnly ? (
          <Link
            href={backTo}
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

        <a href="https://polymarket.com?via=muertazos" target="_blank" rel="noopener noreferrer" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 hover:scale-105 transition-transform duration-200">
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

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-1">
                <div className="relative w-28 h-9">
                  <Image src="/MUERTAZOS ESTRUCTURA/Muertazos.webp" alt="Muertazos" fill className="object-contain" />
                </div>
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

            <nav className="flex flex-col p-3 gap-0.5 flex-1 overflow-y-auto">
              {menuEntries.map((entry, i) => {
                if (entry.type !== 'route') return null
                const isActive = pathname === entry.href.split('?')[0]
                  && (entry.href.includes('?')
                    ? false
                    : true)
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
            </nav>

            {(username || onLogout) && (
              <div className="p-4 border-t border-slate-800">
                {username && (
                  <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex-shrink-0">
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-400">
                        {username.charAt(0).toUpperCase()}
                      </span>
                      {userAvatar && (
                        <Image src={userAvatar} alt={username} fill className="object-cover z-10"
                          onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
