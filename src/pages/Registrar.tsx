import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { DailyRecordForm } from '@/components/forms/DailyRecordForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { DailyRecord } from '@/lib/domain/entities/DailyRecord'

export default function Registrar() {
  const [searchParams] = useSearchParams()
  const today = format(new Date(), 'yyyy-MM-dd')
  const targetDate = searchParams.get('date') ?? today

  const [existingRecord, setExistingRecord] = useState<DailyRecord | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const repository = new SupabaseDailyRecordRepository(supabase)
      const record = await repository.findByDate(session.user.id, targetDate)
      setExistingRecord(record ?? undefined)
      setLoading(false)
    })
  }, [targetDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {existingRecord ? 'Editar registro' : 'Novo registro'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Registre o que você sentiu e observou hoje na vulva.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observação diária</CardTitle>
          <CardDescription>
            Anote a sensação mais próxima da fertilidade observada durante o dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyRecordForm
            defaultDate={today}
            existingRecord={existingRecord}
          />
        </CardContent>
      </Card>
    </div>
  )
}
