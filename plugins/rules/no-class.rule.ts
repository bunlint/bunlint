import { Node } from 'ts-morph';
import { createRule } from '../../src/core';
import { Rule, BaseReportDescriptor, RuleDocumentation } from '../../src/types';

// Define rule documentation separately for better type checking
const ruleDocumentation: RuleDocumentation = {
  description: 'Prevents the use of classes to encourage functional programming',
  category: 'Functional',
  recommended: 'error',
};

export const noClassRule: Rule = createRule({
  name: 'no-class',
  meta: {
    type: 'problem',
    docs: ruleDocumentation,
    fixable: undefined,
    messages: {
      noClass: 'Classes are not allowed. Use functional alternatives like object factories or modules with pure functions.',
    },
  },
  create: (context) => {
    return {
      ClassDeclaration: (node: Node): void => {
        const reportDescriptor: BaseReportDescriptor = {
          node,
          messageId: 'noClass',
        };
        context.report(reportDescriptor);
      },
      ClassExpression: (node: Node): void => {
        const reportDescriptor: BaseReportDescriptor = {
          node,
          messageId: 'noClass',
        };
        context.report(reportDescriptor);
      },
    };
  },
});

export default noClassRule; 
