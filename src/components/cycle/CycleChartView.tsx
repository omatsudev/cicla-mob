import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'

interface Props {
  data: CycleCalendarData
  isMan: boolean
  onNavigate: (newIndex: number) => void
}

export function CycleChartView({ data, isMan, onNavigate }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // scroll to today's position on mount / cycle change
  useEffect(() => {
    const todayDay = data.days.find(d => d.isToday)?.cycleDay
    const target = todayDay ?? data.days.filter(d => d.record !== null).length
    if (scrollRef.current && target > 0) {
      const cellWidth = 44
      const scroll = Math.max(0, (target - 3) * cellWidth)
      scrollRef.current.scrollLeft = scroll
    }
    setSelectedDay(null)
  }, [data.cycleIndex])

  const selectedDayData = selectedDay !== null ? data.days[selectedDay - 1] : null

  const cycleLabel = data.totalCycles === 0
    ? 'Sem ciclos'
    : `Ciclo ${data.cycleNumber}`

  const startLabel = data.startDate
    ? format(parseISO(data.startDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  return (
    <div className="space-y-4">
      {/* Header — cycle navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate(data.cycleIndex + 1)}
          disabled={data.cycleIndex >= data.totalCycles - 1}
          className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-30"
          aria-label="Ciclo anterior"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold text-gray-800">{cycleLabel}</p>
          {startLabel && (
            <p className="text-xs text-gray-400 capitalize mt-0.5">Início: {startLabel}</p>
          )}
        </div>

        <button
          onClick={() => onNavigate(data.cycleIndex - 1)}
          disabled={data.cycleIndex <= 0}
          className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-30"
          aria-label="Próximo ciclo"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {data.totalCycles === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Nenhum ciclo registrado ainda.
        </div>
      ) : (
        <>
          {/* Horizontal scrollable day strip */}
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
              {data.days.map((day) => {
                const info = day.record ? CYCLE_STATUS_DISPLAY[day.record.cycleStatus] : null
                const isEmpty = !day.record
                const isSelected = selectedDay === day.cycleDay

                return (
                  <button
                    key={day.cycleDay}
                    onClick={() => setSelectedDay(isSelected ? null : day.cycleDay)}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-lg border transition active:scale-95 py-1.5 px-0',
                      'w-10 min-w-[40px]',
                      day.isToday && 'ring-2 ring-rose-500 ring-offset-1',
                      isSelected && 'ring-2 ring-blue-400 ring-offset-1',
                      info
                        ? cn(info.bgColor, info.borderColor)
                        : 'bg-gray-50 border-gray-200',
                    )}
                  >
                    {/* Cycle day number */}
                    <span className={cn(
                      'text-[10px] font-bold leading-none',
                      info ? info.textColor : 'text-gray-300',
                    )}>
                      {String(day.cycleDay).padStart(2, '0')}
                    </span>

                    {/* WOOMB symbol */}
                    <span className={cn(
                      'text-[11px] font-bold leading-none mt-1',
                      info ? info.textColor : 'text-gray-200',
                    )}>
                      {isEmpty ? '·' : info?.symbol ?? '·'}
                    </span>

                    {/* Today marker */}
                    {day.isToday && (
                      <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDayData && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Dia {String(selectedDayData.cycleDay).padStart(2, '0')} do ciclo
                  </p>
                  {selectedDayData.date && (
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {format(parseISO(selectedDayData.date), "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedDayData.record ? (
                <div className="space-y-2">
                  {/* Status badge */}
                  {(() => {
                    const info = CYCLE_STATUS_DISPLAY[selectedDayData.record.cycleStatus]
                    return (
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
                        info.bgColor, info.textColor, info.borderColor,
                      )}>
                        {info.symbol} {info.label}
                      </span>
                    )
                  })()}

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Sensação: </span>
                      {SENSATION_LABELS[selectedDayData.record.sensation]}
                    </div>
                    <div>
                      <span className="font-medium">Muco: </span>
                      {MUCUS_APPEARANCE_LABELS[selectedDayData.record.mucusAppearance]}
                    </div>
                  </div>

                  {selectedDayData.record.notes && (
                    <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">
                      {selectedDayData.record.notes}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">{selectedDayData.record.ruleApplied}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Sem registro para este dia.</p>
                  {!isMan && selectedDayData.date && (
                    <Link
                      to={`/registrar?date=${selectedDayData.date}`}
                      className="text-xs text-rose-600 font-medium hover:underline"
                    >
                      Registrar
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
