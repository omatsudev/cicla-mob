import { format } from 'date-fns'
import type { IDailyRecordRepository } from '@/lib/domain/interfaces/IDailyRecordRepository'
import { interpretCycle } from '@/lib/domain/services/BillingsRulesEngine'
import type { CycleCalendarData, CycleDay } from './GetCycleCalendarUseCase'

export async function getAllCycles(
  userId: string,
  repository: IDailyRecordRepository,
): Promise<CycleCalendarData[]> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const records = await repository.findAllByUser(userId)
  const interpreted = interpretCycle(records)

  const cycleStartIndices: number[] = []
  interpreted.forEach((r, i) => {
    if (r.cycleDay === 1) cycleStartIndices.push(i)
  })

  if (cycleStartIndices.length === 0) return []

  const totalCycles = cycleStartIndices.length
  const cycles: CycleCalendarData[] = []

  // Iterate from oldest (reversedIndex=0) to most recent
  for (let reversedIndex = 0; reversedIndex < totalCycles; reversedIndex++) {
    const startIdx = cycleStartIndices[reversedIndex]
    const endIdx = reversedIndex < totalCycles - 1
      ? cycleStartIndices[reversedIndex + 1]
      : interpreted.length

    const cycleRecords = interpreted.slice(startIdx, endIdx)

    const days: CycleDay[] = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      const record = cycleRecords.find(r => r.cycleDay === day) ?? null
      return {
        cycleDay: day,
        date: record?.date ?? null,
        record,
        isToday: record?.date === today,
      }
    })

    const cycleIndex = totalCycles - 1 - reversedIndex // 0 = most recent
    cycles.push({
      cycleIndex,
      totalCycles,
      cycleNumber: reversedIndex + 1, // 1 = oldest, N = most recent
      startDate: cycleRecords[0]?.date ?? null,
      days,
    })
  }

  return cycles // already in chronological order (cycleNumber 1, 2, 3...)
}
