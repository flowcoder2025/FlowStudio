/**
 * 포트원(PortOne) V2 웹훅 처리 API
 * POST /api/credits/portone/webhook
 *
 * 포트원에서 결제 완료/실패/취소 시 호출됩니다.
 * 웹훅 검증 후 크레딧을 지급합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addCredits } from '@/lib/utils/creditManager'
import {
  verifyPortoneWebhookSignature,
  getPortonePayment,
  parsePortoneCustomData,
  type PortoneWebhookPayload
} from '@/lib/utils/portoneWebhook'

// 크레딧 패키지 정의 (pricing-strategy.md에서)
const CREDIT_PACKAGES = {
  starter: { credits: 100, price: 10000, name: '스타터' },
  basic: { credits: 300, price: 28000, name: '베이직' },
  pro: { credits: 1000, price: 90000, name: '프로' },
  business: { credits: 3000, price: 250000, name: '비즈니스' }
} as const

type PackageId = keyof typeof CREDIT_PACKAGES

export async function POST(request: NextRequest) {
  try {
    // 1. 웹훅 시크릿 확인
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Webhook] PORTONE_WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다')
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // 2. 서명 검증
    const signature = request.headers.get('X-Portone-Signature') || ''
    const rawBody = await request.text()

    const isValid = verifyPortoneWebhookSignature(signature, rawBody, webhookSecret)

    if (!isValid) {
      console.error('[Webhook] 서명 검증 실패')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 3. 페이로드 파싱
    const payload: PortoneWebhookPayload = JSON.parse(rawBody)

    console.log('[Webhook] 수신:', {
      type: payload.type,
      paymentId: payload.data.paymentId,
      status: payload.data.status
    })

    // 4. 결제 완료 이벤트만 처리
    if (payload.type !== 'Transaction.Paid' || payload.data.status !== 'PAID') {
      console.log('[Webhook] 결제 완료 아님, 무시:', payload.type, payload.data.status)
      return NextResponse.json({ success: true, message: 'Ignored non-paid event' })
    }

    // 5. 커스텀 데이터에서 패키지 ID 및 사용자 ID 추출
    const customData = parsePortoneCustomData(payload.data.customData)
    const packageId = customData?.packageId as PackageId | undefined
    const userId = customData?.userId

    if (!packageId || !userId) {
      console.error('[Webhook] 커스텀 데이터 누락:', customData)
      return NextResponse.json(
        { success: false, error: 'Missing package or user ID' },
        { status: 400 }
      )
    }

    const pkg = CREDIT_PACKAGES[packageId]
    if (!pkg) {
      console.error('[Webhook] 유효하지 않은 패키지 ID:', packageId)
      return NextResponse.json(
        { success: false, error: 'Invalid package ID' },
        { status: 400 }
      )
    }

    // 6. 금액 검증
    if (payload.data.paidAmount !== pkg.price) {
      console.error('[Webhook] 금액 불일치:', {
        expected: pkg.price,
        actual: payload.data.paidAmount
      })
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // 7. 중복 처리 방지 (이미 처리된 결제인지 확인)
    const existingTransaction = await prisma.creditTransaction.findFirst({
      where: {
        userId,
        metadata: {
          path: ['paymentId'],
          equals: payload.data.paymentId
        }
      }
    })

    if (existingTransaction) {
      console.log('[Webhook] 이미 처리된 결제:', payload.data.paymentId)
      return NextResponse.json({
        success: true,
        message: 'Already processed'
      })
    }

    // 8. 포트원 API로 결제 재확인 (이중 검증)
    const paymentInfo = await getPortonePayment(payload.data.paymentId)

    if (paymentInfo.status !== 'PAID') {
      console.error('[Webhook] 포트원 API 결제 상태 불일치:', paymentInfo.status)
      return NextResponse.json(
        { success: false, error: 'Payment status mismatch' },
        { status: 400 }
      )
    }

    // 9. 크레딧 지급
    const result = await addCredits(
      userId,
      pkg.credits,
      'PURCHASE',
      `${pkg.name} 패키지 충전 (포트원 - 카카오페이)`,
      {
        packageId,
        paymentId: payload.data.paymentId,
        paymentProvider: 'PORTONE',
        pgProvider: payload.data.method?.easyPayProvider || 'KAKAOPAY',
        method: 'EASY_PAY',
        paidAt: payload.data.paidAt,
        amount: payload.data.paidAmount,
        currency: payload.data.currency
      }
    )

    console.log('[Webhook] 크레딧 지급 완료:', {
      userId,
      credits: pkg.credits,
      newBalance: result.balance
    })

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      balance: result.balance
    })

  } catch (error) {
    console.error('[Webhook] 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET 메서드로 웹훅 엔드포인트 테스트
export async function GET() {
  return NextResponse.json({
    message: '포트원 웹훅 엔드포인트입니다. POST 요청만 허용됩니다.',
    endpoint: '/api/credits/portone/webhook'
  })
}
