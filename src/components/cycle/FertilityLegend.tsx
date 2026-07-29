import { cn } from '@/lib/utils/cn'
import { CycleStatus, resolveCycleStatusDisplay } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus as CycleStatusType } from '@/lib/domain/enums/CycleStatus'
import type { Sensation } from '@/lib/domain/enums/Sensation'
import { CycleSymbol } from './CycleSymbol'

interface LegendEntry {
  status: CycleStatusType
  sensation?: Sensation
}

const COLUMN_1: LegendEntry[] = [
  { status: CycleStatus.MENSTRUATION },
  { status: CycleStatus.SPOTTING },
  { status: CycleStatus.DRY_BIP },
  { status: CycleStatus.MUCUS_BIP },
  { status: CycleStatus.FERTILE },
  { status: CycleStatus.PEAK },
]

const COLUMN_2: LegendEntry[] = [
  { status: CycleStatus.POST_PEAK_1, sensation: 'umida' },
  { status: CycleStatus.POST_PEAK_2, sensation: 'umida' },
  { status: CycleStatus.POST_PEAK_3, sensation: 'umida' },
  { status: CycleStatus.POST_PEAK_1, sensation: 'seca' },
  { status: CycleStatus.POST_PEAK_2, sensation: 'seca' },
  { status: CycleStatus.POST_PEAK_3, sensation: 'seca' },
]

function LegendRow({ entry }: { entry: LegendEntry }) {
  const info = resolveCycleStatusDisplay(entry.status, entry.sensation)
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-6 h-6 rounded-md border flex flex-col items-center justify-center text-[9px] font-bold flex-shrink-0 leading-none gap-px',
          info.bgColor,
          info.textColor,
          info.borderColor,
        )}
      >
        <CycleSymbol status={entry.status} sensation={entry.sensation} size="w-4 h-4" />
      </div>
      <span className="text-xs text-gray-600 leading-tight">{info.label}</span>
    </div>
  )
}

export function FertilityLegend() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500">Legenda</p>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          {COLUMN_1.map((entry, i) => <LegendRow key={i} entry={entry} />)}
        </div>
        <div className="flex-1 space-y-2">
          {COLUMN_2.map((entry, i) => <LegendRow key={i} entry={entry} />)}
        </div>
      </div>
    </div>
  )
}
