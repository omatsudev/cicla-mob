import { useState, useEffect, useCallback } from 'react'
import { Download, X, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/context/ProfileContext'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getCycleCalendar } from '@/lib/application/use-cases/GetCycleCalendarUseCase'
import { getAllCycles } from '@/lib/application/use-cases/GetAllCyclesUseCase'
import { CycleChartView } from '@/components/cycle/CycleChartView'
import { FertilityLegend } from '@/components/cycle/FertilityLegend'
import { CyclePrintView } from '@/components/cycle/CyclePrintView'
import { Card, CardContent } from '@/components/ui/card'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'
import { cn } from '@/lib/utils/cn'

export default function Calendario() {
  const { dataUserId, isMan, loading: profileLoading } = useProfile()
  const [cycleIndex, setCycleIndex] = useState(0)
  const [calendarData, setCalendarData] = useState<CycleCalendarData | null>(null)
  const [cycleName, setCycleName] = useState('')
  const [loading, setLoading] = useState(true)

  // PDF export state
  const [showExport, setShowExport] = useState(false)
  const [allCycles, setAllCycles] = useState<CycleCalendarData[]>([])
  const [allCycleNames, setAllCycleNames] = useState<Record<string, string>>({})
  const [fromCycle, setFromCycle] = useState(1)
  const [toCycle, setToCycle] = useState(1)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [exportLoading, setExportLoading] = useState(false)
  const [printReady, setPrintReady] = useState(false)
  const [cyclesToPrint, setCyclesToPrint] = useState<CycleCalendarData[]>([])

  useEffect(() => {
    if (profileLoading || !dataUserId) return
    setLoading(true)
    const repository = new SupabaseDailyRecordRepository(supabase)
    getCycleCalendar(dataUserId, cycleIndex, repository).then(async data => {
      setCalendarData(data)
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

  async function openExport() {
    if (!dataUserId) return
    setExportLoading(true)
    setShowExport(true)
    const repository = new SupabaseDailyRecordRepository(supabase)
    const cycles = await getAllCycles(dataUserId, repository)
    setAllCycles(cycles)

    // Load all cycle names
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

  const rangeInView = allCycles.filter(c =>
    c.cycleNumber >= fromCycle && c.cycleNumber <= toCycle
  )
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
    setPrintReady(true)
    setTimeout(() => {
      window.print()
      setPrintReady(false)
    }, 400)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ciclos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dias numerados a partir do 1° dia da menstruação.
          </p>
        </div>
        {calendarData.totalCycles > 0 && (
          <button
            onClick={openExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition shrink-0"
          >
            <Download size={14} />
            PDF
          </button>
        )}
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

      {/* PDF export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-0">
          <div className="bg-white w-full max-w-lg rounded-t-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Exportar para PDF</h2>
                <p className="text-xs text-gray-500 mt-0.5">3 ciclos por página, formato WOOMB</p>
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
                  {/* Range selector */}
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

                  {/* Cycle list with checkboxes */}
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

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handlePrint}
                disabled={selected.length === 0 || exportLoading}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition"
              >
                <Printer size={16} />
                Baixar PDF ({selected.length} ciclo{selected.length !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print view (hidden on screen, shown only on print) */}
      {printReady && (
        <CyclePrintView cycles={cyclesToPrint} cycleNames={allCycleNames} />
      )}
    </div>
  )
}
