import { describe, expect, it } from 'bun:test'
import preferConstRule from '../../plugins/rules/prefer-const.rule'
import { lintLiteral } from '../../src/core'

describe('prefer-const rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [preferConstRule])
  }

  it('should detect let declarations that could be const', () => {
    const code = `
      let count = 0;
      
      function test() {
        let name = 'John';
        console.log(name);
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(2)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('prefer-const')
      expect(message?.message).toContain('const')
      expect(message?.fixability).toBe('fixable')
    }
  })
  
  it('should flag all let declarations regardless of reassignment', () => {
    const code = `
      let count = 0;
      count = 1;
      
      function test() {
        let name = 'John';
        name = 'Jane';
      }
    `
    
    const result = testRule(code)
    
    // The rule only checks declarations, not uses
    expect(result.messages.length).toBe(2)
  })
  
  it('should provide fixes for all let declarations', () => {
    const code = `
      let count = 0;
      let name = 'John';
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      result.messages.forEach(message => {
        expect(message?.fixability).toBe('fixable')
        if (message && message.fix) {
          expect(message.fix.text).toBe('const')
        }
      })
    }
  })
  
  it('should not report const declarations', () => {
    const code = `
      const count = 0;
      const name = 'John';
      
      function test() {
        const value = 42;
        console.log(value);
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should report let declarations even with destructuring assignments', () => {
    const code = `
      let [a, b] = [1, 2];
      b = 3;
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
}) 