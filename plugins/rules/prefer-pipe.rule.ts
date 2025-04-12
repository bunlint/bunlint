import { createRule } from '../../src/core'
import { CallExpression, Node, SyntaxKind } from 'ts-morph'

export const preferPipeRule = createRule({
  name: 'prefer-pipe',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourages the use of pipe/flow compositions over nested function calls',
      category: 'Functional',
      recommended: 'warn'
    },
    fixable: 'code',
    messages: {
      useComposition: 'Prefer using functional composition (pipe/flow) over deeply nested function calls',
      suggestion: 'Convert to pipe/flow composition for better readability'
    }
  },
  create: (context) => {
    return {
      CallExpression: (node: Node) => {
        const callExpr = node as CallExpression
        
        // Check for nested function calls of depth >= 3
        if (hasDepth(callExpr, 3)) {
          context.report({
            node,
            messageId: 'useComposition',
            fix: (fixer) => {
              const parts = extractParts(callExpr)
              if (parts.length >= 3) {
                const pipedVersion = createPipedVersion(parts)
                return fixer.replaceText(node, pipedVersion)
              }
              return null
            }
          })
        }
      }
    }
  }
})

// Check if call has depth of at least 'depth'
function hasDepth(node: CallExpression, depth: number): boolean {
  if (depth <= 1) return true
  
  // Check if any argument is a call expression
  for (const arg of node.getArguments()) {
    if (arg.getKind() === SyntaxKind.CallExpression) {
      // Found a nested call, decrease depth and check recursively
      if (hasDepth(arg as CallExpression, depth - 1)) {
        return true
      }
    }
  }
  
  return false
}

// Extract the parts of a nested call for pipe conversion
function extractParts(node: CallExpression): string[] {
  const parts: string[] = []
  
  // Helper function to build the chain
  function extract(expr: CallExpression): void {
    // Check for nested call in arguments
    const args = expr.getArguments()
    let nestedCallArg: CallExpression | null = null
    let nestedArgIndex = -1
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg && arg.getKind() === SyntaxKind.CallExpression) {
        nestedCallArg = arg as CallExpression
        nestedArgIndex = i
        break
      }
    }
    
    if (nestedCallArg) {
      // Process nested call first (recursive)
      extract(nestedCallArg)
      
      // Then handle the current expression
      const fnName = expr.getExpression().getText()
      const argList = args.map((arg, idx) => 
        idx === nestedArgIndex ? '$value' : arg.getText()
      ).join(', ')
      
      parts.push(`${fnName}(${argList})`)
    } else {
      // This is the innermost function call
      const fnName = expr.getExpression().getText()
      const argList = args.map(arg => arg.getText()).join(', ')
      parts.push(`${fnName}(${argList})`)
    }
  }
  
  extract(node)
  return parts
}

function createPipedVersion(parts: string[]): string {
  // First part is the innermost call (first to execute)
  const firstCall = parts[0]
  const pipeFunctions = parts.slice(1) 
  
  return `pipe(
  ${firstCall},
  ${pipeFunctions.join(',\n  ')}
)`
} 
