import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getDashboardData } from '@/lib/application/use-cases/GetDashboardDataUseCase'
import { CycleStatusCard } from '@/components/cycle/CycleStatusCard'
import { WeekStrip } from '@/components/cycle/WeekStrip'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CycleStatusBadge } from '@/components/ui/badge'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import type { CurrentStatusSummary } from '@/lib/domain/services/CycleStatusPresenter'
import type { InterpretedRecord, DailyRecord } from '@/lib/domain/entities/DailyRecord'

interface DashboardData {
  statusSummary: CurrentStatusSummary
  todayRecord: (DailyRecord & { cycleStatus: any; cycleDay: number; ruleApplied: string }) | null
  recentDays: InterpretedRecord[]
  today: string
}

export default function Dashboard() {
  const { isMan, isLinked, dataUserId, loading: profileLoading } = useProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading) return
    if (!dataUserId) { setLoading(false); return }
    const repository = new SupabaseDailyRecordRepository(supabase)
    getDashboardData(dataUserId, repository).then(result => {
      setData(result as DashboardData)
      setLoading(false)
    })
  }, [dataUserId, profileLoading])

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  if (isMan && !isLinked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4">
        <p className="text-4xl">👤</p>
        <h2 className="text-lg font-semibold text-gray-800">Conta não vinculada</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Peça para sua esposa adicionar o seu e-mail no perfil dela em{' '}
          <strong>Perfil → Vincular parceiro(a)</strong>.
        </p>
        <a href="/perfil" className="text-sm text-rose-600 font-medium hover:underline">
          Ir para o perfil
        </a>
      </div>
    )
  }

  if (!data) return null

  const { statusSummary, todayRecord, recentDays, today } = data

  return (
    <div className="space-y-5">
      <CycleStatusCard
        summary={statusSummary}
        showRegisterPrompt={!todayRecord}
        isMan={isMan}
      />

      {todayRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registro de hoje</CardTitle>
              {!isMan && (
                <Link to="/registrar" className="text-xs text-rose-600 font-medium hover:underline">
                  Editar
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <CycleStatusBadge status={todayRecord.cycleStatus} />
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

      {recentDays.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <WeekStrip recentDays={recentDays} today={today} />
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
