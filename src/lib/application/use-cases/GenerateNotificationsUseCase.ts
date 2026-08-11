import { generateNotificationsForToday } from '@/lib/domain/services/NotificationRulesEngine'
import { interpretCycle } from '@/lib/domain/services/BillingsRulesEngine'
import type { IDailyRecordRepository } from '@/lib/domain/interfaces/IDailyRecordRepository'
import type { IUserProfileRepository } from '@/lib/domain/interfaces/IUserProfileRepository'
import type { ICoupleRepository } from '@/lib/domain/interfaces/ICoupleRepository'
import type { INotificationRepository } from '@/lib/domain/interfaces/INotificationRepository'
import { format, subDays } from 'date-fns'

export async function generateNotifications(
  userId: string,
  recordRepo: IDailyRecordRepository,
  profileRepo: IUserProfileRepository,
  coupleRepo: ICoupleRepository,
  notifRepo: INotificationRepository,
): Promise<number> {
  const profile = await profileRepo.findById(userId)
  if (!profile?.notificationsEnabled) return 0

  const isMan = profile.userType === 'man'
  const coupleLink = await coupleRepo.findByUserId(userId)
  // Vinculado, os registros do casal ficam sob o id da mulher (registro compartilhado).
  const recordOwnerId = isMan && coupleLink ? coupleLink.womanId : userId

  const today = format(new Date(), 'yyyy-MM-dd')
  const since = format(subDays(new Date(), 45), 'yyyy-MM-dd')
  const rawRecords = await recordRepo.findAllByUser(recordOwnerId, since)
  const records = interpretCycle(rawRecords)
  const recentRecords = records.slice(-14)
  const todayRecord = records.find(r => r.date === today) ?? null
  const hasRecordToday = todayRecord !== null

  const partnerRecord = isMan && coupleLink
    ? (todayRecord ?? (records.length > 0 ? records[records.length - 1] : null))
    : null

  const toCreate = generateNotificationsForToday({
    userProfile: profile,
    todayRecord,
    recentRecords,
    hasRecordToday,
    partnerRecord,
  })

  let created = 0
  for (const input of toCreate) {
    const alreadySent = await notifRepo.hasTypeToday(userId, input.type)
    if (!alreadySent) {
      await notifRepo.create(input)
      created++
    }
  }

  return created
}
