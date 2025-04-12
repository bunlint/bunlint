import noClassRule from './no-class.rule'
import noThisRule from './no-this.rule'
import noLoopsRule from './no-loops.rule'
import preferConstRule from './prefer-const.rule'
import noMutationRule from './no-mutation.rule'
import pureFunctionRule from './pure-function.rule'
import { preferPipeRule } from './prefer-pipe.rule'
import { noObjectMutationRule } from './no-object-mutation.rule'
import { noArrayMutationRule } from './no-array-mutation.rule'

const defaultRules = {
  'no-class': noClassRule,
  'no-this': noThisRule,
  'no-loops': noLoopsRule,
  'prefer-const': preferConstRule,
  'no-mutation': noMutationRule,
  'pure-function': pureFunctionRule,
  'prefer-pipe': preferPipeRule,
  'no-object-mutation': noObjectMutationRule,
  'no-array-mutation': noArrayMutationRule
}

export default defaultRules 