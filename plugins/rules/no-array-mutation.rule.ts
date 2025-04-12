import { createRule } from '../../src/core'
import { arrayMutationDetector } from './no-mutation.rule'

export const noArrayMutationRule = createRule({
  name: 'no-array-mutation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents array mutations like push, pop, splice, etc.',
      category: 'Immutability',
      recommended: 'error'
    },
    messages: {
      noArrayMutation: 'Avoid mutating arrays directly with {{method}}',
      useSpreads: 'Use spreads or non-mutating array methods instead'
    }
  },
  create: (context) => {
    // Use the shared detector
    const checkArrayMutation = arrayMutationDetector(context);
    
    return {
      CallExpression: checkArrayMutation
    }
  }
}) 

export default noArrayMutationRule; 
