import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import type { UserProfile } from '@/lib/domain/entities/UserProfile'

interface ProfileContextValue {
  profile: UserProfile | null
  /** ID a ser usado nas queries de dados — próprio (mulher) ou da esposa vinculada (homem) */
  dataUserId: string | null
  isMan: boolean
  isLinked: boolean
  loading: boolean
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  dataUserId: null,
  isMan: false,
  isLinked: false,
  loading: true,
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<ProfileContextValue>({
    profile: null,
    dataUserId: null,
    isMan: false,
    isLinked: false,
    loading: true,
  })

  useEffect(() => {
    async function loadProfile(userId: string) {
      const profileRepo = new SupabaseUserProfileRepository(supabase)
      const coupleRepo = new SupabaseCoupleRepository(supabase)

      const [profile, coupleLink] = await Promise.all([
        profileRepo.findById(userId),
        coupleRepo.findByUserId(userId),
      ])

      const isMan = profile?.userType === 'man'
      const isLinked = !!coupleLink

      let dataUserId: string | null = userId
      if (isMan && coupleLink) {
        dataUserId = coupleLink.womanId
      } else if (isMan && !coupleLink) {
        dataUserId = null
      }

      setValue({ profile, dataUserId, isMan, isLinked, loading: false })
    }

    // Carrega perfil na sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setValue(v => ({ ...v, loading: false }))
        return
      }
      loadProfile(session.user.id)
    })

    // Re-carrega sempre que a sessão mudar (login, logout, signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setValue({ profile: null, dataUserId: null, isMan: false, isLinked: false, loading: false })
        return
      }
      loadProfile(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  return useContext(ProfileContext)
}
