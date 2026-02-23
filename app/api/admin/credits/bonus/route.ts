/**
 * 관리자 보너스 크레딧 지급 API
 * POST /api/admin/credits/bonus
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions/admin'
import { grantAdminBonus } from '@/lib/credits/admin-bonus'
import { prisma } from '@/lib/db'
import {
  ValidationError,
  NotFoundError,
  formatApiError
} from '@/lib/errors'
import type { AdminBonusRequest, AdminBonusResponse } from '@/types/admin'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const body: AdminBonusRequest = await request.json()
    const { userId, amount, description, expiresInDays } = body

    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('사용자 ID가 필요합니다')
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('유효한 크레딧 금액이 필요합니다 (1 이상)')
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new ValidationError('지급 사유가 필요합니다')
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      throw new NotFoundError('대상 사용자를 찾을 수 없습니다')
    }

    const result = await grantAdminBonus(
      session.user.id,
      userId,
      amount,
      description.trim(),
      expiresInDays === undefined ? 30 : expiresInDays
    )

    const response: AdminBonusResponse = {
      success: true,
      transaction: result.transaction,
      newBalance: result.newBalance
    }

    return NextResponse.json(response)

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
