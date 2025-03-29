# Configuration System: BunLint

## Overview

BunLint uses TypeScript for configuration, providing a type-safe and flexible way to customize linting behavior. The configuration system allows for extending shared configurations, adding plugins, and fine-tuning rule settings.

## Configuration File

BunLint looks for a `bunlint.config.ts` file in the project root:

```typescript
// bunlint.config.ts
import { defineConfig } from 'bunlint';
import immutable from '@bunlint/immutable';
import functional from '@bunlint/functional';
import performance from '@bunlint/performance';

export default defineConfig({
  extends: ['recommended'],
  plugins: [
    immutable(),
    functional(),
    performance(),
  ],
  rules: {
    'immutable/no-array-mutation': 'error',
    'functional/no-class': 'error',
    'functional/prefer-pipe': 'warn',
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

## Configuration Options

### Core Options

| Option | Type | Description |
|--------|------|-------------|
| `extends` | `string[]` | Base configurations to extend |
| `plugins` | `Plugin[]` | Plugins to use |
| `rules` | `Record<string, RuleLevel \| [RuleLevel, ...any[]]>` | Rule configurations |
| `include` | `string[]` | File patterns to include |
| `exclude` | `string[]` | File patterns to exclude |
| `cache` | `boolean` | Whether to use cache |
| `cacheLocation` | `string` | Path to cache directory |
| `report` | `ReportOptions` | Reporting options |

### Rule Configuration

Rules can be configured with different severity levels:
- `'error'`: Treated as errors (exit code 1)
- `'warn'`: Treated as warnings (exit code 0)
- `'off'`: Rule is disabled

Rules can also be configured with options by using an array syntax:
```typescript
rules: {
  'functional/no-loops': ['warn', { allowForEach: true }],
  'immutable/no-let': 'error',
  'performance/no-large-objects': ['error', { maxSize: 100 }]
}
```

### Report Options

| Option | Type | Description |
|--------|------|-------------|
| `format` | `string` | Output format: 'pretty', 'json', 'markdown', etc. |
| `outputFile` | `string` | File to write report to |
| `grouping` | `string` | How to group results: 'file', 'rule', 'category', etc. |
| `customGroups` | `Record<string, string[]>` | Custom grouping for categories |
| `showSummary` | `boolean` | Whether to show summary information |
| `maxIssuesPerGroup` | `number` | Maximum issues to show per group |
| `sortBy` | `string` | How to sort issues: 'severity', 'location', 'rule' |
| `expandGroups` | `boolean` | Whether to expand groups by default |

## Extending Configurations

BunLint supports extending shared configurations:

```typescript
export default defineConfig({
  extends: [
    'recommended', // Built-in recommended config
    '@company/bunlint-config', // External shared config
    './local-config.ts' // Local config file
  ],
  // Override or add specific options
  rules: {
    // Override rules from extended configs
  }
});
```

Extended configurations are merged in order, with later configs taking precedence and the local config having the highest priority.

## Plugin Configuration

Plugins are registered in the `plugins` array and can provide their own rules and presets:

```typescript
import { defineConfig } from 'bunlint';
import immutable from '@bunlint/immutable';
import functional from '@bunlint/functional';
import security from '@bunlint/security';

export default defineConfig({
  plugins: [
    immutable(),
    functional({ noClassExceptions: ['Component'] }), // With options
    security()
  ],
  // Use plugin rules
  rules: {
    'immutable/no-array-mutation': 'error',
    'functional/no-class': 'error',
    'security/no-eval': 'error'
  }
});
```

Plugins can also be added automatically using the `bunlint add` command:

```bash
bunlint add security
```

This will install the plugin package and update the configuration file automatically.

## Configuration Initialization

For new projects, you can use the `bunlint init` command to create a new configuration file interactively:

```bash
bunlint init
```

The wizard will guide you through selecting project type, strictness level, and plugins to use, then generate an appropriate configuration file.

## Programmatic Configuration

BunLint's configuration can also be loaded and used programmatically:

```typescript
import { loadConfig, lint, type LintOptions } from 'bunlint';

async function run() {
  const { config, filepath } = await loadConfig();
  if (!config) {
    console.error('No configuration found');
    process.exit(1);
  }

  const options: LintOptions = { 
    config, 
    configPath: filepath,
    fix: false,
    cache: config.cache 
  };

  const results = await lint(['src/**/*.ts'], options);
  // Process results...
}
```

## Best Practices

1. **Use TypeScript Configuration**: Leverage the type safety of the TypeScript configuration.
2. **Start with Recommended Configs**: Extend from recommended configurations and override as needed.
3. **Group Related Rules**: Use plugins to organize related rules.
4. **Documentation**: Comment your configuration, especially custom rules or unusual settings.
5. **Incremental Adoption**: Start with a small set of rules and gradually add more as your team adapts.
6. **Custom Categories**: Use `customGroups` to organize issues in a way that makes sense for your project. 