/**
 * 관리자 사용자 목록 조회 API
 * GET /api/admin/users?search=&page=&limit=
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/permissions/admin'
import { prisma } from '@/lib/db'
import { formatApiError } from '@/lib/errors'
import type { AdminUser, AdminUsersResponse } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const whereCondition = search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

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
          credits: {
            select: { balance: true }
          },
          UsageStats: {
            select: { totalImages: true }
          },
          subscriptions: {
            select: { tier: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereCondition }),
    ])

    const adminUsers: AdminUser[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      creditBalance: user.credits?.balance ?? 0,
      totalGenerated: user.UsageStats?.totalImages ?? 0,
      createdAt: user.createdAt,
      businessVerified: user.businessVerified,
      subscriptionTier: user.subscriptions?.tier ?? 'FREE',
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
