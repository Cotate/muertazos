// app/admin/layout.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const TABS = [
  { href: '/admin/kings',     label: 'KINGS',     color: '#ffd300' },
  { href: '/admin/queens',    label: 'QUEENS',    color: '#01d6c3' },
  { href: '/admin/ranking',   label: 'RANKING',   color: '#FFFFFF' },
  { href: '/admin/simulador', label: 'SIMULADOR', color: '#FF5733' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') { router.push('/login'); return }
    setReady(true)
    document.body.style.backgroundColor = '#0a0a0a'
  }, [router])

  if (!ready) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full">
      <header className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-800 shadow-lg px-4 lg:px-8 h-14 sticky top-0 z-50">

        {/* Tabs izquierdos */}
        <div className="flex gap-3 lg:gap-8 flex-1 items-center">
          {TABS.slice(0, 2).map(tab => (
            <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
          ))}
        </div>

        {/* Logo centrado */}
        <Link href="/" className="relative w-24 h-8 lg:w-32 lg:h-9 flex-shrink-0 hover:scale-105 transition-transform">
          <Image src="/Muertazos.png" alt="Muertazos" fill className="object-contain" priority />
        </Link>

        {/* Tabs derechos + logout */}
        <div className="flex gap-3 lg:gap-8 flex-1 items-center justify-end">
          {TABS.slice(2).map(tab => (
            <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
          ))}
          <button
            onClick={() => { localStorage.removeItem('muertazos_user'); router.push('/login') }}
            className="ml-2 bg-red-600/10 text-red-500 border border-red-500/30 px-4 py-1.5 rounded-md font-black hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase italic tracking-[0.2em]"
          >
            SALIR
          </button>
        </div>
      </header>

      <div className="w-full">{children}</div>
    </div>
  )
}

function TabLink({ href, label, color, active }: { href: string; label: string; color: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{ color: active ? color : undefined, borderBottom: active ? `3px solid ${color}` : '3px solid transparent' }}
      className="h-14 px-2 lg:px-3 flex items-center font-black italic tracking-tighter transition-all uppercase text-sm lg:text-base text-slate-500 hover:text-white"
    >
      {label}
    </Link>
  )
}
