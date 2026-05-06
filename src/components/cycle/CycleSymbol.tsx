import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

const FETUS_STATUSES = new Set<CycleStatus>(['mudanca', 'fertil', 'apice'])

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

function FetusIconSVG() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Outer circle */}
      <circle cx="10" cy="10" r="8.8" stroke="currentColor" strokeWidth="1.4" />
      {/* Head */}
      <circle cx="8" cy="7.5" r="2.3" stroke="currentColor" strokeWidth="1.1" fill="none" />
      {/* Ear */}
      <path d="M6.2 7 Q5.3 7.6 5.7 8.5" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      {/* Body / back curve */}
      <path d="M10.2 9.6 C13 11.5 12.5 15.5 9.5 16.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {/* Buttocks */}
      <path d="M9.5 16.5 C8 18 6.5 17.5 6.5 16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Lower leg / knee fold */}
      <path d="M6.5 16 C6 14.5 7 13.5 8.5 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Arm */}
      <path d="M9.5 12.5 C8 13 7 14 7.5 15" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      {/* Umbilical cord */}
      <path d="M10.8 12.5 Q15 12 17.8 10.8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
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

  if (FETUS_STATUSES.has(status)) {
    return (
      <span className={`relative flex items-center justify-center ${size}`}>
        {/* Fetus as faded watermark */}
        <span className="absolute inset-0 opacity-20">
          <FetusIconSVG />
        </span>
        {/* Prominent WOOMB oval symbol */}
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
          <ellipse cx="10" cy="10" rx="4.8" ry="6.2" stroke="currentColor" strokeWidth="1.2" />
          {status === 'apice' && (
            <>
              <line x1="7.5" y1="7.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              <line x1="12.5" y1="7.5" x2="7.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
        </svg>
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
