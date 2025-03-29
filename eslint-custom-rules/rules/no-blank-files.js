/**
 * ESLint rule to prevent blank files
 * This rule checks if a file contains only whitespace or no content at all
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevents blank or empty files',
      category: 'Code Quality',
      recommended: true,
    },
    fixable: null,
    messages: {
      blankFile: 'Files must contain meaningful content, not just whitespace or comments.',
      emptyFile: 'Empty files are not allowed.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowComments: {
            type: 'boolean',
            default: false,
          },
          minContentLines: {
            type: 'integer',
            default: 1,
          },
          ignorePatterns: {
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
    const allowComments = options.allowComments || false;
    const minContentLines = options.minContentLines || 1;
    const ignorePatterns = options.ignorePatterns || [];

    // Convert string patterns to RegExp objects
    const ignoreRegexPatterns = ignorePatterns.map(pattern => new RegExp(pattern, 'i'));

    function shouldIgnoreFile(filename) {
      // Check if file should be ignored based on pattern
      return ignoreRegexPatterns.some(pattern => pattern.test(filename));
    }

    return {
      Program(node) {
        const filename = context.getFilename();
        
        // Skip file if it matches ignore patterns
        if (shouldIgnoreFile(filename)) {
          return;
        }
        
        const sourceCode = context.getSourceCode();
        const sourceText = sourceCode.getText();
        const lines = sourceCode.lines || sourceText.split('\n');
        
        // Check for completely empty file
        if (sourceText.trim() === '') {
          context.report({
            node,
            messageId: 'emptyFile',
          });
          return;
        }
        
        // Get all non-whitespace lines
        const nonWhitespaceLines = lines.filter(line => line.trim() !== '');
        
        // If not allowing comments, or we allow comments but want to check if there's more content
        if (!allowComments) {
          // Get all comments
          const comments = sourceCode.getAllComments();
          
          // If all non-whitespace lines are just comments, report an error
          let hasNonCommentContent = false;

          // Convert comments to text ranges
          const commentRanges = comments.map(comment => ({
            start: comment.range[0],
            end: comment.range[1],
            text: sourceCode.getText(comment)
          }));
          
          // Check if we have any content that isn't just comments
          const allText = sourceText.trim();
          let remainingText = allText;
          
          // Remove all comments from the text
          commentRanges.forEach(range => {
            remainingText = remainingText.replace(range.text, '');
          });
          
          // After removing comments, check if there's any meaningful content left
          hasNonCommentContent = remainingText.trim().length > 0;
          
          if (!hasNonCommentContent) {
            context.report({
              node,
              messageId: 'blankFile',
            });
            return;
          }
        }
        
        // Check if we have enough content lines
        if (nonWhitespaceLines.length < minContentLines) {
          context.report({
            node,
            messageId: 'blankFile',
          });
          return;
        }
      },
    };
  },
}; 