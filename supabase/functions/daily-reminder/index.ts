import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'
import { DAILY_RECORD_PATH } from '../_shared/routes.ts'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails('mailto:contato@ciclamob.com.br', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const nowHour = new Date().getUTCHours() - 3 // BRT = UTC-3
  const today = new Date().toISOString().slice(0, 10)

  // Busca usuárias (mulheres) com notificações ativas no horário atual
  const { data: profiles } = await supabase
    .from('mob_user_profiles')
    .select('id, name')
    .eq('notifications_enabled', true)
    .eq('user_type', 'woman')
    .eq('notification_hour', ((nowHour % 24) + 24) % 24)

  if (!profiles?.length) return new Response('ok', { status: 200 })

  const results = await Promise.allSettled(profiles.map(async (profile) => {
    // Verifica se já registrou hoje
    const { data: record } = await supabase
      .from('mob_daily_records')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle()

    if (record) return // Já registrou, não notifica

    // Busca subscrição push
    const { data: sub } = await supabase
      .from('mob_push_subscriptions')
      .select('subscription')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (!sub?.subscription) return

    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({
        title: 'Cicla MOB 📝',
        body: 'Não esqueça de registrar as observações do dia.',
        url: DAILY_RECORD_PATH,
      })
    )
  }))

  const errors = results.filter(r => r.status === 'rejected')
  if (errors.length) console.error('Erros ao enviar push:', errors)

  return new Response(JSON.stringify({ sent: profiles.length - errors.length }), { status: 200 })
})
