import { Node } from 'ts-morph';
import { createRule } from '../../src/core';
import { Rule, RuleContext } from '../../src/types';

export const noLoopsRule: Rule = (() => {
  const loopTypes = {
    ForStatement: 'for loops',
    ForInStatement: 'for-in loops',
    ForOfStatement: 'for-of loops',
    WhileStatement: 'while loops',
    DoStatement: 'do-while loops',
  };

  const visitors: Record<string, (node: Node, context: RuleContext) => void> = {};

  Object.entries(loopTypes).forEach(([nodeType, loopType]) => {
    visitors[nodeType] = (node, context) =>
      context.report({
        node,
        messageId: 'noLoops',
        data: { loopType },
      });
  });

  return createRule({
    name: 'no-loops',
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Discourages the use of loops in favor of higher-order functions',
        category: 'Functional',
        recommended: 'warn',
      },
      fixable: undefined,
      messages: { 
        noLoops: 'Avoid using {{loopType}}. Use functional alternatives like map, filter, reduce instead.' 
      },
    },
    create: (context) => {
      const reportLoop = (node: Node, loopType: string) => {
        context.report({
          node,
          messageId: 'noLoops',
          data: { loopType },
        });
      };

      return {
        ForStatement: (node) => reportLoop(node, loopTypes.ForStatement),
        ForInStatement: (node) => reportLoop(node, loopTypes.ForInStatement),
        ForOfStatement: (node) => reportLoop(node, loopTypes.ForOfStatement),
        WhileStatement: (node) => reportLoop(node, loopTypes.WhileStatement),
        DoStatement: (node) => reportLoop(node, loopTypes.DoStatement),
      };
    },
  });
})();

export default noLoopsRule; 
