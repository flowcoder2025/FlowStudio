/**
 * 포트원(PortOne) V2 웹훅 검증 유틸리티
 *
 * 포트원 V2는 웹훅 요청에 서명을 포함하여 전송합니다.
 * 이 서명을 검증하여 요청이 포트원에서 온 것인지 확인합니다.
 */

import { createHmac } from 'crypto'

/**
 * 포트원 웹훅 서명 검증
 *
 * @param signature - 헤더에서 받은 서명 (X-Portone-Signature)
 * @param body - 웹훅 요청 body (raw string)
 * @param webhookSecret - 포트원 웹훅 시크릿 (환경 변수)
 * @returns 서명이 유효하면 true
 */
export function verifyPortoneWebhookSignature(
  signature: string,
  body: string,
  webhookSecret: string
): boolean {
  try {
    // HMAC-SHA256으로 서명 생성
    const computedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    // 타이밍 공격 방지를 위한 constant-time 비교
    return timingSafeEqual(signature, computedSignature)

  } catch (error) {
    console.error('포트원 웹훅 서명 검증 오류:', error)
    return false
  }
}

/**
 * Constant-time 문자열 비교 (타이밍 공격 방지)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * 포트원 결제 정보 조회 API 호출
 * 웹훅 검증 후 실제 결제 상태를 재확인하기 위해 사용
 *
 * @param paymentId - 결제 ID
 * @returns 결제 정보
 */
export async function getPortonePayment(paymentId: string) {
  const apiSecret = process.env.PORTONE_API_SECRET

  if (!apiSecret) {
    throw new Error('PORTONE_API_SECRET 환경 변수가 설정되지 않았습니다')
  }

  const response = await fetch(
    `https://api.portone.io/payments/${paymentId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${apiSecret}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `포트원 결제 조회 실패: ${response.status} ${JSON.stringify(errorData)}`
    )
  }

  return response.json()
}

/**
 * 포트원 웹훅 페이로드 타입 정의
 */
export interface PortoneWebhookPayload {
  type: 'Transaction.Paid' | 'Transaction.Failed' | 'Transaction.Cancelled'
  timestamp: string
  data: {
    paymentId: string
    transactionId: string
    storeId: string
    channelKey: string
    orderName: string
    currency: string
    totalAmount: number
    paidAmount: number
    status: 'PAID' | 'FAILED' | 'CANCELLED'
    paidAt?: string
    pgTxId?: string
    pgProvider?: string
    method?: {
      type: 'EASY_PAY'
      easyPayProvider?: 'KAKAOPAY' | 'TOSSPAY' | 'NAVERPAY'
    }
    customData?: string // JSON 문자열 (packageId 등 저장)
  }
}

/**
 * 웹훅 페이로드에서 커스텀 데이터 파싱
 */
export function parsePortoneCustomData(customDataString?: string) {
  if (!customDataString) return null

  try {
    return JSON.parse(customDataString) as {
      packageId?: string
      userId?: string
    }
  } catch (error) {
    console.error('포트원 커스텀 데이터 파싱 오류:', error)
    return null
  }
}
