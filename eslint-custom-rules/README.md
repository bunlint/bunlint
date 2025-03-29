# ESLint Custom Rules

This directory contains custom ESLint rules developed for the Bunpress project to enforce functional programming patterns and best practices.

## Available Rules

| Rule | Description | Status |
|------|-------------|--------|
| `no-array-mutation` | Prevents mutation of arrays using methods like push, pop, splice | ✅ Ready |
| `no-comments` | Prevents use of comments in production code | ✅ Ready |
| `enforce-central-utilities` | Enforces use of utility functions from central utilities | ✅ Ready |
| `no-class-inheritance` | Prevents class inheritance | ✅ Ready |
| `no-test-mocks` | Restricts use of test mocks outside of test files | 🟡 Partial |
| `enforce-functional-composition` | Enforces functional composition patterns | 🟡 Partial |
| `no-unused-exports` | Prevents unused exports | ✅ Optimized |
| `only-test-exports` | Ensures test files only export test functions | ✅ Optimized |
| `require-test-file` | Ensures components have corresponding test files | ✅ Optimized |
| `no-blank-files` | Prevents empty or blank files with only whitespace or comments | ✅ Ready |

## Installation

```bash
npm install --save-dev eslint
```

Configure ESLint to use these custom rules in your `.eslintrc.js`:

```javascript
module.exports = {
  // ...other config
  plugins: [
    // ...other plugins
    'custom-rules',
  ],
  rules: {
    // ...other rules
    'custom-rules/no-array-mutation': 'error',
    'custom-rules/no-comments': 'error',
    // add other rules as needed
  }
};
```

## Performance Optimizations

Several rules have been optimized for better performance:

1. **Caching** - Implemented caching for expensive operations like file system access and pattern matching
2. **Precompiled RegExp** - Regular expressions are precompiled once instead of being created repeatedly
3. **Early Returns** - Added early returns to avoid unnecessary computation
4. **Efficient Data Structures** - Optimized data structure usage and lookup operations
5. **Memory Management** - Added cache clearing between ESLint runs to prevent memory leaks

### Testing Performance

To test the performance of the optimized rules:

```bash
# Run the performance test
node eslint-custom-rules/test-performance.js

# Or with executable permission
./eslint-custom-rules/test-performance.js
```

This will measure execution time for individual rules and overall linting performance.

## Development

### Directory Structure

```
eslint-custom-rules/
├── index.js                # Entry point that exposes all rules
├── rules/                  # Individual rule implementations
│   ├── no-array-mutation.js
│   ├── no-comments.js
│   └── ...
├── tests/                  # Tests for the rules
│   ├── no-array-mutation.test.js
│   ├── no-comments.test.js
│   ├── performance-test.js # Performance testing script
│   ├── STATUS.md           # Status of rule tests
│   ├── TESTING.md          # Testing guide
│   └── ...
├── test-performance.js     # Script to run performance tests
├── GUIDE.md                # Development guide
└── README.md               # This file
```

### Documentation

- [GUIDE.md](./GUIDE.md) - Detailed guide on custom rule development
- [tests/TESTING.md](./tests/TESTING.md) - Guide for testing ESLint rules
- [tests/STATUS.md](./tests/STATUS.md) - Current status of test implementation

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific rule
npm test -- -t "no-array-mutation"

# Run tests with coverage
npm test -- --coverage
```

## Best Practices

1. **Use messageIds** instead of hard-coded error messages
2. **Test thoroughly** with valid and invalid cases
3. **Document rules** with examples and explanations
4. **Provide suggestions** when possible to help developers fix issues
5. **Keep rules focused** on a single concern
6. **Optimize performance** for rules that analyze many files or perform complex operations
7. **Use caching** for expensive operations
8. **Clear caches** between runs to prevent memory leaks

## Contributing

1. Create a new rule file in the `rules/` directory
2. Create corresponding test file in the `tests/` directory
3. Add the rule to `index.js`
4. Document the rule in this README
5. Update STATUS.md with the status of your rule
6. Consider performance implications for complex rules

## License

MIT
