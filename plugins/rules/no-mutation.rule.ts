import { SyntaxKind, Node } from 'ts-morph';
import { createRule } from '../../src/core';
import { Rule, Fixer } from '../../src/types';

// Shared utility functions for mutation detection
export const arrayMutationDetector = (context: any) => (node: Node): void => {
  if (node.getKind() === SyntaxKind.CallExpression) {
    const propAccess = node.getChildAtIndex(0)

    if (propAccess && propAccess.getKind() === SyntaxKind.PropertyAccessExpression) {
      const methodName = propAccess.getChildAtIndex(2)?.getText()
      const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']

      if (methodName && mutatingMethods.includes(methodName)) {
        context.report({
          node,
          messageId: 'noArrayMutation',
          data: { method: methodName },
          fix: (fixer: Fixer) => {
            if (methodName === 'push') {
              const arrayExpr = propAccess.getChildAtIndex(0)
              const arrayName = arrayExpr ? arrayExpr.getText() : ''

              const argsStart = node.getText().indexOf('(') + 1
              const argsEnd = node.getText().lastIndexOf(')')
              const args = node.getText().substring(argsStart, argsEnd)

              return fixer.replaceText(
                node,
                `[...${arrayName}, ${args}]`
              )
            }
            return null
          },
        })
      }
    }
  }
}

export const objectAssignDetector = (context: any) => (node: Node): void => {
  if (node.getKind() === SyntaxKind.CallExpression) {
    const propAccess = node.getChildAtIndex(0);
    
    if (propAccess && propAccess.getKind() === SyntaxKind.PropertyAccessExpression) {
      const objExpr = propAccess.getChildAtIndex(0)?.getText() || '';
      const methodName = propAccess.getChildAtIndex(2)?.getText() || '';
      
      if (objExpr === 'Object' && methodName === 'assign') {
        const args = node.getDescendantsOfKind(SyntaxKind.SyntaxList)[0];
        if (args && args.getChildren().length >= 2) {
          // First argument is the target to be mutated
          context.report({
            node,
            messageId: 'noObjectAssign',
            data: { method: 'Object.assign' }
          });
        }
      }
    }
  }
}

export const objectMutationDetector = (context: any) => (node: Node): void => {
  if (node.getKind() === SyntaxKind.BinaryExpression) {
    const children = node.getChildren()
    const operator = children[1]?.getText() ?? ''
    const operatorKind = children[1]?.getKind() ?? ''
    
    // Check for assignment (=) or compound assignments (+=, -=, etc.)
    const isAssignment = operator === '=' ||
      operatorKind === SyntaxKind.PlusEqualsToken ||
      operatorKind === SyntaxKind.MinusEqualsToken ||
      operatorKind === SyntaxKind.AsteriskEqualsToken ||
      operatorKind === SyntaxKind.SlashEqualsToken

    if (isAssignment) {
      const left = children.length > 0 ? children[0] : null

      // Check for direct property access (obj.prop = value)
      if (left && left.getKind() === SyntaxKind.PropertyAccessExpression) {
        context.report({
          node,
          messageId: 'noObjectMutation',
          data: { method: 'property assignment' },
          fix: (fixer: Fixer) => {
            const objExpr = left.getChildAtIndex(0)
            const propName = left.getChildAtIndex(2)

            if (objExpr && propName) {
              const objName = objExpr.getText()
              const property = propName.getText()
              const rightNode = children[2]
              const right = rightNode ? rightNode.getText() : ''

              return fixer.replaceText(
                node,
                `{ ...${objName}, ${property}: ${right} }`
              )
            }
            return null
          },
        })
      }
      
      // Check for bracket notation (obj['prop'] = value or array[index] = value)
      if (left && left.getKind() === SyntaxKind.ElementAccessExpression) {
        // Get the index expression to check if it's an array access
        const indexExpr = left.getChildAtIndex(2);
        
        // Skip if we're accessing an array with a numeric index - but only for the no-object-mutation rule
        // For the general no-mutation rule, we want to detect array index assignments too
        const isLikelyArrayAccess = indexExpr && 
          (indexExpr.getKind() === SyntaxKind.NumericLiteral ||
           (indexExpr.getKind() === SyntaxKind.Identifier && indexExpr.getText().match(/^i\d*$/)));
        
        // For the no-object-mutation rule, we skip array access
        // The context object includes the rule ID
        const isArrayMutationSkippable = context.options && context.options.skipArrayIndexAssignment === true;
        
        if (!isLikelyArrayAccess || !isArrayMutationSkippable) {
          // If it's an array index assignment, use array mutation message ID
          const messageId = isLikelyArrayAccess ? 'noArrayMutation' : 'noObjectMutation';
          const method = isLikelyArrayAccess ? 'index assignment' : 'bracket notation assignment';
          
          context.report({
            node,
            messageId,
            data: { method },
            fix: (fixer: Fixer) => {
              const objExpr = left.getChildAtIndex(0);
              const propNameExpr = left.getChildAtIndex(2);
              
              if (objExpr && propNameExpr) {
                const objName = objExpr.getText();
                const property = propNameExpr.getText();
                const rightNode = children[2];
                const right = rightNode ? rightNode.getText() : '';
                
                if (isLikelyArrayAccess) {
                  // For arrays, suggest a different immutable pattern
                  return fixer.replaceText(
                    node,
                    `${objName} = ${objName}.map((v, i) => i === ${property} ? ${right} : v)`
                  );
                } else {
                  // For objects, use spread syntax
                  return fixer.replaceText(
                    node,
                    `{ ...${objName}, [${property}]: ${right} }`
                  );
                }
              }
              return null;
            },
          });
        }
      }
    }
  }
}

