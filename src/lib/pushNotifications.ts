import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = 'BDoZB_KAywD2z6foaxwVa2r_LCydLdFZu4jl2p-4DHKb_Xh6Hv1r11OXGsDwr5SA07p1N34IrEMwWeImQhMrGbo'

export type RegisterPushFailureReason = 'ios-not-installed' | 'unsupported' | 'denied' | 'error'
export type RegisterPushResult = { ok: true } | { ok: false; reason: RegisterPushFailureReason }

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** No iOS, push só funciona com o app instalado na tela de início (Safari não suporta push no navegador comum). */
export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function registerPush(): Promise<RegisterPushResult> {
  if (isIos() && !isStandalonePwa()) return { ok: false, reason: 'ios-not-installed' }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false, reason: 'unsupported' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return { ok: false, reason: 'error' }

    await supabase.from('mob_push_subscriptions').upsert(
      { user_id: session.user.id, subscription: sub.toJSON() },
      { onConflict: 'user_id' }
    )

    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

export function pushFailureMessage(reason: RegisterPushFailureReason): string {
  switch (reason) {
    case 'ios-not-installed':
      return 'No iPhone, as notificações só funcionam com o app adicionado à tela de início. Toque em Compartilhar e depois em "Adicionar à Tela de Início", abra o app por lá e tente novamente.'
    case 'denied':
      return 'A permissão de notificações foi negada. Você pode ativá-la depois nas configurações do navegador.'
    case 'unsupported':
      return 'Este navegador não é compatível com notificações push.'
    case 'error':
      return 'Não foi possível ativar as notificações agora. Tente novamente em instantes.'
  }
}

export async function unregisterPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return

  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  await supabase.from('mob_push_subscriptions').delete().eq('user_id', session.user.id)
}
