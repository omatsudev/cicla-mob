'use server'

import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { getRecordHistory } from '@/lib/application/use-cases/GetRecordHistoryUseCase'
import { SENSATION_LABELS } from '@/lib/domain/enums/Sensation'
import { MUCUS_APPEARANCE_LABELS } from '@/lib/domain/enums/MucusAppearance'
import { CYCLE_STATUS_DISPLAY } from '@/lib/domain/enums/CycleStatus'

export async function exportCsvAction(): Promise<{ csv?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão expirada.' }

    const repository = new SupabaseDailyRecordRepository(supabase)
    const { records } = await getRecordHistory(user.id, repository)

    const header = 'Data,Sensação,Aparência do Muco,Sangramento,Status,Dia do Ciclo,Observações'
    const rows = records.map((r) =>
      [
        r.date,
        SENSATION_LABELS[r.sensation],
        MUCUS_APPEARANCE_LABELS[r.mucusAppearance],
        r.bleedingIntensity,
        CYCLE_STATUS_DISPLAY[r.cycleStatus].label,
        r.cycleDay,
        `"${r.notes.replace(/"/g, '""')}"`,
      ].join(','),
    )

    return { csv: [header, ...rows].join('\n') }
  } catch {
    return { error: 'Erro ao exportar dados.' }
  }
}
