import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getRecordHistory } from '@/lib/application/use-cases/GetRecordHistoryUseCase'
import { CycleStatusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { InterpretedRecord } from '@/lib/domain/entities/DailyRecord'

export default function Historico() {
  const { dataUserId, loading: profileLoading } = useProfile()
  const [records, setRecords] = useState<InterpretedRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (profileLoading || !dataUserId) return
    const repository = new SupabaseDailyRecordRepository(supabase)
    getRecordHistory(dataUserId, repository).then(result => {
      setRecords(result.records as InterpretedRecord[])
      setTotal(result.total)
      setLoading(false)
    })
  }, [dataUserId, profileLoading])

  async function handleExport() {
    setIsExporting(true)
    const header = 'Data,Sensação,Aparência do Muco,Sangramento,Status,Dia do Ciclo,Observações'
    const rows = records.map((r) =>
      [
        r.date,
        SENSATION_LABELS[r.sensation],
        MUCUS_APPEARANCE_LABELS[r.mucusAppearance],
        r.bleedingIntensity,
        CYCLE_STATUS_DISPLAY[r.cycleStatus].label,
        r.cycleDay,
        `"${r.notes.replace(/"/g, '""')}"`,
      ].join(','),
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cicla-mob-historico-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setIsExporting(false)
  }

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
          <h1 className="text-xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registros</p>
        </div>
        {total > 0 && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-xs text-rose-600 border border-rose-200 rounded-xl px-3 py-2 hover:bg-rose-50 transition disabled:opacity-60"
          >
            <Download size={14} />
            {isExporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        )}
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
