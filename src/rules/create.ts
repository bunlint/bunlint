import { createError, createWarning } from '../utils/error-utils';

import type { Rule, RuleOptions } from './types';

function validateRuleMetadata(options: RuleOptions): void {
  if (!options.name) {
    throw createError('Rule must have a name');
  }

  if (!options.meta) {
    throw createError('Rule must have metadata');
  }

  if (!options.create || typeof options.create !== 'function') {
    throw createError('Rule must have a create function');
  }

  if (options.meta.type && !['problem', 'suggestion', 'layout'].includes(options.meta.type)) {
    throw createError(`Invalid rule type: ${options.meta.type}`);
  }

  if (!options.meta.docs) {
    throw createError('Rule metadata must include docs');
  }

  if (!options.meta.docs.description) {
    throw createError('Rule docs must include a description');
  }

  if (!options.meta.docs.category) {
    throw createError('Rule docs must include a category');
  }

  if (options.meta.docs.recommended === undefined) {
    createWarning(`Rule ${options.name} should define the 'recommended' field in docs`);
  }

  if (!options.meta.messages || Object.keys(options.meta.messages).length === 0) {
    throw createError('Rule must define at least one message');
  }
}

export function createRule(options: RuleOptions): Rule {
  validateRuleMetadata(options);

  return {
    name: options.name,
    meta: { ...options.meta },
    create: options.create
  };
} 