import { defineConfig } from './src/core';

export default defineConfig({
  extends: ['recommended'],
  plugins: [
    'security',
    'performance',
    'functional'
  ],
  rules: {
    'no-mutation': 'error',
    'no-class': 'error',
    'prefer-const': 'error',
    'security/no-eval': 'error',
    'performance/no-large-objects': 'warn',
    'functional/no-loops': 'warn',
    'functional/prefer-pipe': 'warn'
  },
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.test.{ts,tsx,js,jsx}', 'node_modules'],
});
