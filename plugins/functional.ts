import { createPlugin } from '../src/core';
import noClassRule from './rules/no-class.rule';
import noLoopsRule from './rules/no-loops.rule';
import noThisRule from './rules/no-this.rule';
import { preferPipeRule } from './rules/prefer-pipe.rule';
import pureFunctionRule from './rules/pure-function.rule';
// no-statements and no-side-effect would be implemented separately

/**
 * Plugin to enforce functional programming patterns
 */
const functionalPlugin = createPlugin({
  name: 'functional',
  rules: {
    'no-class': noClassRule,
    'no-this': noThisRule,
    'no-loops': noLoopsRule,
    'prefer-pipe': preferPipeRule,
    'pure-function': pureFunctionRule,
    // These would be implemented in the future:
    // 'no-statements': noStatementsRule,
    // 'no-side-effect': noSideEffectRule,
  },
  configs: {
    recommended: {
      plugins: ['functional'],
      rules: {
        'functional/no-class': 'error',
        'functional/no-this': 'error',
        'functional/no-loops': 'warn',
        'functional/prefer-pipe': 'warn',
        'functional/pure-function': 'warn',
      }
    },
    strict: {
      plugins: ['functional'],
      rules: {
        'functional/no-class': 'error',
        'functional/no-this': 'error',
        'functional/no-loops': 'error',
        'functional/prefer-pipe': 'error',
        'functional/pure-function': 'error',
      }
    }
  }
});

export default functionalPlugin; 
