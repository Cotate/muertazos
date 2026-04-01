// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="w-full py-3 flex flex-col items-center gap-2 bg-slate-950 border-t border-slate-800">
      <div id="donate-button-container">
        <div id="donate-button" className="hover:scale-105 transition-transform" />
      </div>
      <p className="text-slate-700 text-[9px] font-black uppercase tracking-[0.3em]">
        MUERTAZOS © 2026
      </p>
    </footer>
  )
}
