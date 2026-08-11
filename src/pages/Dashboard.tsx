import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getDashboardData } from '@/lib/application/use-cases/GetDashboardDataUseCase'
import { CycleStatusCard } from '@/components/cycle/CycleStatusCard'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CycleStatusBadge } from '@/components/ui/badge'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import type { CurrentStatusSummary } from '@/lib/domain/services/CycleStatusPresenter'
import type { InterpretedRecord, DailyRecord } from '@/lib/domain/entities/DailyRecord'

interface CoupleRequest {
  id: string
  requester_id: string
  requesterName: string
}

interface DashboardData {
  statusSummary: CurrentStatusSummary
  todayRecord: (DailyRecord & { cycleStatus: any; cycleDay: number; ruleApplied: string }) | null
  recentDays: InterpretedRecord[]
  today: string
}

export default function Dashboard() {
  const { profile, isMan, isLinked, dataUserId, loading: profileLoading } = useProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [coupleRequests, setCoupleRequests] = useState<CoupleRequest[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)

  useEffect(() => {
    if (profileLoading) return
    if (!dataUserId) { setLoading(false); return }
    const repository = new SupabaseDailyRecordRepository(supabase)
    getDashboardData(dataUserId, repository).then(result => {
      setData(result as DashboardData)
      setLoading(false)
    })
  }, [dataUserId, profileLoading])

  useEffect(() => {
    if (profileLoading || isLinked) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return
      const { data: requests } = await supabase
        .from('mob_couple_requests')
        .select('id, requester_id')
        .eq('target_email', session.user.email)
        .eq('status', 'pending')
      if (!requests?.length) return

      const ids = requests.map(r => r.requester_id)
      const { data: profiles } = await supabase
        .from('mob_user_profiles')
        .select('id, name')
        .in('id', ids)

      setCoupleRequests(requests.map(r => ({
        id: r.id,
        requester_id: r.requester_id,
        requesterName: profiles?.find(p => p.id === r.requester_id)?.name ?? 'Alguém',
      })))
    })
  }, [profileLoading, isLinked])

  async function handleAcceptRequest(req: CoupleRequest) {
    setRespondingId(req.id)
    // Roda no servidor (service role): além de criar o vínculo, migra os
    // registros que a pessoa já tinha feito sozinha para o conjunto
    // compartilhado do casal, o que exige mover dados entre duas contas
    // diferentes — algo que o RLS por usuário não permite fazer do client.
    const { error } = await supabase.functions.invoke('link-couple', {
      body: { requestId: req.id },
    })
    if (error) {
      setRespondingId(null)
      return
    }

    setCoupleRequests([])
    window.location.reload()
  }

  async function handleRejectRequest(id: string) {
    setRespondingId(id)
    await supabase.from('mob_couple_requests').update({ status: 'rejected' }).eq('id', id)
    setCoupleRequests(prev => prev.filter(r => r.id !== id))
    setRespondingId(null)
  }

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  if (!data) return null

  const { statusSummary, todayRecord, recentDays, today } = data

  return (
    <div className="space-y-5">

      {profile && (
        <NotificationPrompt userId={profile.id} notificationsEnabled={profile.notificationsEnabled} />
      )}

      {/* Solicitações de vínculo pendentes */}
      {coupleRequests.map(req => (
        <div key={req.id} className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <UserPlus size={18} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Solicitação de vínculo</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <strong>{req.requesterName}</strong> quer se vincular como seu parceiro(a) no Somos Billings.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleAcceptRequest(req)}
                disabled={respondingId === req.id}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                <Check size={13} /> Aceitar
              </button>
              <button
                onClick={() => handleRejectRequest(req.id)}
                disabled={respondingId === req.id}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium px-3 py-2 rounded-lg transition"
              >
                <X size={13} /> Recusar
              </button>
            </div>
          </div>
        </div>
      ))}

      <CycleStatusCard
        summary={statusSummary}
        showRegisterPrompt={!todayRecord}
        isMan={isMan}
        isLinked={isLinked}
      />

      {todayRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registro de hoje</CardTitle>
              {!isMan && (
                <Link to="/record" className="text-xs text-rose-600 font-medium hover:underline">
                  Editar
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <CycleStatusBadge status={todayRecord.cycleStatus} sensation={todayRecord.sensation} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Sensação</p>
                  <p className="font-medium text-gray-800">
                    {SENSATION_LABELS[todayRecord.sensation]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Aparência do muco</p>
                  <p className="font-medium text-gray-800">
                    {MUCUS_APPEARANCE_LABELS[todayRecord.mucusAppearance]}
                  </p>
                </div>
              </div>
              {todayRecord.notes && (
                <p className="text-sm text-gray-500 italic border-t border-gray-50 pt-3">
                  {todayRecord.notes}
                </p>
              )}
              <p className="text-[11px] text-gray-400">{todayRecord.ruleApplied}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <FertilityLegend />
        </CardContent>
      </Card>
    </div>
  )
}
