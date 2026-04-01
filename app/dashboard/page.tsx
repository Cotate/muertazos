// app/dashboard/page.tsx  ─── redirect a /dashboard/kings
import { redirect } from 'next/navigation'
export default function DashboardRoot() { redirect('/dashboard/kings') }
