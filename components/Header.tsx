// components/Header.tsx
import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  rightAction?: React.ReactNode
  leftAction?: React.ReactNode
}

export default function Header({ rightAction, leftAction }: HeaderProps) {
  return (
    <header className="w-full h-12 flex items-center justify-between bg-slate-950 border-b border-slate-800 shadow-lg sticky top-0 z-50 px-4">
      <div className="flex-1 flex justify-start">
        {leftAction ?? <span />}
      </div>
      <Link href="/" className="relative w-28 h-8 hover:opacity-80 transition-opacity flex-shrink-0">
        <Image src="/Muertazos.png" alt="Muertazos" fill className="object-contain" priority />
      </Link>
      <div className="flex-1 flex justify-end">
        {rightAction ?? <span />}
      </div>
    </header>
  )
}
