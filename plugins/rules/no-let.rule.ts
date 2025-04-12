import { createRule } from '../../src/core';
import { SyntaxKind, VariableDeclarationKind, Node } from 'ts-morph';
import type { RuleContext, Fixer } from '../../src/types';

export default createRule({
  name: 'no-let',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow let declarations in favor of const',
      category: 'Immutability',
      recommended: true
    },
    fixable: 'code',
    messages: {
      useConst: 'Use const instead of let for variable {{varName}}',
      useForOf: 'Use for...of with const instead of for loop with let'
    }
  },
  create: (context: RuleContext) => ({
    'VariableDeclaration': (node: Node) => {
      if (node.getKind() === SyntaxKind.VariableDeclaration &&
          node.getParent()?.getKind() === SyntaxKind.VariableDeclarationList &&
          (node.getParent() as any).getDeclarationKind() === VariableDeclarationKind.Let) {
        const varName = node.getFirstChildByKind(SyntaxKind.Identifier)?.getText() || '';
        context.report({
          node,
          messageId: 'useConst',
          data: { varName },
          fix: (_fixer: Fixer) => ({
            range: [node.getStart(), node.getStart() + 3],
            text: 'const'
          })
        });
      }
    },
    'ForStatement': (node: Node) => {
      const initializer = (node as any).getInitializer();
      if (initializer && 
          initializer.getKind() === SyntaxKind.VariableDeclarationList &&
          initializer.getDeclarationKind() === VariableDeclarationKind.Let) {
        context.report({
          node: initializer,
          messageId: 'useForOf',
          suggest: [{
            messageId: 'useForOf',
            fix: (_fixer: Fixer) => ({
              range: [node.getStart(), node.getEnd()],
              text: node.getText() // No change, just return the same text
            })
          }]
        });
      }
    }
  })
}); 
