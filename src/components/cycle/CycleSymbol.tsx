import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'

// These statuses use the fetus SVG instead of text
const FETUS_STATUSES = new Set<CycleStatus>(['mudanca', 'fertil', 'apice'])

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
  /** size class for the icon wrapper, e.g. "w-5 h-5" */
  size?: string
}

/**
 * Renders the correct WOOMB symbol for a given CycleStatus.
 * Fertile statuses use the fetus SVG; others use stacked text characters.
 */
export function CycleSymbol({ status, size = 'w-full h-full' }: Props) {
  if (FETUS_STATUSES.has(status)) {
    return (
      <span className={`relative flex items-center justify-center ${size}`}>
        <FetusIconSVG />
        {status === 'apice' && (
          <span
            className="absolute inset-0 flex items-center justify-center font-bold"
            style={{ fontSize: '8px', paddingLeft: '3px', paddingTop: '3px' }}
          >
            ✕
          </span>
        )}
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
