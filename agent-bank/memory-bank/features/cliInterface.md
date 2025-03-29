# CLI Interface: BunLint

## Overview

BunLint provides a beautiful and intuitive command-line interface (CLI) with rich features for linting, fixing, reporting, and managing plugins. The CLI is designed to be user-friendly while offering powerful capabilities for advanced users.

## Basic Usage

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

## Commands

### lint (Default)

Checks files for linting issues based on the configured rules.

```bash
# Basic usage
bunlint

# Check specific files or directories
bunlint src/components

# Use specific config
bunlint --config custom.config.ts

# Performance information
bunlint --perf
```

### fix

Automatically fixes issues that can be auto-fixed.

```bash
# Fix all auto-fixable issues
bunlint fix

# Fix specific directory
bunlint fix src/components

# Fix only specific rules
bunlint fix --rules functional/no-class,immutable/no-let
```

### init

Interactive wizard to create a new BunLint configuration.

```bash
# Start configuration wizard
bunlint init
```

The init wizard guides users through setup:

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

### add

Adds and configures a plugin to your project.

```bash
# Add an official plugin
bunlint add security

# Add a third-party plugin
bunlint add bunlint-plugin-react-a11y
bunlint add @my-org/bunlint-conventions
```

The `add` command:
1. Resolves the full package name (e.g., `security` -> `@bunlint/security`)
2. Installs the package using `bun add -d`
3. Updates the configuration file with imports and plugin registration
4. Provides feedback on configuring the plugin's rules

### watch

Watches files for changes and runs linting when files are modified.

```bash
# Watch all files in project
bunlint watch

# Watch specific directory
bunlint watch src/

# Watch with specific rules
bunlint watch --rules functional/no-class
```

### doctor

Diagnoses and fixes common setup issues.

```bash
# Run diagnostics
bunlint doctor

# Fix detected issues
bunlint doctor --fix
```

### report

Generates comprehensive linting reports in various formats.

```bash
# Generate report in default format
bunlint report

# Generate JSON report
bunlint report --format json --output report.json

# Generate markdown report
bunlint report --format markdown --output LINTING.md
```

## Options

### Format Options

Controls the output format of linting results.

```bash
# Pretty format (default)
bunlint --format pretty

# JSON format
bunlint --format json

# Markdown format
bunlint --format markdown

# Compact format
bunlint --format compact
```

### Grouping Options

Groups linting issues by different criteria.

```bash
# Single-level grouping
bunlint --group category   # Group by rule category
bunlint --group file       # Group by file
bunlint --group severity   # Group by severity (error/warning)
bunlint --group rule       # Group by rule ID
bunlint --group fixability # Group by whether issues can be fixed

# Hierarchical (two-level) grouping
bunlint --group file,severity  # Group by file, then severity within each file
bunlint --group file,rule      # Group by file, then rule within each file
bunlint --group category,rule  # Group by category, then rule within each category
bunlint --group rule,severity  # Group by rule, then severity for each rule
```

### Filtering Options

Filters linting results to show only specific issues.

```bash
# Filter by category
bunlint --only-category security,performance

# Filter by path
bunlint --only-path src/components

# Filter by rule
bunlint --only-rule functional/no-class,immutable/*

# Filter by severity
bunlint --only-severity error
```

### Configuration Options

Controls which configuration to use.

```bash
# Use specific config file
bunlint --config custom.bunlint.config.ts

# Disable configuration loading
bunlint --no-config

# Specify rules directly
bunlint --rule "functional/no-class: error" --rule "immutable/no-let: warn"
```

### Cache Options

Controls caching behavior for performance.

```bash
# Disable caching
bunlint --no-cache

# Specify cache location
bunlint --cache-location ./node_modules/.cache/custom-bunlint-cache
```

## Output Examples

### Category Grouping (`--group category`)

```
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

```
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

### Hierarchical Grouping (`--group file,rule`)

```
📁 src/api/client.ts
   functional/no-mutation (1) : Mutates parameter
     ❌ 42:5  

📁 src/auth/login.ts
   security/no-eval (1) : Uses eval()
     ❌ 78:10 

📁 src/components/UserProfile.tsx
   functional/no-class (1) : 🔧 Avoid classes
     ⚠️ 36:10 
   immutable/no-object-mutation (1) : 🔧 Object mutation detected
     ⚠️ 68:12 
   performance/avoid-rerender (1) : Potential unnecessary rerender
     ⚠️ 95:3  

# ... other files ...

🔧 6 issues auto-fixable. Run: bunlint fix
📊 BunLint: 11 issues (3 errors, 8 warnings) in 48 files. Ran in 0.24s
```

## Exit Codes

BunLint provides meaningful exit codes to integrate with CI/CD pipelines:

- `0`: No linting errors (warnings don't affect exit code)
- `1`: Linting errors found
- `2`: Configuration or execution error 