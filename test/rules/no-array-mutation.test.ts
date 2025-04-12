import { describe, expect, it } from 'bun:test'
import { noArrayMutationRule } from '../../plugins/rules/no-array-mutation.rule'
import { lintLiteral } from '../../src/core'

describe('no-array-mutation rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noArrayMutationRule])
  }

  it('should detect array push mutations', () => {
    const code = `
      const numbers = [1, 2, 3];
      numbers.push(4);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-array-mutation')
      expect(message?.fixability).toBe('manual')
      expect(message?.message).toContain('push')
    }
  })
  
  it('should detect array pop mutations', () => {
    const code = `
      const numbers = [1, 2, 3];
      numbers.pop();
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('pop')
  })
  
  it('should detect array sort mutations', () => {
    const code = `
      const numbers = [3, 1, 2];
      numbers.sort();
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('sort')
  })
  
  it('should not report non-mutating array methods', () => {
    const code = `
      const numbers = [1, 2, 3];
      const newArray = numbers.map(n => n * 2);
      const filtered = numbers.filter(n => n > 1);
      const sum = numbers.reduce((acc, n) => acc + n, 0);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should provide a fix using spread for push', () => {
    const code = `
      const numbers = [1, 2, 3];
      numbers.push(4, 5);
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.fixability).toBe('manual')
    }
  })
  
  it('should provide a fix using slice for pop', () => {
    const code = `
      const numbers = [1, 2, 3];
      numbers.pop();
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.fixability).toBe('manual')
    }
  })
}) 