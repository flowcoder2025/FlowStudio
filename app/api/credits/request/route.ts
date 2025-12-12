/**
 * 크레딧 충전 신청 API (계좌이체)
 * POST /api/credits/request
 *
 * 외부 웹훅으로 프록시 요청 (CORS 우회)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 웹훅 URL
const WEBHOOK_URL = 'https://jerome87.com/webhook/176a6de9-064d-4015-9ea7-b674919b6e1a'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, depositAmount, needTaxInvoice, taxInfo } = body

    // 유효성 검사
    if (!name || !email || !phone || !depositAmount) {
      return NextResponse.json(
        { success: false, error: '모든 항목을 입력해주세요' },
        { status: 400 }
      )
    }

    // 세금계산서 요청 시 추가 검증
    if (needTaxInvoice && taxInfo) {
      if (!taxInfo.businessName || !taxInfo.businessNumber || !taxInfo.representativeName || !taxInfo.businessType) {
        return NextResponse.json(
          { success: false, error: '세금계산서 발행을 위한 정보를 모두 입력해주세요' },
          { status: 400 }
        )
      }
    }

    const amount = parseInt(depositAmount)

    // 메시지 구성
    let message = `입금액: ₩${amount.toLocaleString()}원 | 사용자ID: ${session.user.id}`

    if (needTaxInvoice && taxInfo) {
      message += `\n\n[세금계산서 발행 요청]\n사업자명: ${taxInfo.businessName}\n사업자번호: ${taxInfo.businessNumber}\n대표자명: ${taxInfo.representativeName}\n업종/업태: ${taxInfo.businessType}`
    }

    // 웹훅 바디 구성
    const webhookBody = {
      category: 'credit-purchase',
      categoryTitle: needTaxInvoice ? '크레딧 충전 신청 (세금계산서)' : '크레딧 충전 신청',
      name: name,
      company: 'FlowStudio',
      phone: phone.replace(/-/g, ''),
      email: email,
      budget: null,
      referenceUrl: 'https://studio.flow-coder.com/',
      message: message,
      submittedAt: new Date().toISOString()
    }

    // 웹훅 전송
    console.log('[Credit Request] 웹훅 전송 시작:', WEBHOOK_URL)
    console.log('[Credit Request] 웹훅 바디:', JSON.stringify(webhookBody, null, 2))

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(webhookBody)
    })

    const responseText = await response.text()
    console.log('[Credit Request] 웹훅 응답:', response.status, responseText)

    if (!response.ok) {
      console.error('[Credit Request] 웹훅 전송 실패:', response.status, response.statusText, responseText)
      return NextResponse.json(
        { success: false, error: '신청 전송에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('[Credit Request] 신청 완료:', {
      userId: session.user.id,
      name,
      email,
      amount
    })

    return NextResponse.json({
      success: true,
      message: '크레딧 충전 신청이 완료되었습니다'
    })

  } catch (error) {
    console.error('[Credit Request] 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { success: false, error: `서버 오류: ${errorMessage}` },
      { status: 500 }
    )
  }
}
