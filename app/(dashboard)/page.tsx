import { redirect } from 'next/navigation'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getDashboardData } from '@/lib/application/use-cases/GetDashboardDataUseCase'
import { CycleStatusCard } from '@/components/cycle/CycleStatusCard'
import { WeekStrip } from '@/components/cycle/WeekStrip'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CycleStatusBadge } from '@/components/ui/badge'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import Link from 'next/link'

export const runtime = 'edge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const repository = new SupabaseDailyRecordRepository(supabase)
  const { statusSummary, todayRecord, recentDays, today } = await getDashboardData(user.id, repository)

  return (
    <div className="space-y-5">
      {/* Status card */}
      <CycleStatusCard
        summary={statusSummary}
        showRegisterPrompt={!todayRecord}
      />

      {/* Today's record detail */}
      {todayRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Registro de hoje</CardTitle>
              <Link
                href="/registrar"
                className="text-xs text-rose-600 font-medium hover:underline"
              >
                Editar
              </Link>
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

      {/* Week strip */}
      {recentDays.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <WeekStrip recentDays={recentDays} today={today} />
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="pt-5">
          <FertilityLegend />
        </CardContent>
      </Card>
    </div>
  )
}
