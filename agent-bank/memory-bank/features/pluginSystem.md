# Plugin System: BunLint

## Overview

BunLint's plugin system provides a robust mechanism for extending functionality through a modular, declarative approach. Plugins can add new rules, configurations, and custom functionality while maintaining compatibility with the core linting engine.

## Core Concepts

### Plugin Structure

A BunLint plugin is a JavaScript/TypeScript module that exports a plugin definition created with the `createPlugin` factory:

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

### Rule Definition

Rules within a plugin are created using the `createRule` factory:

```typescript
// my-custom-rule.ts
import { createRule } from 'bunlint';
import ts from 'typescript';
import type { SourceFile, Node, VariableStatement } from 'ts-morph';

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
  return true; // Simplified for example
};
```

## Installation and Setup

### Adding Plugins

Plugins can be added to a project using the `bunlint add` command:

```bash
# Add an official plugin
bunlint add security

# Add a third-party plugin by package name
bunlint add bunlint-plugin-react-a11y
bunlint add @my-org/bunlint-conventions
```

This command:
1. Resolves the full package name (e.g., `security` -> `@bunlint/security`)
2. Installs the package using `bun add -d`
3. Updates the configuration file with the appropriate import and plugin registration
4. Provides feedback on next steps for configuring the plugin

### Configuration

Plugins are configured in the `bunlint.config.ts` file:

```typescript
// bunlint.config.ts
import { defineConfig } from 'bunlint';
import immutable from '@bunlint/immutable';
import functional from '@bunlint/functional';
import performance from '@bunlint/performance';
import security from '@bunlint/security'; // Added via bunlint add security

export default defineConfig({
  extends: ['recommended'],
  plugins: [
    immutable(),
    functional(),
    performance(),
    security(),
  ],
  rules: {
    'immutable/no-array-mutation': 'error',
    'functional/no-class': 'error',
    'security/no-eval': 'error',
    // Custom rule configuration
  },
  // Other configuration options
});
```

## Built-in Plugins

BunLint comes with several core plugins:

### @bunlint/immutable

Ensures immutability in your codebase:

- `no-array-mutation`: Prevents array mutations (push, pop, splice, etc.)
- `no-object-mutation`: Prevents object mutations
- `prefer-const`: Enforces the use of const declarations
- `no-let`: Disallows let declarations in favor of const

### @bunlint/functional

Enforces functional programming patterns:

- `no-class`: Prevents the use of classes
- `no-this`: Prevents the use of this keyword
- `no-loops`: Encourages functional alternatives to loops
- `no-statements`: Encourages expressions over statements
- `prefer-pipe`: Encourages the use of pipe/flow compositions
- `pure-function`: Ensures functions are pure
- `no-side-effect`: Prevents side effects in functions

### @bunlint/performance

Optimizes code for performance:

- `no-large-objects`: Warns about excessively large object literals
- `efficient-imports`: Ensures efficient import patterns
- `memo-components`: Suggests memoization for components
- `avoid-rerender`: Identifies patterns that cause unnecessary rerenders

## Plugin Development

### Core APIs

1. **Rule Context**: Provided to rule visitor functions with these features:
   - `report()`: Report violations
   - `getSourceCode()`: Access the parsed source code
   - `options`: Access rule options
   - `settings`: Access shared settings

2. **Fixer API**: Used in `fix` functions to create code transformations:
   - `replaceText(node, text)`: Replace node text
   - `remove(node)`: Remove a node
   - `insertTextBefore(node, text)`: Insert text before node
   - `insertTextAfter(node, text)`: Insert text after node

3. **AST Utilities**: Helper functions for common AST operations:
   - Node type checking
   - Node traversal
   - Type inference

### Testing

Plugins and rules should be tested using the `testRule` function from `bunlint/testing`:

```typescript
// my-custom-rule.test.ts
import { testRule } from 'bunlint/testing';
import { myCustomRule } from './my-custom-rule';

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
        line: 1, column: 1, endColumn: 4,
        data: { detail: "Variable 'y' is mutable." }
      }],
      output: 'const y = 2;', // Expected output after fix
    },
  ],
});
```

## Best Practices

1. **Pure Functions**: Use pure functions for rule logic to improve testability
2. **Rule Composition**: Use `composeRules` to combine related rules
3. **Meaningful Messages**: Provide clear, actionable error messages
4. **Documentation**: Include comprehensive docs in rule metadata
5. **Testing**: Write thorough tests for both valid and invalid cases
6. **Performance**: Be mindful of performance impact, especially for complex rules