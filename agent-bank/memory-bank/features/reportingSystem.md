# Reporting System: BunLint

## Overview

BunLint's reporting system provides flexible, customizable output of linting results. It supports multiple output formats, hierarchical grouping, filtering options, and visual formatting to make linting issues easy to understand and address.

## Output Formats

### Pretty Format (Default)

The default format provides a visually appealing, colorized output with symbols to indicate severity and fixability:

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

### JSON Format

Machine-readable format for integration with other tools:

```json
{
  "results": [
    {
      "filePath": "src/utils/state.ts",
      "messages": [
        {
          "ruleId": "functional/no-side-effect",
          "severity": 2,
          "message": "Modifies external state",
          "line": 15,
          "column": 1,
          "nodeType": "FunctionDeclaration",
          "messageId": "noSideEffect",
          "endLine": 15,
          "endColumn": 42,
          "fix": {
            "range": [450, 492],
            "text": "const updatedState = { ...state, value: newValue };"
          }
        }
      ],
      "errorCount": 1,
      "warningCount": 0,
      "fixableErrorCount": 1,
      "fixableWarningCount": 0,
      "source": "..."
    },
    // Additional files...
  ],
  "errorCount": 3,
  "warningCount": 8,
  "fixableErrorCount": 1,
  "fixableWarningCount": 5,
  "usedRules": ["functional/no-side-effect", "functional/no-mutation", ...],
  "duration": 0.24
}
```

### Markdown Format

Generates a markdown report suitable for documentation or GitHub:

```markdown
# BunLint Report

## Summary

- **Total Issues**: 11 (3 errors, 8 warnings)
- **Files Analyzed**: 48
- **Auto-fixable Issues**: 6
- **Execution Time**: 0.24s

## Errors (3)

### Functional (2)

- **src/utils/state.ts:15:1** - `functional/no-side-effect` - 🔧 Modifies external state
- **src/api/client.ts:42:5** - `functional/no-mutation` - Mutates parameter

### Security (1)

- **src/auth/login.ts:78:10** - `security/no-eval` - Uses eval()

## Warnings (8)

### Immutability (2)

- **src/reducers/user.ts:31:12** - `immutable/no-object-mutation` - 🔧 Object mutation
- **src/components/List.tsx:27:8** - `immutable/no-array-mutation` - 🔧 Array mutation

...
```

### Compact Format

Minimal output format, one issue per line, suitable for CI environments:

```
src/utils/state.ts:15:1: error functional/no-side-effect (🔧) Modifies external state
src/api/client.ts:42:5: error functional/no-mutation Mutates parameter
src/auth/login.ts:78:10: error security/no-eval Uses eval()
src/reducers/user.ts:31:12: warning immutable/no-object-mutation (🔧) Object mutation
...
```

## Grouping Options

BunLint supports various ways to group linting results to make them more digestible:

### Single-Level Grouping

1. **Category Grouping** (`--group category`): Groups issues by rule category
   ```
   ❌ ERRORS (3)
     Functional (2)
       src/utils/state.ts:15:1   functional/no-side-effect   🔧 Modifies external state
       src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
     Security (1)
       src/auth/login.ts:78:10   security/no-eval            Uses eval()
   ```

2. **File Grouping** (`--group file`): Groups issues by file
   ```
   📁 src/api/client.ts
      ❌ 42:5  functional/no-mutation      Mutates parameter
   
   📁 src/auth/login.ts
      ❌ 78:10 security/no-eval            Uses eval()
   ```

3. **Severity Grouping** (`--group severity`): Groups issues by error/warning
   ```
   ❌ ERRORS (3)
     src/utils/state.ts:15:1   functional/no-side-effect   🔧 Modifies external state
     src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
     src/auth/login.ts:78:10   security/no-eval            Uses eval()
   
   ⚠️ WARNINGS (8)
     src/reducers/user.ts:31:12  immutable/no-object-mutation 🔧 Object mutation
     src/components/List.tsx:27:8  immutable/no-array-mutation  🔧 Array mutation
     ...
   ```

