import { useState } from 'react'
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

// Cell background/text for each status (overrides for fertile=white, empty=gray)
function getCellStyle(status: string | null): { bg: string; text: string; border: string } {
  if (!status) return { bg: 'bg-gray-100', text: 'text-gray-300', border: 'border-gray-200' }

  const info = CYCLE_STATUS_DISPLAY[status as keyof typeof CYCLE_STATUS_DISPLAY]
  return { bg: info.bgColor, text: info.textColor, border: info.borderColor }
}

export function CycleChartView({ data, isMan, onNavigate }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const selectedDayData = selectedDay !== null ? data.days[selectedDay - 1] : null

  const cycleLabel = data.totalCycles === 0 ? 'Sem ciclos' : `Ciclo ${data.cycleNumber}`
  const startLabel = data.startDate
    ? format(parseISO(data.startDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  return (
    <div className="space-y-4">
      {/* Cycle navigation header */}
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
          {/* Column headers */}
          <div className="grid grid-cols-[32px_40px_1fr_56px] gap-x-2 px-1 pb-1 border-b border-gray-100">
            <span className="text-[10px] text-gray-400 font-medium text-center">Dia</span>
            <span className="text-[10px] text-gray-400 font-medium text-center">Símbolo</span>
            <span className="text-[10px] text-gray-400 font-medium">Observação</span>
            <span className="text-[10px] text-gray-400 font-medium text-right">Data</span>
          </div>

          {/* Day rows */}
          <div className="space-y-0.5">
            {data.days.map((day) => {
              const status = day.record?.cycleStatus ?? null
              const info = status ? CYCLE_STATUS_DISPLAY[status] : null
              const cell = getCellStyle(status)
              const isSelected = selectedDay === day.cycleDay

              const sensationLabel = day.record
                ? SENSATION_LABELS[day.record.sensation]
                : null

              const mucusLabel = day.record && day.record.mucusAppearance !== 'nenhum'
                ? MUCUS_APPEARANCE_LABELS[day.record.mucusAppearance]
                : null

              const descriptionText = sensationLabel
                ? mucusLabel
                  ? `${sensationLabel} · ${mucusLabel}`
                  : sensationLabel
                : null

              return (
                <button
                  key={day.cycleDay}
                  onClick={() => setSelectedDay(isSelected ? null : day.cycleDay)}
                  className={cn(
                    'w-full grid grid-cols-[32px_40px_1fr_56px] gap-x-2 items-center px-1 py-1 rounded-lg transition text-left',
                    day.isToday && 'ring-1 ring-rose-400',
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
                  )}
                >
                  {/* Day number */}
                  <span className="text-xs font-bold text-gray-500 text-center">
                    {String(day.cycleDay).padStart(2, '0')}
                  </span>

                  {/* Colored symbol cell */}
                  <div className={cn(
                    'h-7 rounded-md border flex items-center justify-center',
                    cell.bg, cell.border,
                  )}>
                    <span className={cn('text-[11px] font-bold', cell.text)}>
                      {info?.symbol ?? '·'}
                    </span>
                  </div>

                  {/* Description */}
                  <span className={cn(
                    'text-xs truncate',
                    day.record ? 'text-gray-700' : 'text-gray-300',
                  )}>
                    {descriptionText ?? (day.date ? '—' : '')}
                  </span>

                  {/* Date */}
                  <span className={cn(
                    'text-[10px] text-right',
                    day.date ? 'text-gray-400' : 'text-gray-200',
                  )}>
                    {day.date
                      ? format(parseISO(day.date), 'dd/MM', { locale: ptBR })
                      : ''}
                  </span>
                </button>
              )
            })}
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
                <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-400 hover:text-gray-600">
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
