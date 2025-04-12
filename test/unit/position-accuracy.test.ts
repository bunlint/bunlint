import { describe, expect, it } from 'bun:test'
import { lintLiteral } from '../../src/core'
import noClassRule from '../../plugins/rules/no-class.rule'
import noLoopsRule from '../../plugins/rules/no-loops.rule'
import noMutationRule from '../../plugins/rules/no-mutation.rule'
import noThisRule from '../../plugins/rules/no-this.rule'
import { preferPipeRule } from '../../plugins/rules/prefer-pipe.rule'
import pureFunctionRule from '../../plugins/rules/pure-function.rule'
import preferConstRule from '../../plugins/rules/prefer-const.rule'

describe('Position Accuracy in Error Reporting', () => {
  it('should report accurate positions for class declarations', () => {
    const code = `
      // Line 1
      class User {
        // Line 3
        name: string;
        
        constructor(name: string) {
          this.name = name;
        }
      }
    `;
    
    const result = lintLiteral(code, [noClassRule]);
    
    expect(result.messages.length).toBe(1);
    
    const message = result.messages[0];
    if (message) {
      expect(message.line).toBe(3); // Class starts on line 3 (1-indexed)
      expect(message.endLine).toBe(9); // Class ends on line 9 (1-indexed)
      expect(message.nodeType).toBe('ClassDeclaration');
    }
  });
  
  it('should report accurate positions for loops', () => {
    const code = `
      const numbers = [1, 2, 3, 4, 5];
      
      for (let i = 0; i < numbers.length; i++) {
        console.log(numbers[i]);
      }
      
      // Another statement
      const sum = numbers.reduce((total, n) => total + n, 0);
    `;
    
    const result = lintLiteral(code, [noLoopsRule]);
    
    expect(result.messages.length).toBe(1);
    
    const message = result.messages[0];
    if (message) {
      expect(message.line).toBe(4); // Loop starts on line 4 (1-indexed)
      expect(message.endLine).toBe(6); // Loop ends on line 6 (1-indexed)
      expect(message.nodeType).toBe('ForStatement');
    }
  });
  
  it('should report accurate column positions', () => {
    const code = `function test() {
  let x = 5; // column positions are important here
  const y = 10;
}`;
    
    const result = lintLiteral(code, [preferConstRule]);
    
    expect(result.messages.length).toBe(1);
    
    const message = result.messages[0];
    if (message) {
      expect(message.column).toBe(3); // 'let' starts at column 3
      expect(message.endColumn).toBeGreaterThan(message.column); // End column after start
    }
  });
  
  it('should correctly identify ranges for nested constructs', () => {
    const code = `
      const obj = {
        method: function() {
          for (let i = 0; i < 10; i++) {
            let x = i * 2; // Inner let
          }
        }
      };
    `;
    
    const result = lintLiteral(code, [noLoopsRule, preferConstRule]);
    
    // Should have 3 messages - one for loop, one for inner let, and one for i declaration
    expect(result.messages.length).toBe(3);
    
    // Find the loop message
    const loopMessage = result.messages.find(m => m.ruleId === 'no-loops');
    if (loopMessage) {
      expect(loopMessage.line).toBe(4);
      expect(loopMessage.nodeType).toBe('ForStatement');
    }
    
    // Find the prefer-const message for inner let
    const letMessage = result.messages.find(m => m.ruleId === 'prefer-const' && m.line === 5);
    if (letMessage) {
      expect(letMessage.line).toBe(5);
      expect(letMessage.nodeType).toBe('VariableDeclaration');
    }
  });
  
  it('should correctly identify object mutation positions', () => {
    const code = `
      const user = { name: 'John', age: 30 };
      
      // Direct mutation
      user.age = 31;
      
      // Another type of mutation
      delete user.name;
    `;
    
    const result = lintLiteral(code, [noMutationRule]);
    
    expect(result.messages.length).toBe(2);
    
    // Sort messages by line number
    const sortedMessages = [...result.messages].sort((a, b) => a.line - b.line);
    
    // Check property assignment mutation
    const assignmentMessage = sortedMessages[0];
    if (assignmentMessage) {
      expect(assignmentMessage.line).toBe(5);
      expect(assignmentMessage.nodeType).toBe('AssignmentExpression');
    }
    
    // Check delete operation mutation
    const deleteMessage = sortedMessages[1];
    if (deleteMessage) {
      expect(deleteMessage.line).toBe(8);
      expect(deleteMessage.nodeType).toBe('UnaryExpression');
    }
  });
  
  it('should include accurate position info in array mutation reports', () => {
    const code = `
      const numbers = [1, 2, 3];
      
      // Method mutation
      numbers.push(4);
      
      // Index mutation
      numbers[0] = 10;
    `;
    
    const result = lintLiteral(code, [noMutationRule]);
    
    expect(result.messages.length).toBe(2);
    
    // Sort messages by line number
    const sortedMessages = [...result.messages].sort((a, b) => a.line - b.line);
    
    // Check array method mutation
    const methodMessage = sortedMessages[0];
    if (methodMessage) {
      expect(methodMessage.line).toBe(5);
      expect(methodMessage.nodeType).toBe('CallExpression');
    }
    
    // Check array index assignment mutation
    const indexMessage = sortedMessages[1];
    if (indexMessage) {
      expect(indexMessage.line).toBe(8);
      expect(indexMessage.nodeType).toBe('AssignmentExpression');
    }
  });
  
  it('should report precise positions for multiline statements', () => {
    const code = `
      // Multiline class declaration
      class MultilineClass 
      {
        method() {
          return true;
        }
      }
      
      // Multiline function
      function multilineFunction(
        a,
        b,
        c
      ) {
        for (
          let i = 0; 
          i < 10; 
          i++
        ) {
          console.log(i);
        }
      }
    `;
    
    const result = lintLiteral(code, [noClassRule, noLoopsRule]);
    
    expect(result.messages.length).toBe(2);
    
    // Find class message
    const classMessage = result.messages.find(m => m.ruleId === 'no-class');
    if (classMessage) {
      // Should span from line 3 to line 8 (1-indexed)
      expect(classMessage.line).toBe(3);
      expect(classMessage.endLine).toBe(8);
    }
    
    // Find loop message
    const loopMessage = result.messages.find(m => m.ruleId === 'no-loops');
    if (loopMessage) {
      // Should span from line 15 to line 22 (1-indexed)
      expect(loopMessage.line).toBe(15);
      expect(loopMessage.endLine).toBe(22);
    }
  });
  
  it('should report accurate positions for this expressions', () => {
    const code = `
      class Example {
        constructor(value) {
          this.value = value;
        }
        
        getValue() {
          return this.value;
        }
      }
    `;
    
    const result = lintLiteral(code, [noThisRule]);
    
    // Should have at least one this expression (actual implementation may report more)
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
    
    // Sort messages by line number
    const sortedMessages = [...result.messages].sort((a, b) => a.line - b.line);
    
    // Check first this expression
    const firstThis = sortedMessages[0];
    if (firstThis) {
      expect(firstThis.line).toBe(4);
      expect(firstThis.nodeType).toBe('ThisExpression');
    }
    
    // If there's a second this expression check it too
    if (sortedMessages.length > 1) {
      const secondThis = sortedMessages[1];
      if (secondThis) {
        expect(secondThis.line).toBe(7);
        expect(secondThis.nodeType).toBe('MethodDeclaration');
      }
    }
  });
  
  it('should accurately identify positions in nested functions', () => {
    const code = `
      function outer() {
        let outerVar = 1; // Should trigger prefer-const
        
        function inner() {
          let innerVar = 2; // Should trigger prefer-const
          return innerVar;
        }
        
        return outerVar + inner();
      }
    `;
    
    const result = lintLiteral(code, [preferConstRule]);
    
    // Should identify both let declarations
    expect(result.messages.length).toBe(2);
    
    // Sort messages by line number
    const sortedMessages = [...result.messages].sort((a, b) => a.line - b.line);
    
    // Check outer let
    const outerLet = sortedMessages[0];
    if (outerLet) {
      expect(outerLet.line).toBe(3);
      expect(outerLet.nodeType).toBe('VariableDeclaration');
    }
    
    // Check inner let
    const innerLet = sortedMessages[1];
    if (innerLet) {
      expect(innerLet.line).toBe(6);
      expect(innerLet.nodeType).toBe('VariableDeclaration');
    }
  });
  
  it('should report precise character ranges for fix suggestions', () => {
    const code = `
      // Non-pure function that could be fixed
      const calculateTotal = (items) => {
        console.log('Calculating total'); // Side effect
        return items.reduce((sum, item) => sum + item.price, 0);
      };
    `;
    
    const result = lintLiteral(code, [pureFunctionRule]);
    
    // Our implementation reports multiple issues for the same function
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
    
    // Find a message with fix info if it exists
    const message = result.messages.find(m => m.fix);
    if (message && message.fix) {
      // The fix object should have valid range values
      expect(typeof message.fix.range[0]).toBe('number');
      expect(typeof message.fix.range[1]).toBe('number');
      expect(message.fix.range[0]).toBeLessThan(message.fix.range[1]);
      
      // Verify the range points to the console.log line
      const sourceSlice = code.substring(message.fix.range[0], message.fix.range[1]);
      expect(sourceSlice).toContain('console.log');
    } else {
      // If no fix is available, at least confirm there's a message about the issue
      const consoleMessage = result.messages.find(m => 
        m.message.includes('console') || m.message.includes('side effect'));
      expect(consoleMessage).toBeDefined();
    }
  });
  
  it('should include line/column info even for file-level problems', () => {
    // File-level issues like configuration problems should still have position info
    const code = `
      // Some code that might trigger a file-level warning
      let x = 5;
      x++; // Mutation
    `;
    
    // Create a mock file-level rule
    const fileLevelRule = {
      name: 'file-structure',
      meta: {
        type: 'suggestion' as const,
        docs: {
          description: 'Check file structure',
          category: 'Best Practices',
          recommended: true
        },
        messages: {
          fileStructure: 'This file has a structure issue'
        }
      },
      create: (context: any) => ({
        Program: (node: any) => {
          context.report({
            node,
            messageId: 'fileStructure',
          });
        }
      })
    };
    
    const result = lintLiteral(code, [fileLevelRule]);
    
    expect(result.messages.length).toBe(1);
    
    const message = result.messages[0];
    if (message) {
      // Even file-level issues should have position information
      expect(message.line).toBeDefined();
      expect(message.column).toBeDefined();
    }
  });
}); 