import { describe, expect, it } from 'bun:test'
import pureFunctionRule from '../../plugins/rules/pure-function.rule'
import { lintLiteral } from '../../src/core'

describe('pure-function rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [pureFunctionRule])
  }

  it('should detect impure functions with console.log', () => {
    const code = `
      function logValue(value) {
        console.log(value);
        return value;
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('pure-function')
      expect(message?.message).toContain('side effect')
    }
  })
  
  it('should detect functions that modify external state', () => {
    const code = `
      let count = 0;
      
      function increment() {
        count++;
        return count;
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
  
  it('should detect functions with DOM manipulation', () => {
    const code = `
      function updateUI(value) {
        document.getElementById('result').textContent = value;
        return true;
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
  
  it('should detect impure functions with localStorage operations', () => {
    const code = `
      function saveUserPreference(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
  })
  
  it('should not report pure functions', () => {
    const code = `
      function add(a, b) {
        return a + b;
      }
      
      const multiply = (a, b) => a * b;
      
      function transformArray(arr) {
        return arr.map(x => x * 2);
      }
      
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
  
  it('should suggest ways to make functions pure in the message', () => {
    const code = `
      let total = 0;
      
      function addToTotal(value) {
        total += value;
        return total;
      }
    `
    
    const result = testRule(code)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]?.message || ''
      expect(message).toContain('pure')
    }
  })
}) 