import { describe, test, expect } from 'bun:test';
import { Node } from 'ts-morph';

import { composeRules } from '../../rules/compose';
import { createRule } from '../../rules/create';
import type { RuleContext } from '../../rules/types';

describe('Rule Composition', () => {
  test('should properly combine multiple rules', () => {
    let identifierCalled = false;
    let stringLiteralCalled = false;
    
    const ruleA = createRule({
      name: 'rule-a',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Rule A',
          category: 'Test',
          recommended: false,
        },
        schema: [],
        messages: {
          violationA: 'Violation from rule A'
        },
      },
      create: (_context: RuleContext) => ({
        Identifier: (node: Node) => {
          identifierCalled = true;
        },
      })
    });

    const ruleB = createRule({
      name: 'rule-b',
      meta: {
        type: 'problem',
        docs: {
          description: 'Rule B',
          category: 'Test',
          recommended: true,
        },
        schema: [],
        messages: {
          violationB: 'Violation from rule B'
        },
      },
      create: (_context: RuleContext) => ({
        StringLiteral: (node: Node) => {
          stringLiteralCalled = true;
        },
      })
    });

    const combinedRule = composeRules([ruleA, ruleB], {
      name: 'combined-rule',
      meta: {
        docs: {
          description: 'Combined rule',
          category: 'Test',
          recommended: false,
        }
      }
    });

    expect(combinedRule.name).toBe('combined-rule');
    expect(combinedRule.meta.type).toBe('suggestion');
    expect(combinedRule.meta.docs.description).toBe('Combined rule');
    expect(combinedRule.meta.docs.category).toBe('Test');
    expect(combinedRule.meta.docs.recommended).toBe(false);
    
    expect(combinedRule.meta.messages).toEqual({
      violationA: 'Violation from rule A',
      violationB: 'Violation from rule B'
    });

    const mockContext = {} as RuleContext;
    const visitors = combinedRule.create(mockContext);
    
    expect(typeof visitors.Identifier).toBe('function');
    expect(typeof visitors.StringLiteral).toBe('function');
    
    const mockNode = {} as Node;
    
    const identifierVisitor = visitors.Identifier;
    expect(identifierVisitor).toBeDefined();
    if (identifierVisitor) {
      identifierVisitor(mockNode);
      expect(identifierCalled).toBe(true);
    }
    
    const stringLiteralVisitor = visitors.StringLiteral;
    expect(stringLiteralVisitor).toBeDefined();
    if (stringLiteralVisitor) {
      stringLiteralVisitor(mockNode);
      expect(stringLiteralCalled).toBe(true);
    }
  });

  test('should handle visitor conflicts correctly', () => {
    let visitorACalled = false;
    let visitorBCalled = false;
    
    const ruleA = createRule({
      name: 'rule-a',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Rule A',
          category: 'Test',
          recommended: false,
        },
        schema: [],
        messages: {
          violationA: 'Violation from rule A'
        },
      },
      create: (_context: RuleContext) => ({
        Identifier: (node: Node) => {
          visitorACalled = true;
        },
      })
    });

    const ruleB = createRule({
      name: 'rule-b',
      meta: {
        type: 'problem',
        docs: {
          description: 'Rule B',
          category: 'Test',
          recommended: true,
        },
        schema: [],
        messages: {
          violationB: 'Violation from rule B'
        },
      },
      create: (_context: RuleContext) => ({
        Identifier: (node: Node) => {
          visitorBCalled = true;
        },
      })
    });

    const combinedRule = composeRules([ruleA, ruleB], {
      name: 'combined-rule'
    });

    const mockContext = {} as RuleContext;
    const visitors = combinedRule.create(mockContext);
    
    const mockNode = {} as Node;
    
    const identifierVisitor = visitors.Identifier;
    expect(identifierVisitor).toBeDefined();
    if (identifierVisitor) {
      identifierVisitor(mockNode);
      expect(visitorACalled).toBe(true);
      expect(visitorBCalled).toBe(true);
    }
  });
});