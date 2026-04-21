'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import type { UserType } from '@/lib/domain/enums/UserType'
import type { CoupleObjective } from '@/lib/domain/enums/CoupleObjective'
import { revalidatePath } from 'next/cache'

export async function saveProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const repo = new SupabaseUserProfileRepository(supabase)
  await repo.upsert({
    userId: user.id,
    name: formData.get('name') as string,
    userType: formData.get('userType') as UserType,
    coupleObjective: (formData.get('coupleObjective') as CoupleObjective) || null,
    notificationsEnabled: formData.get('notificationsEnabled') === 'true',
    notificationHour: parseInt(formData.get('notificationHour') as string, 10) || 8,
  })

  revalidatePath('/perfil')
}

export async function linkPartnerAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partnerEmail = formData.get('partnerEmail') as string
  if (!partnerEmail) return { error: 'E-mail não informado.' }

  const { data: partnerUser } = await supabase
    .from('mob_user_profiles')
    .select('id')
    .eq('id',
      supabase
        .from('auth.users' as never)
        .select('id')
        .eq('email', partnerEmail)
        .single()
    )
    .maybeSingle()

  const { data: authUsers } = await supabase.auth.admin?.listUsers() ?? { data: null }
  const partner = authUsers?.users?.find(u => u.email === partnerEmail)
  if (!partner) return { error: 'Parceiro não encontrado. Verifique o e-mail.' }

  const profileRepo = new SupabaseUserProfileRepository(supabase)
  const myProfile = await profileRepo.findById(user.id)
  if (!myProfile) return { error: 'Perfil não encontrado.' }

  const coupleRepo = new SupabaseCoupleRepository(supabase)
  const womanId = myProfile.userType === 'woman' ? user.id : partner.id
  const manId = myProfile.userType === 'man' ? user.id : partner.id

  await coupleRepo.link(womanId, manId)
  revalidatePath('/perfil')
}

export async function unlinkPartnerAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const coupleRepo = new SupabaseCoupleRepository(supabase)
  await coupleRepo.unlink(user.id)
  revalidatePath('/perfil')
}
