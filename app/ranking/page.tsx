'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import RankingView from '@/components/RankingView'
import { getStoredUser } from '@/lib/utils'

export default function RankingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const u = getStoredUser()
    setUser(u)
    setReady(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AppHeader
        onLogout={user ? handleLogout : undefined}
        userAvatar={user ? `/usuarios/${user.username}.jpg` : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo={!user ? '/' : undefined}
      />
      <main className="w-full pb-2">
        <RankingView currentUser={user?.username} />
      </main>
    </div>
  )
}
