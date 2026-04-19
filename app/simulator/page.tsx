'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import SimulatorView from '@/components/SimulatorView'
import { getStoredUser } from '@/lib/utils'

export default function SimulatorPage() {
  return <Suspense><SimulatorPageInner /></Suspense>
}

function SimulatorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const urlCountry = searchParams.get('country') as 'spain' | 'brazil' | 'mexico' | null
  const urlLeague  = searchParams.get('league')  as 'kings' | 'queens' | null

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
      <main className="w-full pt-6 pb-2">
        <div className="flex justify-center my-4">
          <div id="container-db0f2e579c615669bb2ec9639b23ef77"></div>
        </div>
        <SimulatorView
          key={`${urlCountry ?? 'none'}-${urlLeague ?? 'none'}`}
          isAdmin={user?.role === 'admin'}
          initialCountry={urlCountry ?? undefined}
          initialLeague={urlLeague ?? undefined}
          hideControls={!!(urlCountry || urlLeague)}
        />
      </main>
    </div>
  )
}
