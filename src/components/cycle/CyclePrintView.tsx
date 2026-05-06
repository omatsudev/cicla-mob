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
    width: 13, height: 13, borderRadius: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', fontSize: 5, fontWeight: 'bold', lineHeight: 1,
    flexShrink: 0, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  } as React.CSSProperties

  if (status === 'mancha') {
    const n = (bleedingIntensity ? BLEEDING_DOT[bleedingIntensity] : undefined) ?? 3
    return (
      <div style={{ ...base, background: '#fca5a5', border: '1px solid #f87171' }}>
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          {DOT_POS[n].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="1.8" fill="#b91c1c" />)}
        </svg>
      </div>
    )
  }

  const CFG: Partial<Record<CycleStatus, { bg: string; color: string; chars: string[]; border?: string }>> = {
    menstruacao:         { bg: '#ef4444', color: '#fff',  border: '#dc2626', chars: ['●'] },
    pbi_seco:           { bg: '#22c55e', color: '#fff',  border: '#16a34a', chars: ['|'] },
    pbi_muco:           { bg: '#fde047', color: '#333',  border: '#ca8a04', chars: ['='] },
    mudanca:            { bg: '#fff',    color: '#333',  border: '#999',    chars: ['O'] },
    fertil:             { bg: '#fff',    color: '#333',  border: '#999',    chars: ['O'] },
    apice:              { bg: '#fff',    color: '#333',  border: '#999',    chars: ['O', '✕'] },
    pos_apice_1:        { bg: '#fff',    color: '#333',  border: '#999',    chars: ['1', '='] },
    pos_apice_2:        { bg: '#fff',    color: '#333',  border: '#999',    chars: ['2', '='] },
    pos_apice_3:        { bg: '#fff',    color: '#333',  border: '#999',    chars: ['3', '='] },
    infertil_pos_apice: { bg: '#fde047', color: '#333',  border: '#ca8a04', chars: ['='] },
  }
  const c = CFG[status]
  if (!c) return null
  return (
    <div style={{ ...base, background: c.bg, color: c.color, border: `1px solid ${c.border ?? '#999'}` }}>
      {c.chars.map((ch, i) => <span key={i} style={{ lineHeight: 1 }}>{ch}</span>)}
    </div>
  )
}

function rowBg(status: CycleStatus | null) {
  if (status === 'menstruacao') return '#fee2e2'
  if (status === 'mancha')      return '#fecaca'
  if (status === 'pbi_seco')   return '#dcfce7'
  if (status === 'pbi_muco' || status === 'infertil_pos_apice') return '#fefce8'
  return '#fff'
}

// ── Column widths (mm string) ──────────────────────────────────────
// Page: 210mm, padding: 6mm × 2 = content 198mm
// "Dia": 13mm — remainder for 3 cycles: 185mm → 61.7mm each
// Within each cycle: simb=14 | data=17 | mob=14 | sensações=flex(1)
// sensações ≈ 61.7 - 14 - 17 - 14 = 16.7mm (small but enough for 5–6px text)
const W = { day: '13mm', simb: '14mm', data: '17mm', mob: '14mm' }

const DARK  = '#333'
const MID   = '#888'
const LIGHT = '#ccc'

