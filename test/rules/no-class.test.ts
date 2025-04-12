import { describe, expect, it } from 'bun:test'
import { lintLiteral } from '../../src/core'
import noClassRule from '../../plugins/rules/no-class.rule'

describe('no-class rule', () => {
  const testRule = (code: string) => {
    return lintLiteral(code, [noClassRule])
  }

  it('should detect class declarations', () => {
    const code = `
      class User {
        name: string;
        
        constructor(name: string) {
          this.name = name;
        }
        
        greet() {
          return \`Hello, \${this.name}\`;
        }
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    
    if (result.messages.length > 0) {
      const message = result.messages[0]
      expect(message?.ruleId).toBe('no-class')
      expect(message?.message).toContain('Classes are not allowed')
    }
  })
  
  it('should detect class expressions', () => {
    const code = `
      const User = class {
        name: string;
        
        constructor(name: string) {
          this.name = name;
        }
        
        greet() {
          return \`Hello, \${this.name}\`;
        }
      }
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(1)
    expect(result.messages[0]?.message).toContain('Classes are not allowed')
  })
  
  it('should not report function-based alternatives', () => {
    const code = `
      // Factory function alternative
      const createUser = (name: string) => ({
        name,
        greet: () => \`Hello, \${name}\`
      });
      
      // Module pattern
      const userModule = (() => {
        const createUser = (name: string) => ({
          name,
          greet: () => \`Hello, \${name}\`
        });
        
        return { createUser };
      })();
    `
    
    const result = testRule(code)
    
    expect(result.messages.length).toBe(0)
  })
}) 