/**
 * ESLint rule to enforce Pattern 5: Self-Documenting Code by prohibiting all comments
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforces Pattern 5 by disallowing all comments except specially approved ones',
      category: 'Self-Documenting Code',
      recommended: true,
    },
    fixable: null,
    hasSuggestions: true,
    messages: {
      noComments:
        'Comments are not allowed (Pattern 5: Self-Documenting Code). Use self-documenting code instead.',
      debugInfo: 'Debug info for comment: {{text}}',
      suggestRemove: 'Remove this comment',
    },
    schema: [
      {
        type: 'object',
        properties: {
          debug: {
            type: 'boolean',
            default: false,
          },
          allowedPatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: function (context) {
    const options = context.options[0] || {};
    const debug = options.debug || false;
    const allowedPatterns = options.allowedPatterns || [];

    // Convert string patterns to RegExp objects
    const allowedRegexPatterns = allowedPatterns.map(pattern => new RegExp(pattern, 'i'));

    // Default allowed patterns that should always be permitted
    const DEFAULT_ALLOWED_PATTERNS = [
      /^why:/i,         // Standard why comments
      /^@/i,            // Annotations like @public, @param, etc.
      /^\s*eslint-/i,   // ESLint directives
      /^\s*global /i,   // Global declarations
      /^\s*prettier-/i, // Prettier directives
      /TODO:/i,         // TODOs - though these should be tracked in issue tracker
      /FIXME:/i,        // Critical issues that need attention
      /HACK:/i,         // Acknowledge dirty solutions that need revisiting
      /^\s*Copyright/i, // Copyright notices
      /^\s*License/i    // License information
    ];

    // Check if a comment is allowed
    function isAllowedComment(comment) {
      const text = comment.value.trim();

      // Skip JSDoc comments
      if (comment.type === 'Block' && comment.value.startsWith('*')) {
        return true;
      }

      if (debug) {
        console.log(`Examining comment: "${text}"`);
        console.log(`  Line: ${comment.loc.start.line}, Column: ${comment.loc.start.column}`);
        console.log(`  Comment type: ${comment.type}`);
      }

      // Check default allowed patterns
      for (const pattern of DEFAULT_ALLOWED_PATTERNS) {
        if (pattern.test(text)) {
          if (debug) console.log(`  Allowed by default pattern: ${pattern}`);
          return true;
        }
      }

      // Check user-configured allowed patterns
      for (const pattern of allowedRegexPatterns) {
        if (pattern.test(text)) {
          if (debug) console.log(`  Allowed by user pattern: ${pattern}`);
          return true;
        }
      }

      if (debug) console.log(`  Comment not allowed: "${text}"`);
      return false;
    }

    return {
      Program() {
        const filename = context.getFilename();
        const sourceCode = context.getSourceCode();
        
        if (debug) {
          console.log(`Checking file: ${filename}`);
        }

        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (!isAllowedComment(comment)) {
            context.report({
              loc: comment.loc,
              messageId: 'noComments',
              suggest: [
                {
                  messageId: 'suggestRemove',
                  fix(fixer) {
                    return fixer.remove(comment);
                  },
                },
              ]
            });
          }
        }
      },
    };
  },
};
