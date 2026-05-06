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
    width: 16, height: 16, borderRadius: 2, border: '1px solid #666',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', fontSize: 6, fontWeight: 'bold', lineHeight: 1,
    flexShrink: 0,
  }

  if (status === 'mancha') {
    const count = (bleedingIntensity ? BLEEDING_DOT[bleedingIntensity] : undefined) ?? 3
    return (
      <div style={{ ...box, background: '#fca5a5', border: '1px solid #f87171' }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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

function CycleColumn({ cycle, cycleName }: { cycle: CycleCalendarData; cycleName: string }) {
  const displayName = cycleName.trim() || `Ciclo ${cycle.cycleNumber}`
  const startLabel = cycle.startDate
    ? format(parseISO(cycle.startDate), "d/MM/yyyy", { locale: ptBR })
    : '—'

  const borderColor = '#555'
  const lightBorder = '#ccc'

  const headerCell: React.CSSProperties = {
    textAlign: 'center', fontSize: 6.5, padding: '1px 2px',
    borderBottom: `1px solid ${lightBorder}`, background: '#e5e7eb',
    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  } as React.CSSProperties

  return (
    <div style={{ flex: 1, border: `1px solid ${borderColor}`, minWidth: 0, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
      {/* Header */}
      <div style={{ background: '#d1d5db', borderBottom: `1px solid ${borderColor}`, padding: '2px 4px', textAlign: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
        <div style={{ fontWeight: 'bold', fontSize: 8 }}>{displayName}</div>
        <div style={{ fontSize: 6.5, color: '#444' }}>Início: {startLabel}</div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
        {[['18px','Dia'],['22px','Simb'],['28px','Data'],['20px','MOB'],['1','Sensações']].map(([w, label], i, arr) => (
          <div key={label} style={{ ...(w === '1' ? { flex: 1 } : { width: w }), ...headerCell, borderRight: i < arr.length - 1 ? `1px solid ${lightBorder}` : undefined }}>
            {label}
          </div>
        ))}
      </div>

      {/* Day rows */}
      {cycle.days.map((day) => {
        const status = day.record?.cycleStatus ?? null
        const expectedDate = cycle.startDate
          ? format(addDays(parseISO(cycle.startDate), day.cycleDay - 1), 'yyyy-MM-dd')
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

        const row: React.CSSProperties = {
          display: 'flex', borderBottom: `0.5px solid ${lightBorder}`,
          minHeight: '5.5mm', background: rowBg,
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        } as React.CSSProperties

        const cell: React.CSSProperties = {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 6.5, lineHeight: 1.2,
        }

        return (
          <div key={day.cycleDay} style={row}>
            <div style={{ ...cell, width: 18, borderRight: `0.5px solid ${lightBorder}`, fontWeight: 'bold' }}>
              {String(day.cycleDay).padStart(2, '0')}
            </div>
            <div style={{ ...cell, width: 22, borderRight: `0.5px solid ${lightBorder}` }}>
              {status && <PrintSymbol status={status} bleedingIntensity={day.record?.bleedingIntensity} />}
            </div>
            <div style={{ ...cell, width: 28, borderRight: `0.5px solid ${lightBorder}`, fontSize: 6 }}>
              {dateLabel}
            </div>
            <div style={{ ...cell, width: 20, borderRight: `0.5px solid ${lightBorder}`, fontWeight: 'bold', fontSize: 6.5 }}>
              {mob}
            </div>
            <div style={{ ...cell, flex: 1, justifyContent: 'flex-start', padding: '0 2px', fontSize: 6 }}>
              {descricao}
            </div>
          </div>
        )
      })}
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
      {/* Global print styles injected once */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body * { visibility: hidden !important; }
          #cicla-print-root,
          #cicla-print-root * { visibility: visible !important; }
          #cicla-print-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      {/* Always in DOM but invisible on screen; visibility trick makes it appear on print */}
      <div
        id="cicla-print-root"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden', visibility: 'hidden' }}
      >
        <div style={{ fontFamily: 'Arial, sans-serif', visibility: 'visible' }}>
          {cycles.length === 0 ? null : (
            <>
              <div style={{ fontSize: 8, textAlign: 'center', marginBottom: 4, fontWeight: 'bold' }}>
                GRÁFICO CICLO MENSTRUAL — WOOMB
              </div>
              {pages.map((pageCycles, pageIdx) => (
                <div
                  key={pageIdx}
                  style={{
                    display: 'flex', gap: 4,
                    pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
                    breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
                  }}
                >
                  {pageCycles.map((cycle) => (
                    <CycleColumn
                      key={cycle.cycleNumber}
                      cycle={cycle}
                      cycleName={cycle.startDate ? (cycleNames[cycle.startDate] ?? '') : ''}
                    />
                  ))}
                  {pageCycles.length < 3 && Array.from({ length: 3 - pageCycles.length }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ flex: 1 }} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
