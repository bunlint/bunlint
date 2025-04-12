import { describe, expect, it } from 'bun:test'
import { noLoopsRule } from '../../plugins/rules/no-loops.rule'
import { lintLiteral } from '../../src/core'

describe('no-loops rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noLoopsRule])
  }

  it('should detect for loops', () => {
    const code = `
      for (let i = 0; i < 10; i++) {
        console.log(i);
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-loops')
      expect(message?.message).toContain('for loops')
    }
  })
  
  it('should detect while loops', () => {
    const code = `
      let i = 0;
      while (i < 10) {
        console.log(i);
        i++;
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('while loops')
  })
  
  it('should detect do-while loops', () => {
    const code = `
      let i = 0;
      do {
        console.log(i);
        i++;
      } while (i < 10);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('do-while loops')
  })
  
  it('should detect for...in loops', () => {
    const code = `
      const obj = { a: 1, b: 2, c: 3 };
      for (const key in obj) {
        console.log(key, obj[key]);
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('for-in loops')
  })
  
  it('should not report functional alternatives', () => {
    const code = `
      // Using Array.forEach
      [1, 2, 3].forEach(item => console.log(item));
      
      // Using map
      const doubled = [1, 2, 3].map(x => x * 2);
      
      // Using reduce
      const sum = [1, 2, 3].reduce((acc, val) => acc + val, 0);
      
      // Using filter
      const evens = [1, 2, 3, 4].filter(x => x % 2 === 0);
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should suggest functional alternatives in the message', () => {
    const code = `
      for (let i = 0; i < array.length; i++) {
        console.log(array[i]);
      }
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]?.message || ''
      expect(message).toContain('map')
      expect(message).toContain('filter')
      expect(message).toContain('reduce')
    }
  })
}) 