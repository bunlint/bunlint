import { describe, test, expect } from 'bun:test';
import { Node } from 'ts-morph';

import { createRule } from '../../rules/create';
import type { RuleContext } from '../../rules/types';

describe('Rule Creation Factory', () => {
  test('should properly initialize a rule with correct structure', () => {
    const myRule = createRule({
      name: 'my-rule',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Test rule',
          category: 'Test',
          recommended: false,
        },
        fixable: undefined,
        schema: [],
        messages: {
          violation: 'This is a violation'
        },
      },
      create: (context: RuleContext) => {
        return {
          Identifier: (node: Node) => {
            context.report({
              node,
              messageId: 'violation'
            });
          }
        };
      }
    });

    expect(myRule).toBeDefined();
    expect(myRule.name).toBe('my-rule');
    expect(myRule.meta).toEqual({
      type: 'suggestion',
      docs: {
        description: 'Test rule',
        category: 'Test',
        recommended: false,
      },
      fixable: undefined,
      schema: [],
      messages: {
        violation: 'This is a violation'
      },
    });
    expect(typeof myRule.create).toBe('function');
  });

  test('should validate required rule metadata', () => {
    const createInvalidRule = () => {
      return createRule({
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Test rule',
            category: 'Test',
            recommended: false,
          },
          schema: [],
          messages: {
            violation: 'This is a violation'
          },
        },
        create: () => ({})
      });
    };

    expect(createInvalidRule).toThrow(/Rule must have a name/);
  });
});