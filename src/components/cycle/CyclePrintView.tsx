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

const DOT_POSITIONS: Record<2 | 3 | 5, [number, number][]> = {
  2: [[4, 5], [9, 9]],
  3: [[3, 4], [9, 3], [6, 9]],
  5: [[3, 3], [9, 2], [5, 6], [10, 7], [6, 11]],
}

const BLEEDING_DOT: Partial<Record<BleedingIntensity, 2 | 3 | 5>> = {
  leve: 2, moderado: 3, intenso: 5,
}

function PrintSymbol({ status, bleedingIntensity }: { status: CycleStatus; bleedingIntensity?: BleedingIntensity }) {
  const box: React.CSSProperties = {
    width: 14, height: 14, borderRadius: 2, border: '1px solid #666',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', fontSize: 5.5, fontWeight: 'bold', lineHeight: 1,
    flexShrink: 0,
  }

  if (status === 'mancha') {
    const count = (bleedingIntensity ? BLEEDING_DOT[bleedingIntensity] : undefined) ?? 3
    return (
      <div style={{ ...box, background: '#fca5a5', border: '1px solid #f87171' }}>
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          {DOT_POSITIONS[count].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1.8" fill="#b91c1c" />
          ))}
        </svg>
      </div>
    )
  }

  const configs: Partial<Record<CycleStatus, { bg: string; color: string; chars: string[] }>> = {
    menstruacao:         { bg: '#ef4444', color: 'white',  chars: ['●'] },
    pbi_seco:           { bg: '#22c55e', color: 'white',  chars: ['|'] },
    pbi_muco:           { bg: '#fde047', color: '#333',   chars: ['='] },
    mudanca:            { bg: 'white',   color: '#333',   chars: ['O'] },
    fertil:             { bg: 'white',   color: '#333',   chars: ['O'] },
    apice:              { bg: 'white',   color: '#333',   chars: ['O','✕'] },
    pos_apice_1:        { bg: 'white',   color: '#333',   chars: ['1','='] },
    pos_apice_2:        { bg: 'white',   color: '#333',   chars: ['2','='] },
    pos_apice_3:        { bg: 'white',   color: '#333',   chars: ['3','='] },
    infertil_pos_apice: { bg: '#fde047', color: '#333',   chars: ['='] },
  }

  const cfg = configs[status]
  if (!cfg) return null
  return (
    <div style={{ ...box, background: cfg.bg, color: cfg.color, border: `1px solid ${status === 'menstruacao' ? '#dc2626' : '#999'}` }}>
      {cfg.chars.map((c, i) => <span key={i} style={{ lineHeight: 1 }}>{c}</span>)}
    </div>
  )
}

const BORDER = '#555'
const LIGHT  = '#ccc'

const colWidths = { dia: 16, simb: 20, data: 26, mob: 18 }

function ColHeader() {
  const cell: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 6, padding: '1px 2px',
    background: '#e5e7eb', borderBottom: `1px solid ${BORDER}`,
    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  } as React.CSSProperties
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      <div style={{ ...cell, width: colWidths.dia,  borderRight: `1px solid ${LIGHT}` }}>Dia</div>
      <div style={{ ...cell, width: colWidths.simb, borderRight: `1px solid ${LIGHT}` }}>Simb</div>
      <div style={{ ...cell, width: colWidths.data, borderRight: `1px solid ${LIGHT}` }}>Data</div>
      <div style={{ ...cell, width: colWidths.mob,  borderRight: `1px solid ${LIGHT}` }}>MOB</div>
      <div style={{ ...cell, flex: 1 }}>Sensações</div>
    </div>
  )
}

function DayRow({ day, startDate }: { day: CycleCalendarData['days'][0]; startDate: string | null }) {
  const status = day.record?.cycleStatus ?? null
  const expectedDate = startDate
    ? format(addDays(parseISO(startDate), day.cycleDay - 1), 'yyyy-MM-dd')
    : day.date
  const targetDate = day.date ?? expectedDate
  const dateLabel = targetDate ? format(parseISO(targetDate), 'dd/MM') : ''
  const mob = day.record?.mobRule || (status ? MOB_AUTO[status] : '')
  const sensacao = day.record ? SENSATION_LABELS[day.record.sensation] : ''
  const notes = day.record?.notes ?? ''
  const descricao = [sensacao, notes].filter(Boolean).join(' / ')

  const rowBg =
    status === 'menstruacao' ? '#fee2e2' :
    status === 'mancha'      ? '#fecaca' :
    status === 'pbi_seco'   ? '#dcfce7' :
    (status === 'pbi_muco' || status === 'infertil_pos_apice') ? '#fefce8' :
    'white'

  const cell: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 6, lineHeight: 1.1, overflow: 'hidden',
  }

  return (
    <div style={{
      display: 'flex', flex: 1,
      borderBottom: `0.5px solid ${LIGHT}`,
      background: rowBg,
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      minHeight: 0,
    } as React.CSSProperties}>
      <div style={{ ...cell, width: colWidths.dia,  borderRight: `0.5px solid ${LIGHT}`, fontWeight: 'bold' }}>
        {String(day.cycleDay).padStart(2, '0')}
      </div>
      <div style={{ ...cell, width: colWidths.simb, borderRight: `0.5px solid ${LIGHT}` }}>
        {status && <PrintSymbol status={status} bleedingIntensity={day.record?.bleedingIntensity} />}
      </div>
      <div style={{ ...cell, width: colWidths.data, borderRight: `0.5px solid ${LIGHT}`, fontSize: 5.5 }}>
        {dateLabel}
      </div>
      <div style={{ ...cell, width: colWidths.mob,  borderRight: `0.5px solid ${LIGHT}`, fontWeight: 'bold' }}>
        {mob}
      </div>
      <div style={{ ...cell, flex: 1, justifyContent: 'flex-start', padding: '0 2px', fontSize: 5.5 }}>
        {descricao}
      </div>
    </div>
  )
}

