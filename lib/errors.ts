/**
 * Error Handling Utilities
 *
 * Centralized error handling and formatting
 */

import { NextResponse } from 'next/server'
import { ApiError } from '@/types/api'
import { apiLogger } from '@/lib/logger'

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
  TOO_MANY_REQUESTS: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS]

// ============================================
// API Route Error Handler
// ============================================

export interface ApiErrorResponseData {
  error: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Classify external service errors and return user-friendly messages
 */
export function classifyExternalError(error: Error): { message: string; statusCode: number } {
  const errorMessage = error.message

  // Google AI / Vertex AI specific errors
  if (errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('overloaded')) {
    return {
      message: 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    }
  }

  if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
    // Extract retry time if available
    const retryMatch = errorMessage.match(/retry in ([\d.]+)s/)
    const retryMsg = retryMatch
      ? `${Math.ceil(parseFloat(retryMatch[1]))}초 후에 다시 시도해주세요.`
      : '잠시 후 다시 시도해주세요.'
    return {
      message: `API 할당량이 초과되었습니다. ${retryMsg}`,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    }
  }

  if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('UNAUTHENTICATED')) {
    return {
      message: '서비스 인증 오류가 발생했습니다. 관리자에게 문의하세요.',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    }
  }

  if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
    return {
      message: '네트워크 연결을 확인해주세요.',
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    }
  }

  if (errorMessage.includes('413') || errorMessage.includes('Payload') || errorMessage.includes('too large')) {
    return {
      message: '파일이 너무 큽니다. 4MB 이하의 파일을 사용해주세요.',
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
    }
  }

  if (errorMessage.includes('body size') || errorMessage.includes('entity too large')) {
    return {
      message: '전송 데이터가 너무 큽니다. 파일 크기를 줄여주세요.',
      statusCode: HTTP_STATUS.PAYLOAD_TOO_LARGE,
    }
  }

  // Default error
  return {
    message: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  }
}

/**
 * Create a standardized JSON error response for API routes
 */
export function apiErrorResponse(
  error: unknown,
  context?: { userId?: string; operation?: string; metadata?: Record<string, unknown> }
): NextResponse<ApiErrorResponseData> {
  // Log the error with context
  const logContext = {
    userId: context?.userId,
    operation: context?.operation,
    ...context?.metadata,
  }

  // Handle known error types
  if (error instanceof AppError) {
    apiLogger.warn(error.message, logContext, error)
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Handle external service errors
  if (error instanceof Error) {
    const classified = classifyExternalError(error)
    apiLogger.error(error.message, logContext, error)
    return NextResponse.json(
      { error: classified.message },
      { status: classified.statusCode }
    )
  }

  // Handle unknown errors
  apiLogger.error('Unknown error occurred', logContext)
  return NextResponse.json(
    { error: '알 수 없는 오류가 발생했습니다.' },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

/**
 * Wrap an API route handler with standardized error handling
 *
 * @example
 * export const GET = withApiErrorHandler(async (req) => {
 *   const data = await fetchData()
 *   return NextResponse.json(data)
 * })
 */
export function withApiErrorHandler<T extends (...args: Parameters<T>) => Promise<NextResponse>>(
  handler: T,
  options?: { operation?: string }
): T {
  return (async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return apiErrorResponse(error, { operation: options?.operation })
    }
  }) as T
}

/**
 * Assert that a value exists, throwing NotFoundError if it doesn't
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = '리소스를 찾을 수 없습니다.'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message)
  }
}

/**
 * Assert a condition, throwing ValidationError if false
 */
export function assertValid(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new ValidationError(message)
  }
}
