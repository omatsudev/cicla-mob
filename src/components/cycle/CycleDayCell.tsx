'use client'

import { cn } from '@/lib/utils/cn'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { InterpretedRecord } from '@/lib/domain/entities/DailyRecord'
import { CycleSymbol } from './CycleSymbol'

interface CycleDayCellProps {
  dayOfMonth: number
  record: InterpretedRecord | null
  isToday: boolean
  onClick?: () => void
}

export function CycleDayCell({ dayOfMonth, record, isToday, onClick }: CycleDayCellProps) {
  const displayInfo = record ? CYCLE_STATUS_DISPLAY[record.cycleStatus] : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'aspect-square flex flex-col items-center justify-center rounded-xl text-xs border transition active:scale-95',
        isToday && 'ring-2 ring-rose-500 ring-offset-1',
        displayInfo
          ? cn(displayInfo.bgColor, displayInfo.textColor, displayInfo.borderColor)
          : 'bg-gray-50 border-gray-100 text-gray-400',
        onClick && 'hover:opacity-80 cursor-pointer',
      )}
      title={displayInfo?.description}
    >
      <span className="font-semibold text-[11px] leading-none">{dayOfMonth}</span>
      {record && (
        <span className="flex flex-col items-center mt-0.5 opacity-80 leading-none gap-px text-[9px]">
          <CycleSymbol status={record.cycleStatus} bleedingIntensity={record.bleedingIntensity} size="w-4 h-4" />
        </span>
      )}
    </button>
  )
}
