import { SyntaxKind, Node, VariableDeclarationKind } from 'ts-morph';
import { createRule } from '../../src/core';
import { Rule } from '../../src/types';

export const preferConstRule: Rule = createRule({
  name: 'prefer-const',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforces the use of const declarations over let',
      category: 'Immutability',
      recommended: 'warn',
    },
    fixable: 'code',
    messages: {
      preferConst: 'Use const instead of let for variables that are never reassigned.',
    },
  },
  create: (context) => {
    return {
      VariableDeclarationList: (node: Node): void => {
        if (node.getKind() === SyntaxKind.VariableDeclarationList) {
          const declarationList = node.asKind(SyntaxKind.VariableDeclarationList)

          if (declarationList && declarationList.getDeclarationKind() === VariableDeclarationKind.Let) {
            const keyword = node.getFirstChild()

            if (keyword && keyword.getText() === 'let') {
              context.report({
                node,
                messageId: 'preferConst',
                fix: (fixer) => {
                  return fixer.replaceText(keyword, 'const')
                },
              })
            }
          }
        }
      },
    }
  },
});

export default preferConstRule; 
