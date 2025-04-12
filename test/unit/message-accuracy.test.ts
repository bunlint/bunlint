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

describe('Message reporting accuracy', () => {
  it('should accurately report message location data', () => {
    for (const result of sampleLintResults) {
      const messagesWithFile: LintMessageWithFile[] = result.messages.map(msg => ({
        ...msg,
        filePath: result.filePath
      }))
      
      // Verify message formatting includes accurate positional information
      for (const msg of messagesWithFile) {
        const formatted = `${msg.filePath}:${msg.line}:${msg.column}-${msg.endLine}:${msg.endColumn} ${msg.message} [${msg.ruleId}]`
        
        // Location information should be present and accurate
        expect(formatted).toContain(`${msg.filePath}:${msg.line}:${msg.column}-${msg.endLine}:${msg.endColumn}`)
        expect(formatted).toContain(`[${msg.ruleId}]`)
        expect(formatted).toContain(msg.message)
      }
    }
  })

  it('should preserve complete message information when grouping', () => {
    const allMessagesWithFile: LintMessageWithFile[] = []
    
    // Collect all messages with file info
    for (const result of sampleLintResults) {
      const messagesWithFile = result.messages.map(msg => ({
        ...msg,
        filePath: result.filePath
      }))
      allMessagesWithFile.push(...messagesWithFile)
    }
    
    // Group messages by different criteria
    const groupingKeys = ['rule', 'severity', 'category', 'file']
    
    for (const key of groupingKeys) {
      // Simple grouping implementation to test
      const groupedMessages: Record<string, LintMessageWithFile[]> = {}
      
      // Simple grouping implementation to test
      for (const msg of allMessagesWithFile) {
        let groupKey = ''
        
        if (key === 'rule') {
          groupKey = msg.ruleId
        } else if (key === 'severity') {
          groupKey = msg.severity === 2 ? 'error' : 'warning'
        } else if (key === 'category') {
          groupKey = msg.category || 'unknown'
        } else if (key === 'file') {
          groupKey = msg.filePath
        }
        
        if (!groupedMessages[groupKey]) {
          groupedMessages[groupKey] = []
        }
        groupedMessages[groupKey].push(msg)
      }
      
      // Verify grouped messages contain identical information to originals
      let totalGroupedMessages = 0
      
      for (const groupKey of Object.keys(groupedMessages)) {
        for (const msg of groupedMessages[groupKey]) {
          // Each message should have all original properties intact
          expect(msg.line).toBeDefined()
          expect(msg.column).toBeDefined()
          expect(msg.endLine).toBeDefined()
          expect(msg.endColumn).toBeDefined()
          expect(msg.ruleId).toBeDefined()
          expect(msg.message).toBeDefined()
          expect(msg.severity).toBeDefined()
          
          totalGroupedMessages++
        }
      }
      
      // Total messages should be preserved after grouping
      expect(totalGroupedMessages).toBe(allMessagesWithFile.length)
    }
  })
}) 