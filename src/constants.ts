import { Config, Severity, ConfigRule } from './types'
import chalk from 'chalk'

// Default configuration for bunlint
export const defaultConfig: Config = {
  extends: ['recommended'],
  plugins: [],
  rules: {},  // Rules will be populated from the recommended preset
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.test.{ts,tsx,js,jsx}', 'node_modules'],
  cache: true,
  cacheLocation: './node_modules/.cache/bunlint',
  report: {
    format: 'pretty',
    grouping: 'category',
    showSummary: true,
    maxIssuesPerGroup: 10,
    sortBy: 'severity',
    expandGroups: true,
  }
}

// Console styles and icons
export const icons = {
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅',
  fixable: '🔧',
  suggestion: '💡'
}

// Default patterns for file watch
export const defaultWatchPatterns = {
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['node_modules/**', '**/dist/**', '**/build/**']
}

// Default paths for initialization
export const defaultPaths = {
  config: 'bunlint.config.ts',
  configSearch: [
    'bunlint.config.ts',
    'bunlint.config.js',
    '.bunlintrc.ts',
    '.bunlintrc.js',
    '.bunlintrc.json',
  ],
  cache: './node_modules/.cache/bunlint'
}

// File extensions for report formats
export const reportExtensions = {
  json: '.json',
  html: '.html',
  markdown: '.md',
  pretty: '.txt',
  minimal: '.txt',
  compact: '.txt'
}

// Preset rule configurations
export const presetRules: {
  recommended: ConfigRule,
  strict: ConfigRule
} = {
  recommended: {
    'no-mutation': 'error' as Severity,
    'no-class': 'error' as Severity,
    'prefer-const': 'warn' as Severity,
    'no-loops': 'warn' as Severity,
    'no-this': 'warn' as Severity,
    'pure-function': 'off' as Severity,
    'prefer-pipe': 'warn' as Severity,
    'no-object-mutation': 'warn' as Severity,
    'no-array-mutation': 'warn' as Severity
  },
  
  strict: {
    'no-mutation': 'error' as Severity,
    'no-class': 'error' as Severity,
    'prefer-const': 'error' as Severity,
    'no-loops': 'error' as Severity,
    'no-this': 'error' as Severity,
    'pure-function': 'warn' as Severity,
    'prefer-pipe': 'error' as Severity,
    'no-object-mutation': 'error' as Severity,
    'no-array-mutation': 'error' as Severity
  }
}

// Templates for initialization
export const configTemplate = `
import { defineConfig } from 'bunlint'

export default defineConfig({
  extends: ['recommended'],
  plugins: [],
  rules: {
    // Rules will be populated from the recommended preset
  },
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.test.{ts,tsx,js,jsx}', 'node_modules'],
  cache: true,
  cacheLocation: './node_modules/.cache/bunlint',
  report: {
    format: 'pretty',
    grouping: 'category',
    showSummary: true,
  }
})
`.trim()

// Helper functions for severity normalization
export const severityUtils = {
  normalize: (severity: any): Severity => {
    if (severity === 'error' || severity === 'warn' || severity === 'off') {
      return severity;
    }
    if (severity === true) {
      return 'warn';
    }
    if (severity === false) {
      return 'off';
    }
    if (typeof severity === 'number') {
      return severity === 0 ? 'off' : (severity === 1 ? 'warn' : 'error');
    }
    if (Array.isArray(severity) && severity.length > 0) {
      return severityUtils.normalize(severity[0]);
    }
    // Default fallback
    return 'warn';
  },
  
  getEffective: (configSeverity: any): Severity => {
    return severityUtils.normalize(configSeverity);
  }
}

// Help text for CLI
export const helpText = `
╭───────────────────────────────────────────────────────────╮
│                                                           │
│   🚀 BunLint v1.0.0                                       │
│                                                           │
│   USAGE                                                   │
│     $ bunlint [command] [options] [files...]              │
│                                                           │
│   COMMANDS                                                │
│     lint       Lint files for problems                    │
│     fix        Automatically fix problems                 │
│     init       Create a new configuration                 │
│     add        Add and configure a plugin                 │
│     watch      Watch files and lint on changes            │
│     doctor     Diagnose and fix setup issues              │
│     report     Generate comprehensive reports             │
│                                                           │
│   OPTIONS                                                 │
│     --config             Path to config file              │
│     --format             Output format                    │
│     --group              Grouping strategy                │
│     --output             Output file path                 │
│     --rules, --only-rule Filter by rule ID                │
│     --only-severity      Filter by severity               │
│     --only-category      Filter by category               │
│     --only-path          Filter by file path              │
│     --only-message       Filter by message content        │
│     --perf               Show performance metrics         │
│     --watch              Watch for changes                │
│     --fix                Automatically fix problems       │
│                                                           │
│   FILTERING                                               │
│     All filter options support:                           │
│     - Multiple values separated by commas                 │
│     - Wildcard patterns with * suffix                     │
│     - Regex patterns using /pattern/ syntax               │
│                                                           │
│   EXAMPLES                                                │
│     $ bunlint                                             │
│     $ bunlint src/                                        │
│     $ bunlint fix --format pretty                         │
│     $ bunlint add @bunlint/security                       │
│     $ bunlint --group file,severity                       │
│     $ bunlint watch src/ --rules functional/no-class      │
│     $ bunlint --only-message "/Array mutation/"           │
│                                                           │
│   Run 'bunlint [command] --help' for more information     │
│                                                           │
╰───────────────────────────────────────────────────────────╯
`.trim()

