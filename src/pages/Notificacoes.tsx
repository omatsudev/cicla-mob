import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SupabaseNotificationRepository } from '@/lib/infrastructure/repositories/SupabaseNotificationRepository'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { generateNotifications } from '@/lib/application/use-cases/GenerateNotificationsUseCase'
import { getPendingNotifications } from '@/lib/application/use-cases/GetPendingNotificationsUseCase'
import { Card, CardContent } from '@/components/ui/card'
import type { AppNotification } from '@/lib/domain/entities/AppNotification'

const TYPE_ICONS: Record<string, string> = {
  pms: '🌙',
  fertile_period: '🌸',
  peak_fertility: '✨',
  return_infertile: '🍃',
  daily_reminder: '📝',
}

export default function Notificacoes() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadNotifications(userId: string) {
    const notifRepo = new SupabaseNotificationRepository(supabase)
    const profileRepo = new SupabaseUserProfileRepository(supabase)
    const coupleRepo = new SupabaseCoupleRepository(supabase)
    const recordRepo = new SupabaseDailyRecordRepository(supabase)

    await generateNotifications(userId, recordRepo, profileRepo, coupleRepo, notifRepo)

    const { notifications: notifs, unreadCount: count } = await getPendingNotifications(userId, notifRepo)
    setNotifications(notifs)
    setUnreadCount(count)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      await loadNotifications(session.user.id)
      setLoading(false)
    })
  }, [])

  async function markRead(id: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const repo = new SupabaseNotificationRepository(supabase)
    await repo.markRead(id, session.user.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const repo = new SupabaseNotificationRepository(supabase)
    await repo.markAllRead(session.user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadCount(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  const hasUnread = notifications.some((n) => !n.readAt)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-rose-600 mt-0.5">
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma notificação ainda.</p>
            <p className="text-gray-400 text-xs mt-1">Elas aparecerão conforme seu ciclo avança.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hasUnread && (
            <div className="flex justify-end">
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:underline"
              >
                <CheckCheck size={14} />
                Marcar todas como lidas
              </button>
            </div>
          )}

          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.readAt ? 'opacity-60' : 'border-rose-100 shadow-sm'}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[notification.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
                      {!notification.readAt && (
                        <button
                          onClick={() => markRead(notification.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-rose-600 transition"
                          title="Marcar como lida"
                        >
                          <Check size={15} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {format(parseISO(notification.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
