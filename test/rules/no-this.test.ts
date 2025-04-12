import { describe, expect, it } from 'bun:test'
import noThisRule from '../../plugins/rules/no-this.rule'
import { lintLiteral } from '../../src/core'

describe('no-this rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noThisRule])
  }

  it('should detect this keyword in functions', () => {
    const code = `
      const obj = {
        name: 'test',
        method() {
          this.name = 'new name';
        }
      };
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBeGreaterThan(0)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-this')
      expect(message?.message).toContain('this')
    }
  })
  
  it('should detect this in arrow functions within methods', () => {
    const code = `
      const obj = {
        name: 'User',
        greet() {
          const arrowFn = () => {
            console.log(this.name);
          };
          arrowFn();
        }
      };
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBeGreaterThan(0)
  })
  
  it('should detect this in object methods', () => {
    const code = `
      const user = {
        name: 'John',
        greet() {
          return 'Hello, ' + this.name;
        }
      };
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBeGreaterThan(0)
  })
  
  it('should not report code without this references', () => {
    const code = `
      // Factory function alternative
      const createUser = (name) => {
        const greet = () => {
          return 'Hello, ' + name;
        };
        
        return {
          name,
          greet
        };
      };
      
      // Using closures instead of this
      function makeCounter() {
        let count = 0;
        
        return {
          increment: () => ++count,
          getCount: () => count
        };
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
}) 