'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import CardGeneratorView from '@/components/CardGeneratorView'

export default function CardGeneratorPage() {
  const router = useRouter()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('muertazos_user') || '{}')
    if (user.role !== 'admin') { router.push('/'); return }
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AppHeader onLogout={handleLogout} userRole="admin" variant="nav" />
      <main>
        <div className="flex justify-center my-4">
          <div id="container-db0f2e579c615669bb2ec9639b23ef77"></div>
        </div>
        <CardGeneratorView />
      </main>
    </div>
  )
}
