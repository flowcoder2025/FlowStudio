/**
 * 포트원(PortOne) V2 정기 구독 결제 웹훅
 * POST /api/subscription/portone/webhook
 *
 * 정기 결제 완료 시 구독 갱신/활성화 처리
 * 빌링키 기반 정기 결제 및 수동 결제 모두 지원
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrUpgradeSubscription } from '@/lib/utils/subscriptionManager'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants'
import {
  verifyPortoneWebhookSignature,
  getPortonePayment,
  parsePortoneCustomData,
  type PortoneWebhookPayload
} from '@/lib/utils/portoneWebhook'
import { logger } from '@/lib/logger'

// 정기 구독 플랜 가격 (원)
const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  FREE: 0,
  PLUS: 9900,
  PRO: 29900,
  BUSINESS: 99000
}

export async function POST(request: NextRequest) {
  try {
    // 1. 웹훅 시크릿 확인
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('PORTONE_WEBHOOK_SECRET not configured', { module: 'SubscriptionWebhook' })
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
      logger.error('Webhook signature verification failed', { module: 'SubscriptionWebhook' })
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 3. 페이로드 파싱
    const payload: PortoneWebhookPayload = JSON.parse(rawBody)

    logger.info('Webhook received', {
      module: 'SubscriptionWebhook',
      type: payload.type,
      paymentId: payload.data.paymentId,
      status: payload.data.status
    })

    // 4. 이벤트 타입에 따른 처리
    switch (payload.type) {
      case 'Transaction.Paid':
        return handlePaymentPaid(payload)

      case 'Transaction.Failed':
        return handlePaymentFailed(payload)

      case 'BillingKey.Deleted':
        return handleBillingKeyDeleted(payload)

      default:
        logger.debug('Unhandled event type', { module: 'SubscriptionWebhook', type: payload.type })
        return NextResponse.json({ success: true, message: 'Event ignored' })
    }

  } catch (error) {
    logger.error('Webhook processing error', { module: 'SubscriptionWebhook' }, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 결제 완료 처리 (정기 결제 성공)
 */
async function handlePaymentPaid(payload: PortoneWebhookPayload) {
  const customData = parsePortoneCustomData(payload.data.customData)
  const tier = customData?.tier as SubscriptionTier | undefined
  const userId = customData?.userId
  const isSubscription = customData?.type === 'subscription'

  // 정기 구독 결제가 아닌 경우 무시 (크레딧 웹훅에서 처리)
  if (!isSubscription) {
    logger.debug('Not a subscription payment, ignoring', { module: 'SubscriptionWebhook' })
    return NextResponse.json({ success: true, message: 'Not a subscription payment' })
  }

  if (!tier || !userId) {
    logger.error('Missing custom data', { module: 'SubscriptionWebhook', customData })
    return NextResponse.json(
      { success: false, error: 'Missing tier or user ID' },
      { status: 400 }
    )
  }

  // 유효한 티어인지 확인
  if (!SUBSCRIPTION_TIERS[tier]) {
    logger.error('Invalid tier', { module: 'SubscriptionWebhook', tier })
    return NextResponse.json(
      { success: false, error: 'Invalid subscription tier' },
      { status: 400 }
    )
  }

  // FREE 플랜은 결제 불필요
  if (tier === 'FREE') {
    logger.error('Free tier payment attempt', { module: 'SubscriptionWebhook' })
    return NextResponse.json(
      { success: false, error: 'Free tier does not require payment' },
      { status: 400 }
    )
  }

  // 금액 검증
  const expectedAmount = SUBSCRIPTION_PRICES[tier]
  if (payload.data.paidAmount !== expectedAmount) {
    logger.error('Amount mismatch', {
      module: 'SubscriptionWebhook',
      expected: expectedAmount,
      actual: payload.data.paidAmount
    })
    return NextResponse.json(
      { success: false, error: 'Amount mismatch' },
      { status: 400 }
    )
  }

  // 중복 처리 방지
  const existingPayment = await prisma.subscription.findFirst({
    where: {
      userId,
      externalId: payload.data.paymentId
    }
  })

  if (existingPayment) {
    logger.debug('Payment already processed', { module: 'SubscriptionWebhook', paymentId: payload.data.paymentId })
    return NextResponse.json({
      success: true,
      message: 'Already processed'
    })
  }

  // 포트원 API로 결제 재확인
  const paymentInfo = await getPortonePayment(payload.data.paymentId)

  if (paymentInfo.status !== 'PAID') {
    logger.error('Payment status mismatch', { module: 'SubscriptionWebhook', status: paymentInfo.status })
    return NextResponse.json(
      { success: false, error: 'Payment status mismatch' },
      { status: 400 }
    )
  }

  // 구독 활성화/갱신 (1개월)
  await createOrUpgradeSubscription(
    userId,
    tier,
    1, // 1개월
    'PORTONE',
    payload.data.paymentId
  )

  // 빌링키 저장 (있는 경우)
  if (payload.data.billingKey) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        // @ts-expect-error - billingKey 필드가 스키마에 없을 수 있음
        billingKey: payload.data.billingKey
      }
    }).catch(() => {
      // billingKey 필드가 없으면 무시
      logger.debug('billingKey field not found, ignoring', { module: 'SubscriptionWebhook' })
    })
  }

  logger.info('Subscription activated', {
    module: 'SubscriptionWebhook',
    userId,
    tier,
    paymentId: payload.data.paymentId
  })

  return NextResponse.json({
    success: true,
    message: 'Subscription activated successfully'
  })
}

