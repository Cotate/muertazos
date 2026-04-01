// app/dashboard/kings/page.tsx
'use client'
import {{ useEffect, useState }} from 'react'
import UserPicks from '@/components/UserPicks'

export default function KingsPage() {{
  const [user, setUser] = useState<any>(null)
  useEffect(() => {{
    const stored = localStorage.getItem('muertazos_user')
    if (stored) setUser(JSON.parse(stored))
  }}, [])
  if (!user) return null
  return <UserPicks league="kings" user={{user}} />
}}
