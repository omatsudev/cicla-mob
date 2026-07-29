import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, X, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getRecordHistory } from '@/lib/application/use-cases/GetRecordHistoryUseCase'
import { getAllCycles } from '@/lib/application/use-cases/GetAllCyclesUseCase'
import { CyclePrintView } from '@/components/cycle/CyclePrintView'
import { exportCyclePdf } from '@/lib/utils/exportCyclePdf'
import { CycleStatusBadge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import { cn } from '@/lib/utils/cn'
import type { InterpretedRecord } from '@/lib/domain/entities/DailyRecord'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'

export default function History() {
  const { dataUserId, loading: profileLoading } = useProfile()
  const [records, setRecords] = useState<InterpretedRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showExport, setShowExport] = useState(false)
  const [allCycles, setAllCycles] = useState<CycleCalendarData[]>([])
  const [allCycleNames, setAllCycleNames] = useState<Record<string, string>>({})
  const [fromCycle, setFromCycle] = useState(1)
  const [toCycle, setToCycle] = useState(1)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [exportLoading, setExportLoading] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [cyclesToPrint, setCyclesToPrint] = useState<CycleCalendarData[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profileLoading || !dataUserId) return
    const repository = new SupabaseDailyRecordRepository(supabase)
    getRecordHistory(dataUserId, repository).then(result => {
      setRecords(result.records as InterpretedRecord[])
      setTotal(result.total)
      setLoading(false)
    })
  }, [dataUserId, profileLoading])

  async function openExport() {
    if (!dataUserId) return
    setExportLoading(true)
    setShowExport(true)
    const repository = new SupabaseDailyRecordRepository(supabase)
    const cycles = await getAllCycles(dataUserId, repository)
    setAllCycles(cycles)

    const startDates = cycles.map(c => c.startDate).filter(Boolean) as string[]
    const names: Record<string, string> = {}
    if (startDates.length > 0) {
      const { data: rows } = await supabase
        .from('mob_cycle_names')
        .select('cycle_start, name')
        .eq('user_id', dataUserId)
        .in('cycle_start', startDates)
      rows?.forEach((r: { cycle_start: string; name: string }) => {
        names[r.cycle_start] = r.name
      })
    }
    setAllCycleNames(names)
    setFromCycle(1)
    setToCycle(cycles.length)
    setExcluded(new Set())
    setExportLoading(false)
  }

  const rangeInView = allCycles.filter(c => c.cycleNumber >= fromCycle && c.cycleNumber <= toCycle)
  const selected = rangeInView.filter(c => !excluded.has(c.cycleNumber))

  function toggleExclude(num: number) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })
  }

  function handlePrint() {
    setCyclesToPrint(selected)
    setGeneratingPdf(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (printRef.current) {
          await exportCyclePdf(printRef.current, 'grafico-ciclo-menstrual.pdf')
        }
        setGeneratingPdf(false)
        setShowExport(false)
      })
    })
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
            onClick={openExport}
            className="flex items-center gap-1.5 text-xs text-rose-600 border border-rose-200 rounded-xl px-3 py-2 hover:bg-rose-50 transition"
          >
            <Download size={14} />
            Baixar PDF
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Nenhum registro ainda.</p>
            <a
              href="/record"
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

      {/* PDF export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-0">
          <div className="bg-white w-full max-w-lg rounded-t-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Baixar PDF</h2>
                <p className="text-xs text-gray-500 mt-0.5">2 ciclos por página, formato WOOMB</p>
              </div>
              <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {exportLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin w-7 h-7 border-4 border-rose-200 border-t-rose-500 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Intervalo de ciclos</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">De:</label>
                        <select
                          value={fromCycle}
                          onChange={e => {
                            const v = Number(e.target.value)
                            setFromCycle(v)
                            if (v > toCycle) setToCycle(v)
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          {allCycles.map(c => (
                            <option key={c.cycleNumber} value={c.cycleNumber}>Ciclo {c.cycleNumber}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Até:</label>
                        <select
                          value={toCycle}
                          onChange={e => setToCycle(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          {allCycles.filter(c => c.cycleNumber >= fromCycle).map(c => (
                            <option key={c.cycleNumber} value={c.cycleNumber}>Ciclo {c.cycleNumber}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Ciclos no intervalo{' '}
                      <span className="font-normal text-gray-400">({selected.length} selecionado{selected.length !== 1 ? 's' : ''})</span>
                    </p>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {rangeInView.map(c => {
                        const name = c.startDate ? (allCycleNames[c.startDate] ?? '') : ''
                        const displayName = name || `Ciclo ${c.cycleNumber}`
                        const isExcluded = excluded.has(c.cycleNumber)
                        return (
                          <label key={c.cycleNumber} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={() => toggleExclude(c.cycleNumber)}
                              className="w-4 h-4 accent-rose-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium truncate', isExcluded ? 'text-gray-300' : 'text-gray-800')}>
                                {displayName}
                              </p>
                              {c.startDate && (
                                <p className={cn('text-xs', isExcluded ? 'text-gray-200' : 'text-gray-400')}>
                                  Início: {c.startDate}
                                </p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handlePrint}
                disabled={selected.length === 0 || exportLoading || generatingPdf}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition"
              >
                <Printer size={16} />
                {generatingPdf ? 'Gerando PDF...' : `Baixar PDF (${selected.length} ciclo${selected.length !== 1 ? 's' : ''})`}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Sempre em paisagem, igual em qualquer dispositivo
              </p>
            </div>
          </div>
        </div>
      )}

      <CyclePrintView ref={printRef} cycles={cyclesToPrint} cycleNames={allCycleNames} />
    </div>
  )
}
