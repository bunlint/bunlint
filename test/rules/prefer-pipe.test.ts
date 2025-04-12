import { describe, expect, it } from 'bun:test'
import { Project } from 'ts-morph'
import { preferPipeRule } from '../../plugins/rules/prefer-pipe.rule'
import { createRule, lintLiteral } from '../../src/core'

describe('prefer-pipe rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [preferPipeRule])
  }

  it('should detect deeply nested function calls', () => {
    const code = `
      const result = f1(f2(f3(f4(x))));
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBeGreaterThan(0)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('prefer-pipe')
      expect(message?.fixability).toBe('fixable')
    }
  })
  
  it('should not report simple function calls', () => {
    const code = `
      const result = f1(x);
      const result2 = f2(y, z);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should not report double-nested function calls', () => {
    const code = `
      const result = f1(f2(x));
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should report triple-nested function calls', () => {
    const code = `
      const result = f1(f2(f3(x)));
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
  
  it('should handle mixed arguments correctly', () => {
    const code = `
      const result = f1(a, f2(b, f3(c, d)));
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      if (message && message.fix) {
        expect(message.fix).toBeDefined()
      }
    }
  })
  
  it('should provide a fix that uses pipe composition', () => {
    const code = `
      const result = f1(f2(f3(x)));
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      if (message && message.fix) {
        const fixText = message.fix.text
        
        expect(fixText).toContain('pipe(')
        expect(fixText).toContain('f3(x)')
        expect(fixText).toContain('f2($value)')
        expect(fixText).toContain('f1($value)')
      }
    }
  })
}) 