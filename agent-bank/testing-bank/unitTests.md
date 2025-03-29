# Unit Tests Plan & Status

## 1. Goal & Location for Planning

Verify isolated logic units. **Note functions/logic and expected behavior to be
tested in `testing-plan` BEFORE implementing `.test.ts` files.** Lowest priority.

## 2. Tooling

- **Runner:** `bun test`
- **Quality Requirements:**
  - Isolate pure functions
  - Use parameterized tests for similar cases
  - Shared factory functions in `/test/utils/factories`

## 3. Initial Functions/Logic to Test

### 3.1. Rule Creation Factory

**Function:** `createRule(options: RuleOptions): Rule`
**Description:** Creates a rule definition with metadata and visitor implementation
**Expected Behavior:**
- Should properly initialize rule with name, metadata and visitor functions
- Should validate rule metadata structure
- Should provide correct context API to rule implementation
- Should handle all AST node types correctly
- Should allow for proper error reporting

### 3.2. Rule Composition

**Function:** `composeRules(rules: Rule[], options?: ComposeOptions): Rule`
**Description:** Combines multiple rules into a single rule
**Expected Behavior:**
- Should merge visitor methods from all rules
- Should handle conflicting visitor methods appropriately
- Should combine metadata correctly or use provided override
- Should maintain proper context across composed rules

### 3.3. Rule Testing Framework 

**Function:** `testRule(rule: Rule, testCases: RuleTestCases): void`
**Description:** Provides framework for testing rules with valid and invalid cases
**Expected Behavior:**
- Should validate that valid code examples don't report errors
- Should validate that invalid code examples report exactly the expected errors
- Should check error positions, message IDs, and data
- Should verify that fixes produce the expected output
- Should support options and different parser configurations

### 3.4. Configuration Loading

**Function:** `loadConfig(options?: LoadConfigOptions): Promise<{ config: Config | null, filepath?: string }>`
**Description:** Loads and validates configuration from various sources
**Expected Behavior:**
- Should find configuration in standard locations
- Should validate configuration against schema
- Should apply default values for missing options
- Should handle extends and plugin configurations
- Should resolve relative paths correctly

### 3.5. AST Traversal

**Function:** `traverse(ast: SourceFile, visitors: Visitors, context: Context): void`
**Description:** Traverses AST and calls appropriate visitor functions
**Expected Behavior:**
- Should visit all nodes of requested types
- Should provide node information to visitor functions
- Should maintain proper parent/child relationships
- Should allow context access and modification
- Should handle visitor early returns and exceptions

### 3.6. Reporting Formatters

**Function:** `formatResults(results: LintResult[], options: FormatOptions): string`
**Description:** Formats linting results according to specified options
**Expected Behavior:**
- Should format results in the requested output format (pretty, JSON, markdown)
- Should group results according to grouping option
- Should filter results based on filtering criteria
- Should show summary information when requested
- Should handle empty results appropriately

### 3.7. Fix Application

**Function:** `applyFixes(fixes: Fix[], sourceText: string): string`
**Description:** Applies multiple fixes to source text
**Expected Behavior:**
- Should apply fixes in the correct order (bottom to top of file)
- Should handle overlapping fixes appropriately
- Should preserve unchanged portions of the text
- Should validate fixes before applying them
- Should handle edge cases (empty text, no fixes, etc.)

## 4. Status

- **Current:** Planning. Functions/behavior detailed but tests not yet
  implemented. Coverage 0%.
- **Next:** Implement first unit tests based on the documented behavior above,
  starting with the Rule Creation Factory tests.
