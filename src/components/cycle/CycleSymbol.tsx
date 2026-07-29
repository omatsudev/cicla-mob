import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

const FERTILITY_STATUSES = new Set<CycleStatus>(['mudanca', 'fertil'])

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

function FertilityCircleSVG() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
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
  if (status === 'menstruacao') {
    return (
      <span className={`relative flex items-center justify-center ${size}`}>
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="10" cy="10" r="5.5" fill="#000" />
        </svg>
      </span>
    )
  }

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
        <FertilityCircleSVG />
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
