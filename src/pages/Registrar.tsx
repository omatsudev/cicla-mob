import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { DailyRecordForm } from '@/components/forms/DailyRecordForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useProfile } from '@/lib/context/ProfileContext'
import type { DailyRecord } from '@/lib/domain/entities/DailyRecord'

export default function Registrar() {
  const { dataUserId, loading: profileLoading } = useProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = format(new Date(), 'yyyy-MM-dd')
  const targetDate = searchParams.get('date') ?? today

  const [existingRecord, setExistingRecord] = useState<DailyRecord | undefined>(undefined)
  const [recordUserId, setRecordUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profileLoading) return
    setLoading(true)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const uid = dataUserId ?? session.user.id
      setRecordUserId(uid)
      const repository = new SupabaseDailyRecordRepository(supabase)
      const record = await repository.findByDate(uid, targetDate)
      setExistingRecord(record ?? undefined)
      setLoading(false)
    })
  }, [targetDate, dataUserId, profileLoading])

  const dateLabel = isToday(parseISO(targetDate))
    ? 'Hoje'
    : format(parseISO(targetDate), "d 'de' MMMM", { locale: ptBR })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {existingRecord ? 'Editar registro' : 'Novo registro'}
          </h1>
          <p className="text-sm text-rose-600 font-medium mt-0.5">{dateLabel}</p>
        </div>
        <input
          type="date"
          value={targetDate}
          max={today}
          onChange={e => setSearchParams({ date: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observação diária</CardTitle>
          <CardDescription>
            Anote a sensação mais próxima da fertilidade observada durante o dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordUserId && (
            <DailyRecordForm
              defaultDate={targetDate}
              existingRecord={existingRecord}
              userId={recordUserId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
