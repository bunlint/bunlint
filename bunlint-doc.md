# BunLint Documentation

## Introduction

BunLint is a modern, high-performance linting tool designed specifically for Bun-powered JavaScript and TypeScript projects. Built with functional programming principles at its core, BunLint enforces immutability and functional patterns while providing blazing-fast performance through Bun's runtime optimizations.

## Core Philosophy

-   **Bun-First**: Optimized for the Bun JavaScript runtime
-   **Functional-First**: Enforces functional programming patterns
-   **Immutability**: Prevents mutations and side effects
-   **Performance**: Significantly faster than traditional linters
-   **Developer Experience**: Beautiful CLI with helpful suggestions, autofixes, and easy plugin management.

## Installation

```bash
bun add -d bunlint
```

Create a configuration file:

```bash
bunlint init
```

## Configuration

BunLint uses TypeScript for configuration via a `bunlint.config.ts` file:

```typescript
// bunlint.config.ts
import { defineConfig } from 'bunlint';
import immutable from '@bunlint/immutable';
import functional from '@bunlint/functional';
import performance from '@bunlint/performance';
// Assume a hypothetical security plugin exists
// import security from '@bunlint/security';

export default defineConfig({
  extends: ['recommended'],
  plugins: [
    immutable(),
    functional(),
    performance(),
    // security(), // Example if added via `bunlint add security`
  ],
  rules: {
    'immutable/no-array-mutation': 'error',
    'functional/no-class': 'error',
    'functional/prefer-pipe': 'warn',
    // 'security/no-eval': 'error', // Example rule
    // Custom rule configuration
  },
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.test.{ts,tsx,js,jsx}', 'node_modules'],
  // Caching options for performance
  cache: true,
  cacheLocation: './node_modules/.cache/bunlint',
  // Reporting options
  report: {
    format: 'pretty', // 'json', 'pretty', 'minimal', 'html', 'markdown', 'compact'
    outputFile: './bunlint-report.json', // Optional
    // Grouping: single key or 'primary,secondary'
    // Keys: 'file', 'category', 'severity', 'rule', 'fixability'
    // Examples: 'category', 'file,severity', 'rule,category'
    grouping: 'category', // Default grouping
    customGroups: { // Used for 'category' grouping if defined
      'Critical': ['security/*', 'functional/no-side-effect'],
      'Style': ['formatting/*', 'naming/*'],
      'Other': ['*'] // catch-all
    },
    showSummary: true,
    maxIssuesPerGroup: 10, // Applies to the primary group
    sortBy: 'severity', // 'location', 'rule', 'severity'
    expandGroups: true, // whether primary groups are expanded by default
  }
});
```

## CLI Usage

BunLint provides a beautiful and intuitive CLI:

```
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
│   EXAMPLES                                                │
│     $ bunlint                                             │
│     $ bunlint src/                                        │
│     $ bunlint fix --format pretty                         │
│     $ bunlint add @bunlint/security                       │
│     $ bunlint --group file,severity                      │
│     $ bunlint watch src/ --rules functional/no-class      │
│                                                           │
│   Run 'bunlint [command] --help' for more information     │
│                                                           │
╰───────────────────────────────────────────────────────────╯
```

### Basic Commands

```bash
# Basic usage (uses config, default group is 'category')
bunlint

# Watch mode
bunlint --watch

# Fix automatically fixable issues
bunlint --fix

# Check specific files or directories
bunlint src/components

# Use specific config
bunlint --config custom.config.ts

# Generate reports
bunlint report --format json --output report.json

# Performance information
bunlint --perf
```

### Adding Plugins (`bunlint add`)

Streamline plugin setup using the `add` command. It installs the plugin package and automatically updates your `bunlint.config.ts`.

```bash
# Add an official plugin (e.g., @bunlint/security)
bunlint add security

# Add a third-party plugin by package name
bunlint add bunlint-plugin-react-a11y
bunlint add @my-org/bunlint-conventions
```

**How it works:**

1.  **Resolves:** Determines the full package name (e.g., `security` -> `@bunlint/security`).
2.  **Installs:** Runs `bun add -d <package-name>`.
3.  **Updates Config:** Parses `bunlint.config.ts`, adds the necessary `import` statement, and adds the plugin call (e.g., `security()`) to the `plugins` array in `defineConfig`.
4.  **Feedback:** Reports success and may offer tips on configuring the plugin's rules or recommended configs.

### Grouping and Filtering Options

