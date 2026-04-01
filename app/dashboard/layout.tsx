// app/dashboard/layout.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const TABS = [
  { href: '/dashboard/kings',     label: 'KINGS',      color: '#ffd300' },
  { href: '/dashboard/queens',    label: 'QUEENS',     color: '#01d6c3' },
  { href: '/dashboard/ranking',   label: 'RANKING',    color: '#FFFFFF' },
  { href: '/dashboard/all-picks', label: 'PICKS',      color: '#FFFFFF' },
  { href: '/dashboard/simulador', label: 'SIMULADOR',  color: '#FF5733' },
  { href: '/dashboard/pizarra',   label: 'PIZARRA',    color: '#01d6c3' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    document.body.style.backgroundColor = '#0a0a0a'
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">

      {/* HEADER */}
      <header className="w-full h-12 md:h-14 flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 md:px-10 sticky top-0 z-50">

        {/* Hamburger (mobile) + nav (desktop) izquierda */}
        <div className="flex items-center flex-1 gap-4">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
          <nav className="hidden lg:flex h-full items-center gap-2">
            {TABS.slice(0, 2).map(tab => (
              <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
            ))}
            <TabLink href="/dashboard/ranking" label="RANKING" color="#FFFFFF" active={pathname === '/dashboard/ranking'} />
          </nav>
        </div>

        {/* Logo centrado */}
        <Link href="/" className="relative w-24 h-7 md:w-32 md:h-9 flex-shrink-0 hover:opacity-80 transition-opacity">
          <Image src="/Muertazos.png" alt="Muertazos" fill className="object-contain" priority />
        </Link>

        {/* Nav derecha + avatar + logout */}
        <div className="flex items-center justify-end flex-1 gap-2 md:gap-4">
          <nav className="hidden lg:flex h-full items-center gap-2 mr-2">
            {TABS.slice(3).map(tab => (
              <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
            ))}
          </nav>
          <div className="relative w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex-shrink-0">
            <Image src={`/usuarios/${user.username}.jpg`} alt={user.username} fill className="object-cover" />
          </div>
          <button
            onClick={() => { localStorage.removeItem('muertazos_user'); router.push('/login') }}
            className="text-[9px] font-black text-red-500 border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-all italic"
          >
            SALIR
          </button>
        </div>
      </header>

      {/* MENÚ MÓVIL */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-4">
            {TABS.map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{ color: pathname === tab.href ? tab.color : undefined }}
                className="font-black italic text-xl text-slate-500 hover:text-white transition-colors"
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO — pizarra y all-picks son full-width */}
      <div className={`${pathname === '/dashboard/pizarra' || pathname === '/dashboard/all-picks' ? 'w-full' : 'max-w-5xl mx-auto px-4'} pt-6 pb-20`}>
        {children}
      </div>
    </div>
  )
}

function TabLink({ href, label, color, active }: { href: string; label: string; color: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{ color: active ? color : undefined, borderBottom: active ? `2px solid ${color}` : '2px solid transparent' }}
      className="h-12 md:h-14 px-2 flex items-center font-black italic tracking-widest whitespace-nowrap transition-all text-[10px] lg:text-sm text-slate-500 hover:text-slate-300"
    >
      {label}
    </Link>
  )
}
