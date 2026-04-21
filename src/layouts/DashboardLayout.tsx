import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { SupabaseNotificationRepository } from '@/lib/infrastructure/repositories/SupabaseNotificationRepository'

export function DashboardLayout() {
  const [userName, setUserName] = useState('')
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const user = session.user
      setUserName(user.user_metadata?.name ?? user.email ?? '')

      const notifRepo = new SupabaseNotificationRepository(supabase)
      const count = await notifRepo.countUnreadByUser(user.id)
      setUnreadNotifications(count)
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header userName={userName} unreadNotifications={unreadNotifications} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
