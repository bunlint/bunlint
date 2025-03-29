/**
 * ESLint rule to detect array mutations that violate Pattern 7: Functional & Immutable Programming
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce immutable array operations',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    hasSuggestions: true,
    messages: {
      noMutation: 'Array mutation is not allowed. Use spread operator or Array.from() instead.',
      suggestSpread: 'Use spread operator instead',
      suggestConcat: 'Use concat instead',
      suggestSlice: 'Use slice instead',
    },
  },
  create: function (context) {
    return {
      // Check for direct array mutations
      "CallExpression[callee.property.name='push']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'suggestConcat',
              fix: (fixer) => {
                const array = node.callee.object;
                const args = node.arguments;
                const argString = args
                  .map((arg) => context.getSourceCode().getText(arg))
                  .join(', ');
                return fixer.replaceText(
                  node,
                  `${context.getSourceCode().getText(array)} = ${context.getSourceCode().getText(array)}.concat([${argString}])`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='pop']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'noMutation',
              fix: (fixer) => {
                const array = node.callee.object;
                return fixer.replaceText(
                  node,
                  `${context.getSourceCode().getText(array)} = ${context.getSourceCode().getText(array)}.slice(0, -1)`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='shift']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'noMutation',
              fix: (fixer) => {
                const array = node.callee.object;
                return fixer.replaceText(
                  node,
                  `${context.getSourceCode().getText(array)} = ${context.getSourceCode().getText(array)}.slice(1)`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='unshift']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'noMutation',
              fix: (fixer) => {
                const array = node.callee.object;
                const args = node.arguments;
                const argString = args
                  .map((arg) => context.getSourceCode().getText(arg))
                  .join(', ');
                return fixer.replaceText(
                  node,
                  `${context.getSourceCode().getText(array)} = [${argString}].concat(${context.getSourceCode().getText(array)})`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='splice']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'suggestSpread',
              fix: (fixer) => {
                // Create a simple fix to show the alternative
                const array = node.callee.object;
                const args = node.arguments.map(arg => context.getSourceCode().getText(arg));
                return fixer.replaceText(
                  node,
                  `((arr, ...args) => {
                    const copy = [...arr];
                    copy.splice(...args);
                    return copy;
                  })(${context.getSourceCode().getText(array)}, ${args.join(', ')})`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='sort']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'suggestSpread',
              fix: (fixer) => {
                const array = node.callee.object;
                const args =
                  node.arguments.length > 0
                    ? context.getSourceCode().getText(node.arguments[0])
                    : '';
                return fixer.replaceText(
                  node,
                  `[...${context.getSourceCode().getText(array)}].sort(${args})`
                );
              },
            },
          ],
        });
      },
      "CallExpression[callee.property.name='reverse']": (node) => {
        context.report({
          node,
          messageId: 'noMutation',
          suggest: [
            {
              messageId: 'suggestSpread',
              fix: (fixer) => {
                const array = node.callee.object;
                return fixer.replaceText(
                  node,
                  `[...${context.getSourceCode().getText(array)}].reverse()`
                );
              },
            },
          ],
        });
      },
      // Check for array assignment e.g., array[0] = value
      "AssignmentExpression[left.type='MemberExpression'][left.computed=true]":
        (node) => {
          if (node.left.object && node.left.property) {
            context.report({
              node,
              messageId: 'noMutation',
              suggest: [
                {
                  messageId: 'suggestSpread',
                  fix: null, // Complex to auto-fix
                },
              ],
            });
          }
        },
    };
  },
};
