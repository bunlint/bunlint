import { SyntaxKind, Node } from 'ts-morph';
import { createRule } from '../../src/core';
import { Rule, ReportDescriptor, BaseReportDescriptor, RuleDocumentation } from '../../src/types';

// Define rule documentation separately for better type checking
const ruleDocumentation: RuleDocumentation = {
  description: 'Prevents the use of `this` keyword to encourage functional programming',
  category: 'Functional',
  recommended: 'warn',
};

export const noThisRule: Rule = createRule({
  name: 'no-this',
  meta: {
    type: 'problem',
    docs: ruleDocumentation,
    fixable: 'code',
    messages: {
      noThis: 'Avoid using the `this` keyword. Prefer explicit function arguments.',
      methodThis: 'Methods using `this` should be converted to standalone functions with explicit parameters.',
      propertyThis: 'Properties accessed with `this` should be received as parameters.',
      suggestFunctional: 'Convert to a functional approach with explicit parameters.',
    },
  },
  create: (context) => {
    const classStack: string[] = []
    const methodParams: Record<string, string[]> = {}
    
    const recordMethodParams = (node: Node): void => {
      if (node.getKind() === SyntaxKind.MethodDeclaration) {
        const methodName = node.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() || ''
        const params = node.getDescendantsOfKind(SyntaxKind.Parameter)
          .map(p => p.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() || '')
          .filter(Boolean)
        
        methodParams[methodName] = params
      }
    }
    
    const checkForThisKeyword = (node: Node): void => {
      if (node.getText() === 'this') {
        const enclosingMethod = findEnclosingMethod(node)
        
        if (enclosingMethod) {
          const parent = node.getParent()
          
          if (parent && parent.getKind() === SyntaxKind.PropertyAccessExpression) {
            const propertyName = parent.getLastChild()?.getText()
            
            if (propertyName) {
              const methodName = enclosingMethod.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() || ''
              const params = methodParams[methodName] || []
              
              const suggestedParam = propertyName.charAt(0).toLowerCase() + propertyName.slice(1)
              const paramSuggestion = params.includes(suggestedParam) 
                ? `${suggestedParam}2` 
                : suggestedParam
              
              const reportDescriptor: ReportDescriptor = {
                node,
                messageId: 'propertyThis',
                suggest: [
                  {
                    messageId: 'suggestFunctional',
                    fix: (fixer) => fixer.replaceText(node, paramSuggestion),
                  },
                ],
              }
              
              context.report(reportDescriptor)
              return
            }
          }
        }
        
        const reportDescriptor: BaseReportDescriptor = {
          node,
          messageId: 'noThis',
        }
        
        context.report(reportDescriptor)
      }
    }

    const findEnclosingMethod = (node: Node): Node | undefined => {
      let current = node.getParent()
      while (current) {
        if (current.getKind() === SyntaxKind.MethodDeclaration) {
          return current
        }
        current = current.getParent()
      }
      return undefined
    }

    return {
      ClassDeclaration: (node): void => {
        const className = node.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() || 'anonymous'
        classStack.push(className)
        
        node.getDescendantsOfKind(SyntaxKind.MethodDeclaration)
          .forEach(recordMethodParams)
      },
      
      ClassDeclaration_exit: (): void => {
        classStack.pop()
      },
      
      Identifier: (node): void => {
        if (node.getText() === 'this') {
          checkForThisKeyword(node)
        }
      },
      
      ThisKeyword: (node): void => {
        // Direct handler for this keyword to ensure it's captured correctly
        checkForThisKeyword(node)
      },
      
      ThisExpression: (node): void => {
        // Direct handler for ThisExpression AST nodes
        checkForThisKeyword(node)
      },
      
      MethodDeclaration: (node): void => {
        // Check if method has this keyword
        const hasThisKeyword = hasNodeWithText(node, 'this')
        
        if (hasThisKeyword) {
          const methodName = node.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() || ''
          
          // Create a proper BaseReportDescriptor object
          const reportDescriptor: ReportDescriptor = {
            node,
            messageId: 'methodThis',
            suggest: [
              {
                messageId: 'suggestFunctional',
                fix: (fixer) => {
                  return fixer.replaceText(
                    node, 
                    `// Convert to a standalone function:\n  const ${methodName} = (instance, ...args) => {\n    // Replace this.x with instance.x\n  }`
                  )
                }
              }
            ]
          };
          
          context.report(reportDescriptor)
        }
      },
    }
  },
})

// Helper function to check if a node contains text
function hasNodeWithText(node: Node, text: string): boolean {
  let found = false
  node.forEachDescendant(child => {
    if (child.getText() === text) {
      found = true
      return false // Stop traversal
    }
    return undefined
  })
  return found
}

export default noThisRule; 
