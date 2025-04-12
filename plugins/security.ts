import { createPlugin, createRule } from '../src/core';

// Placeholder rule implementation
const noEvalRule = createRule({
  name: 'no-eval',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the use of eval() due to security risks',
      category: 'Security',
      recommended: 'error',
    },
    messages: {
      noEval: 'Avoid using eval(), it introduces security vulnerabilities',
    }
  },
  create: (context) => {
    return {
      CallExpression: (node) => {
        const expression = node.getFirstChild();
        if (expression && expression.getText() === 'eval') {
          context.report({
            node,
            messageId: 'noEval'
          });
        }
      }
    };
  }
});

/**
 * Plugin for security best practices
 */
const securityPlugin = createPlugin({
  name: 'security',
  rules: {
    'no-eval': noEvalRule,
    // More security rules would be added in the future
  },
  configs: {
    recommended: {
      plugins: ['security'],
      rules: {
        'security/no-eval': 'error',
      }
    }
  }
});

export default securityPlugin; 
