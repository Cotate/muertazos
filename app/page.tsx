'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'

// Definimos la información de cada tarjeta para mapearla fácilmente
const features = [
  {
    id: 'login',
    title: 'Iniciar Sesión',
    description: 'Accede a tu cuenta para guardar tu progreso, estadísticas y gestionar tu perfil.',
    route: '/login', // Asegúrate de mover tu código anterior a esta ruta
    color: '#01d6c3' // Cyan
  },
  {
    id: 'simulador',
    title: 'Simulador',
    description: 'Prueba diferentes estrategias, builds y escenarios en tiempo real.',
    route: '/simulador',
    color: '#FFD300' // Amarillo
  },
  {
    id: 'pizarra',
    title: 'Pizarra',
    description: 'Dibuja, planea y comparte tus tácticas de juego con tu equipo.',
    route: '/pizarra',
    color: '#FF4B4B' // Rojo/Coral
  },
  {
    id: 'tierlist',
    title: 'Tier List',
    description: 'Clasifica, vota y descubre los mejores elementos del meta actual.',
    route: '/tierlist',
    color: '#B829FF' // Morado
  }
]

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    document.body.style.backgroundColor = '#0a0a0a'
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      
      {/* HEADER INTEGRADO */}
      <header className="w-full h-24 flex justify-center items-center bg-slate-950 border-b border-slate-800 shadow-lg relative z-50">
        <div className="relative w-48 h-16 cursor-pointer" onClick={() => router.push('/')}>
          <Image 
            src="/Muertazos.png" 
            alt="Muertazos Logo" 
            fill 
            className="object-contain"
            priority 
          />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: GRID DE TARJETAS */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 md:px-8">
        
        <h1 className="text-3xl md:text-5xl font-black italic text-center mb-12 tracking-tighter uppercase leading-none text-white drop-shadow-lg">
          SELECCIONA UNA <span style={{ color: '#FFD300' }}>FUNCIÓN</span>
        </h1>

        {/* Contenedor Grid responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {features.map((feature) => (
            /* Contenedor principal de la tarjeta: define la perspectiva 3D y agrupa los estados de hover */
            <div 
              key={feature.id} 
              className="group h-64 w-full perspective-[1000px] cursor-pointer"
              onClick={() => router.push(feature.route)}
            >
              {/* Contenedor animado: maneja el giro y el escalado al hacer hover */}
              <div className="relative h-full w-full rounded-3xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:scale-105 shadow-xl">
                
                {/* LADO FRONTAL DE LA TARJETA */}
                <div className="absolute inset-0 h-full w-full rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm [backface-visibility:hidden] flex flex-col items-center justify-center p-6 shadow-2xl">
                  <h2 
                    className="text-2xl font-black italic text-center uppercase tracking-tighter"
                    style={{ color: feature.color }}
                  >
                    {feature.title}
                  </h2>
                </div>

                {/* LADO TRASERO DE LA TARJETA (Oculto inicialmente, girado 180 grados) */}
                <div className="absolute inset-0 h-full w-full rounded-3xl bg-slate-950 border border-slate-700 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                  <p className="text-slate-300 text-sm font-medium mb-6">
                    {feature.description}
                  </p>
                  <span 
                    className="text-[11px] font-black uppercase tracking-widest border-b-2 pb-1 transition-all"
                    style={{ borderColor: feature.color, color: feature.color }}
                  >
                    Entrar &rarr;
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CON BOTÓN DE DONACIÓN */}
      <div className="mt-auto flex flex-col items-center gap-4 pb-8 pt-12">
        <div id="donate-button-container">
          <div id="donate-button" className="hover:scale-105 transition-transform"></div>
        </div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          MUERTAZOS © 2026
        </p>
      </div>

      {/* CARGA DEL SDK DE PAYPAL */}
      <Script
        src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).PayPal) {
            (window as any).PayPal.Donation.Button({
              env: 'production',
              hosted_button_id: 'PE6W2EWS2SJFW',
              image: {
                src: 'https://www.paypalobjects.com/es_XC/i/btn/btn_donate_LG.gif',
                alt: 'Donar con el botón PayPal',
                title: 'PayPal - The safer, easier way to pay online!',
              }
            }).render('#donate-button')
          }
        }}
      />
    </div>
  )
}