4. **Rule Grouping** (`--group rule`): Groups issues by rule ID
   ```
   functional/no-mutation (1) : Mutates parameter
     ❌ src/api/client.ts:42:5    
   
   functional/no-side-effect (1) : 🔧 Modifies external state
     ❌ src/utils/state.ts:15:1   
   ```

5. **Fixability Grouping** (`--group fixability`): Groups by whether issues can be fixed
   ```
   🔧 AUTO-FIXABLE (6)
     ❌ src/utils/state.ts:15:1   functional/no-side-effect   Modifies external state
     ⚠️ src/reducers/user.ts:31:12  immutable/no-object-mutation Object mutation
     ...
   
   🖐️ MANUAL FIX REQUIRED (5)
     ❌ src/api/client.ts:42:5    functional/no-mutation      Mutates parameter
     ❌ src/auth/login.ts:78:10   security/no-eval            Uses eval()
     ...
   ```

### Hierarchical Grouping

BunLint supports two-level grouping for more detailed organization:

1. **File,Rule Grouping** (`--group file,rule`): Groups by file then rule
   ```
   📁 src/api/client.ts
      functional/no-mutation (1) : Mutates parameter
        ❌ 42:5  
   
   📁 src/components/UserProfile.tsx
      functional/no-class (1) : 🔧 Avoid classes
        ⚠️ 36:10 
      immutable/no-object-mutation (1) : 🔧 Object mutation detected
        ⚠️ 68:12 
   ```

2. **File,Severity Grouping** (`--group file,severity`): Groups by file then severity
   ```
   📁 src/api/client.ts
      ❌ functional/no-mutation (1) :  Mutates parameter
         42:5   
   
   📁 src/complex/component.tsx
      ❌ some/critical-error (1) :  Critical error reason
         10:1  
      ⚠️ immutable/no-array-mutation (1) : 🔧 Array mutation
         15:8   
   ```

3. Other combinations:
   - `category,rule`
   - `rule,severity`
   - `severity,category`
   - And more...

## Filtering Options

BunLint provides filtering options to focus on specific subsets of issues:

1. **Category Filtering** (`--only-category`): Show only issues in specified categories
   ```bash
   bunlint --only-category security,performance
   ```

2. **Path Filtering** (`--only-path`): Show only issues in specified paths
   ```bash
   bunlint --only-path src/components
   ```

3. **Rule Filtering** (`--only-rule`): Show only issues from specified rules
   ```bash
   bunlint --only-rule functional/no-class,immutable/*
   ```

4. **Severity Filtering** (`--only-severity`): Show only errors or warnings
   ```bash
   bunlint --only-severity error
   ```

## Additional Report Options

The reporting system supports additional configuration options:

### Custom Category Groups

Define custom groupings for categories:

```typescript
report: {
  grouping: 'category',
  customGroups: {
    'Critical': ['security/*', 'functional/no-side-effect'],
    'Style': ['formatting/*', 'naming/*'],
    'Other': ['*'] // catch-all
  }
}
```

### Other Options

- **`showSummary`**: Controls display of summary information
- **`maxIssuesPerGroup`**: Limits number of issues displayed per group
- **`sortBy`**: Determines sort order ('severity', 'location', 'rule')
- **`expandGroups`**: Controls whether groups are expanded by default

## Report Command

Generate comprehensive reports using the dedicated command:

```bash
# Generate report in default format
bunlint report

# Generate JSON report
bunlint report --format json --output report.json

# Generate markdown report
bunlint report --format markdown --output LINTING.md
```

## Integration with Other Tools

The reporting system is designed for easy integration with other tools:

1. **CI/CD Systems**: Use exit codes and compact/JSON formats
2. **Documentation**: Generate markdown reports for documentation
3. **Custom Tools**: Use the JSON format for post-processing
4. **GitHub Actions**: Generate reports as artifacts or in PRs

## Programmatic Usage

The reporting functionality is also available programmatically:

```typescript
import { formatResults, type LintResult, type FormatOptions } from 'bunlint';

async function generateReport(results: LintResult[]) {
  const options: FormatOptions = {
    format: 'markdown',
    grouping: 'file,severity',
    showSummary: true,
    sortBy: 'severity'
  };
  
  const output = await formatResults(results, options);
  
  // Write to file, send to API, etc.
}
``` 