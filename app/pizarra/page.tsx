// app/pizarra/page.tsx  ─── pizarra pública (sin login)
import PizarraView from '@/components/PizarraView'
import Header from '@/components/Header'
import Link from 'next/link'

const back = <Link href="/" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">← INICIO</Link>

export default function PizarraPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Header leftAction={back} />
      <main className="flex-1 flex flex-col py-4">
        <PizarraView />
      </main>
    </div>
  )
}
