import { forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CycleCalendarData } from '@/lib/application/use-cases/GetCycleCalendarUseCase'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import type { CycleStatus } from '@/lib/domain/enums/CycleStatus'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

const MOB_AUTO: Record<CycleStatus, string> = {
  menstruacao: 'R1', mancha: 'R3', pbi_seco: 'R2', pbi_muco: 'R2',
  mudanca: '', fertil: '', apice: 'A',
  pos_apice_1: '1', pos_apice_2: '2', pos_apice_3: '3',
  infertil_pos_apice: 'RA',
}

const DOT_POS: Record<2 | 3 | 5, [number, number][]> = {
  2: [[4, 5], [9, 9]],
  3: [[3, 4], [9, 3], [6, 9]],
  5: [[3, 3], [9, 2], [5, 6], [10, 7], [6, 11]],
}
const BLEEDING_DOT: Partial<Record<BleedingIntensity, 2 | 3 | 5>> = {
  leve: 2, moderado: 3, intenso: 5,
}

const POST_APICE = new Set<CycleStatus>(['infertil_pos_apice'])
const POST_APICE_DAY: Partial<Record<CycleStatus, string>> = {
  pos_apice_1: '1', pos_apice_2: '2', pos_apice_3: '3',
}

function Sym({ status, bleedingIntensity, sensation }: { status: CycleStatus; bleedingIntensity?: BleedingIntensity; sensation?: string }) {
  const base: React.CSSProperties = {
    width: 14, height: 14, borderRadius: 2, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', fontSize: 6.5, fontWeight: 'bold', lineHeight: 1,
    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  } as React.CSSProperties

  if (status === 'menstruacao') {
    return (
      <div style={{ ...base, background: '#ef4444', border: '1px solid #dc2626' }}>
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="3.6" fill="#000" />
        </svg>
      </div>
    )
  }

  if (status === 'mancha') {
    const n = (bleedingIntensity ? BLEEDING_DOT[bleedingIntensity] : undefined) ?? 3
    return (
      <div style={{ ...base, background: '#ef4444', border: '1px solid #dc2626' }}>
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          {DOT_POS[n].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.8" fill="#111827" />)}
        </svg>
      </div>
    )
  }

  if (status === 'apice') {
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #999' }}>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <circle cx="8" cy="8" r="6" stroke="#333" strokeWidth="1.5" />
          <text x="15.5" y="16.5" textAnchor="middle" dominantBaseline="middle"
            fill="#333" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">x</text>
        </svg>
      </div>
    )
  }

  const postApiceDay = POST_APICE_DAY[status]
  if (postApiceDay) {
    const ch = sensation === 'seca' ? '|' : '='
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #999' }}>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <text x="7" y="10" textAnchor="middle" dominantBaseline="middle"
            fill="#333" fontSize="13" fontWeight="700" fontFamily="Arial, sans-serif">{ch}</text>
          <text x="15.5" y="16.5" textAnchor="middle" dominantBaseline="middle"
            fill="#333" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">{postApiceDay}</text>
        </svg>
      </div>
    )
  }

  // 4°+ dia pós-ápice (úmida/infértil): cor baseada na sensação (verde seca, amarelo úmida)
  if (POST_APICE.has(status) && sensation) {
    const isSeca = sensation === 'seca'
    return (
      <div style={{ ...base,
        background: isSeca ? '#22c55e' : '#fde047',
        color:      isSeca ? '#fff'    : '#333',
        border: `1px solid ${isSeca ? '#16a34a' : '#ca8a04'}`,
      }}>
        <span style={{ lineHeight: 1 }}>{isSeca ? '|' : '='}</span>
      </div>
    )
  }

  const CFG: Partial<Record<CycleStatus, { bg: string; color: string; border: string; chars: string[] }>> = {
    pbi_seco:           { bg: '#22c55e', color: '#fff', border: '#16a34a', chars: ['|'] },
    pbi_muco:           { bg: '#fde047', color: '#333', border: '#ca8a04', chars: ['='] },
    mudanca:            { bg: '#fff',    color: '#333', border: '#999',    chars: ['O'] },
    fertil:             { bg: '#fff',    color: '#333', border: '#999',    chars: ['O'] },
    infertil_pos_apice: { bg: '#fde047', color: '#333', border: '#ca8a04', chars: ['='] },
  }
  const c = CFG[status]
  if (!c) return null
  return (
    <div style={{ ...base, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.chars.map((ch, i) => <span key={i} style={{ lineHeight: 1 }}>{ch}</span>)}
    </div>
  )
}

