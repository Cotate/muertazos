'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import TierList from '@/components/TierList'

export default function TierListPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('muertazos_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      <AppHeader
        onLogout={user ? () => { localStorage.removeItem('muertazos_user'); router.push('/') } : undefined}
        userAvatar={user ? (user.avatar_url || `/usuarios/${user.username}.webp`) : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo="/"
      />
      <TierList user={user} />
    </div>
  )
}
