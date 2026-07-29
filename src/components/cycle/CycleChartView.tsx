import { useState, useRef, useEffect } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Pencil, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'
import { CycleSymbol } from './CycleSymbol'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'

const MOB_RULE: Record<CycleStatus, string> = {
  menstruacao: 'R1',
  mancha:      'R3',
  pbi_seco:    'R2',
  pbi_muco:    'R2',
  mudanca:     '',
  fertil:      '',
  apice:       'A',
  pos_apice_1: '1',
  pos_apice_2: '2',
  pos_apice_3: '3',
  infertil_pos_apice: 'RA',
}

const POST_APICE_STATUSES = new Set<CycleStatus>(['pos_apice_1', 'pos_apice_2', 'pos_apice_3', 'infertil_pos_apice'])
const POST_APICE_DAY: Partial<Record<CycleStatus, string>> = {
  pos_apice_1: '1', pos_apice_2: '2', pos_apice_3: '3',
}

function getPostApiceStyle(sensation: string) {
  if (sensation === 'seca') {
    return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', symbol: '|' }
  }
  return { bg: 'bg-yellow-300', text: 'text-gray-800', border: 'border-yellow-400', symbol: '=' }
}

// Row heights (must match between label col and day cols)
const ROW = {
  diaCiclo: 'h-6',
  simbolo:  'h-9',
  diaMes:   'h-5',
  sensacao: 'h-24',
  regra:    'h-6',
  relacao:  'h-5',
}

const LABEL_W = 'w-[68px] min-w-[68px]'
const COL_W   = 'w-9 min-w-[36px]'

interface Props {
  data: CycleCalendarData
  isMan: boolean
  cycleName?: string
  onNavigate: (newIndex: number) => void
  onNameSave?: (name: string) => void
}