Control the report output using grouping and filtering flags.

**Grouping:**

Use `--group <key>` or `--group <primary_key>,<secondary_key>` to structure the report.
Available keys: `file`, `category`, `severity`, `rule`, `fixability`.

```bash
# Single-level grouping
bunlint --group category
bunlint --group file
bunlint --group severity
bunlint --group rule
bunlint --group fixability

# Hierarchical (two-level) grouping
bunlint --group file,severity  # Group by file, then severity within each file
bunlint --group file,rule # Default  # Group by file, then rule within each file
bunlint --group category,rule  # Group by category, then rule within each category
bunlint --group rule,severity  # Group by rule, then severity for each rule
# ... other combinations
```

**Filtering:**

Show only specific issues.

```bash
# Filter results
bunlint --only-category security,performance
bunlint --only-path src/components
bunlint --only-rule functional/no-class,immutable/*
bunlint --only-severity error
```

## Report CLI Output Examples

Outputs use symbols (📁 File, ❌ Error, ⚠️ Warning, 🔧 Fixable) and indentation for clarity and conciseness.

### Category Grouping (`--group category`)

```bash
# bunlint (or bunlint --group category)

❌ ERRORS (3)

  Functional (2)
    src/utils/state.ts:15:1   functional/no-side-effect   🔧 Modifies external state
    src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
  Security (1)
    src/auth/login.ts:78:10   security/no-eval            Uses eval()

⚠️ WARNINGS (8)

  Immutability (2)
    src/reducers/user.ts:31:12  immutable/no-object-mutation 🔧 Object mutation
    src/components/List.tsx:27:8  immutable/no-array-mutation  🔧 Array mutation
  Functional Style (3)
    src/components/Button.tsx:36:10 functional/no-class         🔧 Avoid classes
    src/hooks/useData.ts:42:5     functional/prefer-pipe      🔧 Use pipe/flow
    src/utils/format.ts:67:3      functional/no-loops         🔧 Avoid loops
  Performance (3)
    src/components/Dashboard.tsx:92:5 performance/memo-component 🔧 Memoize component
    src/hooks/useItems.ts:23:3      performance/avoid-rerender   Avoid rerenders
    src/utils/helpers.ts:105:15     performance/no-large-objects Large object literal

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### File Grouping (`--group file`)

```bash
# bunlint --group file

📁 src/api/client.ts
   ❌ 42:5  functional/no-mutation      Mutates parameter

📁 src/auth/login.ts
   ❌ 78:10 security/no-eval            Uses eval()

📁 src/components/Button.tsx
   ⚠️ 36:10 functional/no-class         🔧 Avoid classes

# ... other files ...

📁 src/utils/state.ts
   ❌ 15:1  functional/no-side-effect   🔧 Modifies external state

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### Severity Grouping (`--group severity`)

```bash
# bunlint --group severity

❌ ERRORS (3)
  src/utils/state.ts:15:1   functional/no-side-effect   🔧 Modifies external state
  src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
  src/auth/login.ts:78:10   security/no-eval            Uses eval()

⚠️ WARNINGS (8)
  src/reducers/user.ts:31:12  immutable/no-object-mutation 🔧 Object mutation
  src/components/List.tsx:27:8  immutable/no-array-mutation  🔧 Array mutation
  # ... other warnings ...

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### Rule Grouping (`--group rule`)

Groups issues by the rule ID.

```bash
# bunlint --group rule

functional/no-mutation (1) : Mutates parameter
  ❌ src/api/client.ts:42:5    

functional/no-side-effect (1) : 🔧 Modifies external state
  ❌ src/utils/state.ts:15:1   

security/no-eval (1) :  Uses eval()
  ❌ src/auth/login.ts:78:10  

immutable/no-object-mutation (1) : 🔧 Object mutation
  ⚠️ src/reducers/user.ts:31:12 

# ... other rules ...

performance/no-large-objects (1) : Large object literal
  ⚠️ src/utils/helpers.ts:105:15  

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### Fixability Grouping (`--group fixability`)

Groups issues based on whether they can be auto-fixed.

