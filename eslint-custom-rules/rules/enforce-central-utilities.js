/**
 * ESLint rule to enforce Pattern 1: Centralized Utilities
 * Ensures that direct imports of core modules and common libraries are avoided
 * in favor of centralized utility modules
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using centralized utility modules instead of direct imports',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowedImports: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          centralUtilityPaths: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noDirect: 'Direct use of {{type}} modules is not allowed. Use centralized utilities instead.',
    },
  },
  create: function (context) {
    const options = context.options[0] || {};
    const allowedImports = options.allowedImports || [];
    const centralUtilityPaths = options.centralUtilityPaths || [
      '../core',
      '../utils',
      '../common',
      '../shared',
    ];

    // Node.js core modules that should be used via centralized utilities
    const coreModules = [
      'fs', 'path', 'os', 'http', 'https', 'crypto',
      'stream', 'util', 'buffer', 'url', 'querystring',
      'zlib', 'child_process'
    ];

    // Common third-party modules that should be wrapped
    const thirdPartyModules = [
      'axios', 'lodash', 'moment', 'luxon', 'date-fns',
      'uuid', 'bcrypt', 'jsonwebtoken', 'validator'
    ];

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Skip allowed imports
        if (allowedImports.includes(importPath)) {
          return;
        }

        // Skip imports from central utility modules
        if (centralUtilityPaths.some(path => importPath.includes(path))) {
          return;
        }

        // Check if importing core module
        if (coreModules.includes(importPath)) {
          context.report({
            node,
            messageId: 'noDirect',
            data: {
              type: 'core',
            },
          });
          return;
        }

        // Check if importing third-party module
        if (thirdPartyModules.includes(importPath) || 
            thirdPartyModules.some(module => importPath.startsWith(module + '/'))) {
          context.report({
            node,
            messageId: 'noDirect',
            data: {
              type: 'third-party',
            },
          });
          return;
        }
      },
    };
  },
};
