/**
 * 고객센터 문의 API
 * POST /api/contact
 *
 * 외부 웹훅으로 문의 내용 전송
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// 웹훅 URL
const WEBHOOK_URL = 'https://jerome87.com/webhook/176a6de9-064d-4015-9ea7-b674919b6e1a'

// 문의 유형 매핑
const INQUIRY_TYPE_MAP: Record<string, string> = {
  usage: '서비스 이용 문의',
  payment: '결제/환불 문의',
  bug: '오류/버그 신고',
  feature: '기능 제안',
  partnership: '제휴/협력 문의',
  other: '기타 문의'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, inquiryType, message } = body

    // 유효성 검사
    if (!name || !email || !inquiryType || !message) {
      return NextResponse.json(
        { success: false, error: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      )
    }

    // 웹훅 바디 구성
    const webhookBody = {
      category: 'customer-support',
      categoryTitle: `고객문의: ${INQUIRY_TYPE_MAP[inquiryType] || '기타'}`,
      name: name,
      company: 'FlowStudio',
      phone: phone ? phone.replace(/-/g, '') : '',
      email: email,
      budget: null,
      referenceUrl: 'https://studio.flow-coder.com/',
      message: `[${INQUIRY_TYPE_MAP[inquiryType] || inquiryType}]\n\n${message}`,
      submittedAt: new Date().toISOString()
    }

    // 웹훅 전송
    logger.debug('웹훅 전송 시작', { module: 'Contact', url: WEBHOOK_URL })
    logger.debug('웹훅 바디', { module: 'Contact', body: webhookBody })

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(webhookBody)
    })

    const responseText = await response.text()
    logger.debug('웹훅 응답', { module: 'Contact', status: response.status, body: responseText })

    if (!response.ok) {
      logger.error('웹훅 전송 실패', { module: 'Contact', status: response.status, statusText: response.statusText })
      return NextResponse.json(
        { success: false, error: '문의 전송에 실패했습니다' },
        { status: 500 }
      )
    }

    logger.info('문의 접수 완료', { module: 'Contact', name, email, inquiryType })

    return NextResponse.json({
      success: true,
      message: '문의가 접수되었습니다'
    })

  } catch (error) {
    logger.error('문의 처리 오류', { module: 'Contact' }, error instanceof Error ? error : new Error(String(error)))
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json(
      { success: false, error: `서버 오류: ${errorMessage}` },
      { status: 500 }
    )
  }
}
