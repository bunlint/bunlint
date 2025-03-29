# System Patterns: BunLint

## 1. Architecture

BunLint follows a domain-driven functional architecture organized around clear boundaries:

- **Analysis Domain**: Handles parsing source code into AST, traversing the tree, and analyzing scope and patterns.
- **Rules Domain**: Manages rule creation, composition, registration, and execution.
- **Configuration Domain**: Handles loading, validation, and resolution of user configuration.
- **Reporting Domain**: Collects, filters, groups, and formats linting results.
- **Plugin Domain**: Manages plugin loading, registration, and integration.
- **Fix Domain**: Handles creation and application of code fixes.
- **File System Domain**: Manages file discovery, reading, writing, and caching.
- **CLI Domain**: Provides command-line interface and user interaction.
- **API Domain**: Exposes programmatic interfaces for external use.

Each domain is implemented as a set of pure functions operating on immutable data structures, focusing on clear inputs and outputs rather than shared state.

## 2. Pattern

BunLint implements the following key patterns:

1. **Visitor Pattern**: The core of rule execution, allowing rules to "visit" specific AST node types without needing to traverse the entire tree.

2. **Factory Pattern**: Used for rule and plugin creation through `createRule` and `createPlugin` functions, providing a declarative API with consistent structure.

3. **Composition Pattern**: Rules can be combined through functional composition to create more complex rules.

4. **Pipeline Pattern**: Data flows through transformation pipelines from file content to AST to rule execution to reporting.

5. **Registry Pattern**: Rules and plugins are registered in central registries for discovery and lookup.

6. **Builder Pattern**: Used for constructing fixes through a fluent API.

7. **Strategy Pattern**: Different formatters and fixers implement the same interface but with different strategies.

8. **Observer Pattern**: Watch mode observes file changes and triggers appropriate linting actions.

## 3. Methodology: Test-First Driven Development (TDD)

Cycle driven by `testing-bank/`:

1. **Define Requirement** (`productContext.md`).
2. **Describe & Document Behavior:** Define test scenarios (Given-When-Then) in
   the relevant `testing-bank/*.md` file (E2E > Int > Unit).
3. **Write Failing Test:** **After scenario is documented in `.md`**, create
   `.test.ts` and write failing test code.
4. **Write Implementation:** Write minimum code (TS) to pass.
5. **Refactor:** Improve code, ensure tests pass & ESLint clean.
6. **Lint Compliance:** Use `bun lint` as the compass for every code change to ensure compliance with established lint rules.

- **Crucial Human Review:** Validate implementation and tests against
  **documented scenarios** for functional relevance, correctness, patterns.

## 4. Pattern: DRY & Centralized Utilities

- Strictly enforce DRY via custom ESLint rules
- Centralize common operations in shared utilities
- Disallow direct API use outside utilities via lint rules

## 5. Principle: Self-Documenting Code

- Code should communicate intent through:
  - Descriptive variable/function names
  - TypeScript type annotations
  - Logical code structure
  - Small, focused functions
- Avoid:
  - JSDoc comments explaining "what"
  - Redundant comments
  - Commented-out code
- Exceptions:
  - Complex business logic may use brief "why" comments
  - Public API methods require TypeDoc comments
- **Lint Guidance:** `bun eslint` serves as the compass for maintaining consistent code style and self-documenting principles.

## 6. Plugin System (Concept)

BunLint's plugin system enables extensibility through a modular approach:

- **Interface-Based Design**: Plugins implement a consistent interface for registration and rule provisioning.
- **Lifecycle Hooks**: Plugins can hook into different phases of the linting process.
- **Content Injection**: Plugins can provide rules, configurations, and transformations.
- **Context API**: Plugins have access to a controlled context for rule execution.
- **Discovery & Loading**: Automatic discovery and lazy loading of plugins from node_modules.
- **Configuration Integration**: Easy plugin configuration via the bunlint.config.ts file.
- **Plugin Command**: Streamlined plugin management via the `bunlint add` command which handles installation and configuration.

## 7. Programming Paradigm: Functional Programming & Immutable

- **Immutability:** All data structures (state, configuration, content objects)
  should be treated as immutable. Instead of modifying existing objects/arrays,
  create new ones with the updated values. This enhances predictability and
  simplifies state management, especially with Recoil.
- **Functional Approach:** Favor pure functions, composition, and declarative
  patterns over imperative code. Avoid traditional OOP classes and inheritance.
  Use plain objects and functions to represent data and behavior.
- **Higher-Order Functions:** Leverage higher-order functions (functions that
  accept other functions as arguments or return functions) for abstraction,
  composition, and code reuse (e.g., in plugin hooks, utility functions, data
  transformations).

## 8. Project Structure

