import { describe, expect, it, mock, spyOn } from 'bun:test'
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

// These tests focus on the statistics part of the report generation
describe('Report statistics functionality', () => {
  it('should calculate accurate statistics for reports', () => {
    const stats = resultUtil.calculateStats(sampleLintResults)
    
    // Verify total counts
    expect(stats.totalErrors).toBe(4)
    expect(stats.totalWarnings).toBe(1)
    expect(stats.totalFixable).toBe(3)
    
    // Verify total message count
    expect(stats.totalIssues).toBe(5)
  })
  
  it('should identify files with issues correctly', () => {
    const stats = resultUtil.calculateStats(sampleLintResults)
    
    // Verify file counts
    expect(stats.filesWithIssues).toBe(3)
    
    // Verify files with issues are properly counted
    const filesWithIssues = sampleLintResults.filter(r => r.messages.length > 0).length
    
    // 3 out of 4 files have issues
    expect(filesWithIssues).toBe(3)
  })
  
  it('should categorize messages correctly by severity', () => {
    const stats = resultUtil.calculateStats(sampleLintResults)
    
    // Filter messages by severity
    const errorMessages = sampleLintResults.flatMap(r => 
      r.messages.filter(m => m.severity === 2))
    
    const warningMessages = sampleLintResults.flatMap(r =>
      r.messages.filter(m => m.severity === 1))
    
    // Should have 4 errors and 1 warning
    expect(errorMessages.length).toBe(4)
    expect(warningMessages.length).toBe(1)
    
    // Should match the calculated stats
    expect(errorMessages.length).toBe(stats.totalErrors)
    expect(warningMessages.length).toBe(stats.totalWarnings)
  })
  
  it('should identify fixable issues correctly', () => {
    const stats = resultUtil.calculateStats(sampleLintResults)
    
    // Total fixable issues
    expect(stats.totalFixable).toBe(3)
    
    // Verify fixable issues are properly counted
    const fixableMessages = sampleLintResults.flatMap(r =>
      r.messages.filter(m => m.fix !== undefined))
    
    // Should have 3 fixable issues
    expect(fixableMessages.length).toBe(3)
  })
}) 