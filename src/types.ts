import { Node, SourceFile } from 'ts-morph'

// Result type pattern for operations that might fail
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

// --- Core Types ---

export type Severity = 'error' | 'warn' | 'off'
// Alias for Severity to maintain backward compatibility
export type RuleSeverity = Severity

// Common format types
export type FormatType = 'json' | 'pretty' | 'minimal' | 'html' | 'markdown' | 'compact'
export type SortBy = 'severity' | 'location' | 'rule'

// Rule type classification
export type RuleType = 'problem' | 'suggestion' | 'layout' | 'security' | 'error' | 'warning'

// Core metadata types
export type RuleDocumentation = {
  description: string
  category: string
  recommended: boolean | Severity
  url?: string
}

// Rule metadata type
export type RuleMeta = {
  type: 'problem' | 'suggestion' | 'layout'
  docs: RuleDocumentation
  fixable?: 'code' | 'whitespace'
  messages: Record<string, string>
}

// Base rule type
export type BaseRule = {
  name: string
  meta: RuleMeta
}

// Full rule type with create function
export type Rule = BaseRule & {
  create: (context: RuleContext) => RuleVisitors,
  options?: unknown[]
}

export type RuleContext = {
  report: (reportDescriptor: ReportDescriptor) => void
  getSourceCode: () => SourceFile
  options: unknown[]
}

// Base report descriptor type
export type BaseReportDescriptor = {
  node: Node
  messageId: string
  data?: Record<string, string>
}

// Derived report descriptor with fix and suggest options
export type ReportDescriptor = BaseReportDescriptor & {
  fix?: (fixer: Fixer) => Fix | null
  suggest?: SuggestionDescriptor[]
}

// Suggestion descriptor (not derived from BaseReportDescriptor to maintain compatibility)
export type SuggestionDescriptor = {
  messageId: string
  fix: (fixer: Fixer) => Fix
  data?: Record<string, string>
}

export type Fixer = {
  replaceText: (node: Node, text: string) => Fix
  insertTextBefore: (node: Node, text: string) => Fix
  insertTextAfter: (node: Node, text: string) => Fix
  remove: (node: Node) => Fix
}

export type Fix = {
  range: [number, number]
  text: string
}

export type RuleVisitors = Record<string, (node: Node) => void>

// Base message type to derive other message types
export type BaseLintMessage = {
  ruleId: string
  severity: number // 0 = off, 1 = warn, 2 = error
  category: string
  fixability: 'fixable' | 'manual'
  message: string
  line: number
  column: number
  endLine: number
  endColumn: number
  nodeType: string
  fix?: Fix
  suggestions?: SuggestionDescriptor[]
}

// Derive from base message type
export type LintMessage = BaseLintMessage

// Derive with additional file path
export type LintMessageWithFile = LintMessage & { filePath: string }

export type BaseFilter = {
  rule?: string
  severity?: string
  category?: string
  path?: string
  message?: string
}

// Options pattern for commands
export type CommandOptions = {
  configPath?: string
  format?: string
  grouping?: string
  outputFile?: string
  filters?: BaseFilter
  config?: Config
  perfMode?: boolean
  sortBy?: SortBy
  limit?: number
}

export type LintCommandOptions = CommandOptions & {
  files?: string[]
}

export type AddCommandOptions = CommandOptions & {
  pluginName?: string
}

export type ParsedArgs = {
  command: 'lint' | 'fix' | 'init' | 'add' | 'watch' | 'doctor' | 'report'
  configPath?: string
  origConfigPath?: string
  showConfigMessage?: boolean
} & CommandOptions & LintCommandOptions & AddCommandOptions

export type LintResult = {
  filePath: string
  messages: LintMessage[]
  errorCount: number
  warningCount: number
  fixableErrorCount: number
  fixableWarningCount: number
  source?: string
}

export type ConfigRule = Record<string, Severity | [Severity, ...unknown[]]>

export type BaseConfig = {
  extends?: string[]
  plugins?: string[]
  rules?: ConfigRule
  include?: string[]
  exclude?: string[]
  cache?: boolean
  cacheLocation?: string
}

export type ReportConfig = {
  format?: FormatType
  outputFile?: string
  grouping?: string
  customGroups?: Record<string, string[]>
  showSummary?: boolean
  maxIssuesPerGroup?: number
  sortBy?: SortBy
  expandGroups?: boolean
  perfMode?: boolean
}

