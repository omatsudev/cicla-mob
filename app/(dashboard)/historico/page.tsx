import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'

import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getRecordHistory } from '@/lib/application/use-cases/GetRecordHistoryUseCase'
import { CycleStatusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import { ExportButton } from '@/app/(dashboard)/historico/ExportButton'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const repository = new SupabaseDailyRecordRepository(supabase)
  const { records, total } = await getRecordHistory(user.id, repository)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registros</p>
        </div>
        {total > 0 && <ExportButton />}
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Nenhum registro ainda.</p>
            <a
              href="/registrar"
              className="inline-block mt-4 text-rose-600 text-sm font-medium hover:underline"
            >
              Fazer primeiro registro →
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const dateFormatted = format(parseISO(record.date), "EEEE, d 'de' MMMM", { locale: ptBR })
            return (
              <Card key={record.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-400 capitalize">{dateFormatted}</p>
                        <p className="text-xs text-gray-400">Dia {record.cycleDay} do ciclo</p>
                      </div>
                      <CycleStatusBadge status={record.cycleStatus} />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>
                        <span className="font-medium">Sensação:</span>{' '}
                        {SENSATION_LABELS[record.sensation]}
                      </span>
                      {record.mucusAppearance !== 'nenhum' && (
                        <span>
                          <span className="font-medium">Muco:</span>{' '}
                          {MUCUS_APPEARANCE_LABELS[record.mucusAppearance]}
                        </span>
                      )}
                      {record.bleedingIntensity !== 'nenhum' && (
                        <span>
                          <span className="font-medium">Sangramento:</span>{' '}
                          {record.bleedingIntensity}
                        </span>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
