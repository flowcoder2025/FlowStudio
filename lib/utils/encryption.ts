/**
 * AES-256-CBC 암호화 유틸리티
 * Gemini API 키 암호화/복호화에 사용
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
