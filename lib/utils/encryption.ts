/**
 * AES-256-CBC 암호화 유틸리티
 *
 * @deprecated Phase 6에서 Vertex AI 중앙 인증으로 전환됨
 * 사용자 개별 API 키 저장이 더 이상 필요하지 않음
 *
 * 이 모듈은 레거시 호환성을 위해 유지되며,
 * 새로운 기능에서는 사용하지 않아야 함
 *
 * 관련 deprecated 엔드포인트: /api/profile/api-key
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

/**
 * 텍스트 암호화
 * @param text - 암호화할 텍스트
 * @returns 암호화된 문자열 (형식: iv:encryptedData)
 */
export function encrypt(text: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(encryptionKey, 'hex'),
    iv
  )

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * 텍스트 복호화
 * @param encryptedText - 암호화된 문자열 (형식: iv:encryptedData)
 * @returns 복호화된 원본 텍스트
 */
export function decrypt(encryptedText: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (encryptionKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  const parts = encryptedText.split(':')

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = Buffer.from(parts[1], 'hex')

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(encryptionKey, 'hex'),
    iv
  )

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}
