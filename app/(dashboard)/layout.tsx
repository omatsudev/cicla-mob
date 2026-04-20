import { createClient } from '@/lib/infrastructure/supabase/server'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export const runtime = 'edge'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.name ?? user?.email ?? ''

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header userName={userName} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
