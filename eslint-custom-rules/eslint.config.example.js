// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import functionalPlugin from 'eslint-plugin-functional';
import importPlugin from 'eslint-plugin-import';
// import jsdocPlugin from 'eslint-plugin-jsdoc'; // Removed jsdoc plugin
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

// Local custom plugin imports would be replaced with npm package in production
import quantumPatternsPlugin from './eslint-custom-rules/index.js';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Base configuration applied to all files
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
      functional: functionalPlugin,
      import: importPlugin,
      // jsdoc: jsdocPlugin, // Removed jsdoc plugin
      'quantum-patterns': quantumPatternsPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      // General code quality rules
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow', // Allow for unused parameters
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-restricted-types': ['error', {
        types: {
          'unknown': {
            message: 'Use a more specific type instead of unknown',
            fixWith: 'never'
          }
        }
      }],

      // Pattern 3: Test-Driven Development (TDD)
      'quantum-patterns/no-test-mocks': 'off', // Off by default, enabled only in test files

      // Pattern 4: DRY & Centralized Utilities
      'quantum-patterns/enforce-central-utilities': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['fs', 'fs/*', 'path', 'path/*'],
              message:
                'Import fs and path utilities from src/core/utils instead',
            },
            {
              group: ['marked', 'marked/*'],
              message: 'Import markdown utilities from src/core/utils instead',
            },
            {
              group: ['js-yaml', 'yaml', 'yaml/*'],
              message: 'Import YAML utilities from src/core/utils instead',
            },
          ],
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Pattern 5: Self-Documenting Code
      'quantum-patterns/no-comments': ['warn', {
        allowedPatterns: [
          "^why:",
          "^@(public|private|protected|internal)"
        ]
      }],
      'max-lines-per-function': [
        'warn',
        { max: 550, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['warn', 3],
      complexity: ['warn', 10],
      'no-warning-comments': [
        'warn',
        { terms: ['todo', 'fixme'], location: 'anywhere' },
      ],
      'no-inline-comments': ['warn', { ignorePattern: '^\\s*why:' }],
      'spaced-comment': ['error', 'always'],
      // 'jsdoc/require-description': ['warn', { descriptionStyle: 'tag' }], // Removed jsdoc rule
      'id-length': [
        'warn',
        { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z', '_', 'fs', 'id'] },
      ],

      // Pattern 7: Functional & Immutable Programming
      'quantum-patterns/no-array-mutation': 'error',
      'quantum-patterns/no-class-inheritance': 'error',
      'quantum-patterns/enforce-functional-composition': ['warn', { maxNestingLevel: 3 }],
      'functional/no-let': 'warn',
      'functional/immutable-data': 'error',
      'functional/no-this-expressions': 'error',
      'functional/no-classes': 'error',
      'functional/prefer-readonly-type': 'warn',
      'no-param-reassign': 'error',
      'no-var': 'error',
      'prefer-const': 'error',

      // Code Quality: Prevent Unused Exports
      'quantum-patterns/no-unused-exports': ['warn', {
        ignorePatterns: [
          // Ignore file patterns commonly used as API endpoints
          'api\\/(.*)\\.ts$',
          // Ignore files that are likely to be imported dynamically
          '(.*)\\.component\\.tsx$',
          // Ignore entry point files
          'src\\/index\\.ts$',
          'src\\/main\\.ts$',
        ],
        includePaths: [
          // Include utility files in analysis
          'src\\/utils\\/(.*)\\.ts$'
        ]
      }],

      // Code Quality: Identify Exports Only Used in Tests
      'quantum-patterns/only-test-exports': ['warn', {
        testPatterns: [
          '\\.test\\.(ts|js|tsx|jsx)$',
          '\\.spec\\.(ts|js|tsx|jsx)$',
          '[/\\\\](test|__tests__)[/\\\\]',
          'cypress',
          'e2e',
          'test-utils',
        ],
        ignoreExports: [
          '^test',
          'Mock$',
          'Fixture$',
          'Stub$',
          'Fake',
        ],
        ignorePatterns: [
          'fixtures',
          'mocks',
          'test-helpers',
        ],
        includePaths: [
          // Include utility files in analysis
          'src\\/utils\\/(.*)\\.ts$'
        ]
      }],

      // Testing Coverage: Require test files for source files
      'quantum-patterns/require-test-file': ['warn', {
        testFilePatterns: [
          '**/__tests__/{{name}}.test.ts',
          '**/{{dir}}/__tests__/{{name}}.test.ts',
          '**/{{name}}.test.ts'
        ],
        ignorePatterns: [
          '**/*.d.ts',
          '**/types/**',
          '**/*.type.ts',
          '**/*.config.ts',
          '**/*.test.ts',
          '**/*.tsx',
          '**/*.jsx',
          '**/*.js',
          '**/node_modules/**',
          '**/eslint-custom-rules/**',
          '**/dist/**',
          '**/build/**',
        ]
      }],

      // Prevent Blank Files
      'quantum-patterns/no-blank-files': ['error', {
        allowComments: false,
        minContentLines: 1,
        ignorePatterns: [
          '\\.gitkeep$',
          '\\.gitignore$',
          '\\.env$',
          '\\.env\\.example$'
        ]
      }],
    },
  },

  // TypeScript files - enforce no semicolons
  {
    files: ['**/*.ts'],
    rules: {
      'semi': ['error', 'never'],
      'no-extra-semi': 'error',
      'prettier/prettier': 'off', // Disable prettier for TypeScript files to avoid conflicts
    },
  },

  // TSX files - also disable prettier
  {
    files: ['**/*.tsx'],
    rules: {
      'prettier/prettier': 'off', // Disable prettier for TSX files as well
    },
  },

  // Test, Cypress and Config files - allow semicolons
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/test/**/*.ts',
      '**/cypress/**/*.ts',
      '**/cypress.config.ts',
      '**/*.cy.ts',
      '**/setup.ts',
      '**/*.config.ts'
    ],
    rules: {
      'semi': 'off',
      'no-extra-semi': 'off',
    },
  },

  // Debug specific problematic files
  {
    files: ['**/path-utils.ts'],
    rules: {
      'quantum-patterns/no-comments': ['error', {
        allowedPatterns: []  // No comments allowed in this file at all
      }],
    },
  },

  // Utility file specific rules
  {
    files: ['**/src/utils/**/*.ts', '**/src/utils/**/*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'functional/prefer-readonly-type': 'off',
      'functional/no-let': 'warn',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'quantum-patterns/no-comments': 'error', // Strict no comments for utils
    },
  },

  // Test file specific rules
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**', '**/__tests__/**'],
    rules: {
      'max-lines-per-function': 'off',
      'no-console': 'off',
      'functional/immutable-data': 'off',
      'functional/no-let': 'off',
      'quantum-patterns/enforce-central-utilities': 'off',
      'quantum-patterns/no-comments': 'off', // Allow comments in test files
      'quantum-patterns/enforce-functional-composition': 'off',
      'quantum-patterns/no-test-mocks': ['error', {
        allowedTestHelpers: [
          // No exceptions by default, but you can add allowed patterns here
          // e.g., "^createFixture", "TestDouble$"
        ]
      }],
      'no-restricted-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow', // More relaxed for test files
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      'unused-imports/no-unused-vars': 'warn',
      complexity: ['warn', 15],
      'max-depth': ['warn', 5],
      'quantum-patterns/only-test-exports': 'off',
      'quantum-patterns/require-test-file': 'off', // Disable for test files
    },
  },

  // Test utilities - relaxed rules
  {
    files: ['**/test/utils/**', '**/test-utils/**', '**/testing/**'],
    rules: {
      // 'jsdoc/require-description': 'off', // Removed jsdoc rule
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow', // More relaxed for test utils
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      'unused-imports/no-unused-vars': 'off',
      'quantum-patterns/only-test-exports': 'off', // Disable for test utilities
      'quantum-patterns/no-test-mocks': 'warn', // Downgrade to warning for test utilities
    },
  },

  // Core components - relaxed rules
  {
    files: ['**/src/core/**/*.ts', '**/src/core/**/*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'quantum-patterns/enforce-central-utilities': 'off',
      'functional/immutable-data': 'warn',
      'functional/no-let': 'warn',
      'functional/prefer-readonly-type': 'warn',
      'complexity': ['warn', 15],
      'max-depth': ['warn', 5],
    },
  },

  // Utils directory rules (for direct implementation of utils)
  {
    files: ['**/src/utils/**/*.ts', '**/src/utils/**/*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'functional/prefer-readonly-type': 'off',
      'functional/no-let': 'warn',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'quantum-patterns/no-comments': 'error',
    },
  },

  // Utility file specific rules
  {
    files: ['**/src/core/utils/**/*.ts'],
    rules: {
      'no-console': 'off',
      'quantum-patterns/enforce-central-utilities': 'off',
    },
  },

  // ESLint custom rules - relaxed rules
  {
    files: ['**/eslint-custom-rules/**'],
    rules: {
      'max-lines-per-function': 'off',
      'functional/immutable-data': 'off',
      'functional/no-let': 'off',
      'functional/no-this-expressions': 'off',
      'functional/no-classes': 'off',
      'no-undef': 'off',
      'quantum-patterns/enforce-central-utilities': 'off',
      'quantum-patterns/no-array-mutation': 'off',
      'quantum-patterns/no-comments': 'off',
      'quantum-patterns/no-class-inheritance': 'off',
      'quantum-patterns/enforce-functional-composition': 'off',
      'quantum-patterns/no-test-mocks': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
      'no-inline-comments': 'off',
      'quantum-patterns/only-test-exports': 'off', // Disable for ESLint rule files
      'quantum-patterns/no-unused-exports': 'off',
      'quantum-patterns/require-test-file': 'off', // Disable for ESLint rule files
    },
  },

  // Example files - relaxed rules
  {
    files: ['**/examples/**'],
    rules: {
      'quantum-patterns/enforce-central-utilities': 'off',
      'quantum-patterns/no-array-mutation': 'off',
      'functional/immutable-data': 'off',
      'no-console': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      'quantum-patterns/only-test-exports': 'off', // Disable for examples
      'quantum-patterns/require-test-file': 'off', // Disable for examples
    },
  },

  // Config files - relaxed rules
  {
    files: ['**/*.config.js', '**/cypress.config.ts', '**/*.config.ts'],
    rules: {
      'quantum-patterns/enforce-central-utilities': 'off',
      'no-restricted-imports': 'off',
      'quantum-patterns/no-comments': 'off', // Allow comments in config files
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      'id-length': ['warn', { min: 1 }],
      'quantum-patterns/require-test-file': 'off', // Disable for config files
    },
  },

  // Files to ignore
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'eslint-custom-rules/**',
      'eslint.config.js',
      'prettier.config.js',
      '.prettierrc.cjs',
      'components.json',
      'tailwind.config.js',
      'postcss.config.js',
      'vitest.config.ts',
    ],
  },

  // [5] Utils specific rules
  {
    files: ['**/src/utils/**/*.{js,ts,jsx,tsx}'],
    rules: {
      // // Allow importing directly from node or other modules in utils
      // 'no-restricted-imports': 'off',
      // Allow mutable types in utilities when necessary
      // 'functional/prefer-readonly-type': 'off',
      // 'functional/immutable-data': 'warn',
      // 'functional/no-let': 'warn',
      // Allow necessary console methods
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      // Increase max complexity for utility functions
      complexity: ['warn', 15],
      'max-depth': ['warn', 5],
    },
  },

  // [6] Special case for logger file to allow all console methods
  {
    files: ['**/src/utils/logger.ts'],
    rules: {
      'no-console': 'off', // Allow all console methods in logger
    },
  },

  // [8] UI components rules
  {
    files: ['**/src/components/**/*.{js,ts,jsx,tsx}'],
    rules: {
      // React components often have implicit returns
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow JSX quoted props for readability
      'prettier/prettier': 'warn',
    },
  },
  // [9] ESLint custom rules
  {
    files: ['**/eslint-custom-rules/**/*.{js,ts}'],
    rules: {
      // Allow require imports in ESLint rules
      '@typescript-eslint/no-require-imports': 'off',
      // These are JavaScript files, so turn off TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Turn off functional programming rules for ESLint rules
      'functional/no-this-expressions': 'off',
      'functional/no-classes': 'off',
      'functional/immutable-data': 'off',
      'quantum-patterns/no-class-inheritance': 'off',
    },
  },

  // API files - relax unused exports rule for backend endpoints
  {
    files: ['**/api/**/*.ts', '**/server/**/*.ts', '**/routes/**/*.ts', '**/controllers/**/*.ts'],
    rules: {
      'quantum-patterns/no-unused-exports': 'off',
    },
  },

  // Component files - relax unused exports rule
  {
    files: ['**/components/**/*.tsx', '**/components/**/*.jsx'],
    rules: {
      'quantum-patterns/no-unused-exports': 'off',
    },
  },

  // Hook files - allow exports without usage checks
  {
    files: ['**/hooks/**/*.ts', '**/*.hook.ts'],
    rules: {
      'quantum-patterns/no-unused-exports': 'off',
    },
  },

  // Type definition files - allow unused types
  {
    files: ['**/*.types.ts', '**/types/**/*.ts', '**/*.d.ts'],
    rules: {
      'quantum-patterns/no-unused-exports': 'off',
    },
  },

];
