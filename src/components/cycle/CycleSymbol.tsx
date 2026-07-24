import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

const FERTILITY_STATUSES = new Set<CycleStatus>(['mudanca', 'fertil', 'apice', 'pos_apice_1', 'pos_apice_2', 'pos_apice_3'])
const FERTILITY_SUFFIX: Partial<Record<CycleStatus, string>> = {
  apice: 'X', pos_apice_1: '1', pos_apice_2: '2', pos_apice_3: '3',
}

// Dot positions (cx, cy) within a 20×20 viewBox
const DOT_POSITIONS: Record<2 | 3 | 5, [number, number][]> = {
  2: [[7, 9], [13, 13]],
  3: [[6, 7], [14, 8], [10, 14]],
  5: [[5, 6], [14, 5], [8, 11], [15, 13], [10, 17]],
}

const BLEEDING_DOT_COUNT: Partial<Record<BleedingIntensity, 2 | 3 | 5>> = {
  leve:     2,
  moderado: 3,
  intenso:  5,
}

function SpottingDotsSVG({ count }: { count: 2 | 3 | 5 }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {DOT_POSITIONS[count].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.2" fill="currentColor" />
      ))}
    </svg>
  )
}

function FertilityCircleSVG({ suffix }: { suffix?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      {suffix && (
        <text x="15.5" y="16" textAnchor="middle" dominantBaseline="middle"
          fill="currentColor" fontSize="7.5" fontWeight="700" fontFamily="Arial, sans-serif">{suffix}</text>
      )}
    </svg>
  )
}

interface Props {
  status: CycleStatus
  bleedingIntensity?: BleedingIntensity
  /** size class for the icon wrapper, e.g. "w-5 h-5" */
  size?: string
}

export function CycleSymbol({ status, bleedingIntensity, size = 'w-full h-full' }: Props) {
  if (status === 'mancha') {
    const count = (bleedingIntensity ? BLEEDING_DOT_COUNT[bleedingIntensity] : undefined) ?? 3
    return (
      <span className={`relative flex items-center justify-center ${size}`}>
        <SpottingDotsSVG count={count} />
      </span>
    )
  }

  if (FERTILITY_STATUSES.has(status)) {
    return (
      <span className={`relative flex items-center justify-center ${size}`}>
        <FertilityCircleSVG suffix={FERTILITY_SUFFIX[status]} />
      </span>
    )
  }

  const { symbol } = CYCLE_STATUS_DISPLAY[status]
  return (
    <>
      {symbol.split('').map((c, i) => (
        <span key={i} className="block leading-none">{c}</span>
      ))}
    </>
  )
}
