import { createPlugin } from '../src/core';
import noArrayMutationRule from './rules/no-array-mutation.rule';
import noObjectMutationRule from './rules/no-object-mutation.rule';
import preferConstRule from './rules/prefer-const.rule';

/**
 * Plugin to ensure immutability in codebase
 */
const immutablePlugin = createPlugin({
  name: 'immutable',
  rules: {
    'no-array-mutation': noArrayMutationRule,
    'no-object-mutation': noObjectMutationRule,
    'prefer-const': preferConstRule,
    // 'no-let' would be implemented in the future
  },
  configs: {
    recommended: {
      plugins: ['immutable'],
      rules: {
        'immutable/no-array-mutation': 'error',
        'immutable/no-object-mutation': 'error',
        'immutable/prefer-const': 'warn',
      }
    },
    strict: {
      plugins: ['immutable'],
      rules: {
        'immutable/no-array-mutation': 'error',
        'immutable/no-object-mutation': 'error',
        'immutable/prefer-const': 'error',
      }
    }
  }
});

export default immutablePlugin; 
