# Rule Creation Tests Plan

## Overview

This document contains detailed test scenarios for the rule creation and testing system of BunLint. Following our TDD methodology, these scenarios must be documented before implementing the corresponding tests.

## Test Categories

1. Rule Factory Tests
2. Rule Composition Tests
3. Rule Testing Framework Tests
4. Custom Rule Examples

## 1. Rule Factory Tests

### 1.1 Basic Rule Creation

**Test:** Verify that `createRule` properly initializes a rule with correct structure
**Given:**
```typescript
const myRule = createRule({
  name: 'my-rule',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Test rule',
      category: 'Test',
      recommended: false,
    },
    fixable: undefined,
    schema: [],
    messages: {
      violation: 'This is a violation'
    },
  },
  create: (context) => {
    return {
      Identifier: (node) => {
        context.report({
          node,
          messageId: 'violation'
        });
      }
    };
  }
});
```
**Expected:**
- Rule has correct name property
- Rule has properly structured metadata
- Rule create function returns appropriate visitor object

### 1.2 Rule Metadata Validation

**Test:** Verify that rule metadata is validated
**Given:** Rule creation with invalid metadata structure
**Expected:**
- Error thrown for missing required fields (name, meta, create)
- Error thrown for invalid message IDs referenced in reports
- Error thrown for invalid rule type
- Warning for missing recommended field

### 1.3 Context API Access

**Test:** Verify that context API provides correct functionality
**Given:** Rule using various context methods
**Expected:**
- `context.report()` properly registers violations
- `context.getSourceCode()` returns source code object
- `context.options` provides rule options
- `context.settings` provides access to shared settings

### 1.4 AST Node Type Handling

**Test:** Verify that all TypeScript AST node types are properly handled
**Given:** Rule with visitors for different node types
**Expected:**
- Correct nodes are visited based on visitor keys
- Node properties are accessible within visitor functions
- Parent and child relationships are maintained

## 2. Rule Composition Tests

### 2.1 Basic Rule Composition

**Test:** Verify that `composeRules` properly combines multiple rules
**Given:**
```typescript
const ruleA = createRule({
  name: 'rule-a',
  // ... other properties ...
  create: (context) => ({
    Identifier: (node) => { /* ... */ }
  })
});

const ruleB = createRule({
  name: 'rule-b',
  // ... other properties ...
  create: (context) => ({
    StringLiteral: (node) => { /* ... */ }
  })
});

const combinedRule = composeRules([ruleA, ruleB], {
  name: 'combined-rule',
  // ... potentially overridden metadata ...
});
```
**Expected:**
- Combined rule has visitor methods from both source rules
- Rule metadata is properly merged or overridden

### 2.2 Visitor Conflict Resolution

**Test:** Verify handling of conflicting visitor methods
**Given:** Multiple rules with the same visitor keys
**Expected:**
- All visitor methods for the same node type are called in sequence
- Each visitor should receive the same node instance
- Context is maintained correctly across all visitor calls

### 2.3 Metadata Merging

**Test:** Verify metadata merging logic
**Given:** Rules with different metadata properties
**Expected:**
- Explicitly provided metadata in compose options takes precedence
- Messages are merged from all rules
- Schema is properly combined or overridden

## 3. Rule Testing Framework Tests

### 3.1 Valid Code Testing

**Test:** Verify that `testRule` correctly handles valid test cases
**Given:**
```typescript
testRule(myRule, {
  valid: [
    { code: 'const x = 1;', name: 'valid constant' },
    { code: 'let y = 2;', options: [{ allowLet: true }], name: 'allowed with options' }
  ],
  invalid: []
});
```
**Expected:**
- Valid code examples do not report errors
- Different options configurations are correctly applied
- Tests with names are properly identified in reports

### 3.2 Invalid Code Testing

**Test:** Verify that `testRule` correctly handles invalid test cases
**Given:**
```typescript
testRule(myRule, {
  valid: [],
  invalid: [
    {
      code: 'let z = 3;',
      name: 'disallows let',
      errors: [{
        messageId: 'violation',
        line: 1, column: 1, endColumn: 4,
        data: { detail: "Variable is mutable." }
      }]
    }
  ]
});
```
**Expected:**
- Invalid code examples report exactly the expected errors
- Error positions, message IDs, and data are verified
- Multiple errors within a single test case are correctly identified

### 3.3 Fix Testing

**Test:** Verify that `testRule` correctly tests fixes
**Given:**
```typescript
testRule(myRule, {
  valid: [],
  invalid: [
    {
      code: 'let z = 3;',
      name: 'fixes let to const',
      errors: [{ messageId: 'violation' }],
      output: 'const z = 3;'
    }
  ]
});
```
**Expected:**
- The rule's fix function is called
- The resulting output matches the expected fixed code
- If no fix is possible, the output should be undefined or match the input

## 4. Custom Rule Examples

### 4.1 No-Let Rule

**Test:** Verify a complete implementation of a no-let rule
**Given:** Implementation similar to the example in the documentation
**Expected:**
- Rule correctly identifies `let` declarations
- Rule provides appropriate error messages
- Fix correctly changes `let` to `const` when possible

### 4.2 No-Array-Mutation Rule

**Test:** Verify the no-array-mutation rule implementation
**Given:** Code using array mutation methods (push, pop, splice, etc.)
**Expected:**
- Rule correctly identifies array mutation operations
- Different array mutation methods are properly detected
- Fix suggestions are provided where appropriate

### 4.3 No-Class Rule

**Test:** Verify the no-class rule implementation
**Given:** Code using class declarations and expressions
**Expected:**
- Rule correctly identifies class declarations and expressions
- Rule provides guidance on functional alternatives
- Fix suggestions are provided where appropriate

## Next Steps

1. Implement unit tests for the rule creation factory
2. Implement the rule composition tests
3. Develop the rule testing framework
4. Create example implementations of core rules 