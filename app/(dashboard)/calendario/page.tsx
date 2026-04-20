import { redirect } from 'next/navigation'
import { createClient } from '@/lib/infrastructure/supabase/server'

export const runtime = 'edge'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getMonthlyCalendar } from '@/lib/application/use-cases/GetMonthlyCalendarUseCase'
import { CycleCalendar } from '@/components/cycle/CycleCalendar'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { Card, CardContent } from '@/components/ui/card'

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  const repository = new SupabaseDailyRecordRepository(supabase)
  const calendarData = await getMonthlyCalendar(user.id, year, month, repository)

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
