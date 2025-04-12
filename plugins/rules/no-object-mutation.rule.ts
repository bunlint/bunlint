import { createRule } from '../../src/core'
import { objectMutationDetector } from './no-mutation.rule'

export const noObjectMutationRule = createRule({
  name: 'no-object-mutation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents object mutations',
      category: 'Immutability',
      recommended: 'error'
    },
    messages: {
      noObjectMutation: 'Avoid mutating objects directly',
      useSpreads: 'Use object spreads to create new objects instead'
    }
  },
  create: (context) => {
    // Use the shared detector, but pass an option to skip array index assignments
    const checkObjectMutation = objectMutationDetector({
      ...context,
      options: {
        ...context.options,
        skipArrayIndexAssignment: true
      }
    });
    
    return {
      BinaryExpression: checkObjectMutation
    }
  }
})

export default noObjectMutationRule; 
