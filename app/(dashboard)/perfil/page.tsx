import { redirect } from 'next/navigation'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileRepo = new SupabaseUserProfileRepository(supabase)
  const coupleRepo = new SupabaseCoupleRepository(supabase)

  const profile = await profileRepo.findById(user.id)
  const partner = await coupleRepo.findPartnerProfile(user.id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure suas preferências e vincule seu parceiro.
        </p>
      </div>

      <ProfileForm
        email={user.email ?? ''}
        profile={profile}
        partner={partner}
      />
    </div>
  )
}
