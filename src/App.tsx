import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useProfile } from '@/lib/context/ProfileContext'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import Invite from '@/pages/Invite'
import Dashboard from '@/pages/Dashboard'
import RecordEntry from '@/pages/RecordEntry'
import Calendar from '@/pages/Calendar'
import Notifications from '@/pages/Notifications'
import Profile from '@/pages/Profile'

function ManGuard({ children }: { children: React.ReactNode }) {
  const { isMan, loading } = useProfile()
  if (loading) return null
  if (isMan) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login', { replace: true })
      } else {
        setUser(session.user)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login', { replace: true })
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  return user ? <>{children}</> : null
}

/** Redirects an old (Portuguese) route to its new path, preserving query string and hash — keeps existing bookmarks/shared links/push-notification links working. */
function LegacyRedirect({ to }: { to: string }) {
  const location = useLocation()
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />

        {/* Public routes */}
        <Route path="/invite" element={<Invite />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/record" element={<RecordEntry />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Legacy Portuguese routes — kept as redirects so old bookmarks, shared invite
            links and already-sent push notifications keep working */}
        <Route path="/convite" element={<LegacyRedirect to="/invite" />} />
        <Route path="/cadastro" element={<LegacyRedirect to="/signup" />} />
        <Route path="/registrar" element={<LegacyRedirect to="/record" />} />
        <Route path="/calendario" element={<LegacyRedirect to="/calendar" />} />
        {/* Histórico foi descontinuado como página própria; a lista de registros agora vive dentro de Ciclos */}
        <Route path="/historico" element={<LegacyRedirect to="/calendar" />} />
        <Route path="/history" element={<LegacyRedirect to="/calendar" />} />
        <Route path="/notificacoes" element={<LegacyRedirect to="/notifications" />} />
        <Route path="/perfil" element={<LegacyRedirect to="/profile" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
