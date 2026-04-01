// app/admin/page.tsx  ─── redirect a /admin/kings
import { redirect } from 'next/navigation'
export default function AdminRoot() { redirect('/admin/kings') }
