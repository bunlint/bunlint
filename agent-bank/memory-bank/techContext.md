# Technology Context: BunLint

## Core Technologies

### Runtime & Environment
- **Bun**: Primary runtime for both development and execution, providing JavaScript/TypeScript runtime, package manager, bundler, and test runner capabilities.
- **TypeScript**: Used for all code implementation, configuration, and API definitions.
- **Node.js**: Secondary compatibility for environments where Bun is not available.

### Key Libraries & Dependencies
- **ts-morph**: Core library for TypeScript AST manipulation and code analysis.
- **typescript**: Provides TypeScript compiler API and type checking capabilities.
- **zod**: Schema validation for configuration files and plugin options.
- **cosmiconfig**: Configuration loading and resolution.
- **ink**: Interactive terminal UI components.
- **chalk**: Terminal text styling.
- **bun glob**: File pattern matching.
- **listr2**: 

## Architecture Components

### Code Analysis
- **Parser**: Converts source code into AST using ts-morph/TypeScript parser.
- **Traverse**: AST traversal utilities implementing the visitor pattern.
- **Scope Analysis**: Tracks variable declarations, references, and mutations.
- **Pattern Detection**: Identifies common code patterns for rule evaluation.

### Rule System
- **Rule Engine**: Executes rule visitors against the AST.
- **Rule Factory**: Creates rule definitions with a declarative API.
- **Rule Registry**: Manages rule registration and lookup.
- **Rule Composition**: Combines multiple rules for complex pattern detection.

### Configuration System
- **Config Loader**: Finds and loads configuration files.
- **Config Schema**: Validates configuration using Zod.
- **Config Resolution**: Handles extends, overrides, and plugin configurations.

### Reporting
- **Formatters**: Outputs results in various formats (pretty, JSON, markdown).
- **Grouping**: Organizes results by file, rule, severity, etc.
- **Filtering**: Limits results by category, path, rule, or severity.
- **Summarization**: Generates concise overview of linting results.

### Plugin System
- **Plugin Loader**: Dynamically loads plugins from node_modules.
- **Plugin Factory**: Creates plugin definitions with a declarative API.
- **Plugin Registry**: Manages plugin registration and rule lookup.

### Fix System
- **Fix Builder**: Constructs code modifications.
- **Fix Applier**: Safely applies fixes to source code.
- **Code Transforms**: Common transformation utilities for auto-fixes.

## Development Environment

### Build & Test
- **Building**: Bun's bundler for packaging.
- **Testing**: Bun's test runner with custom rule testing utilities.
- **CI/CD**: GitHub Actions for continuous integration.

### Development Workflow
- **Package Management**: Bun for dependency management.
- **Version Control**: Git with conventional commits.
- **Quality Assurance**: Self-linting with BunLint (dogfooding).

## Deployment & Distribution

### Packaging
- **npm Package**: Primary distribution method.
- **Versioning**: Semantic versioning.
- **Module Format**: ESM for both CJS and ESM compatibility.

### Integration Points
- **CLI**: Primary user interface.
- **Programmatic API**: For custom integrations.
- **VS Code Extension**: Editor integration.
- **GitHub Actions**: CI/CD integration.

## Performance Considerations

### Optimization Strategies
- **Bun Runtime**: Leverages Bun's speed (JSC, fast I/O, transpiler).
- **Caching**: File content and analysis results based on content hashes.
- **Parallel Processing**: Concurrent file analysis.
- **Incremental Analysis**: Minimal re-analysis in watch mode.
- **AST Reuse**: Parse once, share AST across rules.
- **Memory Management**: Careful lifecycle management of AST objects.
- **Lazy Loading**: On-demand loading of plugins, rules, and formatters.

## Built-in Rule Plugins

### @bunlint/immutable
- `no-array-mutation`: Prevents array mutations (push, pop, splice, etc.)
- `no-object-mutation`: Prevents object mutations
- `prefer-const`: Enforces the use of const declarations
- `no-let`: Disallows let declarations in favor of const

### @bunlint/functional
- `no-class`: Prevents the use of classes
- `no-this`: Prevents the use of this keyword
- `no-loops`: Encourages functional alternatives to loops
- `no-statements`: Encourages expressions over statements
- `prefer-pipe`: Encourages the use of pipe/flow compositions
- `pure-function`: Ensures functions are pure
- `no-side-effect`: Prevents side effects in functions

### @bunlint/performance
- `no-large-objects`: Warns about excessively large object literals
- `efficient-imports`: Ensures efficient import patterns
- `memo-components`: Suggests memoization for components
- `avoid-rerender`: Identifies patterns that cause unnecessary rerenders
