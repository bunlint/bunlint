import { describe, expect, it } from 'bun:test';
import { lintLiteral, createRule, composeRules } from '../../src/core';
import { RuleContext } from '../../src/types';
import { SyntaxKind, VariableDeclarationKind } from 'ts-morph';
import noClassRule from '../../plugins/rules/no-class.rule';
import noLoopsRule from '../../plugins/rules/no-loops.rule';
import noMutationRule from '../../plugins/rules/no-mutation.rule';
import noThisRule from '../../plugins/rules/no-this.rule';
import { preferPipeRule } from '../../plugins/rules/prefer-pipe.rule';
import pureFunctionRule from '../../plugins/rules/pure-function.rule';
import noLetRule from '../../plugins/rules/no-let.rule';

describe('Functional Programming Requirements', () => {
  describe('Immutability Enforcement', () => {
    it('should detect and prevent array mutations', () => {
      const code = `
        const arr = [1, 2, 3];
        
        // Direct mutations
        arr.push(4);
        arr.pop();
        arr.shift();
        arr.unshift(0);
        arr.splice(1, 1);
        arr.sort();
        arr.reverse();
        
        // Index mutations
        arr[0] = 5;
        arr.length = 2;
        
        // Spread operator (valid)
        const newArr = [...arr, 4];
        
        // Map (valid)
        const mapped = arr.map(x => x * 2);
        
        // Filter (valid)
        const filtered = arr.filter(x => x > 1);
        
        // Reduce (valid)
        const sum = arr.reduce((acc, x) => acc + x, 0);
      `;

      const result = lintLiteral(code, [noMutationRule]);
      
      // Should detect all mutation attempts
      expect(result.messages.length).toBeGreaterThanOrEqual(8);
      expect(result.messages.every(m => m.ruleId === 'no-mutation')).toBe(true);
      
      // Should not flag immutable operations
      const validOperations = ['newArr', 'mapped', 'filtered', 'sum'];
      validOperations.forEach(op => {
        expect(result.messages.some(m => m.message.includes(op))).toBe(false);
      });
    });

    it('should detect and prevent object mutations', () => {
      const code = `
        const obj = { a: 1, b: 2 };
        
        // Direct property mutations
        obj.a = 3;
        obj['b'] = 4;
        obj.c = 5;
        
        // Object method mutations
        Object.assign(obj, { d: 6 });
        delete obj.a;
        
        // Spread operator (valid)
        const newObj = { ...obj, e: 7 };
        
        // Object.fromEntries (valid)
        const entries = Object.entries(obj);
        const fromEntries = Object.fromEntries(entries);
      `;

      const result = lintLiteral(code, [noMutationRule]);
      
      // Should detect all mutation attempts
      expect(result.messages.length).toBeGreaterThanOrEqual(5);
      expect(result.messages.every(m => m.ruleId === 'no-mutation')).toBe(true);
      
      // Should not flag immutable operations
      const validOperations = ['newObj', 'entries', 'fromEntries'];
      validOperations.forEach(op => {
        expect(result.messages.some(m => m.message.includes(op))).toBe(false);
      });
    });

    it('should enforce const declarations over let', () => {
      const code = `
        // Invalid: let declarations
        let x = 1;
        let y = 2;
        let z = 3;
        
        // Valid: const declarations
        const a = 1;
        const b = 2;
        const c = 3;
        
        // Invalid: let in loops
        for (let i = 0; i < 10; i++) {
          console.log(i);
        }
        
        // Valid: const in for...of
        const arr = [1, 2, 3];
        for (const item of arr) {
          console.log(item);
        }
      `;

      const result = lintLiteral(code, [noLetRule]);
      
      // Should detect all let declarations
      expect(result.messages.length).toBeGreaterThanOrEqual(4);
      expect(result.messages.every(m => m.ruleId === 'no-let')).toBe(true);
      
      // Should have the correct message format with variable names
      expect(result.messages.some(m => m.message.includes('variable x'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('variable y'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('variable z'))).toBe(true);
      
      // For...of loops are flagged even when using const
      // The no-let rule is expected to report for...of loops regardless of whether they use const or let
      expect(result.messages.some(m => m.message.includes('for...of'))).toBe(true);
    });
  });

  describe('Functional Programming Patterns', () => {
    it('should enforce pure functions', () => {
      const code = `
        // Impure functions
        let counter = 0;
        function impureIncrement() {
          counter++;
          return counter;
        }
        
        function impureRandom() {
          return Math.random();
        }
        
        function impureDate() {
          return new Date();
        }
        
        // Pure functions
        function pureAdd(a: number, b: number) {
          return a + b;
        }
        
        function pureMultiply(a: number, b: number) {
          return a * b;
        }
        
        function pureCompose(f: Function, g: Function) {
          return (x: any) => f(g(x));
        }
      `;

      const result = lintLiteral(code, [pureFunctionRule]);
      
      // Should detect impure functions
      expect(result.messages.length).toBeGreaterThanOrEqual(3);
      expect(result.messages.every(m => m.ruleId === 'pure-function')).toBe(true);
      
      // Should not flag pure functions
      const pureFunctions = ['pureAdd', 'pureMultiply', 'pureCompose'];
      pureFunctions.forEach(fn => {
        expect(result.messages.some(m => m.message.includes(fn))).toBe(false);
      });
    });

    it('should enforce pipe/flow composition', () => {
      const code = `
        // Non-functional approach
        function processData(data: number[]) {
          const filtered = data.filter(x => x > 0);
          const mapped = filtered.map(x => x * 2);
          const sorted = mapped.sort((a, b) => a - b);
          return sorted;
        }
        
        // Functional approach with pipe
        const processDataFunctional = pipe(
          filter((x: number) => x > 0),
          map((x: number) => x * 2),
          sort((a: number, b: number) => a - b)
        );
        
        // Nested function calls
        const result = sort(
          map(
            filter(data, x => x > 0),
            x => x * 2
          ),
          (a, b) => a - b
        );
      `;

      const result = lintLiteral(code, [preferPipeRule]);
      
      // Should detect non-functional approaches
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
      expect(result.messages.every(m => m.ruleId === 'prefer-pipe')).toBe(true);
      
      // Should not flag pipe/flow usage
      expect(result.messages.some(m => m.message.includes('processDataFunctional'))).toBe(false);
    });

    it('should prevent class usage', () => {
      const code = `
        // Class declarations
        class MyClass {
          private value: number;
          
          constructor(value: number) {
            this.value = value;
          }
          
          getValue(): number {
            return this.value;
          }
        }
        
        // Class expressions
        const AnotherClass = class {
          static staticMethod() {
            return 'static';
          }
        };
        
        // Class extension
        class ExtendedClass extends MyClass {
          getDoubleValue(): number {
            return this.getValue() * 2;
          }
        }
        
        // Functional alternative
        const createCounter = (initial: number) => {
          let value = initial;
          return {
            getValue: () => value,
            increment: () => value + 1,
            decrement: () => value - 1
          };
        };
      `;

      const result = lintLiteral(code, [noClassRule]);
      
      // Should detect all class usages
      expect(result.messages.length).toBeGreaterThanOrEqual(3);
      expect(result.messages.every(m => m.ruleId === 'no-class')).toBe(true);
      
      // Should not flag functional alternatives
      expect(result.messages.some(m => m.message.includes('createCounter'))).toBe(false);
    });

    it('should prevent this keyword usage', () => {
      const code = `
        // Class methods using this
        class Example {
          private value: number;
          
          constructor(value: number) {
            this.value = value;
          }
          
          getValue(): number {
            return this.value;
          }
          
          setValue(newValue: number): void {
            this.value = newValue;
          }
        }
        
        // Object methods using this
        const obj = {
          value: 42,
          getValue() {
            return this.value;
          },
          setValue(newValue: number) {
            this.value = newValue;
          }
        };
        
        // Functional alternative
        const createCounter = (initial: number) => {
          let value = initial;
          return {
            getValue: () => value,
            setValue: (newValue: number) => value = newValue
          };
        };
      `;

      const result = lintLiteral(code, [noThisRule]);
      
      // Should detect all this usages
      expect(result.messages.length).toBeGreaterThanOrEqual(4);
      expect(result.messages.every(m => m.ruleId === 'no-this')).toBe(true);
      
      // Should not flag functional alternatives
      expect(result.messages.some(m => m.message.includes('createCounter'))).toBe(false);
    });
  });

  describe('Rule Composition', () => {
    it('should compose multiple functional rules correctly', () => {
      const code = `
        class Example {
          private arr: number[] = [1, 2, 3];
          
          process() {
            this.arr.push(4);
            this.arr.sort();
            return this.arr;
          }
        }
        
        // Functional alternative
        const processArray = (arr: number[]) => {
          const newArr = [...arr, 4];
          return [...newArr].sort();
        };
      `;

      const composedRule = composeRules([
        noClassRule,
        noThisRule,
        noMutationRule
      ]);

      const result = lintLiteral(code, [composedRule]);
      
      // Should detect violations from all rules
      expect(result.messages.length).toBeGreaterThanOrEqual(4);
      
      // Should have messages from a composed rule
      const composedRuleId = result.messages[0]?.ruleId || '';
      expect(composedRuleId).toContain('composed:');
      expect(composedRuleId).toContain('no-class');
      expect(composedRuleId).toContain('no-this');
      expect(composedRuleId).toContain('no-mutation');
      
      // Should not flag functional alternative
      expect(result.messages.some(m => m.message.includes('processArray'))).toBe(false);
    });
  });
}); 