function cellBg(status: CycleStatus | null) {
  if (status === 'menstruacao') return '#fee2e2'
  if (status === 'mancha')      return '#fecaca'
  if (status === 'pbi_seco')   return '#dcfce7'
  if (status === 'pbi_muco' || status === 'infertil_pos_apice') return '#fefce8'
  return '#fff'
}

// ── Layout constants ────────────────────────────────────────────────
// Page: 297×210mm, padding 6mm → table area: 285×198mm
// Title strip: 13mm → table: 272mm
// Label col: 23mm → day cols: 249mm / 35 ≈ 7.11mm each
// 2 cycles/page (was 3) → ~99mm per block, used to enlarge fonts for legibility
const DARK = '#444'
const MID  = '#aaa'
const LT   = '#ddd'

const TITLE_W  = 13   // mm (left vertical title strip)
const LABEL_W  = 23   // mm (row label column inside table)
// Day col: auto flex

// Row heights inside each cycle block (mm)
// No separate cycle-name header row — name goes in the Dia do Ciclo label cell
const H_DAY  = 10   // "Dia do Ciclo" row (includes cycle name in label)
const H_SIMB = 16   // symbols
const H_DATE = 7    // dates
const H_MOB  = 7    // MOB rule
const H_REL  = 5    // Relação
// Sensações: flex:1 → 198/2 - (10+16+7+7+5) = 99-45 = 54mm per cycle

type Day = CycleCalendarData['days'][0]

const BLANK_DAYS: Day[] = Array.from({ length: 35 }, (_, i) => ({
  cycleDay: i + 1, date: null, record: null, isToday: false,
}))

const mm = (v: number) => `${v}mm`

function LabelCell({ children, height }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{
      width: mm(LABEL_W), flexShrink: 0,
      height: height ? mm(height) : '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '1px 2px',
      fontSize: 7, fontWeight: 'bold', lineHeight: 1.2,
      border: `1px solid ${MID}`,
      background: '#f3f4f6',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    } as React.CSSProperties}>
      {children}
    </div>
  )
}

function DayCell({
  children, bg, isLast, bold, fontSize,
}: {
  children?: React.ReactNode
  bg?: string
  isLast?: boolean
  bold?: boolean
  fontSize?: number
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      borderRight: isLast ? 'none' : `0.5px solid ${LT}`,
      background: bg ?? '#fff',
      fontSize: fontSize ?? 7,
      fontWeight: bold ? 'bold' : undefined,
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    } as React.CSSProperties}>
      {children}
    </div>
  )
}

function RowWrap({
  height, flex, borderBottom, children,
}: {
  height?: number; flex?: boolean; borderBottom?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      height: height ? mm(height) : undefined,
      flex: flex ? 1 : undefined,
      minHeight: 0,
      flexShrink: height ? 0 : undefined,
      borderBottom: borderBottom !== false ? `0.5px solid ${MID}` : 'none',
    }}>
      {children}
    </div>
  )
}

