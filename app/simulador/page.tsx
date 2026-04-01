// app/simulador/page.tsx  ─── simulador público (sin login)
import SimulatorView from '@/components/SimulatorView'
import Header from '@/components/Header'
import Link from 'next/link'

const back = <Link href="/" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">← INICIO</Link>

export default function SimuladorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Header leftAction={back} />
      <main className="flex-1 w-full">
        <SimulatorView />
      </main>
    </div>
  )
}
