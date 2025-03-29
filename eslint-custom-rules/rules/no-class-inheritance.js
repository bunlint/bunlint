/**
 * ESLint rule to prevent classes, OOP patterns, and inheritance to enforce Pattern 7: Functional & Immutable Programming
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce functional programming by preventing classes and inheritance',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noClass: 'Class declarations are not allowed. Use factory functions instead.',
      noExtends: 'Class inheritance is not allowed. Use composition over inheritance.',
      noThis: 'Using "this" binding is not allowed. Use pure functions with explicit parameters.',
      noNew: 'Class instantiation with new is not allowed. Use factory functions instead.',
    },
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        // Report class declaration
        context.report({
          node,
          messageId: 'noClass',
        });

        // Separately report inheritance if it exists
        if (node.superClass) {
          context.report({
            node,
            messageId: 'noExtends',
          });
        }
      },

      // Report "this" usage
      ThisExpression(node) {
        context.report({
          node,
          messageId: 'noThis',
        });
      },

      // Report "new" keyword usage
      NewExpression(node) {
        context.report({
          node,
          messageId: 'noNew',
        });
      },
    };
  },
};

// Helper function to check if a node is inside a React hook
function isInsideReactHook(node) {
  let current = node;

  // Walk up the AST to find if we're inside a useX function
  while (current && current.parent) {
    current = current.parent;

    // Check if we're in a call expression with a name starting with 'use'
    if (
      current.type === 'CallExpression' &&
      current.callee &&
      current.callee.type === 'Identifier' &&
      current.callee.name.startsWith('use')
    ) {
      return true;
    }
  }

  return false;
}
