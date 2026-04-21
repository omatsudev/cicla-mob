'use server'

import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseNotificationRepository } from '@/lib/infrastructure/repositories/SupabaseNotificationRepository'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { generateNotifications } from '@/lib/application/use-cases/GenerateNotificationsUseCase'
import { revalidatePath } from 'next/cache'

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const repo = new SupabaseNotificationRepository(supabase)
  await repo.markRead(id, user.id)
  revalidatePath('/notificacoes')
}

export async function markAllReadAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const repo = new SupabaseNotificationRepository(supabase)
  await repo.markAllRead(user.id)
  revalidatePath('/notificacoes')
}

export async function triggerNotificationsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await generateNotifications(
    user.id,
    new SupabaseDailyRecordRepository(supabase),
    new SupabaseUserProfileRepository(supabase),
    new SupabaseCoupleRepository(supabase),
    new SupabaseNotificationRepository(supabase),
  )
  revalidatePath('/notificacoes')
}