const hCell = (extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 5.5, fontWeight: 'bold', textAlign: 'center', padding: '0 1px',
  background: '#d1d5db', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  ...extra,
})

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
          @page { size: A4 portrait; margin: 0; }
          body > *:not(#cicla-print-root) { display: none !important; }
          #cicla-print-root { display: block !important; }
        }
      `}</style>

      {cycles.length === 0 ? null : pages.map((pageCycles, pageIdx) => {
        // Pad to exactly 3 cycles (nulls for blank columns)
        const cols: (CycleCalendarData | null)[] = [
          ...pageCycles,
          ...Array(3 - pageCycles.length).fill(null),
        ]

        return (
          <div
            key={pageIdx}
            style={{
              width: '210mm', height: '297mm', padding: '6mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter:     pageIdx < pages.length - 1 ? 'page'   : 'auto',
              pageBreakInside: 'avoid', breakInside: 'avoid',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'Arial, Helvetica, sans-serif',
            } as React.CSSProperties}
          >

            {/* ── Title ── */}
            <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: '2mm' }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: '0.3px' }}>
                GRÁFICO CICLO MENSTRUAL
              </div>
              <div style={{ fontSize: 6, color: '#555', marginTop: 1 }}>
                CENPLAFAM WOOMB Brasil – Confederação Nacional de Planejamento Natural da Família
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              border: `1.5px solid ${DARK}`, minHeight: 0,
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>

              {/* ── Row 1: cycle name headers ── */}
              <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${DARK}` }}>
                {/* top-left corner */}
                <div style={{ ...hCell(), width: W.day, borderRight: `1px solid ${DARK}` }} />
                {cols.map((cycle, ci) => {
                  const name = cycle
                    ? (cycleName(cycle, cycleNames) + '  —  Início: ' + (cycle.startDate
                        ? format(parseISO(cycle.startDate), "d/MM/yyyy", { locale: ptBR })
                        : '—'))
                    : ''
                  return (
                    <div
                      key={ci}
                      style={{
                        ...hCell({ fontSize: 7, fontWeight: 'bold' }),
                        flex: 1,
                        borderRight: ci < 2 ? `1px solid ${DARK}` : undefined,
                        padding: '3px 4px',
                      }}
                    >
                      {name || ' '}
                    </div>
                  )
                })}
              </div>

              {/* ── Row 2: column sub-headers ── */}
              <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${DARK}` }}>
                <div style={{ ...hCell(), width: W.day, borderRight: `1px solid ${DARK}`, padding: '2px' }}>
                  Dia do<br />ciclo
                </div>
                {cols.map((_, ci) => (
                  <div key={ci} style={{ flex: 1, display: 'flex', borderRight: ci < 2 ? `1px solid ${DARK}` : undefined }}>
                    <div style={{ ...hCell(), width: W.simb, borderRight: `1px solid ${LIGHT}` }}>Simb</div>
                    <div style={{ ...hCell(), width: W.data, borderRight: `1px solid ${LIGHT}` }}>Data</div>
                    <div style={{ ...hCell(), width: W.mob,  borderRight: `1px solid ${LIGHT}` }}>MOB</div>
                    <div style={{ ...hCell({ flex: 1 }) }}>Descrição das Sensações e do Fluxo</div>
                  </div>
                ))}
              </div>

              {/* ── 35 data rows ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {Array.from({ length: 35 }, (_, i) => {
                  const dayNum = i + 1

                  // Determine the dominant background for the whole row
                  // (use first cycle that has a record for this day)
                  const firstStatus = cols.reduce<CycleStatus | null>((found, cycle) => {
                    if (found || !cycle) return found
                    return cycle.days[i]?.record?.cycleStatus ?? null
                  }, null)
                  const bg = rowBg(firstStatus)

                  const isLastRow = dayNum === 35
                  const rowStyle: React.CSSProperties = {
                    display: 'flex', flex: 1, minHeight: 0,
                    borderBottom: isLastRow ? 'none' : `0.5px solid ${LIGHT}`,
                    background: bg,
                    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                  } as React.CSSProperties

                  const numCell: React.CSSProperties = {
                    width: W.day, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 'bold', color: DARK,
                    borderRight: `1px solid ${DARK}`,
                    flexShrink: 0,
                  }

                  return (
                    <div key={dayNum} style={rowStyle}>
                      {/* Day number */}
                      <div style={numCell}>{String(dayNum).padStart(2, '0')}</div>

                      {/* Cycle columns */}
                      {cols.map((cycle, ci) => {
                        const day = cycle?.days[i] ?? null
                        const status = day?.record?.cycleStatus ?? null
                        const expectedDate = cycle?.startDate
                          ? format(addDays(parseISO(cycle.startDate), dayNum - 1), 'yyyy-MM-dd')
                          : day?.date
                        const targetDate = day?.date ?? expectedDate
                        const dateLabel = targetDate ? format(parseISO(targetDate), 'dd/MM') : ''
                        const mob = day?.record?.mobRule || (status ? MOB_AUTO[status] : '')
                        const sensacao = day?.record ? SENSATION_LABELS[day.record.sensation] : ''
                        const notes = day?.record?.notes ?? ''
                        const desc = [sensacao, notes].filter(Boolean).join(' / ')

                        const cellBase: React.CSSProperties = {
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 6, lineHeight: 1.2, overflow: 'hidden', flexShrink: 0,
                        }
                        const divider = ci < 2 ? `1px solid ${DARK}` : undefined

                        return (
                          <div key={ci} style={{ flex: 1, display: 'flex', borderRight: divider }}>
                            {/* Symbol */}
                            <div style={{ ...cellBase, width: W.simb, borderRight: `0.5px solid ${LIGHT}` }}>
                              {status && <Sym status={status} bleedingIntensity={day?.record?.bleedingIntensity} />}
                            </div>
                            {/* Date */}
                            <div style={{ ...cellBase, width: W.data, borderRight: `0.5px solid ${LIGHT}`, fontSize: 5.5, color: '#222' }}>
                              {dateLabel}
                            </div>
                            {/* MOB */}
                            <div style={{ ...cellBase, width: W.mob, borderRight: `0.5px solid ${LIGHT}`, fontWeight: 'bold', color: '#111' }}>
                              {mob}
                            </div>
                            {/* Sensações */}
                            <div style={{
                              ...cellBase, flex: 1,
                              justifyContent: 'flex-start', padding: '0 2px',
                              fontSize: 5.5, color: '#333',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {desc}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>,
    document.body
  )
}

function cycleName(cycle: CycleCalendarData, names: Record<string, string>) {
  return (cycle.startDate ? names[cycle.startDate] : '') || `Ciclo ${cycle.cycleNumber}`
}
