# Active Context: BunLint

## Current Focus

We are in the **foundation phase** of building BunLint, focusing on establishing the core architecture and implementing the fundamental components needed for a minimal viable product. 

### Immediate Priorities

1. **Core Type Definitions**: Designing and implementing essential TypeScript interfaces and types that will serve as the foundation for the entire system, including:
   - Rule interface and context
   - AST node types and visitor patterns
   - Configuration schema
   - Reporting structures

2. **Configuration System**: Building a robust configuration system using TypeScript and Zod:
   - Configuration loading from `bunlint.config.ts`
   - Schema validation
   - Default values
   - Configuration resolution (extends, overrides)

3. **AST Parsing & Traversal**: Setting up the code analysis infrastructure:
   - Integrating ts-morph for TypeScript parsing
   - Implementing efficient AST traversal
   - Building visitor pattern implementation
   - Creating a simple scope analysis system

4. **Rule Engine**: Developing the core rule execution system:
   - Rule registration mechanism
   - Rule execution flow
   - Context creation and management
   - Simple issue reporting

## Key Features In Development

### CLI Interface

Building a beautiful and intuitive CLI with the following commands:
- `lint`: Lint files for problems
- `fix`: Automatically fix problems
- `init`: Create a new configuration
- `add`: Add and configure a plugin
- `watch`: Watch files and lint on changes
- `doctor`: Diagnose and fix setup issues
- `report`: Generate comprehensive reports

### Reporting System

Implementing a flexible reporting system with:
- **Multiple formats**: pretty, json, markdown, html, compact
- **Grouping options**: 
  - Single-level: file, category, severity, rule, fixability
  - Hierarchical: file+rule, file+severity, category+rule, etc.
- **Filtering capabilities**: by category, path, rule, or severity
- **Visual formatting**: Using symbols and colors for clarity

### Plugin Management

Creating a streamlined plugin system:
- Automatic plugin discovery
- `bunlint add` command for plugin installation and config updates
- Easy plugin configuration via TypeScript

## Testing Focus

Following our TDD methodology, we are focusing on:

1. **Unit Tests** for core utilities:
   - Configuration loading and validation
   - AST traversal utilities
   - Rule creation factory
   - Reporting formatters

2. **Integration Tests** for key workflows:
   - Configuration loading to rule execution pipeline
   - File parsing to AST traversal

## Next Steps

After completing the current focus areas, we will move to:

1. **Implement Basic Rule Sets**:
   - Start with the immutability plugin (`no-array-mutation`, `no-object-mutation`)
   - Develop the functional plugin (`no-class`, `no-this`)
   - Create the performance plugin (`no-large-objects`)

2. **Basic CLI Interface**:
   - Implement the `lint` command
   - Create a simple pretty formatter
   - Set up file discovery and processing

3. **Simple Reporting System**:
   - Implement issue collection
   - Create basic output formatting
   - Add issue filtering and grouping

## Challenges & Decisions

1. **AST Representation**: Deciding on the best approach for AST manipulation and transformation:
   - Direct use of ts-morph API vs. creating abstractions
   - Handling of ESTree vs. TypeScript AST differences
   - Balancing performance with ease of use

2. **Rule API Design**: Creating a developer-friendly yet powerful API for rule creation:
   - Finding the right balance between flexibility and type safety
   - Making rule creation intuitive yet powerful

3. **Performance Focus**: Ensuring performance remains a priority from the start:
   - Efficient file reading and caching
   - AST reuse across rules
   - Parallel processing strategies
