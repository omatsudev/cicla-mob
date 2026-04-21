import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getMonthlyCalendar } from '@/lib/application/use-cases/GetMonthlyCalendarUseCase'
import { CycleCalendar } from '@/components/cycle/CycleCalendar'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent } from '@/components/ui/card'
import type { MonthlyCalendarData } from '@/lib/application/use-cases/GetMonthlyCalendarUseCase'

export default function Calendario() {
  const [searchParams] = useSearchParams()
  const now = new Date()
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : now.getFullYear()
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth() + 1

  const [calendarData, setCalendarData] = useState<MonthlyCalendarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const repository = new SupabaseDailyRecordRepository(supabase)
      const data = await getMonthlyCalendar(session.user.id, year, month, repository)
      setCalendarData(data)
      setLoading(false)
    })
  }, [year, month])

  if (loading) {
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
          Toque em um dia para ver os detalhes do registro.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <CycleCalendar data={calendarData} year={year} month={month} />
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
