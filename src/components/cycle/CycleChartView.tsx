import { useState, useRef, useEffect } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'

const CELL_W = 48 // px per column

interface Props {
  data: CycleCalendarData
  isMan: boolean
  onNavigate: (newIndex: number) => void
}

export function CycleChartView({ data, isMan, onNavigate }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Find next day to mark: first day with no record whose date ≤ today (or today itself)
  const nextDayToMark = data.days.find(d => {
    if (d.record) return false
    if (!d.date) {
      // Day hasn't happened yet — compute expected date from startDate
      if (!data.startDate) return false
      const expected = format(addDays(parseISO(data.startDate), d.cycleDay - 1), 'yyyy-MM-dd')
      return expected <= today
    }
    return d.date <= today
  })

  // Scroll so that nextDayToMark (or today) is visible, roughly centered-right
  useEffect(() => {
    if (!scrollRef.current) return
    const targetDay = nextDayToMark?.cycleDay ?? data.days.find(d => d.isToday)?.cycleDay
    if (targetDay) {
      const containerWidth = scrollRef.current.clientWidth
      const targetScroll = (targetDay - 1) * CELL_W - containerWidth + CELL_W * 2
      scrollRef.current.scrollLeft = Math.max(0, targetScroll)
    }
    setSelectedDay(null)
  }, [data.cycleIndex, data.startDate])

  const selectedDayData = selectedDay !== null ? data.days[selectedDay - 1] : null
  const cycleLabel = data.totalCycles === 0 ? 'Sem ciclos' : `Ciclo ${data.cycleNumber}`
  const startLabel = data.startDate
    ? format(parseISO(data.startDate), "d 'de' MMMM", { locale: ptBR })
    : ''

  return (
    <div className="space-y-4">
      {/* Cycle navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate(data.cycleIndex + 1)}
          disabled={data.cycleIndex >= data.totalCycles - 1}
          className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-30"
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
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {data.totalCycles === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum ciclo registrado ainda.</div>
      ) : (
        <>
          {/* Horizontal scroll strip */}
          <div
            ref={scrollRef}
            className="overflow-x-auto -mx-2 px-2 pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
              {data.days.map((day) => {
                const status = day.record?.cycleStatus ?? null
                const info = status ? CYCLE_STATUS_DISPLAY[status] : null
                const isSelected = selectedDay === day.cycleDay
                const isNextToMark = !isMan && nextDayToMark?.cycleDay === day.cycleDay

                // Compute expected date even if record doesn't exist yet
                const expectedDate = data.startDate
                  ? format(addDays(parseISO(data.startDate), day.cycleDay - 1), 'yyyy-MM-dd')
                  : day.date

                const dateLabel = (day.date ?? expectedDate)
                  ? format(parseISO((day.date ?? expectedDate)!), 'dd/MM')
                  : ''

                return (
                  <button
                    key={day.cycleDay}
                    onClick={() => setSelectedDay(isSelected ? null : day.cycleDay)}
                    className={cn(
                      'flex flex-col items-center rounded-xl border transition active:scale-95 pt-1.5 pb-1 gap-1',
                      'focus:outline-none',
                      isSelected && 'ring-2 ring-blue-400 ring-offset-1',
                      day.isToday && !isSelected && 'ring-2 ring-rose-400 ring-offset-1',
                      isNextToMark
                        ? 'border-rose-300 bg-rose-50 w-14'
                        : info
                          ? cn('border', info.borderColor, info.bgColor, 'w-12')
                          : 'border-gray-200 bg-gray-100 w-12',
                    )}
                    style={{ minWidth: isNextToMark ? 56 : CELL_W }}
                  >
                    {/* Day number */}
                    <span className={cn(
                      'text-[10px] font-bold leading-none',
                      info ? info.textColor : isNextToMark ? 'text-rose-500' : 'text-gray-300',
                    )}>
                      {String(day.cycleDay).padStart(2, '0')}
                    </span>

                    {/* Symbol or + button */}
                    {isNextToMark ? (
                      <Link
                        to={`/registrar?date=${expectedDate ?? today}`}
                        onClick={e => e.stopPropagation()}
                        className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
                      >
                        <Plus size={18} />
                      </Link>
                    ) : (
                      <div className={cn(
                        'w-10 h-10 rounded-lg border flex items-center justify-center',
                        info ? cn(info.bgColor, info.borderColor) : 'bg-gray-100 border-gray-200',
                      )}>
                        <span className={cn(
                          'text-[13px] font-bold',
                          info ? info.textColor : 'text-gray-300',
                        )}>
                          {info?.symbol ?? '·'}
                        </span>
                      </div>
                    )}

                    {/* Date */}
                    <span className={cn(
                      'text-[9px] leading-none',
                      isNextToMark ? 'text-rose-400 font-medium' : info ? info.textColor + ' opacity-70' : 'text-gray-300',
                    )}>
                      {dateLabel}
                    </span>
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
                      {format(parseISO(selectedDayData.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-400 hover:text-gray-600 p-1">
                  ✕
                </button>
              </div>

              {selectedDayData.record ? (
                <div className="space-y-2">
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
                    <div><span className="font-medium">Sensação: </span>{SENSATION_LABELS[selectedDayData.record.sensation]}</div>
                    <div><span className="font-medium">Muco: </span>{MUCUS_APPEARANCE_LABELS[selectedDayData.record.mucusAppearance]}</div>
                  </div>
                  {selectedDayData.record.notes && (
                    <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">{selectedDayData.record.notes}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-gray-400">{selectedDayData.record.ruleApplied}</p>
                    {!isMan && (
                      <Link to={`/registrar?date=${selectedDayData.date}`} className="text-xs text-rose-600 font-medium hover:underline">
                        Editar
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Sem registro para este dia.</p>
                  {!isMan && selectedDayData.date && (
                    <Link to={`/registrar?date=${selectedDayData.date}`} className="text-xs text-rose-600 font-medium hover:underline">
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
