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

function Sym({ status, bleedingIntensity }: { status: CycleStatus; bleedingIntensity?: BleedingIntensity }) {
  const base: React.CSSProperties = {
    width: 11, height: 11, borderRadius: 2, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', fontSize: 5, fontWeight: 'bold', lineHeight: 1,
    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  } as React.CSSProperties

  if (status === 'mancha') {
    const n = (bleedingIntensity ? BLEEDING_DOT[bleedingIntensity] : undefined) ?? 3
    return (
      <div style={{ ...base, background: '#fca5a5', border: '1px solid #f87171' }}>
        <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
          {DOT_POS[n].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.8" fill="#b91c1c" />)}
        </svg>
      </div>
    )
  }

  const CFG: Partial<Record<CycleStatus, { bg: string; color: string; border: string; chars: string[] }>> = {
    menstruacao:         { bg: '#ef4444', color: '#fff', border: '#dc2626', chars: ['●'] },
    pbi_seco:           { bg: '#22c55e', color: '#fff', border: '#16a34a', chars: ['|'] },
    pbi_muco:           { bg: '#fde047', color: '#333', border: '#ca8a04', chars: ['='] },
    mudanca:            { bg: '#fff',    color: '#333', border: '#999',    chars: ['O'] },
    fertil:             { bg: '#fff',    color: '#333', border: '#999',    chars: ['O'] },
    apice:              { bg: '#fff',    color: '#333', border: '#999',    chars: ['O', '✕'] },
    pos_apice_1:        { bg: '#fff',    color: '#333', border: '#999',    chars: ['1', '='] },
    pos_apice_2:        { bg: '#fff',    color: '#333', border: '#999',    chars: ['2', '='] },
    pos_apice_3:        { bg: '#fff',    color: '#333', border: '#999',    chars: ['3', '='] },
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
// Label col: 21mm → day cols: 251mm / 35 ≈ 7.17mm each
const DARK = '#444'
const MID  = '#aaa'
const LT   = '#ddd'

const TITLE_W  = 13   // mm (left vertical title strip)
const LABEL_W  = 21   // mm (row label column inside table)
// Day col: auto flex

// Row heights inside each cycle block (mm)
const H_HDR  = 8    // cycle name header
const H_DAY  = 7    // "Dia do Ciclo" 01-35 numbers
const H_SIMB = 13   // symbols
const H_DATE = 6.5  // dates
const H_MOB  = 6.5  // MOB rule
// Sensações: flex:1 (fills rest of cycle block height)

// Page: 198mm / 3 cycles ≈ 66mm per cycle
// Fixed rows: 8+7+13+6.5+6.5 = 41mm → sensações ≈ 25mm

type Day = CycleCalendarData['days'][0]

const BLANK_DAYS: Day[] = Array.from({ length: 35 }, (_, i) => ({
  cycleDay: i + 1, date: null, record: null, isToday: false,
}))

const mm = (v: number) => `${v}mm`

function LabelCell({ children, height, flex }: { children: React.ReactNode; height?: number; flex?: boolean }) {
  return (
    <div style={{
      width: mm(LABEL_W), flexShrink: 0,
      height: height ? mm(height) : undefined,
      flex: flex ? 1 : undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '1px 2px',
      fontSize: 5.5, fontWeight: 'bold', lineHeight: 1.2,
      borderRight: `1px solid ${MID}`,
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
      fontSize: fontSize ?? 5.5,
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
    ? format(parseISO(cycle.startDate), "d/MM/yyyy", { locale: ptBR })
    : '—'

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      borderBottom: isLast ? 'none' : `1.5px solid ${DARK}`,
    }}>

      {/* Cycle name header */}
      <div style={{
        height: mm(H_HDR), flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#d1d5db', borderBottom: `1px solid ${DARK}`,
        fontSize: 7, fontWeight: 'bold',
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      } as React.CSSProperties}>
        {name}{cycle ? `  —  Início: ${startLabel}` : ''}
      </div>

      {/* "Dia do Ciclo" numbers row */}
      <RowWrap height={H_DAY}>
        <LabelCell height={H_DAY}>Dia do<br />Ciclo</LabelCell>
        {Array.from({ length: 35 }, (_, i) => (
          <DayCell key={i} bg="#e5e7eb" bold fontSize={6} isLast={i === 34}>
            {String(i + 1).padStart(2, '0')}
          </DayCell>
        ))}
      </RowWrap>

      {/* Symbol row */}
      <RowWrap height={H_SIMB}>
        <LabelCell height={H_SIMB}>Primeiro dia<br />da Menstruação</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34}>
              {status && <Sym status={status} bleedingIntensity={day.record?.bleedingIntensity} />}
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
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34} fontSize={5.5}>
              {label}
            </DayCell>
          )
        })}
      </RowWrap>

      {/* Sensações row — flex: 1, vertical text */}
      <RowWrap flex>
        <LabelCell flex>Descrições das<br />Sensações e<br />do Fluxo</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          const sensacao = day.record ? SENSATION_LABELS[day.record.sensation] : ''
          const notes = day.record?.notes ?? ''
          const desc = [sensacao, notes].filter(Boolean).join(' / ')
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34}>
              {desc && (
                <span style={{
                  fontSize: 5,
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
      <RowWrap height={H_MOB} borderBottom={false}>
        <LabelCell height={H_MOB}>Regra MOB</LabelCell>
        {days.map((day, i) => {
          const status = day.record?.cycleStatus ?? null
          const mob = day.record?.mobRule || (status ? MOB_AUTO[status] : '')
          return (
            <DayCell key={i} bg={cellBg(status)} isLast={i === 34} bold fontSize={6}>
              {mob}
            </DayCell>
          )
        })}
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

export function CyclePrintView({ cycles, cycleNames }: Props) {
  const pages: CycleCalendarData[][] = []
  for (let i = 0; i < cycles.length; i += 3) pages.push(cycles.slice(i, i + 3))

  return createPortal(
    <div id="cicla-print-root" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body > *:not(#cicla-print-root) { display: none !important; }
          #cicla-print-root { display: block !important; }
        }
      `}</style>

      {cycles.length === 0 ? null : pages.map((pageCycles, pageIdx) => {
        const cols: (CycleCalendarData | null)[] = [
          ...pageCycles,
          ...Array(3 - pageCycles.length).fill(null),
        ]

        return (
          <div
            key={pageIdx}
            style={{
              width: '297mm', height: '210mm', padding: '6mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter:     pageIdx < pages.length - 1 ? 'page'   : 'auto',
              pageBreakInside: 'avoid', breakInside: 'avoid',
              overflow: 'hidden',
              display: 'flex', gap: 0,
              fontFamily: 'Arial, Helvetica, sans-serif',
            } as React.CSSProperties}
          >

            {/* ── Left: vertical title ── */}
            <div style={{
              width: mm(TITLE_W), flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3mm',
              borderRight: `1.5px solid ${DARK}`,
              paddingRight: '2mm',
            }}>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontWeight: 'bold', fontSize: 10,
                letterSpacing: '0.5px', whiteSpace: 'nowrap',
              }}>
                GRÁFICO CICLO MENSTRUAL
              </span>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 5.5, color: '#555',
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
                  isLast={ci === 2}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
