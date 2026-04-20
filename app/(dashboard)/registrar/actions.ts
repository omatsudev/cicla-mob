'use server'

import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { saveDailyRecord } from '@/lib/application/use-cases/SaveDailyRecordUseCase'
import type { Sensation } from '@/lib/domain/enums/Sensation'
import type { MucusAppearance } from '@/lib/domain/enums/MucusAppearance'
import type { MucusQuantity } from '@/lib/domain/enums/MucusQuantity'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

interface SaveRecordInput {
  date: string
  sensation: Sensation
  mucusAppearance: MucusAppearance
  mucusQuantity: MucusQuantity
  bleedingIntensity: BleedingIntensity
  notes: string
}

export async function saveRecordAction(
  input: SaveRecordInput,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

    const repository = new SupabaseDailyRecordRepository(supabase)

    await saveDailyRecord(
      {
        userId: user.id,
        date: input.date,
        sensation: input.sensation,
        mucusAppearance: input.mucusAppearance,
        mucusQuantity: input.mucusQuantity,
        bleedingIntensity: input.bleedingIntensity,
        notes: input.notes,
      },
      repository,
    )

    return {}
  } catch (err) {
    return { error: 'Erro ao salvar registro. Tente novamente.' }
  }
}