function CycleBlock({
  cycle, name, isLast,
}: {
  cycle: CycleCalendarData | null
  name: string
  isLast: boolean
}) {
  const days = cycle?.days ?? BLANK_DAYS
  const startLabel = cycle?.startDate
    ? format(parseISO(cycle.startDate), "dd/MM/yy", { locale: ptBR })
    : ''
  const cycleInfo = cycle ? [name, startLabel].filter(Boolean).join(' — ') : ''

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      borderBottom: isLast ? 'none' : `1.5px solid ${DARK}`,
    }}>

      {/* "Dia do Ciclo" numbers row — cycle name embedded in label cell */}
      <RowWrap height={H_DAY}>
        <div style={{
          width: mm(LABEL_W), flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '1px 2px',
          border: `1px solid ${MID}`,
          background: '#e5e7eb',
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <span style={{ fontSize: 7.5, fontWeight: 'bold', lineHeight: 1.2 }}>Dia do Ciclo</span>
          {cycleInfo && (
            <span style={{ fontSize: 6, color: '#444', lineHeight: 1.3, marginTop: '0.5mm' }}>
              {cycleInfo}
            </span>
          )}
        </div>
        {Array.from({ length: 35 }, (_, i) => (
          <DayCell key={i} bg="#e5e7eb" bold fontSize={7.5} isLast={i === 34}>
            {String(i + 1).padStart(2, '0')}
          </DayCell>
        ))}
      </RowWrap>

      {/* Symbol row */}
      <RowWrap height={H_SIMB}>
        <LabelCell height={H_SIMB}>Primeiro dia<br />Menstruação</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34}>
              {status && <Sym status={status} bleedingIntensity={day.record?.bleedingIntensity} sensation={day.record?.sensation} />}
            </DayCell>
          )
        })}
      </RowWrap>

      {/* Date row */}
      <RowWrap height={H_DATE}>
        <LabelCell height={H_DATE}>Dia do<br />mês</LabelCell>
        {days.map((day, i) => {
          const expected = cycle?.startDate
            ? format(addDays(parseISO(cycle.startDate), day.cycleDay - 1), 'yyyy-MM-dd')
            : day.date
          const target = day.date ?? expected
          const label = target ? format(parseISO(target), 'dd/MM') : ''
          const status = day.record?.cycleStatus ?? null
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34} fontSize={7}>
              {label}
            </DayCell>
          )
        })}
      </RowWrap>

      {/* Sensações row — flex: 1, vertical text */}
      <RowWrap flex>
        <LabelCell>Descrições das<br />Sensações e do<br />Fluxo</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          const sensacao = day.record ? SENSATION_LABELS[day.record.sensation] : ''
          const notes = day.record?.notes ?? ''
          const desc = [sensacao, notes].filter(Boolean).join(' / ')
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34}>
              {desc && (
                <span style={{
                  fontSize: 6.5,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  maxHeight: '100%',
                }}>
                  {desc}
                </span>
              )}
            </DayCell>
          )
        })}
      </RowWrap>

      {/* MOB row */}
      <RowWrap height={H_MOB}>
        <LabelCell height={H_MOB}>Regra MOB</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          const mob = day.record?.mobRule || (status ? MOB_AUTO[status] : '')
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34} bold fontSize={7.5}>
              {mob}
            </DayCell>
          )
        })}
      </RowWrap>

      {/* Relação row */}
      <RowWrap height={H_REL} borderBottom={false}>
        <LabelCell height={H_REL}>Relação</LabelCell>
        {days.map((day, i) => (
          <DayCell key={i} isLast={i === 34} bold fontSize={7.5}>
            {day.record?.hadIntercourse && (
              <span style={{ color: '#e11d48', fontWeight: 'bold', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>R</span>
            )}
          </DayCell>
        ))}
      </RowWrap>
    </div>
  )
}

function getCycleName(cycle: CycleCalendarData, names: Record<string, string>) {
  return (cycle.startDate ? names[cycle.startDate] : '') || `Ciclo ${cycle.cycleNumber}`
}

interface Props {
  cycles: CycleCalendarData[]
  cycleNames: Record<string, string>
}

/** Class applied to each A4-landscape page div, used by exportCyclePdf to locate pages for capture. */
export const CICLA_PRINT_PAGE_CLASS = 'cicla-print-page'

export const CyclePrintView = forwardRef<HTMLDivElement, Props>(function CyclePrintView({ cycles, cycleNames }, ref) {
  const pages: CycleCalendarData[][] = []
  for (let i = 0; i < cycles.length; i += 2) pages.push(cycles.slice(i, i + 2))

  return createPortal(
    <div ref={ref} id="cicla-print-root" style={{ position: 'fixed', top: 0, left: '-99999px', zIndex: -1 }}>
      {cycles.length === 0 ? null : pages.map((pageCycles, pageIdx) => {
        const cols: (CycleCalendarData | null)[] = [
          ...pageCycles,
          ...Array(2 - pageCycles.length).fill(null),
        ]

        return (
          <div
            key={pageIdx}
            className={CICLA_PRINT_PAGE_CLASS}
            style={{
              width: '297mm', height: '210mm', padding: '6mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex', gap: 0,
              background: '#fff',
              fontFamily: 'Arial, Helvetica, sans-serif',
            } as React.CSSProperties}
          >

            {/* ── Left: vertical title ── */}
            <div style={{
              width: mm(TITLE_W), flexShrink: 0,
              display: 'flex', flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center',
              gap: '1mm',
              border: `1.5px solid ${DARK}`,
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontWeight: 'bold', fontSize: 12,
                letterSpacing: '0.5px', whiteSpace: 'nowrap',
              }}>
                GRÁFICO CICLO MENSTRUAL
              </span>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 7, color: '#555',
                lineHeight: 1.3,
                textAlign: 'center',
              }}>
                CENPLAFAM WOOMB Brasil – Confederação Nacional de Planejamento Natural da Família
              </span>
            </div>

            {/* ── Right: table ── */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              border: `1.5px solid ${DARK}`, minWidth: 0, minHeight: 0,
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>
              {cols.map((cycle, ci) => (
                <CycleBlock
                  key={ci}
                  cycle={cycle}
                  name={cycle ? getCycleName(cycle, cycleNames) : ''}
                  isLast={ci === 1}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
})
