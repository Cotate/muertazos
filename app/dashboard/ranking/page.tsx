// app/dashboard/ranking/page.tsx
'use client'
import { useEffect, useState } from 'react'
import UserRankingView from '@/components/UserRankingView'

export default function RankingPage() {
  const [user, setUser] = useState<any>(null)
  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])
  if (!user) return null
  return <UserRankingView user={user} />
}
