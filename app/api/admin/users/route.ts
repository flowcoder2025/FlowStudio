/**
 * 관리자 사용자 목록 조회 API
 * GET /api/admin/users?search=&page=&limit=
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatApiError } from '@/lib/errors'
import type { AdminUser, AdminUsersResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 관리자 권한 확인
    await requireAdmin(session?.user?.id)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // 검색 조건
    const whereCondition = search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // 사용자 목록 조회 (관계 데이터 포함)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          businessVerified: true,
          credit: {
            select: { balance: true }
          },
          usageStats: {
            select: { totalImages: true }
          },
          subscription: {
            select: { tier: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereCondition }),
    ])

    // 응답 형식 변환
    const adminUsers: AdminUser[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      creditBalance: user.credit?.balance ?? 0,
      totalGenerated: user.usageStats?.totalImages ?? 0,
      createdAt: user.createdAt,
      businessVerified: user.businessVerified,
      subscriptionTier: user.subscription?.tier ?? 'FREE',
    }))

    const response: AdminUsersResponse = {
      users: adminUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
