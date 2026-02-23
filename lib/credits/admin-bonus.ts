/**
 * Admin Bonus Credit Grant
 *
 * Grant bonus credits to users from admin dashboard
 */

import { prisma } from '@/lib/db'
import { ValidationError } from '@/lib/errors'

/**
 * 관리자 보너스 크레딧 지급
 *
 * @param adminId - 관리자 사용자 ID
 * @param userId - 대상 사용자 ID
 * @param amount - 지급 크레딧
 * @param description - 지급 사유
 * @param expiresInDays - 만료 기간 (null이면 무기한, 기본: 30일)
 */
export async function grantAdminBonus(
  adminId: string,
  userId: string,
  amount: number,
  description: string,
  expiresInDays: number | null = 30
): Promise<{
  transaction: {
    id: string
    userId: string
    amount: number
    description: string
    expiresAt: Date | null
  }
  newBalance: number
}> {
  if (amount <= 0) {
    throw new ValidationError('지급 금액은 0보다 커야 합니다')
  }

  const expiresAt = expiresInDays !== null
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const result = await prisma.$transaction(async (tx) => {
    const credit = await tx.credit.upsert({
      where: { userId },
      create: {
        userId,
        balance: amount,
        updatedAt: new Date()
      },
      update: {
        balance: { increment: amount },
        updatedAt: new Date()
      }
    })

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        remainingAmount: amount,
        type: 'BONUS',
        description,
        metadata: {
          type: 'admin_bonus',
          adminId,
          grantedAt: new Date().toISOString()
        },
        expiresAt
      }
    })

    return { credit, transaction }
  })

  return {
    transaction: {
      id: result.transaction.id,
      userId: result.transaction.userId,
      amount: result.transaction.amount,
      description: result.transaction.description || '',
      expiresAt: result.transaction.expiresAt
    },
    newBalance: result.credit.balance
  }
}
