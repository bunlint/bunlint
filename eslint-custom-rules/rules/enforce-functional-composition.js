/**
 * ESLint rule to enforce Pattern 7: Functional Composition
 * Discourages nested function calls and encourages pipe/compose patterns
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourage functional composition over deeply nested function calls',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxNestingLevel: {
            type: 'integer',
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useComposition: 'Nested function calls over 3 levels deep should use functional composition (pipe or compose).',
    },
  },
  create: function (context) {
    const options = context.options[0] || {};
    const maxNestingLevel = options.maxNestingLevel || 3;
    const ignoreChainedMethods = options.ignoreChainedMethods !== false;

    /**
     * Recursively count the level of function call nesting
     */
    function countNestingLevel(node, visited = new Set()) {
      // Prevent infinite recursion
      const nodeStr = context.getSourceCode().getText(node);
      if (visited.has(nodeStr)) {
        return 0;
      }
      visited.add(nodeStr);

      if (node.type !== 'CallExpression') {
        return 0;
      }

      // If this is a method chain (a.b().c()) and we're ignoring chains, return 0
      if (ignoreChainedMethods && 
          node.callee.type === 'MemberExpression' && 
          node.callee.object.type === 'CallExpression') {
        return 0;
      }

      let maxChildNesting = 0;

      // Check arguments for nested calls
      if (node.arguments && node.arguments.length > 0) {
        for (const arg of node.arguments) {
          maxChildNesting = Math.max(maxChildNesting, countNestingLevel(arg, visited));
        }
      }

      // Check callee for nested calls (like (foo())(bar))
      if (node.callee.type === 'CallExpression') {
        maxChildNesting = Math.max(maxChildNesting, countNestingLevel(node.callee, visited));
      }

      // Check inside the callee's object if it's a member expression (like a.foo(b()))
      if (node.callee.type === 'MemberExpression' && node.callee.object) {
        maxChildNesting = Math.max(maxChildNesting, countNestingLevel(node.callee.object, visited));
      }

      return 1 + maxChildNesting;
    }

    return {
      CallExpression(node) {
        const level = countNestingLevel(node);
        if (level > maxNestingLevel) {
          context.report({
            node,
            messageId: 'useComposition',
            data: {
              count: level,
            },
          });
        }
      },
    };
  },
}; 