function CycleColumn({ cycle, cycleName }: { cycle: CycleCalendarData; cycleName: string }) {
  const displayName = cycleName.trim() || `Ciclo ${cycle.cycleNumber}`
  const startLabel = cycle.startDate
    ? format(parseISO(cycle.startDate), 'd/MM/yyyy', { locale: ptBR })
    : '—'

  return (
    <div style={{
      flex: 1, border: `1px solid ${BORDER}`, minWidth: 0,
      display: 'flex', flexDirection: 'column',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    } as React.CSSProperties}>
      <div style={{
        background: '#d1d5db', borderBottom: `1px solid ${BORDER}`,
        padding: '2px 4px', textAlign: 'center', flexShrink: 0,
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      } as React.CSSProperties}>
        <div style={{ fontWeight: 'bold', fontSize: 7.5 }}>{displayName}</div>
        <div style={{ fontSize: 6, color: '#444' }}>Início: {startLabel}</div>
      </div>
      <ColHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {cycle.days.map(day => (
          <DayRow key={day.cycleDay} day={day} startDate={cycle.startDate} />
        ))}
      </div>
    </div>
  )
}

function BlankCycleColumn() {
  return (
    <div style={{
      flex: 1, border: `1px solid ${BORDER}`, minWidth: 0,
      display: 'flex', flexDirection: 'column',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    } as React.CSSProperties}>
      <div style={{
        background: '#d1d5db', borderBottom: `1px solid ${BORDER}`,
        padding: '2px 4px', textAlign: 'center', flexShrink: 0,
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      } as React.CSSProperties}>
        <div style={{ fontWeight: 'bold', fontSize: 7.5 }}>&nbsp;</div>
        <div style={{ fontSize: 6, color: '#444' }}>Início: —</div>
      </div>
      <ColHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {Array.from({ length: 35 }, (_, i) => {
          const cell: React.CSSProperties = {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 6, lineHeight: 1.1, overflow: 'hidden',
          }
          return (
            <div key={i} style={{ display: 'flex', flex: 1, borderBottom: `0.5px solid ${LIGHT}`, background: 'white', minHeight: 0 }}>
              <div style={{ ...cell, width: colWidths.dia,  borderRight: `0.5px solid ${LIGHT}`, fontWeight: 'bold' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ ...cell, width: colWidths.simb, borderRight: `0.5px solid ${LIGHT}` }} />
              <div style={{ ...cell, width: colWidths.data, borderRight: `0.5px solid ${LIGHT}` }} />
              <div style={{ ...cell, width: colWidths.mob,  borderRight: `0.5px solid ${LIGHT}` }} />
              <div style={{ ...cell, flex: 1 }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  cycles: CycleCalendarData[]
  cycleNames: Record<string, string>
}

export function CyclePrintView({ cycles, cycleNames }: Props) {
  const pages: CycleCalendarData[][] = []
  for (let i = 0; i < cycles.length; i += 3) {
    pages.push(cycles.slice(i, i + 3))
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden !important; }
          #cicla-print-root,
          #cicla-print-root * { visibility: visible !important; }
          #cicla-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div
        id="cicla-print-root"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden', visibility: 'hidden' }}
      >
        {cycles.length === 0 ? null : pages.map((pageCycles, pageIdx) => (
          <div
            key={pageIdx}
            style={{
              width: '297mm',
              height: '210mm',
              padding: '6mm',
              boxSizing: 'border-box',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Arial, sans-serif',
            } as React.CSSProperties}
          >
            <div style={{ fontSize: 8, textAlign: 'center', marginBottom: 3, fontWeight: 'bold', flexShrink: 0 }}>
              GRÁFICO CICLO MENSTRUAL — WOOMB
            </div>
            <div style={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
              {pageCycles.map((cycle) => (
                <CycleColumn
                  key={cycle.cycleNumber}
                  cycle={cycle}
                  cycleName={cycle.startDate ? (cycleNames[cycle.startDate] ?? '') : ''}
                />
              ))}
              {Array.from({ length: 3 - pageCycles.length }).map((_, i) => (
                <BlankCycleColumn key={`blank-${i}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