```bash
# bunlint --group fixability

🔧 AUTO-FIXABLE (6)
  ❌ src/utils/state.ts:15:1   functional/no-side-effect   Modifies external state
  ⚠️ src/reducers/user.ts:31:12  immutable/no-object-mutation Object mutation
  ⚠️ src/components/List.tsx:27:8  immutable/no-array-mutation  Array mutation
  ⚠️ src/components/Button.tsx:36:10 functional/no-class         Avoid classes
  ⚠️ src/hooks/useData.ts:42:5     functional/prefer-pipe      Use pipe/flow
  ⚠️ src/utils/format.ts:67:3      functional/no-loops         Avoid loops

🖐️ MANUAL FIX REQUIRED (5)
  ❌ src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
  ❌ src/auth/login.ts:78:10   security/no-eval            Uses eval()
  ⚠️ src/components/Dashboard.tsx:92:5 performance/memo-component Memoize component
  ⚠️ src/hooks/useItems.ts:23:3  performance/avoid-rerender   Avoid rerenders
  ⚠️ src/utils/helpers.ts:105:15 performance/no-large-objects Large object literal

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### Hierarchical: File, Rule Grouping (`--group file,rule`) # Default

Condensed output showing rules violated within each file.

```bash
# bunlint --group file,rule

📁 src/api/client.ts
   functional/no-mutation (1) : Mutates parameter
     ❌ 42:5  

📁 src/auth/login.ts
   security/no-eval (1) : Uses eval()
     ❌ 78:10 

📁 src/components/UserProfile.tsx # Example file with multiple rules
   functional/no-class (1) : 🔧 Avoid classes
     ⚠️ 36:10 
   immutable/no-object-mutation (1) : 🔧 Object mutation detected
     ⚠️ 68:12 
   performance/avoid-rerender (1) : Potential unnecessary rerender
     ⚠️ 95:3  

📁 src/hooks/useData.ts
   functional/prefer-pipe (1) : 🔧 Use pipe/flow
     ⚠️ 42:5  

# ... other files ...

📁 src/utils/state.ts
   functional/no-side-effect (1) : 🔧 Modifies external state
     ❌ 15:1  

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

### Hierarchical: File, Severity Grouping (`--group file,severity`)

Shows severity breakdown within each file concisely.

```bash
# bunlint --group file,severity

📁 src/api/client.ts
   ❌ functional/no-mutation (1) :  Mutates parameter
      42:5   

📁 src/auth/login.ts
   ❌ security/no-eval (1) :  Uses eval()
      78:10  

# ... Example file with both Errors and Warnings
📁 src/complex/component.tsx # Hypothetical
   ❌ some/critical-error (1) :  Critical error reason
      10:1  
   ⚠️ immutable/no-array-mutation (1) : 🔧 Array mutation
      15:8   
   ⚠️ performance/memo-component (1) :  🔧 Memoize component
      45:5  

📁 src/reducers/user.ts
   ⚠️ immutable/no-object-mutation (1)
      31:12   🔧 Object mutation

# ... other files ...

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 13 issues (4 errors, 9 warnings) in 49 files. Ran in 0.25s
```

## Built-in Rule Plugins

BunLint comes with several core plugins:

### @bunlint/immutable

Ensures immutability in your codebase:

-   `no-array-mutation`: Prevents array mutations (push, pop, splice, etc.)
-   `no-object-mutation`: Prevents object mutations
-   `prefer-const`: Enforces the use of const declarations
-   `no-let`: Disallows let declarations in favor of const

### @bunlint/functional

Enforces functional programming patterns:

-   `no-class`: Prevents the use of classes
-   `no-this`: Prevents the use of this keyword
-   `no-loops`: Encourages functional alternatives to loops
-   `no-statements`: Encourages expressions over statements
-   `prefer-pipe`: Encourages the use of pipe/flow compositions
-   `pure-function`: Ensures functions are pure
-   `no-side-effect`: Prevents side effects in functions

### @bunlint/performance

Optimizes code for performance:

-   `no-large-objects`: Warns about excessively large object literals
-   `efficient-imports`: Ensures efficient import patterns
-   `memo-components`: Suggests memoization for components
-   `avoid-rerender`: Identifies patterns that cause unnecessary rerenders

*(Note: Other official or third-party plugins like `@bunlint/security`, `@bunlint/naming`, etc., can be added using `bunlint add <n>`)*

## Disabling Rules

BunLint allows disabling rules using special comments in your code.

### Disable Rules for Specific Lines

You can disable rules for a single line:

```typescript
// bunlint-disable no-class
class TemporarilyAllowed {} // No error reported
```

Or for the next line only:

```typescript
// bunlint-disable-next-line no-loops
for (let i = 0; i < items.length; i++) {
  // No error reported for this loop
}
```

### Disable Rules for an Entire File

To disable specific rules for an entire file:

