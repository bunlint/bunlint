# BunLint

A functional-first linting tool designed specifically for Bun JavaScript/TypeScript projects.

## Project Structure

```
src/
├── analysis/         # AST parsing, traversal, scope analysis
├── api/              # Public programmatic API
├── bundled-plugins/  # Built-in linting rule plugins
├── cli/              # Command-line interface
├── config/           # Configuration loading and resolution
├── fixes/            # Auto-fixing capabilities
├── fs/               # File system operations
├── plugins/          # Plugin system management
├── reporting/        # Issue reporting and formatting
├── rules/            # Rule engine and registration
├── test/             # Test suite
├── testing/          # Test utilities and helpers
├── utils/            # Shared utilities
├── index.ts          # Main entry point
└── types.ts          # Shared type definitions
```

## Features

- TypeScript-based configuration
- Functional programming rule enforcement
- Immutability pattern detection
- Performance optimization rules
- Plugin system for extensibility
- Beautiful CLI with helpful suggestions

## Installation

```bash
# Using bun
bun add -d bunlint

# Using npm
npm install --save-dev bunlint
```

## License

MIT
