import { format, addDays, parseISO } from 'date-fns'
import type { IDailyRecordRepository } from '@/lib/domain/interfaces/IDailyRecordRepository'
import { interpretCycle } from '@/lib/domain/services/BillingsRulesEngine'
import type { InterpretedRecord } from '@/lib/domain/entities/DailyRecord'

export interface CycleDay {
  cycleDay: number
  date: string | null
  record: InterpretedRecord | null
  isToday: boolean
}

export interface CycleCalendarData {
  cycleIndex: number   // 0 = most recent
  totalCycles: number
  cycleNumber: number  // 1-based display
  startDate: string | null
  days: CycleDay[]     // 35 slots
}

export async function getCycleCalendar(
  userId: string,
  cycleIndex: number,
  repository: IDailyRecordRepository,
): Promise<CycleCalendarData> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const records = await repository.findAllByUser(userId)
  const interpreted = interpretCycle(records)

  const cycleStartIndices: number[] = []
  interpreted.forEach((r, i) => {
    if (r.cycleDay === 1) cycleStartIndices.push(i)
  })

  if (cycleStartIndices.length === 0) {
    return { cycleIndex: 0, totalCycles: 0, cycleNumber: 1, startDate: null, days: [] }
  }

  const totalCycles = cycleStartIndices.length
  const clampedIndex = Math.max(0, Math.min(cycleIndex, totalCycles - 1))
  const reversedIndex = totalCycles - 1 - clampedIndex

  const startIdx = cycleStartIndices[reversedIndex]
  const endIdx = reversedIndex < totalCycles - 1
    ? cycleStartIndices[reversedIndex + 1]
    : interpreted.length

  const cycleRecords = interpreted.slice(startIdx, endIdx)
  const startDate = cycleRecords[0]?.date ?? null

  const days: CycleDay[] = Array.from({ length: 35 }, (_, i) => {
    const day = i + 1
    const record = cycleRecords.find(r => r.cycleDay === day) ?? null
    // Use expected date even when there's no record yet
    const expectedDate = startDate
      ? format(addDays(parseISO(startDate), day - 1), 'yyyy-MM-dd')
      : null
    const dateForDay = record?.date ?? expectedDate
    return {
      cycleDay: day,
      date: record?.date ?? null,
      record,
      isToday: dateForDay === today,
    }
  })

  return {
    cycleIndex: clampedIndex,
    totalCycles,
    cycleNumber: reversedIndex + 1,
    startDate: cycleRecords[0]?.date ?? null,
    days,
  }
}
