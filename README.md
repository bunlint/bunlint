# BunLint

BunLint is a modern, high-performance linting tool designed specifically for Bun-powered JavaScript and TypeScript projects. Built with functional programming principles at its core, BunLint enforces immutability and functional patterns while providing blazing-fast performance through Bun's runtime optimizations.

## Core Philosophy

- **Bun-First**: Optimized for the Bun JavaScript runtime
- **Functional-First**: Enforces functional programming patterns
- **Immutability**: Prevents mutations and side effects
- **Performance**: Significantly faster than traditional linters
- **Developer Experience**: Beautiful CLI with helpful suggestions, autofixes, and easy plugin management

## Installation

```bash
# Using Bun (recommended)
bun add -d bunlint

# Using npm
npm install --save-dev bunlint

# Using yarn
yarn add --dev bunlint

# Using pnpm
pnpm add -D bunlint
```

Create a configuration file:

```bash
bunlint init
```

## Usage

```bash
# Basic usage
bunlint

# Fix automatically fixable issues
bunlint fix

# Check specific files or directories
bunlint src/components
```

## Configuration

BunLint uses TypeScript for configuration via a `bunlint.config.ts` file:

```typescript
import { defineConfig } from 'bunlint';

export default defineConfig({
  extends: ['recommended'],
  plugins: [],
  rules: {
    'no-mutation': 'error',
    'no-class': 'error',
    'prefer-const': 'warn',
    'no-loops': 'warn',
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
});
```

## Built-in Rules

BunLint comes with several core rules:

### Immutability

- `no-mutation`: Prevents mutations of objects and arrays

### Functional

- `no-class`: Prevents the use of classes
- `no-loops`: Encourages functional alternatives to loops

### Best Practices

- `prefer-const`: Enforces the use of const declarations

## API Usage

```typescript
import { lint, fix, analyzeFile, createRule } from 'bunlint';

// Lint files
const results = await lint(['src/**/*.ts']);
console.log(`Found ${results.length} files with issues`);

// Fix issues
await fix(results);

// Create custom rules
const myRule = createRule({
  name: 'my-custom-rule',
  meta: {
    type: 'problem',
    docs: {
      description: 'My custom rule',
      category: 'Custom',
      recommended: 'error',
    },
    messages: {
      myIssue: 'This is an issue',
    },
  },
  create: (context) => ({
    // Your rule implementation
  }),
});
```

## License

MIT
