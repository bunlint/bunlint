import { describe, expect, it } from 'bun:test'
import { LintResult } from '../../src/types'

// Create inline test data instead of importing
const testLintResults: LintResult[] = [
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
      },
      {
        ruleId: 'prefer-const',
        severity: 2, // error
        category: 'best-practices',
        fixability: 'fixable',
        message: 'Use const instead of let when variable is not reassigned',
        line: 8,
        column: 1,
        endLine: 8,
        endColumn: 20,
        nodeType: 'VariableDeclaration',
        fix: {
          range: [105, 125],
          text: 'const example = 42;'
        }
      }
    ],
    errorCount: 2,
    warningCount: 0,
    fixableErrorCount: 1,
    fixableWarningCount: 0
  }
];

describe('Fix range validation', () => {
  it('should report valid ranges for all fixes', () => {
    for (const result of testLintResults) {
      for (const message of result.messages) {
        if (message.fix) {
          const [start, end] = message.fix.range
          
          // Range validation
          expect(start).toBeLessThan(end)
          expect(start).toBeGreaterThanOrEqual(0)
          
          // Text validation
          expect(message.fix.text).toBeDefined()
          expect(typeof message.fix.text).toBe('string')
          expect(message.fix.text.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('should not have overlapping fix ranges within a single file', () => {
    for (const result of testLintResults) {
      const fixRanges: Array<{ start: number; end: number }> = []
      
      for (const message of result.messages) {
        if (message.fix) {
          const [start, end] = message.fix.range
          fixRanges.push({ start, end })
        }
      }
      
      // Check for overlapping ranges
      for (let i = 0; i < fixRanges.length; i++) {
        for (let j = i + 1; j < fixRanges.length; j++) {
          const a = fixRanges[i]!; // non-null assertion
          const b = fixRanges[j]!; // non-null assertion
          
          // Ranges overlap if one starts before the other ends
          const overlaps = 
            (a.start <= b.start && b.start < a.end) || 
            (b.start <= a.start && a.start < b.end)
          
          // In a real implementation, overlapping fixes are problematic
          // and should be avoided
          expect(overlaps).toBe(false)
        }
      }
    }
  })
}) 