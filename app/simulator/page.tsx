'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import SimulatorView from '@/components/SimulatorView'
import { getStoredUser } from '@/lib/utils'

export default function SimulatorPage() {
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
        userAvatar={user ? `/usuarios/${user.username}.webp` : undefined}
        username={user?.username}
        userRole={user?.role}
        variant="nav"
        backTo={!user ? '/' : undefined}
      />
      <main className="w-full pb-2">
        <SimulatorView isAdmin={user?.role === 'admin'} />
      </main>
    </div>
  )
}
