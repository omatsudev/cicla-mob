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
  const [cycleIndex, setCycleIndex] = useState(0)
  const [calendarData, setCalendarData] = useState<CycleCalendarData | null>(null)
  const [cycleName, setCycleName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading || !dataUserId) return
    setLoading(true)
    const repository = new SupabaseDailyRecordRepository(supabase)
    getCycleCalendar(dataUserId, cycleIndex, repository).then(async data => {
      setCalendarData(data)
      // Load custom name for this cycle
      if (data.startDate) {
        const { data: row } = await supabase
          .from('mob_cycle_names')
          .select('name')
          .eq('user_id', dataUserId)
          .eq('cycle_start', data.startDate)
          .maybeSingle()
        setCycleName(row?.name ?? '')
      } else {
        setCycleName('')
      }
      setLoading(false)
    })
  }, [dataUserId, profileLoading, cycleIndex])

  async function handleNameSave(name: string) {
    if (!dataUserId || !calendarData?.startDate) return
    setCycleName(name)
    if (name.trim()) {
      await supabase.from('mob_cycle_names').upsert({
        user_id: dataUserId,
        cycle_start: calendarData.startDate,
        name: name.trim(),
      }, { onConflict: 'user_id,cycle_start' })
    } else {
      await supabase.from('mob_cycle_names')
        .delete()
        .eq('user_id', dataUserId)
        .eq('cycle_start', calendarData.startDate)
    }
  }

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
            cycleName={cycleName}
            onNavigate={setCycleIndex}
            onNameSave={!isMan ? handleNameSave : undefined}
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
