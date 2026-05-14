import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Heart, Link2, Unlink, LogOut, Copy, Check } from 'lucide-react'
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
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [requestEmail, setRequestEmail] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [pendingSent, setPendingSent] = useState<{ id: string; target_email: string }[]>([])

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

      const { data: sent } = await supabase
        .from('mob_couple_requests')
        .select('id, target_email')
        .eq('requester_id', user.id)
        .eq('status', 'pending')
      setPendingSent(sent ?? [])
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

  async function handleGenerateInvite() {
    setInviteLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase
      .from('mob_invites')
      .insert({ inviter_id: session.user.id })
      .select('token')
      .single()
    if (data?.token) {
      setInviteLink(`${window.location.origin}/convite?token=${data.token}`)
    }
    setInviteLoading(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSendRequest() {
    if (!requestEmail.trim()) return
    setRequestLoading(true)
    setRequestError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    if (requestEmail.toLowerCase() === email.toLowerCase()) {
      setRequestError('Você não pode se vincular consigo mesmo.')
      setRequestLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('mob_couple_requests')
      .insert({ requester_id: session.user.id, target_email: requestEmail.toLowerCase().trim() })
      .select('id, target_email')
      .single()

    if (error) {
      setRequestError('Erro ao enviar solicitação. Tente novamente.')
    } else {
      setPendingSent(prev => [...prev, data])
      setRequestEmail('')
      setRequestSent(true)
      setTimeout(() => setRequestSent(false), 3000)
    }
    setRequestLoading(false)
  }

  async function handleCancelRequest(id: string) {
    await supabase.from('mob_couple_requests').delete().eq('id', id)
    setPendingSent(prev => prev.filter(r => r.id !== id))
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

        {/* Logout */}
        <button
          type="button"
          onClick={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm hover:bg-gray-50 transition"
        >
          <LogOut size={16} />
          Sair da conta
        </button>

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
              <div className="space-y-4">

                {/* Solicitar por e-mail */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Solicitar vínculo por e-mail</p>
                  <p className="text-xs text-gray-500">
                    Se seu parceiro(a) já tem conta, insira o e-mail dele(a). Ele(a) receberá uma notificação para aceitar.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={requestEmail}
                      onChange={e => setRequestEmail(e.target.value)}
                      placeholder="email@parceiro.com"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                    <button
                      type="button"
                      onClick={handleSendRequest}
                      disabled={requestLoading || !requestEmail.trim()}
                      className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                    >
                      {requestLoading ? '...' : 'Enviar'}
                    </button>
                  </div>
                  {requestSent && <p className="text-xs text-green-600">✓ Solicitação enviada!</p>}
                  {requestError && <p className="text-xs text-red-500">{requestError}</p>}
                </div>

                {/* Solicitações pendentes enviadas */}
                {pendingSent.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">Aguardando resposta</p>
                    {pendingSent.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-700 truncate">{r.target_email}</p>
                        <button
                          type="button"
                          onClick={() => handleCancelRequest(r.id)}
                          className="text-xs text-gray-400 hover:text-red-500 ml-2 shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">Convidar parceiro(a) sem conta</p>
                  <p className="text-xs text-gray-500">
                    Gere um link de convite. Ao clicar, ele(a) cria a conta e o vínculo é feito automaticamente.
                  </p>
                  {inviteLink ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                        <p className="text-xs text-gray-600 flex-1 truncate">{inviteLink}</p>
                        <button type="button" onClick={handleCopy} className="shrink-0 text-rose-600">
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">Válido por 7 dias e de uso único.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateInvite}
                      disabled={inviteLoading}
                      className="w-full bg-white border border-rose-300 hover:bg-rose-50 disabled:opacity-60 text-rose-600 font-semibold py-2.5 rounded-xl transition text-sm"
                    >
                      {inviteLoading ? 'Gerando...' : 'Gerar link de convite'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
