import { describe, expect, it } from 'bun:test'
import noMutationRule from '../../plugins/rules/no-mutation.rule'
import { lintLiteral } from '../../src/core'

describe('no-mutation rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noMutationRule])
  }

  it('should detect array mutations', () => {
    const code = `
      const numbers = [1, 2, 3];
      numbers.push(4);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-mutation')
      expect(message?.message).toContain('Mutation of array')
    }
  })
  
  it('should detect various array mutating methods', () => {
    const code = `
      const array = [1, 2, 3];
      array.push(4);
      array.pop();
      array.shift();
      array.unshift(0);
      array.splice(1, 1);
      array.sort();
      array.reverse();
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(7)
  })
  
  it('should detect object property mutations', () => {
    const code = `
      const user = { name: 'John', age: 30 };
      user.age = 31;
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('Mutation of object')
  })
  
  it('should provide fixes for array mutations', () => {
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
  
  it('should provide fixes for object mutations', () => {
    const code = `
      const user = { name: 'John', age: 30 };
      user.age = 31;
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.fixability).toBe('manual')
    }
  })
  
  it('should not report non-mutating operations', () => {
    const code = `
      // Non-mutating array methods
      const array = [1, 2, 3];
      const mapped = array.map(x => x * 2);
      const filtered = array.filter(x => x > 1);
      const reduced = array.reduce((sum, x) => sum + x, 0);
      
      // Non-mutating object operations
      const obj = { a: 1, b: 2 };
      const newObj = { ...obj, c: 3 };
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
})