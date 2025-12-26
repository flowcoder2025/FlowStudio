/**
 * 국세청 사업자등록정보 진위확인 API 유틸리티
 *
 * 공공데이터포탈 API 사용
 * https://www.data.go.kr/
 */

import { logger } from '@/lib/logger'

/**
 * 국세청 API 응답 타입
 */
export interface NTSBusinessStatusResponse {
  status_code: string  // "OK", "ERROR"
  data?: Array<{
    b_no: string                  // 사업자등록번호
    b_stt: string                 // 납세자상태 ("계속사업자", "휴업자", "폐업자")
    b_stt_cd: string             // 납세자상태코드 ("01": 계속, "02": 휴업, "03": 폐업)
    tax_type: string             // 과세유형 ("일반과세자", "간이과세자")
    tax_type_cd: string          // 과세유형코드
    end_dt: string               // 폐업일자 (YYYYMMDD)
    utcc_yn: string              // 단위과세전환사업자 여부 ("Y", "N")
    tax_type_change_dt: string   // 과세유형전환일자
    invoice_apply_dt: string     // 세금계산서적용일자
    rbf_tax_type: string         // 직전과세유형
    rbf_tax_type_cd: string      // 직전과세유형코드
  }>
  message?: string
}

/**
 * 사업자등록번호 형식 검증
 * @param businessNumber 사업자등록번호 (하이픈 포함 가능)
 * @returns 유효 여부
 */
export function validateBusinessNumber(businessNumber: string): boolean {
  // 하이픈 제거
  const cleaned = businessNumber.replace(/-/g, '')

  // 10자리 숫자 확인
  if (!/^\d{10}$/.test(cleaned)) {
    return false
  }

  // 체크섬 검증 (국세청 알고리즘)
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5, 1]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i]
  }

  // 9번째 자리 특수 계산
  sum += Math.floor((parseInt(cleaned[8]) * weights[8]) / 10)

  // 체크섬 확인
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[9])
}

/**
 * 사업자등록번호 정규화 (하이픈 제거)
 * @param businessNumber 사업자등록번호
 * @returns 정규화된 사업자등록번호 (10자리 숫자)
 */
export function normalizeBusinessNumber(businessNumber: string): string {
  return businessNumber.replace(/-/g, '')
}

/**
 * 국세청 API로 사업자등록정보 진위 확인
 * @param businessNumber 사업자등록번호 (10자리, 하이픈 제거)
 * @returns API 응답
 */
export async function verifyBusinessWithNTS(
  businessNumber: string
): Promise<NTSBusinessStatusResponse> {
  const apiKey = process.env.BUSINESS_VERIFICATION_API_KEY

  if (!apiKey) {
    throw new Error('BUSINESS_VERIFICATION_API_KEY 환경 변수가 설정되지 않았습니다')
  }

  // 하이픈 제거 및 정규화
  const normalized = normalizeBusinessNumber(businessNumber)

  // 형식 검증
  if (!validateBusinessNumber(normalized)) {
    throw new Error('유효하지 않은 사업자등록번호 형식입니다')
  }

  try {
    const response = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          b_no: [normalized] // 배열로 전송 (최대 100개)
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      logger.error('NTS API HTTP Error', {
        module: 'BusinessVerification',
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error('국세청 API 인증 오류: API 키를 확인해주세요')
      }

      throw new Error(`국세청 API 호출 실패: ${response.status} ${response.statusText}`)
    }

    const data: NTSBusinessStatusResponse = await response.json()

    if (data.status_code !== 'OK') {
      logger.error('NTS API Status Error', { module: 'BusinessVerification', response: data })
      throw new Error(data.message || '국세청 API 응답 오류')
    }

    return data

  } catch (error) {
    logger.error('NTS API Unexpected Error', { module: 'BusinessVerification' }, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * 사업자 상태 확인 (계속사업자 여부)
 * @param businessNumber 사업자등록번호
 * @returns { valid: boolean, status: string, reason?: string }
 */
export async function checkBusinessStatus(businessNumber: string): Promise<{
  valid: boolean
  status: string
  taxType?: string
  reason?: string
}> {
  try {
    const response = await verifyBusinessWithNTS(businessNumber)

    if (!response.data || response.data.length === 0) {
      return {
        valid: false,
        status: 'NOT_FOUND',
        reason: '사업자등록번호를 찾을 수 없습니다'
      }
    }

    const businessInfo = response.data[0]

    // 계속사업자(01)만 인증 허용
    if (businessInfo.b_stt_cd !== '01') {
      return {
        valid: false,
        status: businessInfo.b_stt,
        reason: `${businessInfo.b_stt} 상태의 사업자는 인증할 수 없습니다`
      }
    }

    return {
      valid: true,
      status: businessInfo.b_stt,
      taxType: businessInfo.tax_type
    }

  } catch (error: unknown) {
    logger.error('Business verification error', { module: 'BusinessVerification' }, error instanceof Error ? error : new Error(String(error)))

    const message = error instanceof Error ? error.message : '사업자 확인 중 오류가 발생했습니다'
    return {
      valid: false,
      status: 'ERROR',
      reason: message
    }
  }
}
