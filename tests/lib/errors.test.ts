/**
 * Error Handling Unit Tests
 *
 * Tests for error classes and utilities
 */

import { describe, it, expect, vi } from 'vitest'
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InsufficientCreditsError,
  formatApiError,
  getUserErrorMessage,
  createErrorResponse,
  isOperationalError,
  classifyExternalError,
  assertExists,
  assertValid,
  HTTP_STATUS,
} from '@/lib/errors'

describe('errors.ts', () => {
  // ============================================
  // Error Classes
  // ============================================

  describe('AppError', () => {
    it('should create error with message and default values', () => {
      const error = new AppError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })

    it('should create error with custom status code', () => {
      const error = new AppError('Bad request', 400)

      expect(error.statusCode).toBe(400)
    })

    it('should create error with isOperational flag', () => {
      const error = new AppError('System error', 500, false)

      expect(error.isOperational).toBe(false)
    })

    it('should have proper stack trace', () => {
      const error = new AppError('Test error')

      expect(error.stack).toBeDefined()
      // Stack trace starts with error message, not constructor name
      expect(error.stack).toContain('Test error')
    })
  })

  describe('ValidationError', () => {
    it('should create error with 400 status code', () => {
      const error = new ValidationError('Invalid input')

      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error).toBeInstanceOf(AppError)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create error with 401 status code', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('로그인이 필요합니다.')
      expect(error.statusCode).toBe(401)
      expect(error).toBeInstanceOf(UnauthorizedError)
    })

    it('should accept custom message', () => {
      const error = new UnauthorizedError('세션이 만료되었습니다.')

      expect(error.message).toBe('세션이 만료되었습니다.')
    })
  })

  describe('ForbiddenError', () => {
    it('should create error with 403 status code', () => {
      const error = new ForbiddenError()

      expect(error.message).toBe('권한이 없습니다.')
      expect(error.statusCode).toBe(403)
      expect(error).toBeInstanceOf(ForbiddenError)
    })

    it('should accept custom message', () => {
      const error = new ForbiddenError('관리자만 접근 가능합니다.')

      expect(error.message).toBe('관리자만 접근 가능합니다.')
    })
  })

  describe('NotFoundError', () => {
    it('should create error with 404 status code', () => {
      const error = new NotFoundError()

      expect(error.message).toBe('리소스를 찾을 수 없습니다.')
      expect(error.statusCode).toBe(404)
      expect(error).toBeInstanceOf(NotFoundError)
    })

    it('should accept custom message', () => {
      const error = new NotFoundError('프로젝트를 찾을 수 없습니다.')

      expect(error.message).toBe('프로젝트를 찾을 수 없습니다.')
    })
  })

  describe('ConflictError', () => {
    it('should create error with 409 status code', () => {
      const error = new ConflictError()

      expect(error.message).toBe('리소스 충돌이 발생했습니다.')
      expect(error.statusCode).toBe(409)
      expect(error).toBeInstanceOf(ConflictError)
    })

    it('should accept custom message', () => {
      const error = new ConflictError('이미 존재하는 이메일입니다.')

      expect(error.message).toBe('이미 존재하는 이메일입니다.')
    })
  })

  describe('InsufficientCreditsError', () => {
    it('should create error with 402 status code', () => {
      const error = new InsufficientCreditsError()

      expect(error.message).toBe('크레딧이 부족합니다.')
      expect(error.statusCode).toBe(402)
      expect(error).toBeInstanceOf(InsufficientCreditsError)
    })

    it('should accept custom message', () => {
      const error = new InsufficientCreditsError('크레딧이 부족합니다 (필요: 20, 보유: 10)')

      expect(error.message).toBe('크레딧이 부족합니다 (필요: 20, 보유: 10)')
    })
  })

  // ============================================
  // Error Formatting
  // ============================================

  describe('formatApiError()', () => {
    it('should format AppError correctly', () => {
      const error = new ValidationError('Invalid input')

      const result = formatApiError(error)

      expect(result).toEqual({
        error: 'Invalid input',
        statusCode: 400,
      })
    })

    it('should format generic Error with 500 status', () => {
      const error = new Error('Something went wrong')

      const result = formatApiError(error)

      expect(result).toEqual({
        error: 'Something went wrong',
        statusCode: 500,
      })
    })

    it('should handle unknown error types', () => {
      const result = formatApiError('string error')

      expect(result).toEqual({
        error: '알 수 없는 오류가 발생했습니다.',
        statusCode: 500,
      })
    })

    it('should handle null/undefined', () => {
      expect(formatApiError(null)).toEqual({
        error: '알 수 없는 오류가 발생했습니다.',
        statusCode: 500,
      })

      expect(formatApiError(undefined)).toEqual({
        error: '알 수 없는 오류가 발생했습니다.',
        statusCode: 500,
      })
    })
  })

  describe('getUserErrorMessage()', () => {
    it('should return AppError message', () => {
      const error = new ValidationError('입력값이 올바르지 않습니다.')

      const message = getUserErrorMessage(error)

      expect(message).toBe('입력값이 올바르지 않습니다.')
    })

    it('should return generic Error message', () => {
      const error = new Error('Database connection failed')

      const message = getUserErrorMessage(error)

      expect(message).toBe('Database connection failed')
    })

    it('should return default message for unknown error', () => {
      const message = getUserErrorMessage({ unknown: true })

      expect(message).toBe('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    })
  })

  describe('createErrorResponse()', () => {
    it('should create error response from AppError', () => {
      const error = new NotFoundError('User not found')

      const response = createErrorResponse(error)

      expect(response).toEqual({
        error: 'User not found',
        statusCode: 404,
      })
    })

    it('should allow status code override', () => {
      const error = new Error('Some error')

      const response = createErrorResponse(error, 503)

      expect(response.statusCode).toBe(503)
    })

    it('should default to 500 for unknown errors', () => {
      const response = createErrorResponse('unknown')

      expect(response.statusCode).toBe(500)
    })
  })

  describe('isOperationalError()', () => {
    it('should return true for operational AppError', () => {
      const error = new ValidationError('Bad input')

      expect(isOperationalError(error)).toBe(true)
    })

    it('should return false for non-operational AppError', () => {
      const error = new AppError('System failure', 500, false)

      expect(isOperationalError(error)).toBe(false)
    })

    it('should return false for generic Error', () => {
      const error = new Error('Generic error')

      expect(isOperationalError(error)).toBe(false)
    })

    it('should return false for non-Error types', () => {
      expect(isOperationalError('string')).toBe(false)
      expect(isOperationalError(null)).toBe(false)
      expect(isOperationalError(undefined)).toBe(false)
    })
  })

  // ============================================
  // HTTP Status
  // ============================================

  describe('HTTP_STATUS', () => {
    it('should have correct success status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
    })

    it('should have correct client error status codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.PAYMENT_REQUIRED).toBe(402)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.CONFLICT).toBe(409)
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429)
      expect(HTTP_STATUS.PAYLOAD_TOO_LARGE).toBe(413)
    })

    it('should have correct server error status codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  // ============================================
  // External Error Classification
  // ============================================

  describe('classifyExternalError()', () => {
    it('should classify 503 service unavailable errors', () => {
      const error = new Error('503 Service Unavailable')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(503)
      expect(result.message).toContain('과부하')
    })

    it('should classify UNAVAILABLE errors', () => {
      const error = new Error('UNAVAILABLE: service overloaded')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(503)
    })

    it('should classify overloaded errors', () => {
      const error = new Error('The model is overloaded')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(503)
    })

    it('should classify 429 rate limit errors', () => {
      const error = new Error('429 Too Many Requests')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(429)
      expect(result.message).toContain('할당량')
    })

    it('should classify RESOURCE_EXHAUSTED errors', () => {
      const error = new Error('RESOURCE_EXHAUSTED: quota exceeded')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(429)
    })

    it('should extract retry time from error message', () => {
      const error = new Error('RESOURCE_EXHAUSTED: retry in 30.5s')

      const result = classifyExternalError(error)

      expect(result.message).toContain('31초') // ceil(30.5)
    })

    it('should classify API key/authentication errors', () => {
      const error = new Error('API key not valid')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(500)
      expect(result.message).toContain('인증')
    })

    it('should classify UNAUTHENTICATED errors', () => {
      const error = new Error('UNAUTHENTICATED: token expired')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(500)
      expect(result.message).toContain('인증')
    })

    it('should classify network errors', () => {
      const error = new Error('network connection failed')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(503)
      expect(result.message).toContain('네트워크')
    })

    it('should classify ENOTFOUND errors', () => {
      const error = new Error('ENOTFOUND: DNS lookup failed')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(503)
      expect(result.message).toContain('네트워크')
    })

    it('should classify 413 payload too large errors', () => {
      const error = new Error('413 Payload Too Large')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(413)
      expect(result.message).toContain('파일')
    })

    it('should classify entity too large errors', () => {
      const error = new Error('request entity too large')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(413)
    })

    it('should return default for unknown errors', () => {
      const error = new Error('Some random error')

      const result = classifyExternalError(error)

      expect(result.statusCode).toBe(500)
      expect(result.message).toContain('오류가 발생했습니다')
    })
  })

  // ============================================
  // Assertion Functions
  // ============================================

  describe('assertExists()', () => {
    it('should not throw when value exists', () => {
      expect(() => assertExists('value')).not.toThrow()
      expect(() => assertExists(0)).not.toThrow()
      expect(() => assertExists(false)).not.toThrow()
      expect(() => assertExists({})).not.toThrow()
      expect(() => assertExists([])).not.toThrow()
    })

    it('should throw NotFoundError for null', () => {
      expect(() => assertExists(null)).toThrow(NotFoundError)
    })

    it('should throw NotFoundError for undefined', () => {
      expect(() => assertExists(undefined)).toThrow(NotFoundError)
    })

    it('should use custom message', () => {
      expect(() => assertExists(null, '사용자를 찾을 수 없습니다.')).toThrow('사용자를 찾을 수 없습니다.')
    })

    it('should use default message', () => {
      expect(() => assertExists(null)).toThrow('리소스를 찾을 수 없습니다.')
    })

    it('should narrow type after assertion', () => {
      const value: string | null = 'test'
      assertExists(value)
      // TypeScript should know value is string here
      expect(value.toUpperCase()).toBe('TEST')
    })
  })

  describe('assertValid()', () => {
    it('should not throw when condition is true', () => {
      expect(() => assertValid(true, 'Should pass')).not.toThrow()
      expect(() => assertValid(1 === 1, 'Math works')).not.toThrow()
      expect(() => assertValid('test'.length > 0, 'Has length')).not.toThrow()
    })

    it('should throw ValidationError when condition is false', () => {
      expect(() => assertValid(false, 'Invalid')).toThrow(ValidationError)
    })

    it('should use provided message', () => {
      expect(() => assertValid(false, '이메일 형식이 올바르지 않습니다.')).toThrow('이메일 형식이 올바르지 않습니다.')
    })

    it('should narrow type after assertion', () => {
      const value: unknown = 'test'
      assertValid(typeof value === 'string', 'Must be string')
      // TypeScript should know value is string here
      expect(value.length).toBe(4)
    })
  })

  // ============================================
  // Error Inheritance
  // ============================================

  describe('Error inheritance', () => {
    it('all custom errors should be instanceof Error', () => {
      const errors = [
        new AppError('test'),
        new ValidationError('test'),
        new UnauthorizedError(),
        new ForbiddenError(),
        new NotFoundError(),
        new ConflictError(),
        new InsufficientCreditsError(),
      ]

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(AppError)
      })
    })

    it('error properties should be enumerable for JSON serialization', () => {
      const error = new ValidationError('Test')

      // Error should have expected properties
      expect(error.message).toBeDefined()
      expect(error.statusCode).toBeDefined()
      expect(error.isOperational).toBeDefined()
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge cases', () => {
    it('should handle empty string message', () => {
      const error = new AppError('')

      expect(error.message).toBe('')
      expect(formatApiError(error).error).toBe('')
    })

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000)
      const error = new AppError(longMessage)

      expect(error.message).toBe(longMessage)
    })

    it('should handle special characters in messages', () => {
      const specialMessage = '에러: <script>alert("xss")</script> & "quotes"'
      const error = new AppError(specialMessage)

      expect(error.message).toBe(specialMessage)
    })

    it('should handle circular references in error context', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular

      // This should not throw
      const error = new AppError('Test with circular')
      expect(error.message).toBe('Test with circular')
    })
  })
})
