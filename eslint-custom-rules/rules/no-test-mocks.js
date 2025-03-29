/**
 * ESLint rule to prevent mocks in testing to encourage more stable tests
 * Following Pattern 3: Test-Driven Development
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent test mocks, spies, and stubs',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowCommentPattern: {
            type: 'string',
          },
          allowedTestHelpers: {
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
      noMocks: 'Test mocks are not allowed. Use real implementations or test fixtures instead.',
    },
  },
  create: function (context) {
    const options = context.options[0] || {};
    const allowedPatterns = options.allowedPatterns || [];
    
    // Keep track of reported nodes to avoid duplicate errors
    const reportedNodes = new Set();

    // Check if a string matches any allowed pattern
    function isAllowed(str) {
      return allowedPatterns.some(pattern => new RegExp(pattern).test(str));
    }
    
    // Check source code for exemption comment
    function isExempt() {
      try {
        // Some tests might not provide getSourceCode
        if (!context.getSourceCode) return false;
        
        const sourceCode = context.getSourceCode();
        if (!sourceCode || !sourceCode.getAllComments) return false;
        
        const comments = sourceCode.getAllComments();
        return comments.some(comment => comment.value.trim().startsWith('allow-mocks:'));
      } catch (e) {
        return false;
      }
    }
    
    // Common reporting function to avoid duplicates
    function reportIfNeeded(node) {
      // If already reported or exempt, skip
      if (reportedNodes.has(node) || isExempt()) {
        return;
      }
      
      reportedNodes.add(node);
      context.report({
        node,
        messageId: 'noMocks',
      });
    }

    return {
      // Handle Jest mocks
      "CallExpression[callee.object.name='jest'][callee.property.name='fn']"(node) {
        if (!isAllowed(node.callee.property.name)) {
          reportIfNeeded(node);
        }
      },
      
      // Handle Jest spyOn
      "CallExpression[callee.object.name='jest'][callee.property.name='spyOn']"(node) {
        if (!isAllowed(node.callee.property.name)) {
          reportIfNeeded(node);
        }
      },
      
      // Handle Jest mock
      "CallExpression[callee.object.name='jest'][callee.property.name='mock']"(node) {
        if (!isAllowed(node.callee.property.name)) {
          reportIfNeeded(node);
        }
      },
      
      // Handle Sinon stubs, spies, mocks
      "CallExpression[callee.object.name='sinon']"(node) {
        if (
          ['stub', 'spy', 'mock'].includes(node.callee.property.name) &&
          !isAllowed(node.callee.property.name)
        ) {
          reportIfNeeded(node);
        }
      },

      // Handle imports of mocking libraries
      ImportDeclaration(node) {
        const source = node.source.value;
        const mockingLibraries = [
          'sinon',
          'jest-mock',
          'testdouble',
          'mock-req-res',
          'nock',
        ];

        if (mockingLibraries.some(lib => source.includes(lib)) && !isAllowed(source)) {
          reportIfNeeded(node);
        }
      },

      // Check for jasmine spies
      "CallExpression[callee.object.name='jasmine'][callee.property.name='createSpy']"(node) {
        const sourceCode = context.getSourceCode();
        const nodeText = sourceCode.getText(node);
        
        if (!isAllowed(nodeText)) {
          reportIfNeeded(node);
        }
      },

      // Check for variable names that suggest mocks
      VariableDeclarator(node) {
        if (node.id && node.id.name) {
          const variableName = node.id.name;
          if (
            /^mock|Mock$|^spy|Spy$|^stub|Stub$|^fake|Fake$/i.test(variableName) && 
            !isAllowed(variableName)
          ) {
            reportIfNeeded(node);
          }
        }
      },
    };
  },
}; 