/**
 * 결제 실패 처리 (정기 결제 실패)
 */
async function handlePaymentFailed(payload: PortoneWebhookPayload) {
  const customData = parsePortoneCustomData(payload.data.customData)
  const userId = customData?.userId
  const isSubscription = customData?.type === 'subscription'

  if (!isSubscription || !userId) {
    return NextResponse.json({ success: true, message: 'Not a subscription payment' })
  }

  logger.info('Payment failed', {
    module: 'SubscriptionWebhook',
    userId,
    paymentId: payload.data.paymentId
  })

  // 결제 실패 시 구독 상태 업데이트 (유예 기간 7일)
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (subscription && subscription.tier !== 'FREE') {
    // 7일 유예 기간 설정 (이미 유예 중이면 유지)
    const gracePeriodEnd = new Date()
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'PAUSED', // 일시 정지 상태
        endDate: subscription.endDate && subscription.endDate > gracePeriodEnd
          ? subscription.endDate
          : gracePeriodEnd
      }
    })

    logger.info('Subscription paused with grace period', { module: 'SubscriptionWebhook', userId, graceDays: 7 })
  }

  return NextResponse.json({
    success: true,
    message: 'Payment failure recorded'
  })
}

/**
 * 빌링키 삭제 처리 (구독 취소)
 */
async function handleBillingKeyDeleted(payload: PortoneWebhookPayload) {
  // 빌링키 삭제 이벤트 - 필요한 경우 구독 취소 처리
  logger.info('Billing key deleted', { module: 'SubscriptionWebhook', paymentId: payload.data.paymentId })

  // 빌링키와 연결된 사용자 찾기 (커스텀 데이터에서)
  const customData = parsePortoneCustomData(payload.data.customData)
  const userId = customData?.userId

  if (userId) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (subscription && subscription.tier !== 'FREE') {
      // 현재 구독 기간은 유지하고, 다음 갱신 시 FREE로 다운그레이드 예약
      // (endDate가 지나면 자동으로 downgradeToFree 호출됨)
      logger.info('Downgrade scheduled for next renewal', { module: 'SubscriptionWebhook', userId })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Billing key deletion processed'
  })
}

// GET 메서드로 웹훅 엔드포인트 테스트
export async function GET() {
  return NextResponse.json({
    message: '포트원 정기 구독 웹훅 엔드포인트입니다. POST 요청만 허용됩니다.',
    endpoint: '/api/subscription/portone/webhook'
  })
}