bunlint/
├── src/
│   ├── analysis/                      # Code analysis domain (AST, scope, types)
│   │   ├── parser.ts                  # Source code parsing (using ts-morph)
│   │   ├── traverse.ts                # AST traversal utilities (visitors)
│   │   ├── scope.ts                   # Scope analysis (variable tracking)
│   │   ├── types.ts                   # Analysis type definitions
│   │   └── patterns.ts                # Common code pattern detection helpers
│   │
│   ├── rules/                         # Rules domain (definition, execution)
│   │   ├── engine.ts                  # Rule execution engine (runs visitors)
│   │   ├── create.ts                  # Rule creation factory (`createRule`)
│   │   ├── compose.ts                 # Rule composition utility
│   │   ├── registry.ts                # Rule registration and lookup
│   │   ├── categories.ts              # Rule categorization logic
│   │   └── types.ts                   # Rule-related types (Rule, Context, etc.)
│   │
│   ├── fixes/                         # Auto-fixing domain
│   │   ├── builder.ts                 # Fix construction utilities (Fixer API)
│   │   ├── apply.ts                   # Fix application logic (modifies source text)
│   │   ├── transforms.ts              # Common code transformations (e.g., rename)
│   │   └── types.ts                   # Fix-related types (Fix, Fixer)
│   │
│   ├── config/                        # Configuration domain
│   │   ├── load.ts                    # Config loading and validation (cosmiconfig/zod)
│   │   ├── resolve.ts                 # Config resolution (extends, plugins)
│   │   ├── defaults.ts                # Default configuration values
│   │   ├── schema.ts                  # Configuration schema (Zod)
│   │   └── types.ts                   # Config-related types
│   │
│   ├── plugins/                       # Plugin system domain
│   │   ├── loader.ts                  # Plugin loading and resolution
│   │   ├── create.ts                  # Plugin creation factory (`createPlugin`)
│   │   ├── registry.ts                # Plugin registration
│   │   └── types.ts                   # Plugin-related types (Plugin)
│   │
│   ├── bundled-plugins/               # Built-in plugins (@bunlint/*)
│   │   ├── immutable/                 # Immutability rules plugin
│   │   │   ├── index.ts               # Plugin entry
│   │   │   ├── rules/                 # Rule files
│   │   │   │  └── no-mutation.ts
│   │   │   └── configs.ts             # Plugin configs (e.g., recommended)
│   │   ├── functional/                # Functional programming rules plugin
│   │   └── performance/               # Performance rules plugin
│   │   └── naming/                    # Hypothetical naming rules plugin
│   │
│   ├── reporting/                     # Reporting domain (formatting results)
│   │   ├── formatters/                # Various output format implementations
│   │   │   ├── pretty.ts
│   │   │   ├── json.ts
│   │   │   ├── markdown.ts
│   │   │   ├── rule.ts                # Hypothetical formatter logic for rule grouping
│   │   │   └── index.ts               # Formatter factory
│   │   ├── collect.ts                 # Result collection and aggregation
│   │   ├── summarize.ts               # Report summarization logic
│   │   ├── filter.ts                  # Result filtering logic (--only-*)
│   │   ├── group.ts                   # Result grouping logic (--group)
│   │   └── types.ts                   # Reporting types (LintResult, Message)
│   │
│   ├── fs/                            # File system domain (reading, writing, watching)
│   │   ├── finder.ts                  # File discovery (glob patterns)
│   │   ├── reader.ts                  # File reading (async)
│   │   ├── writer.ts                  # File writing (async, for fixes)
│   │   ├── watcher.ts                 # File watching (--watch mode)
│   │   └── cache.ts                   # File caching logic
│   │
│   ├── cli/                           # Command Line Interface
│   │   ├── index.ts                   # CLI entry point (main execution)
│   │   ├── commands/                  # CLI command handlers (lint, fix, init)
│   │   │   ├── lint.ts
│   │   │   ├── fix.ts
│   │   │   ├── init.ts
│   │   │   └── report.ts
│   │   ├── ui/                        # Terminal UI components (ink, chalk)
│   │   │   ├── spinner.tsx
│   │   │   ├── colors.ts
│   │   │   ├── interactive.tsx        # Interactive report component
│   │   │   └── layout.ts
│   │   └── args.ts                    # CLI argument parsing (e.g., yargs)
│   │
│   ├── api/                           # Programmatic API facade
│   │   ├── lint.ts                    # Public `lint` function
│   │   ├── fix.ts                     # Public `applyFixes` function
│   │   ├── format.ts                  # Public `formatResults` function
│   │   ├── config.ts                  # Public `loadConfig` function
│   │   └── types.ts                   # Public API type definitions
│   │
│   ├── utils/                         # Cross-cutting utilities
│   │   ├── fp.ts                      # Functional programming helpers (pipe, map, etc.)
│   │   ├── perf.ts                    # Performance measurement utilities
│   │   ├── logger.ts                  # Logging utilities (debug, info, error)
│   │   ├── errors.ts                  # Custom error classes
│   │   └── ast-utils.ts               # Common AST manipulation helpers
│   │
│   ├── testing/                       # Testing utilities and framework
│   │   ├── rule-tester.ts             # Rule testing framework (`testRule`)
│   │   ├── fixtures.ts                # Test fixture management
│   │   └── snapshot.ts                # Snapshot testing utilities
│   │
│   └── index.ts                       # Public package entry point (exports API)
│
├── test/                              # Tests directory
│   ├── unit/                          # Unit tests (rules, utils, config)
│   ├── integration/                   # Integration tests (CLI, API usage)
│   ├── fixtures/                      # Test fixtures (code snippets, configs)
│   └── helpers/                       # Test helpers
│
├── examples/                          # Example projects using BunLint
│   ├── basic-ts/
│   ├── react-app/
│   └── custom-plugin-example/
│
├── docs/                              # Documentation files
│   ├── rules/                         # Auto-generated or manual rule docs
│   ├── plugins/                       # Plugin documentation
│   ├── api/                           # API reference documentation
│   └── guides/                        # Usage guides and tutorials
│
├── scripts/                           # Build, release, and maintenance scripts
│   ├── build.ts                       # Build script (e.g., using Bun's bundler)
│   ├── release.ts                     # Release script (versioning, publishing)
│   └── docs-gen.ts                    # Documentation generation script
│
├── package.json                       # Package metadata
├── tsconfig.json                      # TypeScript configuration
├── bunlint.config.ts                  # BunLint's own config for self-linting
└── README.md                          # Project overview