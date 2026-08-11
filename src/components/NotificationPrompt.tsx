import { useState } from 'react'
import { Bell, Share, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { registerPush, pushFailureMessage, isIos, isStandalonePwa, isPushSupported } from '@/lib/pushNotifications'

const DISMISSED_KEY = 'notif-prompt-dismissed'

interface NotificationPromptProps {
  userId: string
  notificationsEnabled: boolean
}

export function NotificationPrompt({ userId, notificationsEnabled }: NotificationPromptProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)

  if (notificationsEnabled || dismissed || activated) return null
  if (!isPushSupported() && !isIos()) return null

  const iosNeedsInstall = isIos() && !isStandalonePwa()

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  async function handleActivate() {
    setLoading(true)
    setError('')
    const result = await registerPush()
    if (!result.ok) {
      setError(pushFailureMessage(result.reason))
      setLoading(false)
      return
    }
    const repo = new SupabaseUserProfileRepository(supabase)
    await repo.upsert({ userId, notificationsEnabled: true })
    setActivated(true)
    setLoading(false)
  }

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
        {iosNeedsInstall ? <Share size={16} className="text-rose-500" /> : <Bell size={16} className="text-rose-500" />}
      </div>
      <div className="flex-1 min-w-0">
        {iosNeedsInstall ? (
          <>
            <p className="text-sm font-semibold text-gray-800">Ative as notificações no iPhone</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Toque em Compartilhar e depois em "Adicionar à Tela de Início". Abra o app por lá para poder ativar as notificações.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-800">Ativar notificações?</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Receba avisos sobre período fértil, pico de fertilidade e lembretes de registro.
            </p>
          </>
        )}
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        <div className="flex gap-2 mt-3">
          {!iosNeedsInstall && (
            <button
              onClick={handleActivate}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              {loading ? 'Ativando...' : 'Ativar'}
            </button>
          )}
          <button
            onClick={dismiss}
            className="border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            {iosNeedsInstall ? 'Entendi' : 'Agora não'}
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
