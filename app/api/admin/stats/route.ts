/**
 * 관리자 통계 조회 API
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatApiError } from '@/lib/errors'
import type { AdminStats, AdminStatsResponse } from '@/types/api'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 관리자 권한 확인
    await requireAdmin(session?.user?.id)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setMonth(monthStart.getMonth() - 1)

    // 병렬 쿼리 실행
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      businessVerifiedUsers,
      creditStats,
      generationStats,
      subscriptionStats,
    ] = await Promise.all([
      // 전체 사용자 수
      prisma.user.count(),

      // 오늘 가입자
      prisma.user.count({
        where: { createdAt: { gte: todayStart } }
      }),

      // 이번 주 가입자
      prisma.user.count({
        where: { createdAt: { gte: weekStart } }
      }),

      // 이번 달 가입자
      prisma.user.count({
        where: { createdAt: { gte: monthStart } }
      }),

      // 사업자 인증 사용자
      prisma.user.count({
        where: { businessVerified: true }
      }),

      // 크레딧 통계
      prisma.creditTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
      }),

      // 이미지 생성 통계
      prisma.generationHistory.aggregate({
        _count: true,
        _sum: { imageCount: true },
      }),

      // 구독 통계
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ])

    // 크레딧 통계 계산
    const creditStatsMap = creditStats.reduce((acc, stat) => {
      acc[stat.type] = stat._sum.amount || 0
      return acc
    }, {} as Record<string, number>)

    // 기간별 생성 통계 (추가 쿼리)
    const [generationsToday, generationsThisWeek, generationsThisMonth] = await Promise.all([
      prisma.generationHistory.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.generationHistory.count({
        where: { createdAt: { gte: weekStart } }
      }),
      prisma.generationHistory.count({
        where: { createdAt: { gte: monthStart } }
      }),
    ])

    // 구독 통계 매핑
    const subscriptionMap = subscriptionStats.reduce((acc, stat) => {
      acc[stat.tier.toLowerCase()] = stat._count
      return acc
    }, {} as Record<string, number>)

    // 현재 유통 중인 크레딧 (모든 사용자 잔액 합계)
    const totalBalance = await prisma.credit.aggregate({
      _sum: { balance: true }
    })

    const stats: AdminStats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        businessVerified: businessVerifiedUsers,
      },
      credits: {
        totalInCirculation: totalBalance._sum.balance || 0,
        totalPurchased: creditStatsMap['PURCHASE'] || 0,
        totalBonusGranted: (creditStatsMap['BONUS'] || 0) + (creditStatsMap['REFERRAL'] || 0),
        totalUsed: Math.abs((creditStatsMap['GENERATION'] || 0) + (creditStatsMap['UPSCALE'] || 0)),
        totalExpired: Math.abs(creditStatsMap['EXPIRED'] || 0),
      },
      generations: {
        total: generationStats._count || 0,
        today: generationsToday,
        thisWeek: generationsThisWeek,
        thisMonth: generationsThisMonth,
      },
      subscriptions: {
        free: subscriptionMap['free'] || (totalUsers - Object.values(subscriptionMap).reduce((a, b) => a + b, 0)),
        plus: subscriptionMap['plus'] || 0,
        pro: subscriptionMap['pro'] || 0,
        enterprise: subscriptionMap['enterprise'] || 0,
      },
    }

    const response: AdminStatsResponse = {
      success: true,
      stats,
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
