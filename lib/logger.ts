/**
 * Logger Abstraction Module
 *
 * Environment-aware logging with structured output and context support.
 * Replaces direct console.log/error usage throughout the codebase.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Environment-aware: verbose in development, minimal in production
 * - Structured logging with context and metadata
 * - Child loggers for module-specific logging
 * - Future-ready: Easy integration with external services (Sentry, DataDog, etc.)
 */

// ============================================
// Types
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  /** Module or component name */
  module?: string
  /** User ID for request tracing */
  userId?: string
  /** Request ID for distributed tracing */
  requestId?: string
  /** Additional metadata */
  [key: string]: unknown
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// ============================================
// Configuration
// ============================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = isProduction ? 'info' : 'debug'

// Whether to output structured JSON logs (for production log aggregation)
const USE_STRUCTURED_LOGS = isProduction

// ============================================
// Logger Class
// ============================================

class Logger {
  private context: LogContext

  constructor(context: LogContext = {}) {
    this.context = context
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext,
    })
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (isTest) return false // Suppress logs during tests
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL]
  }

  /**
   * Format the log entry
   */
  private formatEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    const mergedContext = { ...this.context, ...context }
    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    return entry
  }

  /**
   * Output log entry to console
   */
  private output(entry: LogEntry): void {
    if (USE_STRUCTURED_LOGS) {
      // Structured JSON output for production log aggregation
      const output = JSON.stringify(entry)
      switch (entry.level) {
        case 'error':
          console.error(output)
          break
        case 'warn':
          console.warn(output)
          break
        default:
          console.log(output)
      }
    } else {
      // Human-readable output for development
      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
      const modulePrefix = entry.context?.module ? ` [${entry.context.module}]` : ''
      const contextStr = entry.context
        ? ` ${JSON.stringify(
            Object.fromEntries(
              Object.entries(entry.context).filter(([key]) => key !== 'module')
            )
          )}`
        : ''

      const logMessage = `${prefix}${modulePrefix} ${entry.message}${contextStr}`

      switch (entry.level) {
        case 'error':
          console.error(logMessage)
          if (entry.error?.stack) {
            console.error(entry.error.stack)
          }
          break
        case 'warn':
          console.warn(logMessage)
          break
        case 'debug':
          console.debug(logMessage)
          break
        default:
          console.log(logMessage)
      }
    }
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return
    const entry = this.formatEntry('debug', message, context)
    this.output(entry)
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return
    const entry = this.formatEntry('info', message, context)
    this.output(entry)
  }

  /**
   * Warning level logging - potential issues
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return
    const entry = this.formatEntry('warn', message, context, error)
    this.output(entry)
  }

  /**
   * Error level logging - actual errors
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return
    const entry = this.formatEntry('error', message, context, error)
    this.output(entry)

    // Future: Send to external error tracking service
    // if (isProduction && error) {
    //   Sentry.captureException(error, { extra: entry.context })
    // }
  }

  /**
   * Log API request/response (convenience method)
   */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `${method} ${path} ${statusCode} ${durationMs}ms`

    if (!this.shouldLog(level)) return
    const entry = this.formatEntry(level, message, { ...context, statusCode, durationMs })
    this.output(entry)
  }

  /**
   * Log database query (convenience method)
   */
  dbQuery(operation: string, table: string, durationMs: number, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table} (${durationMs}ms)`, context)
  }
}

// ============================================
// Module-specific Loggers
// ============================================

/**
 * Create a module-specific logger
 */
export function createLogger(module: string): Logger {
  return new Logger({ module })
}

// Pre-configured loggers for common modules
export const logger = new Logger() // Default logger
export const apiLogger = createLogger('api')
export const authLogger = createLogger('auth')
export const dbLogger = createLogger('db')
export const genaiLogger = createLogger('genai')
export const paymentLogger = createLogger('payment')
export const storageLogger = createLogger('storage')

// ============================================
// Utility Functions
// ============================================

/**
 * Wrap async function with error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  loggerInstance: Logger = logger
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      loggerInstance.error(
        `Async operation failed: ${fn.name || 'anonymous'}`,
        {},
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }) as T
}

/**
 * Measure and log execution time
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  loggerInstance: Logger = logger
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    loggerInstance.debug(`${operation} completed`, { durationMs: duration })
    return result
  } catch (error) {
    const duration = Date.now() - start
    loggerInstance.error(
      `${operation} failed`,
      { durationMs: duration },
      error instanceof Error ? error : new Error(String(error))
    )
    throw error
  }
}

// ============================================
// Request Context Helper
// ============================================

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export default logger
