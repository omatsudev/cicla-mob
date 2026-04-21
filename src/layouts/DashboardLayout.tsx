import { Outlet } from 'react-router-dom'
import { ProfileProvider, useProfile } from '@/lib/context/ProfileContext'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

function Layout() {
  const { profile } = useProfile()
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header userName={profile?.name ?? ''} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export function DashboardLayout() {
  return (
    <ProfileProvider>
      <Layout />
    </ProfileProvider>
  )
}
