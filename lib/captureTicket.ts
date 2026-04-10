/**
 * Share ticket capture — html2canvas with the proven working configuration.
 * Key flags: useCORS: true + allowTaint: true handles same-origin images
 * (including paths with spaces) without canvas taint issues.
 * The 600ms delay lets the hidden off-screen DOM fully render before capture.
 */

export async function captureAndDownload(el: HTMLElement, filename: string): Promise<void> {
  // Allow the hidden element to fully render before capture
  await new Promise(resolve => setTimeout(resolve, 600))

  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(el, {
    useCORS: true,
    scale: 2,
    backgroundColor: '#0a0a0a',
    logging: false,
    allowTaint: true,
  })

  const link = document.createElement('a')
  // Always export as PNG — most reliable format with html2canvas
  const pngName = filename.replace(/\.(webp|jpeg|jpg)$/i, '.png')
  link.download = pngName.endsWith('.png') ? pngName : `${pngName}.png`
  link.href = canvas.toDataURL('image/png', 1.0)
  link.click()
}
