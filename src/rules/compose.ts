import type { Node } from 'ts-morph';

import { createError } from '../utils/errors';

import type { Rule, RuleMeta, RuleType, Visitors } from './types';

export interface ComposeOptions {
  name: string;
  meta?: Partial<Rule['meta']>;
}

export function composeRules(rules: Rule[], options: ComposeOptions): Rule {
  if (!rules.length) {
    throw createError('Cannot compose an empty list of rules');
  }

  if (!options.name) {
    throw createError('Composed rule must have a name');
  }

  const baseRule = rules[0];
  const defaultMeta: RuleMeta = {
    type: 'suggestion' as RuleType,
    docs: { description: '', category: '', recommended: false },
    schema: [],
    messages: {}
  };
  
  const baseMeta = baseRule ? baseRule.meta : defaultMeta;
  
  const allMessages = rules.reduce(
    (acc, rule) => ({ ...acc, ...rule.meta.messages }),
    {} as Record<string, string>
  );
  
  const mergedMeta = {
    ...baseMeta,
    ...options.meta,
    messages: allMessages
  };

  return {
    name: options.name,
    meta: mergedMeta,
    create: (context) => {
      const allNodeTypes = rules.flatMap(rule => {
        const ruleVisitors = rule.create(context);
        return Object.keys(ruleVisitors);
      }).filter((v, i, a) => a.indexOf(v) === i);
      
      const visitorMap = allNodeTypes.reduce<Visitors>((acc, nodeType) => {
        const visitorsForType = rules
          .map(rule => {
            const visitors = rule.create(context);
            return visitors[nodeType];
          })
          .filter((visitor): visitor is (node: Node) => void => Boolean(visitor));
        
        const combinedVisitor = (node: Node): void => {
          visitorsForType.forEach(visitor => visitor(node));
        };
        
        return {
          ...acc,
          [nodeType]: combinedVisitor
        };
      }, {});
      
      return visitorMap;
    }
  };
} 