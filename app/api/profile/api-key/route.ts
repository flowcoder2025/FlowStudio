/**
 * API Key Management Endpoint
 *
 * @deprecated Phase 6에서 Vertex AI 중앙 인증으로 전환됨
 *
 * 이 엔드포인트는 더 이상 사용되지 않습니다.
 * 사용자는 이제 크레딧만 구매하면 이미지 생성 가능 (API 키 설정 불필요)
 *
 * 레거시 호환성:
 * - 기존 모바일 앱 클라이언트 지원을 위해 유지
 * - 새로운 클라이언트는 이 엔드포인트를 호출하지 않아야 함
 *
 * 관련 deprecated 모듈: /lib/utils/encryption.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/encryption'

/**
 * POST /api/profile/api-key
 * Save or update user's encrypted API key
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'API 키를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIzaSy')) {
      return NextResponse.json(
        { error: 'Gemini API 키 형식이 올바르지 않습니다. API 키는 "AIzaSy"로 시작해야 합니다.' },
        { status: 400 }
      )
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey.trim())

    // Save to database (upsert to handle both create and update)
    await prisma.apiKey.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        encryptedKey,
      },
      update: {
        encryptedKey,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'API 키가 안전하게 저장되었습니다.',
    })
  } catch (error: unknown) {
    console.error('API key save error:', error)

    // Handle encryption errors
    if (error instanceof Error && error.message?.includes('ENCRYPTION_KEY')) {
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'API 키 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/api-key
 * Check if user has configured an API key
 * (Does NOT return the actual key for security)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Check if API key exists
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true, // Only select non-sensitive fields
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      exists: !!apiKeyRecord,
      isConfigured: !!apiKeyRecord,
      lastUpdated: apiKeyRecord?.updatedAt || null,
    })
  } catch (error) {
    console.error('API key check error:', error)
    return NextResponse.json(
      { error: 'API 키 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/api-key
 * Remove user's API key from database
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    await prisma.apiKey.delete({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'API 키가 삭제되었습니다.',
    })
  } catch (error: unknown) {
    // Handle case where API key doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: '삭제할 API 키가 없습니다.' },
        { status: 404 }
      )
    }

    console.error('API key delete error:', error)
    return NextResponse.json(
      { error: 'API 키 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
