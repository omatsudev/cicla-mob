import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

/**
 * Aceita uma solicitação de vínculo de casal (mob_couple_requests) e migra os
 * registros diários já existentes de quem se cadastrou por conta própria antes
 * de vincular, para que o casal sempre acompanhe o mesmo conjunto de dados
 * (o da mulher). Roda com a service role porque mover registros de um usuário
 * para outro é uma operação entre duas contas distintas, fora do alcance do
 * RLS por usuário.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401)

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user?.email) return json({ error: 'Não autenticado.' }, 401)

  const { requestId } = await req.json().catch(() => ({}))
  if (!requestId) return json({ error: 'requestId é obrigatório.' }, 400)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: request } = await admin
    .from('mob_couple_requests')
    .select('id, requester_id, target_email, status')
    .eq('id', requestId)
    .maybeSingle()

  if (!request || request.status !== 'pending') {
    return json({ error: 'Solicitação não encontrada ou já respondida.' }, 404)
  }
  if (request.target_email?.toLowerCase() !== user.email.toLowerCase()) {
    return json({ error: 'Esta solicitação não é sua.' }, 403)
  }

  const [{ data: myProfile }, { data: requesterProfile }] = await Promise.all([
    admin.from('mob_user_profiles').select('user_type').eq('id', user.id).maybeSingle(),
    admin.from('mob_user_profiles').select('user_type').eq('id', request.requester_id).maybeSingle(),
  ])

  const myType = myProfile?.user_type ?? 'woman'
  const requesterType = requesterProfile?.user_type ?? 'man'

  if (myType === requesterType) {
    return json({ error: 'O vínculo precisa ser entre uma mulher e um homem.' }, 400)
  }

  const womanId = requesterType === 'woman' ? request.requester_id : user.id
  const manId = requesterType === 'man' ? request.requester_id : user.id

  const { error: linkError } = await admin
    .from('mob_couple_links')
    .insert({ woman_id: womanId, man_id: manId })
  if (linkError) return json({ error: linkError.message }, 500)

  // Migra os registros do homem para o conjunto compartilhado (mulher).
  // Em caso de conflito de data, mantém o registro dela.
  const [{ data: manRecords }, { data: womanRecords }] = await Promise.all([
    admin.from('mob_daily_records').select('id, date').eq('user_id', manId),
    admin.from('mob_daily_records').select('date').eq('user_id', womanId),
  ])
  const womanDates = new Set((womanRecords ?? []).map((r) => r.date))
  const toMigrate = (manRecords ?? []).filter((r) => !womanDates.has(r.date)).map((r) => r.id)
  const toDrop = (manRecords ?? []).filter((r) => womanDates.has(r.date)).map((r) => r.id)

  if (toMigrate.length) {
    await admin.from('mob_daily_records').update({ user_id: womanId }).in('id', toMigrate)
  }
  if (toDrop.length) {
    await admin.from('mob_daily_records').delete().in('id', toDrop)
  }

  await admin.from('mob_couple_requests').update({ status: 'accepted' }).eq('id', requestId)

  return json({ ok: true, migratedRecords: toMigrate.length, droppedConflicts: toDrop.length })
})
