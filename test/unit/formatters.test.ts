import { describe, expect, it } from 'bun:test'
import { formatResults } from '../../src/core'
import { FormatOptions, LintResult } from '../../src/types'

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
      },
      {
        ruleId: 'no-this',
        severity: 1, // warning
        category: 'functional',
        fixability: 'manual',
        message: 'Using "this" is not allowed in functional programming',
        line: 10,
        column: 10,
        endLine: 10,
        endColumn: 14,
        nodeType: 'ThisExpression'
      }
    ],
    errorCount: 2,
    warningCount: 1,
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

describe('Formatter summary information', () => {
  it('should include correct summary information in pretty format', () => {
    const options: FormatOptions = { 
      format: 'pretty',
      showSummary: true
    }
    
    const formatted = formatResults(sampleLintResults, 'pretty', 'category', { report: { showSummary: true } })
    
    // Check for partial matches to account for color codes
    expect(formatted).toMatch(/Total:.+6 issues/);
    expect(formatted).toMatch(/4 errors/);
    expect(formatted).toMatch(/2 warnings/);
    expect(formatted).toMatch(/3 issues auto-fixable/);
  })

  it('should hide summary when showSummary is false', () => {
    const options: FormatOptions = { 
      format: 'pretty',
      showSummary: false
    }
    
    const formatted = formatResults(sampleLintResults, 'pretty', 'category', { report: { showSummary: false } })
    
    // Should not contain full summary stats, but should contain auto-fixable note
    expect(formatted).not.toContain('BunLint: 6 issues')
    expect(formatted).toContain('3 issues auto-fixable')
  })

  it('should include correct statistics in json format', () => {
    const formatted = formatResults(sampleLintResults, 'json')
    const parsed = JSON.parse(formatted)
    
    // JSON format should preserve all result details
    expect(parsed.results.length).toBe(4)
    
    // Verify each file has correct counts
    expect(parsed.results[0].errorCount).toBe(2)
    expect(parsed.results[1].warningCount).toBe(1)
    expect(parsed.results[2].errorCount).toBe(2)
    expect(parsed.results[2].warningCount).toBe(1)
    expect(parsed.results[3].errorCount).toBe(0)
  })
  
  it('should include correct statistics in markdown format', () => {
    const formatted = formatResults(sampleLintResults, 'markdown')
    
    // Check for summary section
    expect(formatted).toContain('## Summary')
    expect(formatted).toContain('Total: 6 issues')
    expect(formatted).toContain('Errors: 4')
    expect(formatted).toContain('Warnings: 2')
    expect(formatted).toContain('Files: 3')
  })
}) 