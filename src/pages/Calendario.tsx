import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getCycleCalendar } from '@/lib/application/use-cases/GetCycleCalendarUseCase'
import { CycleChartView } from '@/components/cycle/CycleChartView'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent } from '@/components/ui/card'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'

export default function Calendario() {
  const { dataUserId, isMan, loading: profileLoading } = useProfile()
  const [cycleIndex, setCycleIndex] = useState(0) // 0 = most recent
  const [calendarData, setCalendarData] = useState<CycleCalendarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !dataUserId) return
    setLoading(true)
    const repository = new SupabaseDailyRecordRepository(supabase)
    getCycleCalendar(dataUserId, cycleIndex, repository).then(data => {
      setCalendarData(data)
      setLoading(false)
    })
  }, [dataUserId, profileLoading, cycleIndex])

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  if (!calendarData) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Calendário</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dias numerados a partir do 1° dia da menstruação.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <CycleChartView
            data={calendarData}
            isMan={isMan}
            onNavigate={setCycleIndex}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <FertilityLegend />
        </CardContent>
      </Card>
    </div>
  )
}