export function CycleChartView({ data, isMan, cycleName = '', onNavigate, onNameSave }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0, moved: false })
  const today = format(new Date(), 'yyyy-MM-dd')

  function startEditing() {
    setNameInput(cycleName)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  function saveName() {
    setEditingName(false)
    onNameSave?.(nameInput)
  }

  // First unmarked day whose expected date ≤ today
  const nextDayToMark = !isMan ? data.days.find(d => {
    if (d.record) return false
    const expected = data.startDate
      ? format(addDays(parseISO(data.startDate), d.cycleDay - 1), 'yyyy-MM-dd')
      : null
    return (expected ?? d.date ?? '') <= today
  }) : undefined

  // Auto-scroll so today is the last visible column (right edge)
  useEffect(() => {
    const todayCycleDay = data.days.find(d => d.isToday)?.cycleDay
    const target = todayCycleDay ?? nextDayToMark?.cycleDay
    setSelectedDay(null)
    if (!target) return
    const doScroll = () => {
      const el = scrollRef.current
      if (!el) return
      const colW = 36
      const labelW = 68
      const visW = el.clientWidth - labelW
      el.scrollLeft = Math.max(0, labelW + (target - 1) * colW - visW)
    }
    // RAF ensures the browser has laid out before we read clientWidth
    requestAnimationFrame(doScroll)
  }, [data.cycleIndex, data.startDate])

  // Desktop: convert vertical mouse-wheel to horizontal scroll (passive:false required)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const selectedDayData = selectedDay !== null ? data.days[selectedDay - 1] : null
  const defaultLabel = data.totalCycles === 0 ? 'Sem ciclos' : `Ciclo ${data.cycleNumber}`
  const displayName = cycleName.trim() || defaultLabel
  const startLabel = data.startDate
    ? format(parseISO(data.startDate), "d 'de' MMMM", { locale: ptBR })
    : ''

  return (
    <div className="space-y-4">
      {/* Cycle navigation */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => onNavigate(data.cycleIndex + 1)} disabled={data.cycleIndex >= data.totalCycles - 1}
          className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-30 shrink-0">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex-1 text-center min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1 justify-center">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                onBlur={saveName}
                placeholder={defaultLabel}
                className="text-sm font-semibold text-gray-800 text-center bg-transparent border-b border-rose-400 outline-none w-36"
              />
              <button onClick={saveName} className="text-rose-500 shrink-0">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 justify-center">
              <p className="text-base font-semibold text-gray-800 truncate">{displayName}</p>
              {onNameSave && data.totalCycles > 0 && (
                <button onClick={startEditing} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
          {startLabel && <p className="text-xs text-gray-400 capitalize mt-0.5">Início: {startLabel}</p>}
        </div>

        <button onClick={() => onNavigate(data.cycleIndex - 1)} disabled={data.cycleIndex <= 0}
          className="p-2 rounded-xl hover:bg-gray-100 transition disabled:opacity-30 shrink-0">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {data.totalCycles === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhum ciclo registrado ainda.</div>
      ) : (
        <>
          {/* WOOMB-style grid */}
          <div
            ref={scrollRef}
            className="overflow-x-auto -mx-5 border-t border-b border-gray-200"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', overscrollBehaviorX: 'contain', cursor: dragRef.current.dragging ? 'grabbing' : 'grab' } as React.CSSProperties}
            onMouseDown={e => {
              const el = scrollRef.current!
              dragRef.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false }
              el.style.cursor = 'grabbing'
            }}
            onMouseMove={e => {
              const d = dragRef.current
              if (!d.dragging) return
              e.preventDefault()
              const x = e.pageX - scrollRef.current!.offsetLeft
              const delta = x - d.startX
              if (Math.abs(delta) > 3) d.moved = true
              scrollRef.current!.scrollLeft = d.scrollLeft - delta
            }}
            onMouseUp={() => {
              dragRef.current.dragging = false
              if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
            }}
            onMouseLeave={() => {
              dragRef.current.dragging = false
              if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
            }}
          >
            <div className="flex w-max">

              {/* ── Sticky label column ── */}
              <div className={cn('sticky left-0 z-20 bg-white border-r-2 border-gray-300 flex flex-col shrink-0', LABEL_W)}>
                <Cell cls={cn(ROW.diaCiclo, 'border-b border-gray-200 justify-start pl-1 text-[9px] font-semibold text-gray-500')}>Dia ciclo</Cell>
                <Cell cls={cn(ROW.simbolo,  'border-b border-gray-200 justify-start pl-1 text-[9px] font-semibold text-gray-500')}>Símbolo</Cell>
                <Cell cls={cn(ROW.diaMes,   'border-b border-gray-200 justify-start pl-1 text-[9px] font-semibold text-gray-500')}>Dia mês</Cell>
                <Cell cls={cn(ROW.sensacao, 'border-b border-gray-200 justify-start pl-1 text-[9px] font-semibold text-gray-500 items-start pt-1')}>
                  <span>Descrição das</span>
                  <span>sensações</span>
                </Cell>
                <Cell cls={cn(ROW.regra,   'border-b border-gray-200 justify-start pl-1 text-[9px] font-semibold text-gray-500')}>Regra MOB</Cell>
                <Cell cls={cn(ROW.relacao, 'justify-start pl-1 text-[9px] font-semibold text-gray-500')}>Relação</Cell>
              </div>

              {/* ── Day columns ── */}
              {data.days.map((day) => {
                const status = day.record?.cycleStatus ?? null
                const info   = status ? CYCLE_STATUS_DISPLAY[status] : null
                const isNext = nextDayToMark?.cycleDay === day.cycleDay
                const isSel  = selectedDay === day.cycleDay

                const expectedDate = data.startDate
                  ? format(addDays(parseISO(data.startDate), day.cycleDay - 1), 'yyyy-MM-dd')
                  : day.date ?? ''
                const targetDate = day.date ?? expectedDate

                // Any past/today unmarked day can be registered (not just the first one)
                const isMarkable = !isMan && !day.record && !!targetDate && targetDate <= today

                const dateLabel = targetDate
                  ? format(parseISO(targetDate), 'dd/MM')
                  : ''

                const sensacaoText = day.record
                  ? SENSATION_LABELS[day.record.sensation]
                  : ''

                const mobRule = day.record?.mobRule || (status ? MOB_RULE[status] : '')

                const isPostApice = status ? POST_APICE_STATUSES.has(status) : false
                const postApiceStyle = isPostApice && day.record ? getPostApiceStyle(day.record.sensation) : null

                return (
                  <div
                    key={day.cycleDay}
                    role="button"
                    tabIndex={0}
                    onClick={() => { if (!dragRef.current.moved) setSelectedDay(isSel ? null : day.cycleDay) }}
                    onKeyDown={e => e.key === 'Enter' && setSelectedDay(isSel ? null : day.cycleDay)}
                    className={cn(
                      'flex flex-col shrink-0 border-r border-gray-200 transition cursor-pointer select-none',
                      COL_W,
                      isSel   && 'bg-blue-50',
                      isNext  && !isSel && 'bg-rose-50',
                      day.isToday && 'outline outline-1 outline-rose-400',
                    )}
                    style={{ touchAction: 'pan-x' }}
                  >
                    {/* Row 1: Dia do ciclo */}
                    <div className={cn('flex items-center justify-center border-b border-gray-200 text-[10px] font-bold text-gray-600', ROW.diaCiclo)}>
                      {String(day.cycleDay).padStart(2, '0')}
                    </div>

                    {/* Row 2: Symbol */}
                    <div className={cn('flex items-center justify-center border-b border-gray-200 p-0.5', ROW.simbolo)}>
                      {isMarkable ? (
                        <Link
                          to={`/registrar?date=${targetDate}`}
                          onClick={e => e.stopPropagation()}
                          className={cn(
                            'w-full h-full rounded flex items-center justify-center text-white transition',
                            isNext ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-300 hover:bg-gray-400',
                          )}
                          style={{ touchAction: 'manipulation' }}
                        >
                          <Plus size={14} />
                        </Link>
                      ) : postApiceStyle ? (
                        <div className={cn(
                          'relative w-full h-full rounded flex flex-col items-center justify-center text-[11px] font-bold leading-none border',
                          postApiceStyle.bg, postApiceStyle.text, postApiceStyle.border,
                        )}>
                          <span>{postApiceStyle.symbol}</span>
                          {status && POST_APICE_DAY[status] && (
                            <span className="absolute bottom-0 right-0.5 text-[7px] leading-none">{POST_APICE_DAY[status]}</span>
                          )}
                        </div>
                      ) : (
                        <div className={cn(
                          'w-full h-full rounded flex flex-col items-center justify-center text-[11px] font-bold leading-none gap-px',
                          info ? cn(info.bgColor, info.textColor, 'border', info.borderColor) : 'bg-gray-100 text-gray-300',
                        )}>
                          {status
                            ? <CycleSymbol status={status} bleedingIntensity={day.record?.bleedingIntensity} sensation={day.record?.sensation} />
                            : <span>·</span>}
                        </div>
                      )}
                    </div>

                    {/* Row 3: Dia do mês */}
                    <div className={cn('flex items-center justify-center border-b border-gray-200 text-[9px] text-gray-500', ROW.diaMes)}>
                      {dateLabel}
                    </div>

                    {/* Row 4: Sensação + anotação (vertical) */}
                    <div className={cn('flex items-center justify-center gap-px border-b border-gray-200 overflow-hidden', ROW.sensacao)}>
                      {sensacaoText && (
                        <span
                          className="text-[9px] text-gray-700 leading-tight"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {sensacaoText}
                        </span>
                      )}
                      {day.record?.notes && (
                        <span
                          className="text-[8px] text-gray-400 leading-tight"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {day.record.notes}
                        </span>
                      )}
                    </div>

                    {/* Row 5: Regra MOB */}
                    <div className={cn('flex items-center justify-center border-b border-gray-200 text-[9px] font-bold text-gray-600', ROW.regra)}>
                      {mobRule}
                    </div>

                    {/* Row 6: Relação */}
                    <div className={cn('flex items-center justify-center text-[9px] font-bold text-rose-500', ROW.relacao)}>
                      {day.record?.hadIntercourse ? 'R' : ''}
                    </div>
                  </div>
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
                <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-400 hover:text-gray-600 p-1">✕</button>
              </div>

              {selectedDayData.record ? (
                <div className="space-y-2">
                  {(() => {
                    const info = CYCLE_STATUS_DISPLAY[selectedDayData.record.cycleStatus]
                    return (
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border', info.bgColor, info.textColor, info.borderColor)}>
                        {info.symbol} {info.label}
                      </span>
                    )
                  })()}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Regra: <strong>{selectedDayData.record.mobRule || (selectedDayData.record.cycleStatus ? MOB_RULE[selectedDayData.record.cycleStatus] : '—') || '—'}</strong></span>
                    {selectedDayData.record.hadIntercourse && (
                      <span className="text-rose-500">♥ Relação sexual</span>
                    )}
                  </div>
                  {selectedDayData.record.notes && (
                    <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">{selectedDayData.record.notes}</p>
                  )}
                  {!isMan && (
                    <Link to={`/registrar?date=${selectedDayData.date}`} className="block text-xs text-rose-600 font-medium hover:underline text-right">
                      Editar registro
                    </Link>
                  )}
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

function Cell({ cls, children }: { cls?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-[9px]', cls)}>
      {children}
    </div>
  )
}
