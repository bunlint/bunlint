/**
 * Rule type definitions for BunLint
 */

import { Node } from 'ts-morph';

/**
 * Rule type (severity level)
 */
export type RuleType = 'problem' | 'suggestion' | 'layout';

/**
 * Fix type for auto-fixing capabilities
 */
export type FixType = 'code' | 'whitespace';

/**
 * Rule documentation
 */
export interface RuleDocumentation {
  description: string;
  category: string;
  recommended: boolean;
  url?: string;
}

/**
 * Rule metadata
 */
export interface RuleMeta {
  type: RuleType;
  docs: RuleDocumentation;
  fixable?: FixType;
  schema: unknown[];
  messages: Record<string, string>;
}

/**
 * Report descriptor for rule violations
 */
export interface ReportDescriptor {
  node: Node;
  messageId: string;
  data?: Record<string, string>;
  fix?: (fixer: Fixer) => Fix | Fix[];
}

/**
 * Fix operation
 */
export interface Fix {
  range: [number, number];
  text: string;
}

/**
 * Fixer API for creating fixes
 */
export interface Fixer {
  replaceText(node: Node, text: string): Fix;
  insertTextAfter(node: Node, text: string): Fix;
  insertTextBefore(node: Node, text: string): Fix;
  remove(node: Node): Fix;
}

/**
 * Source code representation
 */
export interface SourceCode {
  getText(node?: Node): string;
  getNodeByRange(range: [number, number]): Node | null;
}

/**
 * Rule context provided to rule implementations
 */
export interface RuleContext {
  id: string;
  options: unknown[];
  settings: Record<string, unknown>;
  report(descriptor: ReportDescriptor): void;
  getSourceCode(): SourceCode;
}

/**
 * Visitor functions for AST nodes
 */
export type Visitors = Record<string, (node: Node) => void>;

/**
 * Rule creation options
 */
export interface RuleOptions {
  name: string;
  meta: RuleMeta;
  create: (context: RuleContext) => Visitors;
}

/**
 * Rule definition
 */
export interface Rule {
  name: string;
  meta: RuleMeta;
  create: (context: RuleContext) => Visitors;
} 