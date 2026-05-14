import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = 'BDoZB_KAywD2z6foaxwVa2r_LCydLdFZu4jl2p-4DHKb_Xh6Hv1r11OXGsDwr5SA07p1N34IrEMwWeImQhMrGbo'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function registerPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false

  await supabase.from('mob_push_subscriptions').upsert(
    { user_id: session.user.id, subscription: sub.toJSON() },
    { onConflict: 'user_id' }
  )

  return true
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
