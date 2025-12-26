/**
 * 사업자 인증 API
 * /api/profile/business-verification
 *
 * POST: 사업자등록번호 인증 요청
 * GET: 인증 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBusinessStatus, normalizeBusinessNumber } from '@/lib/utils/businessVerification'
import { addCredits } from '@/lib/utils/creditManager'
import { awardReferralCredits } from '@/lib/utils/referralManager'
import { UnauthorizedError, ValidationError, formatApiError } from '@/lib/errors'

/**
 * GET: 사업자 인증 상태 조회
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 사용자의 사업자 인증 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        businessNumber: true,
        businessOwnerName: true,
        businessPhone: true,
        businessVerified: true,
        businessVerifiedAt: true,
        businessBonusClaimed: true
      }
    })

    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다')
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: user.businessVerified,
        verifiedAt: user.businessVerifiedAt,
        bonusClaimed: user.businessBonusClaimed,
        businessNumber: user.businessNumber,
        ownerName: user.businessOwnerName,
        phone: user.businessPhone
      }
    })

  } catch (error) {
    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}

/**
 * POST: 사업자등록번호 인증 요청
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new UnauthorizedError('로그인이 필요합니다')
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { businessNumber, ownerName, phone } = body

    // 필수 필드 검증
    if (!businessNumber || !ownerName || !phone) {
      throw new ValidationError('사업자등록번호, 담당자 이름, 전화번호를 모두 입력해주세요')
    }

    // 사업자등록번호 정규화 (하이픈 제거)
    const normalized = normalizeBusinessNumber(businessNumber)

    // 이미 인증된 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (existingUser?.businessVerified) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 사업자 인증이 완료되었습니다'
        },
        { status: 400 }
      )
    }

    // 중복 사업자번호 확인
    const duplicateBusiness = await prisma.user.findFirst({
      where: {
        businessNumber: normalized,
        businessVerified: true,
        id: { not: session.user.id } // 본인은 제외
      }
    })

    if (duplicateBusiness) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 등록된 사업자등록번호입니다'
        },
        { status: 400 }
      )
    }

    // 국세청 API로 사업자 진위 확인
    console.log('[Business Verification] Checking business number:', normalized)
    const verification = await checkBusinessStatus(normalized)

    if (!verification.valid) {
      console.log('[Business Verification] Failed:', verification)
      return NextResponse.json(
        {
          success: false,
          error: verification.reason || '사업자 인증에 실패했습니다'
        },
        { status: 400 }
      )
    }

    console.log('[Business Verification] Success:', verification)

    // 사용자 정보 업데이트 (인증 완료)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessNumber: normalized,
        businessOwnerName: ownerName,
        businessPhone: phone,
        businessVerified: true,
        businessVerifiedAt: new Date()
      }
    })

    // 사업자 보너스 크레딧 지급 (100 크레딧)
    // 최초 1회만 지급
    if (!existingUser?.businessBonusClaimed) {
      await addCredits(
        session.user.id,
        100, // 사업자 보너스 크레딧
        'BONUS',
        '사업자 인증 완료 보너스',
        {
          type: 'business_verification',
          businessNumber: normalized
        }
      )

      // 보너스 지급 완료 표시
      await prisma.user.update({
        where: { id: session.user.id },
        data: { businessBonusClaimed: true }
      })

      console.log('[Business Verification] Bonus credited: 100 credits')
    }

    // 레퍼럴 크레딧 지급 (추천인과 가입자 각각 50 크레딧)
    // 레퍼럴 실패가 사업자 인증을 차단하지 않도록 try-catch로 감싸기
    try {
      const referralAwarded = await awardReferralCredits(session.user.id)
      if (referralAwarded) {
        console.log('[Business Verification] Referral credits awarded: 50 credits each to referrer and referred')
      }
    } catch (referralError) {
      // 레퍼럴 크레딧 지급 실패는 사업자 인증을 차단하지 않음
      console.error('[Business Verification] Referral credit award failed:', referralError)
    }

    return NextResponse.json({
      success: true,
      message: '사업자 인증이 완료되었습니다',
      data: {
        verified: true,
        verifiedAt: updatedUser.businessVerifiedAt,
        bonusCredits: existingUser?.businessBonusClaimed ? 0 : 100,
        businessStatus: verification.status,
        taxType: verification.taxType
      }
    })

  } catch (error: unknown) {
    console.error('[Business Verification] API Error:', error)

    const apiError = formatApiError(error)
    return NextResponse.json(
      { success: false, error: apiError.error },
      { status: apiError.statusCode }
    )
  }
}
