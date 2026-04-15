'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import { getStoredUser } from '@/lib/utils'

const CONTACTS = [
  { label: 'Cotate',  href: 'https://x.com/Cotate_',    handle: '@Cotate_'    },
  { label: 'Anye',   href: 'https://x.com/anyecrx_',   handle: '@anyecrx_'   },
  { label: 'Jude',   href: 'https://x.com/jude_utd05', handle: '@jude_utd05' },
  { label: 'Annagg', href: 'https://x.com/Annagg05',   handle: '@Annagg05'   },
]

type FormState = 'idle' | 'sending' | 'sent'

export default function ContactoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')

  useEffect(() => {
    const u = getStoredUser()
    setUser(u)
    setReady(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('muertazos_user')
    router.push('/')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return

    setFormState('sending')

    const body = encodeURIComponent(
      `Nombre: ${name}\n\nMensaje:\n${message}`
    )
    const mailtoHref = `mailto:cotate14@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`

    // Open the user's mail client
    window.location.href = mailtoHref

    // Mark as sent after a short delay so the UI responds
    setTimeout(() => setFormState('sent'), 800)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
    setFormState('idle')
  }

  if (!ready) return null

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-medium placeholder-slate-600 focus:outline-none focus:border-[#FFD300]/60 focus:ring-1 focus:ring-[#FFD300]/20 transition-all'
  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2'

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

      <main className="max-w-5xl mx-auto px-5 py-10 flex flex-col gap-12">

        {/* Page title */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-10">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
            Contacto
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl mt-1">
            Si tienes dudas, sugerencias o has encontrado algun error en la plataforma, no dudes en ponerte en contacto con nosotros. El feedback de la comunidad es fundamental para el desarrollo de Muertazos y valoramos cada mensaje recibido.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left: Contact info */}
          <div className="flex flex-col gap-8">

            {/* Email */}
            <div className="flex flex-col gap-3">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Correo electronico
            </h3>
              <a
                href="mailto:cotate14@gmail.com"
                className="group flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl px-4 py-3.5 hover:border-white/10 transition-colors w-fit"
              >
                <svg className="w-4 h-4 text-[#FFD300] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-300 group-hover:text-white text-sm font-medium transition-colors">
                  cotate14@gmail.com
                </span>
              </a>
            </div>

            {/* Twitter / X */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
                Redes Sociales
              </h3>
              <div className="flex flex-col gap-2">
                {CONTACTS.map(c => (
                  <a
                    key={c.handle}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={`/usuarios/${c.label}.webp`}
                        alt={c.label}
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-300 group-hover:text-white text-sm font-bold transition-colors">
                        {c.label}
                      </span>
                      <span className="text-slate-600 text-xs font-medium">
                        {c.handle}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
                Tiempo de respuesta
              </h3>
              <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Revisamos todas las solicitudes y nos comprometemos a responder en un plazo de{' '}
                  <span className="text-white font-bold">24 a 48 horas habiles</span> desde la recepcion del mensaje.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="flex flex-col gap-4">
              <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
                Formulario de contacto
              </h3>

            {formState === 'sent' ? (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-5 text-center h-full min-h-[360px]">
                <div className="w-12 h-12 rounded-full bg-[#FFD300]/10 border border-[#FFD300]/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FFD300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-white font-black italic uppercase tracking-tight text-lg">
                    Mensaje enviado
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                    Se ha abierto tu cliente de correo con el mensaje preparado. Responderemos en un plazo de 24 a 48 horas habiles.
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col gap-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      autoComplete="name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Correo electronico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Asunto</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Mensaje</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={6}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formState === 'sending'}
                  className="w-full bg-[#FFD300] text-black font-black italic uppercase text-sm tracking-tight px-5 py-3.5 rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formState === 'sending' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar mensaje'
                  )}
                </button>

                <p className="text-slate-700 text-[10px] leading-relaxed text-center">
                  Al enviar, se abrira tu cliente de correo con el mensaje preparado para cotate14@gmail.com.
                </p>
              </form>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
