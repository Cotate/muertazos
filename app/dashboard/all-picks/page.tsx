// app/dashboard/all-picks/page.tsx
'use client'
import { useState } from 'react'
import CompetitionReadOnly from '@/components/CompetitionReadOnly'

export default function AllPicksPage() {
  const [league, setLeague] = useState<'kings' | 'queens'>('kings')
  return (
    <div className="w-full">
      <div className="flex justify-center gap-3 py-3">
        <button onClick={() => setLeague('kings')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${league === 'kings' ? 'bg-[#FFD300] text-black border-[#FFD300]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Kings</button>
        <button onClick={() => setLeague('queens')} className={`px-5 py-1.5 rounded-full text-xs font-black italic uppercase border transition-colors ${league === 'queens' ? 'bg-[#01d6c3] text-black border-[#01d6c3]' : 'bg-transparent text-slate-500 border-slate-700 hover:text-white'}`}>Queens</button>
      </div>
      <CompetitionReadOnly competitionKey={league} />
    </div>
  )
}
