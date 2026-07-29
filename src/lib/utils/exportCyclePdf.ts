import { CICLA_PRINT_PAGE_CLASS } from '@/components/cycle/CyclePrintView'

const A4_LANDSCAPE_MM = { width: 297, height: 210 }

/**
 * Renders each .cicla-print-page inside `container` to a canvas and assembles
 * a landscape A4 PDF. Bypasses the browser print dialog entirely so the
 * output is pixel-identical across desktop, mobile and tablet — OS/browser
 * print drivers routinely ignore @page orientation on mobile.
 *
 * jsPDF/html-to-image are dynamically imported so they don't bloat the main
 * bundle — they're only needed when a user actually exports a PDF.
 *
 * Uses html-to-image (SVG foreignObject) instead of html2canvas: html2canvas
 * reimplements CSS layout from scratch and garbles `writing-mode:
 * vertical-rl` (used for the rotated title/labels), while html-to-image
 * delegates rendering to the browser's real engine, so it just works.
 */
export async function exportCyclePdf(container: HTMLElement, filename: string): Promise<void> {
  const pages = Array.from(container.querySelectorAll<HTMLElement>(`.${CICLA_PRINT_PAGE_CLASS}`))
  if (pages.length === 0) return

  const [{ jsPDF }, { toCanvas }] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
  ])

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  for (let i = 0; i < pages.length; i++) {
    const canvas = await toCanvas(pages[i], { pixelRatio: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    if (i > 0) pdf.addPage('a4', 'landscape')
    pdf.addImage(imgData, 'PNG', 0, 0, A4_LANDSCAPE_MM.width, A4_LANDSCAPE_MM.height)
  }

  pdf.save(filename)
}