export type Config = BaseConfig & {
  report?: ReportConfig
}

export type Plugin = {
  name: string
  rules: Record<string, Rule>
  configs?: Record<string, Partial<Config>>
  extends?: Plugin[] | Plugin
}

export type RuleConfig = {
  name: string
  type: 'problem' | 'suggestion' | 'layout'
  description: string
  category: string
  recommended: boolean | Severity
  messages: Record<string, string>
  fixable?: 'code' | 'whitespace'
  nodeVisitors: Record<string, (node: Node, context: RuleContext, fixer?: Fixer) => void>
  options?: unknown[]
}

// Format options with consistent parameters
export type FormatOptions = {
  grouping?: string
  config?: Config
  showSummary?: boolean
  expandGroups?: boolean
  maxIssuesPerGroup?: number
  sortBy?: SortBy
  format?: FormatType
  filters?: BaseFilter
  duration?: string
}

// Type for formatters
export type FormatRenderer = (results: LintResult[], options: FormatOptions) => string

// Define LintOptions type for parameter object pattern
export type LintOptions = {
  patterns?: string[]
  ignorePatterns?: string[]
  rules?: Rule[]
  config?: Config
  cache?: boolean
  files?: string[]
}

export type CommandHandler = (args: ParsedArgs) => Promise<number>

export interface WatchOptions {
  /**
   * Glob patterns to include in watch
   */
  include?: string[];
  
  /**
   * Glob patterns to exclude from watch
   */
  exclude?: string[];
  
  /**
   * Whether to use caching for improved performance
   */
  cache?: boolean;
  
  /**
   * Path to config file to watch for changes
   */
  configPath?: string;
}

export interface WatchOptionsType extends WatchOptions {
  /**
   * Whether to use polling instead of native watchers
   */
  usePolling?: boolean;

  /**
   * Polling interval in milliseconds
   */
  pollInterval?: number;

  /**
   * Whether to use native file system watchers
   */
  useNativeWatchers?: boolean;

  /**
   * Whether to lint files on start
   */
  lintOnStart?: boolean;

  /**
   * Whether to watch for config file changes
   */
  watchConfig?: boolean;

  /**
   * Whether to recursively watch directories
   */
  recursive?: boolean;

  /**
   * Whether to watch for new files in directories
   */
  watchForNewFiles?: boolean;
  
  /**
   * Force directory watching on Windows even though it might have permission issues
   * Use with caution as this might cause EPERM errors on some Windows systems
   */
  forceDirWatchOnWindows?: boolean;
  
  /**
   * Force recursive directory watching on Windows even though it might have permission issues
   * Use with caution as this might cause EPERM errors on some Windows systems
   */
  forceRecursiveOnWindows?: boolean;
}

export interface FileWatcher {
  close: () => void;
}

export interface FileWatchState {
  mtime: number;
  content: string;
  exists?: boolean;
}

export type FileChangeType = 'change' | 'rename';

export interface FileChangeHandler {
  (eventType: FileChangeType, filename: string | null): void;
}

// Type guards for type checking and validation
export const typeGuards = {
  isPartialConfig: (obj: unknown): obj is Partial<Config> => {
    if (typeof obj !== 'object' || obj === null) return false
    if (Object.keys(obj as object).length === 0) return true
    
    const config = obj as Partial<Config>
    return (config.extends === undefined || Array.isArray(config.extends)) &&
           (config.plugins === undefined || Array.isArray(config.plugins)) &&
           (config.rules === undefined || typeof config.rules === 'object') &&
           (config.include === undefined || Array.isArray(config.include)) &&
           (config.exclude === undefined || Array.isArray(config.exclude)) &&
           (config.cache === undefined || typeof config.cache === 'boolean')
  },
  
  isPlugin: (obj: unknown): obj is Plugin => {
    if (!obj || typeof obj !== 'object') return false
    
    const candidate = obj as Plugin
    return typeof candidate.name === 'string' && 
           typeof candidate.rules === 'object' &&
           Object.values(candidate.rules).every(rule => 
             typeof rule === 'object' && 
             rule !== null && 
             typeof rule.name === 'string' && 
             typeof rule.create === 'function' &&
             typeof rule.meta === 'object'
           )
  },
  
  isFormatType: (format: string | undefined): format is FormatType => 
    !!format && ['json', 'pretty', 'minimal', 'html', 'markdown', 'compact'].includes(format)
} 