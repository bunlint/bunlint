import { describe, test, expect, beforeEach, afterEach } from 'bun:test'

import { 
  createError, 
  createApiError, 
  createValidationError, 
  formatError, 
  handleError, 
  isAppError, 
  fromError, 
  throwError,
  ErrorSeverity,
  type AppError
} from '../error-utils'

describe('error-utils', () => {
  const originalDate = global.Date
  const fixedTestDate = '2023-01-01T00:00:00.000Z'
  
  beforeEach(() => {
    const constantDate = fixedTestDate
    
    // @ts-expect-error - Deliberately using a minimal mock to avoid class instantiation
    global.Date = function() { return { toISOString: () => constantDate }; }
  })
  
  afterEach(() => {
    global.Date = originalDate
  })

  describe('createError', () => {
    test('should create an error with given parameters', () => {
      const originalError = Error('Original error')
      const error = createError(
        'Test error',
        'TEST_ERROR',
        ErrorSeverity.WARNING,
        { file: 'test.ts', line: 10 },
        originalError,
        { testId: '123' }
      )

      expect(error).toEqual({
        message: 'Test error',
        code: 'TEST_ERROR',
        severity: ErrorSeverity.WARNING,
        source: { file: 'test.ts', line: 10 },
        cause: originalError,
        context: { testId: '123' },
        timestamp: fixedTestDate
      })
    })

    test('should use default severity if not provided', () => {
      const error = createError('Test error', 'TEST_ERROR')
      expect(error.severity).toBe(ErrorSeverity.ERROR)
    })
  })

  describe('createApiError', () => {
    test('should create an API error with critical severity for status codes >= 500', () => {
      const error = createApiError('Server error', 500)
      expect(error.severity).toBe(ErrorSeverity.CRITICAL)
      expect(error.code).toBe('API_500')
      expect(error.source).toEqual({ function: 'API' })
    })

    test('should create an API error with error severity for status codes < 500', () => {
      const error = createApiError('Not found', 404)
      expect(error.severity).toBe(ErrorSeverity.ERROR)
      expect(error.code).toBe('API_404')
    })
  })

  describe('createValidationError', () => {
    test('should create a validation error with field in context if provided', () => {
      const error = createValidationError('Invalid email', 'email')
      expect(error.severity).toBe(ErrorSeverity.WARNING)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.context).toEqual({ field: 'email' })
    })

    test('should create a validation error without field in context if not provided', () => {
      const error = createValidationError('Invalid data')
      expect(error.context).toBeUndefined()
    })
  })

  describe('formatError', () => {
    test('should format an error with all fields', () => {
      const error: AppError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        severity: ErrorSeverity.ERROR,
        source: { file: 'test.ts', function: 'testFn', line: 10 },
        timestamp: fixedTestDate
      }

      const formatted = formatError(error)
      expect(formatted).toBe('[2023-01-01T00:00:00.000Z] [ERROR] [TEST_ERROR] Test error (file: test.ts, function: testFn, line: 10)')
    })

    test('should format an error without source', () => {
      const error: AppError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        severity: ErrorSeverity.ERROR,
        timestamp: fixedTestDate
      }

      const formatted = formatError(error)
      expect(formatted).toBe('[2023-01-01T00:00:00.000Z] [ERROR] [TEST_ERROR] Test error')
    })
  })

  describe('handleError', () => {
    test('should return the error if it is already an AppError', () => {
      const appError = createError('App error', 'APP_ERROR')
      const result = handleError(appError)
      expect(result).toBe(appError)
    })

    test('should create an AppError from an Error instance', () => {
      const originalError = Error('Original error')
      const result = handleError(originalError)
      
      expect(result).toEqual({
        message: 'Original error',
        code: 'UNKNOWN_ERROR',
        severity: ErrorSeverity.ERROR,
        cause: originalError,
        timestamp: expect.any(String)
      })
    })

    test('should use defaultMessage for non-Error instances', () => {
      const result = handleError('string error')
      expect(result.message).toBe('An unexpected error occurred')
      expect(result.cause).toBe('string error')
    })
  })

  describe('isAppError', () => {
    test('should return true for valid AppError objects', () => {
      const error = createError('Test error', 'TEST_ERROR')
      expect(isAppError(error)).toBe(true)
    })

    test('should return false for non-AppError objects', () => {
      expect(isAppError(Error('Test'))).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError('')).toBe(false)
      expect(isAppError({})).toBe(false)
    })
  })

  describe('fromError', () => {
    test('should convert a standard Error to an AppError', () => {
      const originalError = Error('Original error')
      const result = fromError(originalError, 'CONVERTED_ERROR')
      
      expect(result).toEqual({
        message: 'Original error',
        code: 'CONVERTED_ERROR',
        severity: ErrorSeverity.ERROR,
        cause: originalError,
        timestamp: expect.any(String)
      })
    })
  })

  describe('throwError', () => {
    test('should throw an error with the error message', () => {
      const error = createError('Error to throw', 'THROW_ERROR')
      expect(() => throwError(error)).toThrow('Error to throw')
    })
  })
}) 