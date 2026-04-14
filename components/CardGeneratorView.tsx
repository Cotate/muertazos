'use client'
import { useState, useRef, useCallback } from 'react'

const CANVAS_W = 300
const CANVAS_H = 423
const CORNER_RADIUS = 28

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function extractNameFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')       // strip extension
    .replace(/[_-]+/g, ' ')         // underscores/dashes → spaces
    .trim()
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sw: number, sh: number, sx: number, sy: number
  if (imgRatio > boxRatio) {
    sh = img.height
    sw = img.height * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = img.width / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundedClip(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(w - r, 0)
  ctx.arcTo(w, 0, w, r, r)
  ctx.lineTo(w, h - r)
  ctx.arcTo(w, h, w - r, h, r)
  ctx.lineTo(r, h)
  ctx.arcTo(0, h, 0, h - r, r)
  ctx.lineTo(0, r)
  ctx.arcTo(0, 0, r, 0, r)
  ctx.closePath()
  ctx.clip()
}

export default function CardGeneratorView() {
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [playerFile, setPlayerFile] = useState<File | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handlePlayerFile = useCallback((file: File | null) => {
    setPlayerFile(file)
    if (file) {
      setPlayerName(extractNameFromFilename(file.name))
    }
  }, [])

  const generate = useCallback(async () => {
    if (!bgFile || !playerFile) {
      setError('Selecciona ambas imágenes antes de generar.')
      return
    }
    setError(null)
    setGenerating(true)

    try {
      const [bgUrl, playerUrl] = await Promise.all([
        fileToDataURL(bgFile),
        fileToDataURL(playerFile),
      ])
      const [bgImg, playerImg] = await Promise.all([
        loadImage(bgUrl),
        loadImage(playerUrl),
      ])

      const canvas = canvasRef.current!
      canvas.width = CANVAS_W
      canvas.height = CANVAS_H
      const ctx = canvas.getContext('2d')!

      // Rounded-corner clip applied first — everything drawn inside it
      ctx.save()
      roundedClip(ctx, CANVAS_W, CANVAS_H, CORNER_RADIUS)

      // --- Layer 1: Background (cover) ---
      drawCoverImage(ctx, bgImg, 0, 0, CANVAS_W, CANVAS_H)

      // --- Layer 2: Player cutout ---
      // Draw at full canvas width (edge-to-edge), maintain aspect ratio, anchor to bottom
      const pW = CANVAS_W
      const pH = Math.round((playerImg.height / playerImg.width) * pW)
      const pX = 0
      // Bottom of player image sits at the bottom of the canvas
      const pY = CANVAS_H - pH

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(playerImg, pX, pY, pW, pH)

      // --- Layer 3: Bottom gradient ---
      const gradH = CANVAS_H * 0.42
      const grad = ctx.createLinearGradient(0, CANVAS_H - gradH, 0, CANVAS_H)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.45, 'rgba(0,0,0,0.78)')
      grad.addColorStop(1, 'rgba(0,0,0,0.97)')
      ctx.fillStyle = grad
      ctx.fillRect(0, CANVAS_H - gradH, CANVAS_W, gradH)

      // --- Layer 4: Player name text ---
      const name = playerName.trim() || 'JUGADOR'
      const safeMargin = CANVAS_W * 0.08
      const maxTextW = CANVAS_W - safeMargin * 2

      // Dynamic font size: start at canvas-proportional size, shrink until text fits
      let fontSize = 30
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      while (fontSize > 6) {
        ctx.font = `900 italic ${fontSize}px 'Arial Black', Arial, sans-serif`
        const metrics = ctx.measureText(name.toUpperCase())
        if (metrics.width <= maxTextW) break
        fontSize -= 1
      }

      // Move text higher from the bottom for better visual balance
      const textY = CANVAS_H - Math.round(CANVAS_H * 0.13)

      // Shadow / glow for legibility
      ctx.shadowColor = 'rgba(0,0,0,0.95)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 3

      // Draw text twice with tight offset — creates a crisp outline/stroke feel
      ctx.fillStyle = '#FFD300'
      ctx.fillText(name.toUpperCase(), CANVAS_W / 2 + 1, textY + 1)

      ctx.shadowBlur = 4
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(name.toUpperCase(), CANVAS_W / 2, textY)

      ctx.shadowColor = 'transparent'
      ctx.restore()

      setPreviewUrl(canvas.toDataURL('image/png'))
    } catch (err) {
      console.error(err)
      setError('Error al procesar las imágenes. Intenta de nuevo.')
    } finally {
      setGenerating(false)
    }
  }, [bgFile, playerFile, playerName])

  const download = useCallback(() => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const safeName = (playerName.trim() || 'jugador').replace(/\s+/g, '_')
    a.download = `${safeName}_card.png`
    a.click()
  }, [previewUrl, playerName])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tight text-[#FFD300]">
            Generador de Cartas
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left panel: controls ── */}
          <div className="flex flex-col gap-5">

            {/* Background upload */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                A · Imagen de Fondo
              </label>
              <label className={`flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${bgFile ? 'border-[#FFD300]/60 bg-[#FFD300]/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setBgFile(e.target.files?.[0] ?? null)
                    setPreviewUrl(null)
                  }}
                />
                {bgFile ? (
                  <>
                    <svg className="w-7 h-7 text-[#FFD300]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold text-[#FFD300] text-center px-4 truncate max-w-full">{bgFile.name}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-slate-500 font-medium">Haz clic o arrastra una imagen</span>
                  </>
                )}
              </label>
            </div>

            {/* Player cutout upload */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                B · Imagen del Jugador (PNG Transparente)
              </label>
              <label className={`flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${playerFile ? 'border-[#01d6c3]/60 bg-[#01d6c3]/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handlePlayerFile(e.target.files?.[0] ?? null)
                    setPreviewUrl(null)
                  }}
                />
                {playerFile ? (
                  <>
                    <svg className="w-7 h-7 text-[#01d6c3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-bold text-[#01d6c3] text-center px-4 truncate max-w-full">{playerFile.name}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-slate-500 font-medium">Haz clic o arrastra el PNG del jugador</span>
                  </>
                )}
              </label>
            </div>

            {/* Player name */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                Nombre del Jugador
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ej: Ibai Llanos"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-base placeholder-slate-600 focus:outline-none focus:border-[#FFD300]/60 focus:ring-1 focus:ring-[#FFD300]/30 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={generate}
                disabled={generating || !bgFile || !playerFile}
                className="flex-1 bg-[#FFD300] text-black font-black italic uppercase text-sm tracking-tight px-5 py-3.5 rounded-xl hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generando...
                  </>
                ) : (
                  'Generar Carta'
                )}
              </button>

              {previewUrl && (
                <button
                  onClick={download}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-black italic uppercase text-sm tracking-tight px-5 py-3.5 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar
                </button>
              )}
            </div>
          </div>

          {/* ── Right panel: preview ── */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 self-start">
              Vista Previa
            </p>

            <div className="w-full max-w-sm aspect-[5/7] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Carta generada"
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-700">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <p className="text-sm font-medium">La carta aparecerá aquí</p>
                </div>
              )}
            </div>

            {previewUrl && (
              <p className="text-xs text-slate-600 font-medium">
                Resolución: {CANVAS_W} × {CANVAS_H} px
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for compositing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
