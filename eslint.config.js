import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import customRules from './eslint-custom-rules/index.js';

export default [
  {
    ignores: [
      // Dependencies
      'node_modules/**',
      
      // Build outputs
      'dist/**',
      'build/**',
      
      // Cache directories
      '.cache/**',
      
      // Coverage directories
      'coverage/**',
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
      'custom-rules': customRules,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      
      // Import rules
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/named': 'error',
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
      }],
      
      // Custom rules - enable only the ones that are working without issues
      'custom-rules/no-array-mutation': 'error',
      'custom-rules/no-comments': 'error',
      'custom-rules/enforce-central-utilities': 'warn',
      'custom-rules/no-class-inheritance': 'error',
      
      // Temporarily disable problematic rules
      'custom-rules/no-test-mocks': 'off',
      'custom-rules/enforce-functional-composition': 'off',
      'custom-rules/no-unused-exports': 'off',
      'custom-rules/only-test-exports': 'off',
      'custom-rules/require-test-file': 'off',
      'custom-rules/no-blank-files': 'error',
    },
  },
  {
    // Specific overrides for test files
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    rules: {
      // Disable certain rules in test files
      'custom-rules/no-comments': 'off',
    },
  },
  {
    // Specific overrides for config files
    files: ['*.config.js', '*.config.ts'],
    rules: {
      'custom-rules/no-comments': 'off',
    },
  }
]; 