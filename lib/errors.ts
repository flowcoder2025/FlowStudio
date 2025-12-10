/**
 * Error Handling Utilities
 *
 * Centralized error handling and formatting
 */

import { ApiError } from '@/types/api'

// ============================================
// Error Classes
// ============================================

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '로그인이 필요합니다.') {
    super(message, 401)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '권한이 없습니다.') {
    super(message, 403)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(message, 404)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '리소스 충돌이 발생했습니다.') {
    super(message, 409)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(message: string = '크레딧이 부족합니다.') {
    super(message, 402) // 402 Payment Required
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype)
  }
}

// ============================================
// Error Formatting
// ============================================

/**
 * Format error for API response
 */
export function formatApiError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    }
  }

  return {
    error: '알 수 없는 오류가 발생했습니다.',
    statusCode: 500,
  }
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

// ============================================
// Error Response Helpers
// ============================================

/**
 * Create error response object
 */
export function createErrorResponse(error: unknown, statusCode?: number) {
  const apiError = formatApiError(error)
  return {
    error: apiError.error,
    statusCode: statusCode || apiError.statusCode || 500,
  }
}

/**
 * Check if error is operational (expected error that we can handle)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

// ============================================
// HTTP Status Helpers
// ============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]
