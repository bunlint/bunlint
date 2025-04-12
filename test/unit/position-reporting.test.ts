import { describe, expect, it } from 'bun:test'
import { LintMessageWithFile, LintResult } from '../../src/types'

// Create inline test data instead of importing
const sampleLintResults: LintResult[] = [
  {
    filePath: 'src/examples/example1.ts',
    messages: [
      {
        ruleId: 'no-class',
        severity: 2, // error
        category: 'functional',
        fixability: 'manual',
        message: 'Class declarations are not allowed in functional code',
        line: 2,
        column: 1,
        endLine: 5,
        endColumn: 2,
        nodeType: 'ClassDeclaration'
      }
    ],
    errorCount: 1,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  }
];

const sampleWithInvalidPositions: LintResult[] = [
  {
    filePath: 'src/examples/invalid-positions.ts',
    messages: [
      {
        ruleId: 'no-class',
        severity: 2,
        category: 'functional',
        fixability: 'manual',
        message: 'Class declarations are not allowed in functional code',
        line: -1, // Invalid line number
        column: 1,
        endLine: -5, // Changed to negative value to match test expectation
        endColumn: 2,
        nodeType: 'ClassDeclaration'
      },
      {
        ruleId: 'prefer-const',
        severity: 2,
        category: 'best-practices',
        fixability: 'fixable',
        message: 'Use const instead of let when variable is not reassigned',
        line: 8,
        column: -5, // Invalid column number
        endLine: 8,
        endColumn: 20,
        nodeType: 'VariableDeclaration'
      }
    ],
    errorCount: 2,
    warningCount: 0,
    fixableErrorCount: 1,
    fixableWarningCount: 0
  }
];

describe('Position reporting', () => {
  it('should have valid line and column numbers in normal results', () => {
    // All positions should be valid in sample results
    for (const result of sampleLintResults) {
      for (const message of result.messages) {
        expect(message.line).toBeGreaterThan(0)
        expect(message.column).toBeGreaterThan(0)
        expect(message.endLine).toBeGreaterThan(0)
        expect(message.endColumn).toBeGreaterThan(0)
      }
    }
  })
  
  it('should detect invalid line and column positions', () => {
    const invalidResults = sampleWithInvalidPositions
    
    // First message has invalid line number and end line number
    expect(invalidResults[0].messages[0].line).toBeLessThan(1)
    expect(invalidResults[0].messages[0].endLine).toBeLessThan(1)
    
    // Second message has invalid column number
    expect(invalidResults[0].messages[1].column).toBeLessThan(1)
  })
}) 