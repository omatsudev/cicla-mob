import { useState, useEffect } from 'react'
import { User, Bell, Heart, Link2, Unlink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SupabaseUserProfileRepository } from '@/lib/infrastructure/repositories/SupabaseUserProfileRepository'
import { SupabaseCoupleRepository } from '@/lib/infrastructure/repositories/SupabaseCoupleRepository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UserProfile } from '@/lib/domain/entities/UserProfile'
import type { UserType } from '@/lib/domain/enums/UserType'
import type { CoupleObjective } from '@/lib/domain/enums/CoupleObjective'
import { USER_TYPE_LABELS } from '@/lib/domain/enums/UserType'
import { COUPLE_OBJECTIVE_LABELS } from '@/lib/domain/enums/CoupleObjective'

export default function Perfil() {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerError, setPartnerError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const user = session.user
      setEmail(user.email ?? '')

      const profileRepo = new SupabaseUserProfileRepository(supabase)
      const coupleRepo = new SupabaseCoupleRepository(supabase)

      const [p, pt] = await Promise.all([
        profileRepo.findById(user.id),
        coupleRepo.findPartnerProfile(user.id),
      ])
      setProfile(p)
      setPartner(pt)
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const fd = new FormData(e.currentTarget)
    const repo = new SupabaseUserProfileRepository(supabase)
    await repo.upsert({
      userId: session.user.id,
      name: fd.get('name') as string,
      userType: fd.get('userType') as UserType,
      coupleObjective: (fd.get('coupleObjective') as CoupleObjective) || null,
      notificationsEnabled: fd.get('notificationsEnabled') === 'true',
      notificationHour: parseInt(fd.get('notificationHour') as string, 10) || 8,
    })

    // Refresh profile
    const updatedProfile = await repo.findById(session.user.id)
    setProfile(updatedProfile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPartnerError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    // Look up partner by email in mob_user_profiles via a function or direct lookup
    // We query auth.users via RPC or search profiles by email stored in the table
    const { data: partnerProfile } = await supabase
      .from('mob_user_profiles')
      .select('id, name')
      .eq('email', partnerEmail)
      .maybeSingle()

    if (!partnerProfile) {
      setPartnerError('Parceiro não encontrado. Verifique o e-mail.')
      return
    }

    const profileRepo = new SupabaseUserProfileRepository(supabase)
    const myProfile = await profileRepo.findById(session.user.id)
    if (!myProfile) return

    const coupleRepo = new SupabaseCoupleRepository(supabase)
    const womanId = myProfile.userType === 'woman' ? session.user.id : partnerProfile.id
    const manId = myProfile.userType === 'man' ? session.user.id : partnerProfile.id
    await coupleRepo.link(womanId, manId)

    setPartner({ id: partnerProfile.id, name: partnerProfile.name ?? '' })
    setPartnerEmail('')
  }

  async function handleUnlink() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const coupleRepo = new SupabaseCoupleRepository(supabase)
    await coupleRepo.unlink(session.user.id)
    setPartner(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure suas preferências e vincule seu parceiro.
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={18} className="text-rose-500" />
              Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
                <p className="text-sm text-gray-700">{email}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                <input
                  name="name"
                  defaultValue={profile?.name ?? ''}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Eu sou</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['woman', 'man'] as const).map((type) => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value={type}
                        defaultChecked={(profile?.userType ?? 'woman') === type}
                        className="sr-only peer"
                      />
                      <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl p-3 text-center text-sm font-medium text-gray-700 peer-checked:text-rose-700 transition">
                        {USER_TYPE_LABELS[type]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <input type="hidden" name="notificationsEnabled" value={profile?.notificationsEnabled ? 'true' : 'false'} />
              <input type="hidden" name="notificationHour" value={profile?.notificationHour ?? 8} />

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {saved ? '✓ Salvo!' : 'Salvar dados'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Couple objective */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart size={18} className="text-rose-500" />
              Objetivo do casal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['get_pregnant', 'avoid_pregnancy'] as const).map((obj) => (
                  <label key={obj} className="cursor-pointer">
                    <input
                      type="radio"
                      name="coupleObjective"
                      value={obj}
                      defaultChecked={profile?.coupleObjective === obj}
                      className="sr-only peer"
                    />
                    <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl p-3 text-center text-sm font-medium text-gray-700 peer-checked:text-rose-700 transition">
                      {COUPLE_OBJECTIVE_LABELS[obj]}
                    </div>
                  </label>
                ))}
              </div>

              <input type="hidden" name="name" value={profile?.name ?? ''} />
              <input type="hidden" name="userType" value={profile?.userType ?? 'woman'} />
              <input type="hidden" name="notificationsEnabled" value={profile?.notificationsEnabled ? 'true' : 'false'} />
              <input type="hidden" name="notificationHour" value={profile?.notificationHour ?? 8} />

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Salvar objetivo
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} className="text-rose-500" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Ativar notificações</p>
                  <p className="text-xs text-gray-500">Receba alertas personalizados do ciclo</p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationsEnabledToggle"
                    defaultChecked={profile?.notificationsEnabled ?? false}
                    onChange={(e) => {
                      const hidden = e.currentTarget.closest('form')?.querySelector<HTMLInputElement>('input[name="notificationsEnabled"]')
                      if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-rose-500 rounded-full transition peer-focus:ring-2 peer-focus:ring-rose-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Horário preferido</label>
                <select
                  name="notificationHour"
                  defaultValue={profile?.notificationHour ?? 8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>

              <input type="hidden" name="notificationsEnabled" value={profile?.notificationsEnabled ? 'true' : 'false'} />
              <input type="hidden" name="name" value={profile?.name ?? ''} />
              <input type="hidden" name="userType" value={profile?.userType ?? 'woman'} />
              <input type="hidden" name="coupleObjective" value={profile?.coupleObjective ?? ''} />

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Salvar preferências
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Partner linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 size={18} className="text-rose-500" />
              Vincular parceiro(a)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                    {(partner.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{partner.name || 'Parceiro(a)'}</p>
                    <p className="text-xs text-green-700">Vinculado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  <Unlink size={15} />
                  Desvincular
                </button>
              </div>
            ) : (
              <form onSubmit={handleLink} className="space-y-3">
                <p className="text-xs text-gray-500">
                  Informe o e-mail do(a) seu(sua) parceiro(a) para vincular os perfis e receber notificações cruzadas.
                </p>
                <input
                  name="partnerEmail"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="email@parceiro.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                {partnerError && (
                  <p className="text-xs text-red-500">{partnerError}</p>
                )}
                <button
                  type="submit"
                  disabled={!partnerEmail}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Vincular parceiro(a)
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