export const objectDeleteDetector = (context: any) => (node: Node): void => {
  if (node.getKind() === SyntaxKind.DeleteExpression) {
    const operand = node.getChildAtIndex(1);
    
    if (operand && operand.getKind() === SyntaxKind.PropertyAccessExpression) {
      const objExpr = operand.getChildAtIndex(0);
      const propName = operand.getChildAtIndex(2);
      
      if (objExpr && propName) {
        context.report({
          node,
          messageId: 'noObjectDelete',
          data: { method: 'delete' },
          fix: (fixer: Fixer) => {
            const objName = objExpr.getText();
            const property = propName.getText();
            
            return fixer.replaceText(
              node,
              `(({ ${property}, ...rest }) => rest)(${objName})`
            );
          },
        });
      }
    }
  }
}

export const noMutationRule: Rule = createRule({
  name: 'no-mutation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents mutations of objects and arrays',
      category: 'Immutability',
      recommended: 'error',
    },
    messages: {
      noArrayMutation: 'Mutation of array using {{method}} is not allowed',
      noObjectMutation: 'Mutation of object using {{method}} is not allowed',
      noObjectDelete: 'Deletion of object property using delete operator is not allowed',
      noObjectAssign: 'Direct mutation using Object.assign is not allowed',
    },
  },
  create: (context) => {
    const checkArrayMutation = arrayMutationDetector(context);
    const checkObjectAssign = objectAssignDetector(context);
    const checkObjectDelete = objectDeleteDetector(context);

    return {
      CallExpression: (node) => {
        checkArrayMutation(node);
        checkObjectAssign(node);
      },
      ObjectExpression: (node) => {
        // Watch for object mutations
        checkObjectAssign(node);
      },
      BinaryExpression: (node) => {
        const children = node.getChildren();
        const operator = children[1]?.getText();
        
        if (operator === '=') {
          const left = children[0];
          const leftText = left?.getText();
          
          // Call the object mutation detector implementation directly
          const objectMutation = objectMutationDetector(context);
          objectMutation(node);
          
          if (leftText && leftText.includes('.') && !leftText.startsWith('this.')) {
            // Report object property mutation
            context.report({
              node,
              messageId: 'objectMutation',
              data: { 
                prop: leftText
              },
              fix: (_fixer) => ({
                range: [node.getStart(), node.getEnd()],
                text: `${leftText.split('.')[0]} = { ...${leftText.split('.')[0]}, ${leftText.split('.').slice(1).join('.')}: ${children[2]?.getText()} }`
              })
            });
          }
        }
      },
      DeleteExpression: checkObjectDelete
    }
  },
});

export default noMutationRule; 
