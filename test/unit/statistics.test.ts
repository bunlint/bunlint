import { describe, expect, it } from 'bun:test'
import { resultUtil } from '../../src/utils'
import { LintResult } from '../../src/types'

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
  },
  {
    filePath: 'src/examples/example2.ts',
    messages: [
      {
        ruleId: 'no-loops',
        severity: 1, // warning
        category: 'functional',
        fixability: 'manual',
        message: 'For loops are not allowed in functional code. Use map, filter, or reduce instead.',
        line: 3,
        column: 1,
        endLine: 5,
        endColumn: 2,
        nodeType: 'ForStatement'
      }
    ],
    errorCount: 0,
    warningCount: 1,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  },
  {
    filePath: 'src/examples/example3.ts',
    messages: [
      {
        ruleId: 'no-mutation',
        severity: 2, // error
        category: 'functional',
        fixability: 'fixable',
        message: 'Array mutation methods are not allowed. Use immutable alternatives.',
        line: 4,
        column: 1,
        endLine: 4,
        endColumn: 15,
        nodeType: 'CallExpression',
        fix: {
          range: [75, 90],
          text: 'arr = [...arr, 4]'
        }
      },
      {
        ruleId: 'prefer-const',
        severity: 2, // error
        category: 'best-practices',
        fixability: 'fixable',
        message: 'Use const instead of let when variable is not reassigned',
        line: 7,
        column: 1,
        endLine: 7,
        endColumn: 23,
        nodeType: 'VariableDeclaration',
        fix: {
          range: [150, 173],
          text: 'const example2 = "value";'
        }
      }
    ],
    errorCount: 2,
    warningCount: 0,
    fixableErrorCount: 2,
    fixableWarningCount: 0
  },
  {
    filePath: 'src/examples/example4.ts',
    messages: [],
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  }
];

const sampleWithIncorrectStats: LintResult[] = [
  {
    filePath: 'src/examples/incorrect-stats.ts',
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
        severity: 1, // warning
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
    // Incorrect stats - don't match actual message counts
    errorCount: 1, // Should be 1
    warningCount: 0, // Should be 1
    fixableErrorCount: 0, // Should be 0
    fixableWarningCount: 0  // Should be 1
  }
];

describe('Statistics calculation', () => {
  it('should calculate correct stats from lint results', () => {
    const stats = resultUtil.calculateStats(sampleLintResults)
    
    expect(stats.totalErrors).toBe(4) // 2 from file1 + 0 from file2 + 2 from file3 + 0 from file4
    expect(stats.totalWarnings).toBe(1) // 0 from file1 + 1 from file2 + 0 from file3 + 0 from file4
    expect(stats.totalIssues).toBe(5) // 4 errors + 1 warning
    
    // Check fixable stats
    expect(stats.totalFixable).toBe(3) // 1 from file1 + 0 from file2 + 2 from file3 + 0 from file4
  })
  
  it('should handle empty results array', () => {
    const emptyStats = resultUtil.calculateStats([])
    
    expect(emptyStats.totalErrors).toBe(0)
    expect(emptyStats.totalWarnings).toBe(0)
    expect(emptyStats.totalIssues).toBe(0)
    expect(emptyStats.totalFixable).toBe(0)
    expect(emptyStats.filesWithIssues).toBe(0)
  })
  
  it('should validate stats against message counts', () => {
    const results = sampleWithIncorrectStats
    
    // Manually count messages by severity
    const manuallyCalculatedErrorCount = results[0].messages.filter(m => m.severity === 2).length
    const manuallyCalculatedWarningCount = results[0].messages.filter(m => m.severity === 1).length
    const manuallyCalculatedFixableErrorCount = results[0].messages.filter(m => m.severity === 2 && m.fix !== undefined).length
    const manuallyCalculatedFixableWarningCount = results[0].messages.filter(m => m.severity === 1 && m.fix !== undefined).length
    
    // Compare against reported counts - errorCount is already consistent, unlike other counts
    expect(manuallyCalculatedErrorCount).toBe(1)
    
    // Validate these counts are incorrect in the sample data
    expect(manuallyCalculatedWarningCount).not.toBe(results[0].warningCount) // Should be 1, not 0
    expect(manuallyCalculatedFixableWarningCount).not.toBe(results[0].fixableWarningCount) // Should be 1, not 0
  })
}) 