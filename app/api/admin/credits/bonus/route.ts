/**
 * 관리자 보너스 크레딧 지급 API
 * POST /api/admin/credits/bonus
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/permissions'
import { grantAdminBonus } from '@/lib/utils/creditManager'
import { prisma } from '@/lib/prisma'
import {
  ValidationError,
  NotFoundError,
  formatApiError
} from '@/lib/errors'
import type { AdminBonusRequest, AdminBonusResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 관리자 권한 확인
    await requireAdmin(session?.user?.id)

    const body: AdminBonusRequest = await request.json()
    const { userId, amount, description, expiresInDays } = body

    // 유효성 검사
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('사용자 ID가 필요합니다')
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('유효한 크레딧 금액이 필요합니다 (1 이상)')
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new ValidationError('지급 사유가 필요합니다')
    }

    // 대상 사용자 존재 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      throw new NotFoundError('대상 사용자를 찾을 수 없습니다')
    }

    // 보너스 지급 (expiresInDays가 undefined면 기본 30일, null이면 무기한)
    const result = await grantAdminBonus(
      session!.user!.id,
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
