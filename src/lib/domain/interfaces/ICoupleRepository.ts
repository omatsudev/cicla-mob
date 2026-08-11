import type { CoupleLink } from '@/lib/domain/entities/CoupleLink'

export interface ICoupleRepository {
  findByUserId(userId: string): Promise<CoupleLink | null>
  findPartnerProfile(userId: string): Promise<{ id: string; name: string } | null>
  unlink(userId: string): Promise<void>
}
