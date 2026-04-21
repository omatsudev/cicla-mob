import { redirect } from 'next/navigation'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseNotificationRepository } from '@/lib/infrastructure/repositories/SupabaseNotificationRepository'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { generateNotifications } from '@/lib/application/use-cases/GenerateNotificationsUseCase'
import { getPendingNotifications } from '@/lib/application/use-cases/GetPendingNotificationsUseCase'
import { NotificationList } from '@/components/notifications/NotificationList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const notifRepo = new SupabaseNotificationRepository(supabase)
  const profileRepo = new SupabaseUserProfileRepository(supabase)
  const coupleRepo = new SupabaseCoupleRepository(supabase)
  const recordRepo = new SupabaseDailyRecordRepository(supabase)

  await generateNotifications(user.id, recordRepo, profileRepo, coupleRepo, notifRepo)

  const { notifications, unreadCount } = await getPendingNotifications(user.id, notifRepo)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-rose-600 mt-0.5">{unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}</p>
          )}
        </div>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  )
}
