import { error as logError } from './logger'
import { getCurrentTimestamp } from './utils'

export enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorSource {
  file?: string
  function?: string
  line?: number
}

export interface ErrorContext {
  [key: string]: string | number | boolean | object | null
}

export interface AppError {
  message: string
  code: string
  severity: ErrorSeverity
  source?: ErrorSource
  cause?: Error | string | object | null
  context?: ErrorContext
  timestamp: string
}

export const createError = (
  message: string,
  code: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  source?: ErrorSource,
  cause?: Error | string | object | null,
  context?: ErrorContext
): AppError => ({
  message,
  code,
  severity,
  source,
  cause,
  context,
  timestamp: getCurrentTimestamp(),
})

export const createApiError = (
  message: string,
  statusCode = 500,
  cause?: Error | string | object | null,
  context?: ErrorContext
): AppError =>
  createError(
    message,
    `API_${statusCode}`,
    statusCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR,
    { function: 'API' },
    cause,
    context
  )

export const createValidationError = (
  message: string,
  field?: string,
  cause?: Error | string | object | null
): AppError =>
  createError(
    message,
    'VALIDATION_ERROR',
    ErrorSeverity.WARNING,
    undefined,
    cause,
    field ? { field } : undefined
  )

export const formatError = (error: AppError): string => {
  const { message, code, severity, source, timestamp } = error
  const sourceInfo = source
    ? Object.entries(source)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : ''

  return [
    `[${timestamp}]`,
    `[${severity.toUpperCase()}]`,
    `[${code}]`,
    message,
    sourceInfo ? `(${sourceInfo})` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export const handleError = (
  error: Error | AppError | string | object | null,
  defaultMessage = 'An unexpected error occurred'
): AppError => {
  if (error && typeof error === 'object' && 'code' in error && 'severity' in error) {
    return error as AppError
  }

  const appError = createError(
    error instanceof Error ? error.message : defaultMessage,
    'UNKNOWN_ERROR',
    ErrorSeverity.ERROR,
    undefined,
    error
  )

  logError(formatError(appError))
  return appError
}

export const isAppError = (error: Error | string | object | null): error is AppError =>
  error !== null &&
  typeof error === 'object' &&
  'code' in error &&
  'severity' in error &&
  'timestamp' in error

export const fromError = (
  error: Error,
  code: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  source?: ErrorSource,
  context?: ErrorContext
): AppError =>
  createError(error.message, code, severity, source, error, context)

export const throwError = (error: AppError): never => {
  logError(formatError(error))
  const errorProps = { ...error }
  throw { ...errorProps, message: error.message }
}