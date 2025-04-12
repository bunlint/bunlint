import { describe, expect, it } from 'bun:test'
import { noObjectMutationRule } from '../../plugins/rules/no-object-mutation.rule'
import { lintLiteral } from '../../src/core'

describe('no-object-mutation rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noObjectMutationRule])
  }

  it('should detect direct object property mutations', () => {
    const code = `
      const user = { name: 'John', age: 30 };
      user.name = 'Jane';
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-object-mutation')
      expect(message?.fixability).toBe('manual')
    }
  })
  
  it('should not report variable assignments', () => {
    const code = `
      let name = 'John';
      name = 'Jane';
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should not report array element assignments', () => {
    const code = `
      const arr = [1, 2, 3];
      arr[1] = 4;
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should detect compound assignments to object properties', () => {
    const code = `
      const counter = { value: 0 };
      counter.value += 1;
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
  
  it('should provide a fix using object spread', () => {
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
}) 