```typescript
// bunlint-disable-file no-class,no-loops
// All classes and loops in this file will be ignored
```

### Disable All Rules

You can disable all rules for specific lines or the entire file by omitting the rule names:

```typescript
// bunlint-disable
// All rules disabled for this line

// bunlint-disable-next-line
const something = [...]; // No errors reported on this line

// bunlint-disable-file
// All rules disabled for this entire file
```

## Creating Custom Rules

BunLint uses [ts-morph](https://github.com/dsherret/ts-morph) for powerful AST manipulation with TypeScript awareness.

### Rule Structure

Create a rule file (e.g., `rules/my-custom-rule.ts`):

```typescript
// my-custom-rule.ts
import { createRule } from 'bunlint';
import ts from 'typescript'; // Import ts namespace if needed
import type { SourceFile, Node, VariableStatement } from 'ts-morph'; // Import specific Node types

export const myCustomRule = createRule({
  name: 'my-custom-rule',
  meta: {
    type: 'suggestion', // 'problem', 'suggestion', 'layout'
    docs: {
      description: 'Enforces a custom pattern',
      category: 'Best Practices', // e.g., 'Functional', 'Immutability', 'Style'
      recommended: false, // or 'warn', 'error'
      url: 'https://example.com/docs/rules/my-custom-rule', // Optional URL
    },
    fixable: 'code', // 'code', 'whitespace', or undefined
    schema: [], // Optional JSON schema for rule options
    messages: {
      violation: 'This violates my custom rule: {{ detail }}',
      suggestion: 'Consider using this pattern instead.',
    },
  },
  create: (context) => {
    // context provides: options, report(), getSourceCode(), etc.
    return {
      // Visitor key matching AST node kind (e.g., VariableStatement)
      VariableStatement: (node: VariableStatement) => {
        if (isViolation(node)) {
          context.report({
            node: node,
            messageId: 'violation',
            data: { detail: `Variable '${node.getDeclarations()[0]?.getName() ?? ''}' is mutable.` },
            fix: (fixer) => {
              // Pure function to generate a fix
              const keyword = node.getDeclarationKindKeyword();
              if (keyword && isFixable(node)) {
                return fixer.replaceText(keyword, 'const');
              }
              return null;
            },
            suggest: [ /* ... suggestions ... */ ],
          });
        }
      },
      // Add more visitors as needed
    };
  }
});

// Pure helper functions for logic and testability
const isViolation = (node: VariableStatement): boolean => {
  return node.getDeclarationKind() === ts.VariableDeclarationKind.Let;
};

const isFixable = (node: VariableStatement): boolean => {
  // Add logic to check if changing 'let' to 'const' is safe
  // (Requires scope analysis - simplified here)
  return true; // Assume fixable for example
};
```

### Creating a Plugin

Bundle related rules into a plugin (e.g., `my-plugin.ts`):

```typescript
// my-plugin.ts
import { createPlugin } from 'bunlint';
import { myCustomRule } from './rules/my-custom-rule';
import { anotherRule } from './rules/another-rule';

export default createPlugin({
  name: 'my-plugin', // Prefix for rules: 'my-plugin/my-custom-rule'
  rules: {
    'my-custom-rule': myCustomRule,
    'another-rule': anotherRule,
  },
  configs: {
    recommended: {
      plugins: ['my-plugin'],
      rules: {
        'my-plugin/my-custom-rule': 'warn',
        'my-plugin/another-rule': 'error',
      }
    },
    // Add other configs like 'strict' if desired
  }
});
```

## Rule Testing

Use the `bunlint/testing` framework:

```typescript
// my-custom-rule.test.ts
import { testRule } from 'bunlint/testing';
import { myCustomRule } from './my-custom-rule'; // Rule disallowing 'let'

testRule(myCustomRule, {
  valid: [
    { code: 'const x = 1;', name: 'allows const' },
  ],
  invalid: [
    {
      code: 'let y = 2;',
      name: 'disallows let',
      errors: [{
        messageId: 'violation',
        line: 1, column: 1, endColumn: 4, // Pinpoint 'let'
        data: { detail: "Variable 'y' is mutable." }
      }],
      output: 'const y = 2;', // Expected output after fix
    },
  ],
});
```

## Advanced Features

### Rule Composition

Combine rules functionally:

```typescript
import { composeRules, createRule } from 'bunlint';
import { ruleA } from './rule-a';
import { ruleB } from './rule-b';

const combinedRule = composeRules([ruleA, ruleB], {
  name: 'combined-check',
  meta: { /* ... merged or new meta ... */ },
});
```

### Init Wizard (`bunlint init`)

Interactive setup for `bunlint.config.ts`:

```
╭─ BunLint Init ─────────────────────────────────────────────╮
│                                                            │
│  Let's set up BunLint for your project!                    │
│                                                            │
│  ? Select project type:                                    │
│    ● Generic TypeScript                                    │
│    ○ React                                                 │
│    ○ Node.js API                                           │
│    ○ Full-stack application                                │
│                                                            │
│  ? Select strictness level:                                │
│    ○ Relaxed    - Minimal restrictions                     │
│    ● Standard   - Balanced approach                        │
│    ○ Strict     - Enforce functional paradigms             │
│    ○ Very Strict - Pure functional programming only        │
│                                                            │
│  ? Select additional plugins:                              │
│    ◉ immutable   [recommended]                             │
│    ◉ functional  [recommended]                             │
│    ◉ performance [recommended]                             │
│    ○ security    - Security best practices                 │
│    ○ naming      - Naming conventions                      │
│    ○ a11y        - Accessibility guidelines                │
│    ○ import      - Import/export conventions               │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

## Integration Examples

### GitHub Actions

```yaml
# .github/workflows/bunlint.yml
name: BunLint

on: [push, pull_request]

jobs:
  lint:
    name: Run BunLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with: bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun lint --format minimal # Fail CI on issues
      - name: Generate Report Artifact
        if: always()
        run: bun lint report --format markdown --output bunlint-report.md
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: bunlint-report
          path: bunlint-report.md
```

### VS Code Extension

Real-time linting and quick fixes in your editor.

1.  **Install:** Search `BunLint` in Marketplace, install `bunlint-vscode`.
2.  **Features:** Automatically uses `bunlint.config.ts`, shows errors/warnings inline, hover details, quick fixes (`Ctrl+.`/`Cmd+.`), Problems panel integration, Command Palette actions (`BunLint: Fix...`, `BunLint: Disable...`, etc.).

## API Reference

Use BunLint programmatically:

```typescript
import { lint, loadConfig, formatResults, applyFixes, type LintResult, type LintOptions } from 'bunlint';
import path from 'node:path';

async function run() {
  const { config, filepath: configPath } = await loadConfig(); // Auto-finds config
  if (!config) process.exit(1);

  const files = config.include || ['src/**/*.ts'];
  const options: LintOptions = { config, configPath, fix: false, cache: config.cache };

  const results: LintResult[] = await lint(files, options);

  const output = await formatResults(results, {
    format: config.report?.format || 'pretty',
    grouping: config.report?.grouping || 'category',
    // ... other formatting options
  });
  console.log(output);

  // Optional: Apply fixes
  // if (needsFixing) await applyFixes(files, { config, configPath });

  const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
  process.exit(errorCount > 0 ? 1 : 0);
}

run().catch(console.error);
```

## Performance Optimizations

1.  **Bun Runtime**: Leverages Bun's speed (JSC, fast I/O, transpiler).
2.  **Efficient Caching**: Persists results based on content/config/version hashes.
3.  **Parallel Processing**: Lints multiple files concurrently using Bun's capabilities.
4.  **Incremental Analysis**: Minimal re-analysis in `--watch` mode.
5.  **AST Reuse**: Parses each file once per run, shared by all rules.
6.  **Optimized Traversal**: Efficient visitor pattern for AST analysis.
7.  **Memory Efficiency**: Functional patterns minimize state; careful AST lifecycle management.
8.  **Lazy Loading**: On-demand loading of plugins, rules, formatters.

## Contributing

Contributions are welcome! Please follow:

1.  **Functional Principles**: Pure functions, immutability, FP utilities. Avoid `class`, `this`, imperative loops where possible.
2.  **Code Style**: Enforced by BunLint itself (`bun lint --fix`).
3.  **Testing**: Comprehensive tests via `bunlint/testing` (`testRule`). Cover valid/invalid cases, options, fixes (`output`).
4.  **Documentation**: Update README, rule docs (`docs/rules/`), guides for changes. Explain rule rationale, examples, options, fixability.
5.  **Commit Messages**: Use Conventional Commits (`feat: ...`, `fix: ...`, `docs: ...`).
6.  **Pull Requests**: Target `main`, describe changes clearly, ensure CI passes, be responsive.

## License

MIT