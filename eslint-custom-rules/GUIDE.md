# ESLint Custom Rules Development Guide

## Rule Development Principles

### Structure
- Each rule should be in its own file named `rule-name.js`
- Implement using the ESLint rule structure with `meta` and `create` properties
- Use messageIds instead of hard-coded error messages

```javascript
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Brief description of rule',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: null, // or 'code' if the rule provides autofix
    schema: [], // options schema
    messages: {
      myError: 'This is an error message', // Use messageIds
    }
  },
  create(context) {
    return {
      // AST node visitors
    };
  }
};
```

### Error Reporting
- Always use messageIds when reporting errors:
```javascript
context.report({
  node: node,
  messageId: 'myError', // Reference messageId
  data: { name: node.name }, // Optional data for variable substitution
});
```

### Suggestions
- Implement the `suggest` property for fixable violations:
```javascript
context.report({
  node: node,
  messageId: 'myError',
  suggest: [
    {
      messageId: 'mySuggestion',
      fix: (fixer) => fixer.replaceText(node, 'fixedCode')
    }
  ]
});
```

## Testing Best Practices

### Test Structure
- Create test files in `tests/` directory with naming pattern `rule-name.test.js`
- Use RuleTester from ESLint to run tests
- Include both valid and invalid test cases

```javascript
const rule = require('../rule-name');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  }
});

ruleTester.run('rule-name', rule, {
  valid: [
    // Valid test cases
    'const x = 1;',
  ],
  invalid: [
    // Invalid test cases
    {
      code: 'const y = 2;',
      errors: [{ messageId: 'myError' }]
    }
  ]
});
```

### Testing TypeScript Rules
- Use @typescript-eslint/parser for TypeScript rules:
```javascript
const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  }
});
```

### Testing File System Operations
- Mock file system operations using jest.mock:
```javascript
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('mock content'),
}));
```

### Circular References
- Avoid complex object structures in error expectations
- Use messageId instead of literal error messages
- Split complex rules into simpler functions

## Common Issues and Solutions

### Circular Reference Errors
- Problem: `Converting circular structure to JSON` errors
- Solution: Use messageId instead of full error objects:
```javascript
// Instead of:
errors: [{ message: 'This is an error' }]

// Use:
errors: [{ messageId: 'myError' }]
```

### Suggestions Implementation
- Problem: Suggestions not being properly tested
- Solution: Verify suggestions are correctly configured:
```javascript
// In rule:
meta: {
  hasSuggestions: true,
  // ...
}

// In test:
errors: [{
  messageId: 'myError',
  suggestions: [
    { messageId: 'mySuggestion' }
  ]
}]
```

### AST Node Navigation
- Use selector functions for complex AST navigation
- Break down complex visitor logic into multiple functions
- Document each function's purpose

## Testing Coverage
- Run coverage reports: `npm test -- --coverage`
- Aim for >80% coverage for all rules
- Ensure edge cases are tested for each rule

## Debugging Tips
- Use `console.log(JSON.stringify(node, null, 2))` to debug AST nodes
- Add debug logs during development, remove before committing
- Test rules individually during development
- Use ESLint's --debug flag for verbose output

## Performance Considerations
- Minimize AST traversals
- Cache results when possible
- Avoid complex regular expressions
- Consider the impact of autofix operations

## Documentation
- Document each rule thoroughly
- Include examples of valid and invalid code
- Specify available rule options
- Document any performance considerations 

## Rule Examples

### no-blank-files

This rule prevents empty files or files that contain only whitespace or comments. It promotes maintaining quality by ensuring all files contribute meaningful content to the codebase.

#### Options

```javascript
{
  "quantum-patterns/no-blank-files": ["error", {
    // Whether to allow files with only comments (default: false)
    "allowComments": false,
    
    // Minimum number of non-whitespace lines required (default: 1)
    "minContentLines": 1,
    
    // File patterns to ignore (default: [])
    "ignorePatterns": [
      "\\.gitkeep$",
      "\\.env$"
    ]
  }]
}
```

#### Valid Examples

```javascript
// File with code
const value = 0;
```

```javascript
// File with content exceeding minimum lines
const a = 1;
const b = 2;
const c = 3;
```

```javascript
// File with comments and code (allowComments: false)
// This is a comment
const value = 0;
```

```javascript
// File with only comments (allowComments: true)
// This is a useful comment
```

#### Invalid Examples

```javascript
// Empty file
```

```javascript
// File with only whitespace
   

```

```javascript
// File with only comments (allowComments: false)
// This is just a comment without code
```

```javascript
// File with fewer content lines than required (minContentLines: 3)
const a = 1;
const b = 2;
```

#### Implementation Details

The rule examines the source code to check for:
1. Completely empty files
2. Files with only whitespace
3. Files with fewer than the minimum required content lines
4. Files with only comments when comments are not considered as content

Special patterns like `.gitkeep`, `.env`, etc., can be ignored using the `ignorePatterns` option. 