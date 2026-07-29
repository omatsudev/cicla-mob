import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-banner-dismissed') === '1')

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!promptEvent || dismissed) return null

  async function handleInstall() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setDismissed(true)
      localStorage.setItem('pwa-banner-dismissed', '1')
    }
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto">
      <div className="bg-white border border-rose-200 rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <span className="text-lg">🌸</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Adicionar à tela inicial</p>
          <p className="text-xs text-gray-500 mt-0.5">Acesse o Somos Billings como um app</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-rose-700 transition"
          >
            <Download size={12} />
            Instalar
          </button>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
