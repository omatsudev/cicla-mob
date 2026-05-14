import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails('mailto:contato@ciclamob.com.br', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
  // Chamado via Database Webhook no INSERT de mob_daily_records
  const payload = await req.json()
  const record = payload.record // { user_id, date, ... }

  if (!record?.user_id) return new Response('ok', { status: 200 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verifica se quem registrou é mulher
  const { data: profile } = await supabase
    .from('mob_user_profiles')
    .select('user_type, name')
    .eq('id', record.user_id)
    .maybeSingle()

  if (profile?.user_type !== 'woman') return new Response('ok', { status: 200 })

  // Busca parceiro (homem) vinculado
  const { data: link } = await supabase
    .from('mob_couple_links')
    .select('man_id')
    .eq('woman_id', record.user_id)
    .maybeSingle()

  if (!link?.man_id) return new Response('ok', { status: 200 })

  // Verifica se parceiro tem notificações ativas
  const { data: manProfile } = await supabase
    .from('mob_user_profiles')
    .select('notifications_enabled')
    .eq('id', link.man_id)
    .maybeSingle()

  if (!manProfile?.notifications_enabled) return new Response('ok', { status: 200 })

  // Busca subscrição push do parceiro
  const { data: sub } = await supabase
    .from('mob_push_subscriptions')
    .select('subscription')
    .eq('user_id', link.man_id)
    .maybeSingle()

  if (!sub?.subscription) return new Response('ok', { status: 200 })

  const womanName = profile.name ?? 'Sua parceira'

  await webpush.sendNotification(
    sub.subscription,
    JSON.stringify({
      title: 'Cicla MOB 🌸',
      body: `${womanName} registrou as observações de hoje.`,
      url: '/dashboard',
    })
  )

  return new Response('ok', { status: 200 })
})
