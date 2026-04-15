'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import { getStoredUser } from '@/lib/utils'

const TOOLS = [
  {
    name: 'Predis',
    description:
      'Herramienta de predicciones individuales disponible para Kings League en sus tres ligas (España, Mexico y Brasil) y para Queens League (España). Permite a cada usuario registrar sus elecciones antes del cierre de cada jornada.',
  },
  {
    name: 'Multipredis',
    description:
      'Herramienta de predicciones grupales diseñada para fomentar la competencia interna y la interaccion social entre amigos. Permite crear grupos privados donde los participantes compiten entre si con sus propias predicciones.',
  },
  {
    name: 'Simulador',
    description:
      'Visualizador de clasificaciones en tiempo real basado en los resultados de cada jornada. Permite explorar escenarios hipoteticos modificando resultados y observando el impacto directo en las posiciones de la tabla.',
  },
  {
    name: 'Pizarra',
    description:
      'Panel de informacion actualizada por jornada que incluye lesiones, wildcards, sanciones y convocatorias. Facilita la construccion de alineaciones realistas antes de que se dispute cada partido.',
  },
  {
    name: 'Tier List',
    description:
      'Constructor de clasificaciones personalizadas para jugadores, escudos de equipos e indumentaria. Permite a los usuarios ordenar y compartir sus valoraciones de forma visual e intuitiva.',
  },
]

export default function QuienesSomosPage() {
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

      <main className="max-w-4xl mx-auto px-5 py-10 flex flex-col gap-12">

        {/* Page title */}
        <div className="flex flex-col gap-3 border-b border-white/5 pb-10">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-none">
            Quienes somos
          </h1>
        </div>

        {/* Introduction */}
        <section className="flex flex-col gap-4">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Introduccion
            </h3>
          <p className="text-slate-300 text-base leading-relaxed">
            Muertazos es una plataforma global de herramientas para el seguimiento y la participacion activa en las Kings League y Queens League. Su proposito va mas alla de las predicciones clasicas: es un ecosistema de funcionalidades pensadas para que los aficionados vivan las competiciones de una forma mas profunda, informada y competitiva.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            El proyecto nacio de la comunidad y se desarrolla de forma independiente, con el objetivo de cubrir cada funcionalidad que los usuarios demandan y que las plataformas oficiales no ofrecen.
          </p>
        </section>

        {/* Private competition */}
        <section className="flex flex-col gap-4">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Competicion Privada
            </h3>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col gap-3">
          <p className="text-white font-black uppercase tracking-[0.4em] text-[#FFD300]">
            Liga interna con premio en metálico
          </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Muertazos alberga una competicion privada en la que usuarios de distintos paises se enfrentan entre si utilizando las predicciones de tres ligas distintas: Kings League España, Kings League Mexico y Kings League Brasil. Al cierre de cada temporada, el participante con mayor puntuacion acumulada se lleva un premio en metalico.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Esta competicion interna es el nucleo original del proyecto y sigue siendo el principal motor de participacion de la comunidad registrada.
            </p>
          </div>
        </section>

        {/* Public tools */}
        <section className="flex flex-col gap-6">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Herramientas publicas
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOOLS.map(tool => (
              <div
                key={tool.name}
                className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex flex-col gap-2 hover:border-white/10 transition-colors"
              >
                <h3 className="text-white font-black uppercase tracking-[0.4em] text-[#FFD300]">
                  {tool.name}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Scope & Vision */}
        <section className="flex flex-col gap-4">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Alcance y vision
            </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            En la actualidad, Muertazos ofrece cobertura de tres ligas de la Kings League (España, Mexico y Brasil) y una liga de la Queens League (España). La incorporacion de la Kings League Italia esta planificada para proximas temporadas, continuando con la expansion del proyecto a nivel internacional.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            La vision a largo plazo es consolidarse como la referencia en herramientas de analisis y participacion para las competiciones del ecosistema Kings y Queens League, con una comunidad activa que contribuya a su crecimiento.
          </p>
        </section>

        {/* Development */}
        <section className="flex flex-col gap-4 border-t border-white/5 pt-10">
            <h3 className="text-[#FFD300] font-black italic uppercase text-lg tracking-tight">
              Desarrollo
            </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Muertazos es un desarrollo independiente, construido y mantenido por un equipo reducido de aficionados con perfil tecnico. No tiene vinculacion oficial con Kings League, Queens League ni ninguna de sus entidades asociadas. Cada funcionalidad es diseñada y lanzada en respuesta directa a las necesidades y sugerencias de la comunidad, con un compromiso constante de mejora y expansion.
          </p>
        </section>

      </main>
    </div>
  )
}