// HTML template elements for the HTML formatter
export const htmlTemplates = {
  head: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BunLint Report</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; color: #333; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; display: flex; gap: 20px; flex-wrap: wrap; }
      .summary-item { display: flex; flex-direction: column; align-items: center; padding: 10px 15px; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; min-width: 120px; }
      .summary-item.errors { border-left: 4px solid #e74c3c; }
      .summary-item.warnings { border-left: 4px solid #f39c12; }
      .summary-item.fixable { border-left: 4px solid #3498db; }
      .summary-item.files { border-left: 4px solid #2ecc71; }
      .summary-number { font-size: 24px; font-weight: bold; }
      .summary-label { font-size: 14px; color: #666; text-transform: uppercase; }
      .file-section { border: 1px solid #ddd; margin-bottom: 15px; border-radius: 5px; overflow: hidden; }
      .file-header { font-size: 16px; padding: 10px 15px; background: #f0f0f0; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; }
      .file-issues { padding: 0; margin: 0; }
      
      /* Table styling */
      .issues-table { width: 100%; border-collapse: collapse; }
      .issues-table th { background-color: #f5f5f5; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      .issues-table td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
      .issues-table tr:hover { background-color: #f9f9f9; }
      
      .issue-icon { margin-right: 10px; font-size: 18px; min-width: 20px; text-align: center; }
      .issue-error { color: #e74c3c; }
      .issue-warning { color: #f39c12; }
      .issue-fixable { margin-left: 5px; color: #3498db; }
      .issue-details { flex: 1; }
      .issue-location { color: #666; font-family: monospace; margin-right: 10px; }
      .issue-rule { color: #2980b9; margin-right: 10px; font-family: monospace; }
      .issue-message { margin-top: 3px; }
      .issue-category-tag { background: #eee; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
      
      .accordion { cursor: pointer; }
      .accordion::after { content: " ▾"; font-size: 12px; color: #666; }
      .accordion.collapsed::after { content: " ▸"; }
      .accordion-content { padding: 0; margin: 0; max-height: 1000px; overflow: hidden; }
      .accordion-content.collapsed { max-height: 0; overflow: hidden; }
      
      .code-fix { margin-top: 5px; font-size: 12px; color: #3498db; }
    </style>
  </head>
  `,
  script: `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize accordions
      const accordions = document.querySelectorAll('.accordion');
      accordions.forEach(accordion => {
        accordion.addEventListener('click', function() {
          const content = this.nextElementSibling;
          this.classList.toggle('collapsed');
          content.classList.toggle('collapsed');
        });
      });
    });
  </script>
  `
}

// Color functions for terminal output
export const colors = {
  error: (text: string) => chalk.red(text),
  warning: (text: string) => chalk.yellow(text),
  info: (text: string) => chalk.blue(text),
  success: (text: string) => chalk.green(text),
  gray: (text: string) => chalk.gray(text),
  bold: (text: string) => chalk.bold(text)
}

// Common terminal messages
export const messages = {
  noIssues: '✓ No linting issues found',
  watching: 'Watching for changes...',
  pressCtrlC: 'Press Ctrl+C to exit',
  fixedIssues: '✅ Fixed applicable issues',
  remainingIssues: '⚠️ Some issues could not be fixed automatically:',
  
  // CLI output templates
  foundIssuesError: (errorCount: number, warningCount: number) => 
    `❌ Found issues: ${errorCount} errors, ${warningCount} warnings`,
  foundIssuesWarning: (warningCount: number) => 
    `⚠️ Found issues: ${warningCount} warnings`,
  fixableIssues: (count: number) => 
    `🔧 ${count} issues auto-fixable. Run: bunlint fix`,
  totalSummary: (totalIssues: number, totalErrors: number, totalWarnings: number) => 
    `Total: ${totalIssues} issues (${totalErrors} errors, ${totalWarnings} warnings)`,
  filesWithIssues: (count: number) => 
    `Files with issues: ${count}`,
  ruleDescription: (ruleId: string, description: string) =>
    `  ${ruleId}: ${description}`
} 