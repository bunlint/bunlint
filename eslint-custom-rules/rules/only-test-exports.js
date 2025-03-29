/**
 * ESLint rule to identify exports that are only used in test files
 * This helps identify code that might be test-specific and should be moved to test utilities
 */

const path = require('path');
const fs = require('fs');

// Global store for tracking imports/exports and their test status
const globalTracker = {
  // Map of source module -> { exportName -> Set of importing files }
  exportUsage: new Map(),
  
  // Map of filename -> boolean (isTestFile)
  testFiles: new Map(),
  
  // Set of files that have been analyzed
  analyzedFiles: new Set(),
  
  // Cache for test-only results to avoid repeated calculations
  _testOnlyCache: new Map(),
  
  // Debug mode
  debug: process.env.DEBUG_ESLINT_RULES === 'true',
  
  // Resolve a relative import path to an absolute path
  resolveImportPath(importingFile, importPath) {
    // If the import path is relative, resolve it relative to the importing file
    if (importPath.startsWith('.')) {
      const importingDir = path.dirname(importingFile);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const resolvedPath = path.resolve(importingDir, importPath + ext);
        // Check if the file exists with this extension
        if (fs.existsSync(resolvedPath)) {
          return resolvedPath;
        }
      }
      
      // Handle index files
      for (const ext of extensions) {
        const indexPath = path.resolve(importingDir, importPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
      
      // If we can't resolve it to a real file, just return the resolved path
      return path.resolve(importingDir, importPath);
    }
    
    // For non-relative imports, just return the import path
    return importPath;
  },

  // Record a file as a test file
  recordTestFile(filename, isTest) {
    this.testFiles.set(filename, isTest);
    
    if (this.debug) {
      console.log(`[only-test-exports] Recording ${filename} as ${isTest ? 'test' : 'non-test'} file`);
    }
  },

  // Record an import
  recordImport(importingFile, sourceModule, importName) {
    if (!sourceModule) return; // Skip if no source module
    
    // Try to resolve the source module to an absolute path
    const resolvedSourceModule = this.resolveImportPath(importingFile, sourceModule);
    
    if (this.debug) {
      console.log(`[only-test-exports] Recording import ${importName} from ${resolvedSourceModule} in ${importingFile}`);
    }
    
    // Use map lookup with get/set instead of has/get/set for better performance
    let moduleExports = this.exportUsage.get(resolvedSourceModule);
    if (!moduleExports) {
      moduleExports = new Map();
      this.exportUsage.set(resolvedSourceModule, moduleExports);
    }

    let importingFiles = moduleExports.get(importName);
    if (!importingFiles) {
      importingFiles = new Set();
      moduleExports.set(importName, importingFiles);
    }

    importingFiles.add(importingFile);
    
    // Also try with the original source module name
    if (resolvedSourceModule !== sourceModule) {
      let origModuleExports = this.exportUsage.get(sourceModule);
      if (!origModuleExports) {
        origModuleExports = new Map();
        this.exportUsage.set(sourceModule, origModuleExports);
      }

      let origImportingFiles = origModuleExports.get(importName);
      if (!origImportingFiles) {
        origImportingFiles = new Set();
        origModuleExports.set(importName, origImportingFiles);
      }

      origImportingFiles.add(importingFile);
    }
    
    // Clear cache when new imports are recorded
    this._testOnlyCache.delete(`${resolvedSourceModule}:${importName}`);
    this._testOnlyCache.delete(`${sourceModule}:${importName}`);
  },

  // Check if an export is only used in test files
  isExportOnlyUsedInTests(sourceModule, exportName) {
    const cacheKey = `${sourceModule}:${exportName}`;
    
    // Check cache first
    if (this._testOnlyCache.has(cacheKey)) {
      return this._testOnlyCache.get(cacheKey);
    }
    
    if (this.debug) {
      console.log(`[only-test-exports] Checking if ${exportName} from ${sourceModule} is only used in tests`);
    }
    
    // Try with the given path
    let found = false;
    let usedInRegularFiles = false;
    
    let checkUsage = (modulePath) => {
      const moduleExports = this.exportUsage.get(modulePath);
      if (!moduleExports) return false;
      
      const importingFiles = moduleExports.get(exportName);
      if (!importingFiles || importingFiles.size === 0) return false;
      
      found = true;
      
      // Check if any importing file is not a test file
      for (const file of importingFiles) {
        const isTestFile = this.testFiles.get(file);
        
        // If we don't know if it's a test file, assume it's not
        if (isTestFile === undefined || isTestFile === false) {
          usedInRegularFiles = true;
          
          if (this.debug) {
            console.log(`[only-test-exports] ${exportName} from ${sourceModule} is used in non-test file: ${file}`);
          }
          
          return true; // Short-circuit once we find any non-test usage
        }
      }
      
      return false;
    };
    
    // Check with the given path
    if (checkUsage(sourceModule)) {
      this._testOnlyCache.set(cacheKey, false);
      return false;
    }
    
    // Check normalized paths
    const normalizedPath = path.normalize(sourceModule);
    if (normalizedPath !== sourceModule && checkUsage(normalizedPath)) {
      this._testOnlyCache.set(cacheKey, false);
      return false;
    }
    
    // Check absolute paths
    if (!path.isAbsolute(sourceModule)) {
      const absolutePath = path.resolve(sourceModule);
      if (checkUsage(absolutePath)) {
        this._testOnlyCache.set(cacheKey, false);
        return false;
      }
    }
    
    // Check basename
    const basename = path.basename(sourceModule);
    for (const [modulePath, exports] of this.exportUsage.entries()) {
      if (path.basename(modulePath) === basename) {
        const importingFiles = exports.get(exportName);
        if (importingFiles && importingFiles.size > 0) {
          found = true;
          
          for (const file of importingFiles) {
            const isTestFile = this.testFiles.get(file);
            if (isTestFile === undefined || isTestFile === false) {
              usedInRegularFiles = true;
              
              if (this.debug) {
                console.log(`[only-test-exports] ${exportName} from ${sourceModule} is used in non-test file (basename): ${file}`);
              }
              
              break;
            }
          }
          
          if (usedInRegularFiles) {
            this._testOnlyCache.set(cacheKey, false);
            return false;
          }
        }
      }
    }
    
    // If we found importing files and none were regular files, it's used only in tests
    // If we didn't find any importing files, assume it's not used in tests
    const result = found && !usedInRegularFiles;
    
    if (this.debug) {
      if (result) {
        console.log(`[only-test-exports] ${exportName} from ${sourceModule} is only used in test files`);
      } else if (!found) {
        console.log(`[only-test-exports] ${exportName} from ${sourceModule} is not imported anywhere`);
      }
    }
    
    this._testOnlyCache.set(cacheKey, result);
    return result;
  },

  // Clear all tracked data - should be called between lint runs
  clear() {
    if (this.debug) {
      console.log(`[only-test-exports] Clearing global tracker data`);
    }
    this.exportUsage.clear();
    this.testFiles.clear();
    this.analyzedFiles.clear();
    this._testOnlyCache.clear();
  },
};

// Function to clear the global tracker
function clearCache() {
  globalTracker.clear();
}

// Function to sync this rule's tracker with a shared tracker
function syncWithSharedTracker(sharedTracker) {
  if (!sharedTracker) return;
  
  // Copy export usage data
  for (const [module, exports] of globalTracker.exportUsage.entries()) {
    let sharedExports = sharedTracker.exportUsage.get(module);
    if (!sharedExports) {
      sharedExports = new Map();
      sharedTracker.exportUsage.set(module, sharedExports);
    }
    
    for (const [name, files] of exports.entries()) {
      let sharedFiles = sharedExports.get(name);
      if (!sharedFiles) {
        sharedFiles = new Set();
        sharedExports.set(name, sharedFiles);
      }
      
      for (const file of files) {
        sharedFiles.add(file);
      }
    }
  }
  
  // Copy test files data
  for (const [file, isTest] of globalTracker.testFiles.entries()) {
    sharedTracker.testFiles.set(file, isTest);
  }
  
  // Copy analyzed files data
  for (const file of globalTracker.analyzedFiles) {
    sharedTracker.analyzedFiles.add(file);
  }
}

// Add a sync method to the tracker
globalTracker.syncWith = syncWithSharedTracker;

// Export the rule
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Identify exports that are only used in test files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      onlyTestExport: "'{{name}}' is only used in test files and should be marked with @testOnly or moved to test utilities",
      addTestOnlyJsDoc: 'Add @testOnly annotation',
    },
    schema: [
      {
        type: 'object',
        properties: {
          testPatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          ignoreExports: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          ignorePatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          includePaths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Paths to include in the analysis, even if they match special patterns'
          },
          excludePaths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Paths to exclude from the analysis'
          }
        },
        additionalProperties: false,
      },
    ],
  },
  create: function (context) {
    // We need to track all exports in the current file
    const exportedItems = new Map();
    const filename = context.getFilename();
    const options = context.options[0] || {};
    const testPatterns = options.testPatterns || [
      '\\.test\\.(ts|js|tsx|jsx)$',
      '\\.spec\\.(ts|js|tsx|jsx)$',
      '[/\\\\](test|__tests__)[/\\\\]',
      'cypress',
      'e2e',
      'test-utils',
    ];
    const ignoreExports = options.ignoreExports || [];
    const ignorePatterns = options.ignorePatterns || [];
    const includePaths = options.includePaths || [];
    const excludePaths = options.excludePaths || [];
    
    // Enable debugging for this file if needed
    const debugThisFile = process.env.DEBUG_FILE && filename.includes(process.env.DEBUG_FILE);
    
    if (debugThisFile || globalTracker.debug) {
      console.log(`[only-test-exports] Processing file: ${filename}`);
    }
    
    // Add this file to the global tracker
    globalTracker.analyzedFiles.add(filename);
    
    // Precompile regular expressions for better performance
    const testRegexes = testPatterns.map((pattern) => new RegExp(pattern));
    const ignoreExportRegexes = ignoreExports.map((pattern) => new RegExp(pattern));
    const ignoreRegexes = ignorePatterns.map((pattern) => new RegExp(pattern));
    const includePathRegexes = includePaths.map(pattern => new RegExp(pattern));
    const excludePathRegexes = excludePaths.map(pattern => new RegExp(pattern));
    
    // Special file patterns that should be excluded from analysis
    const typeDefRegex = /\.d\.ts$/;
    const indexFileRegex = /index\.(ts|js|tsx|jsx)$/;
    const apiFileRegex = /api|service|client|controller|router|handler/i;
    
    // Cache the result of shouldIgnoreFile for this file - compute only once
    const shouldIgnoreCurrentFile = shouldIgnoreFile();
    
    // Cache the result of isTestFile for this file - compute only once
    const isTestFile = isCurrentFileTestFile();

    // Record this file's test status in the global tracker
    globalTracker.recordTestFile(filename, isTestFile);

    // Helper to check if this is a test file
    function isCurrentFileTestFile() {
      for (const regex of testRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[only-test-exports] File is a test file: ${filename}`);
          return true;
        }
      }
      if (debugThisFile) console.log(`[only-test-exports] File is not a test file: ${filename}`);
      return false;
    }

    // Helper to check if we should ignore this file
    function shouldIgnoreFile() {
      // Skip type definition files
      if (typeDefRegex.test(filename)) {
        if (debugThisFile) console.log(`[only-test-exports] Ignoring type definition file: ${filename}`);
        return true;
      }

      // Skip index files which are meant to re-export
      if (indexFileRegex.test(filename)) {
        if (debugThisFile) console.log(`[only-test-exports] Ignoring index file: ${filename}`);
        return true;
      }

      // Check if file should be excluded
      for (const regex of excludePathRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[only-test-exports] Excluded by pattern: ${filename}`);
          return true;
        }
      }

      // Check if file should be included regardless of special patterns
      for (const regex of includePathRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[only-test-exports] Included by pattern: ${filename}`);
          return false;
        }
      }

      // Skip API-related files
      if (apiFileRegex.test(filename)) {
        if (debugThisFile) console.log(`[only-test-exports] Ignoring API-related file: ${filename}`);
        return true;
      }

      // Skip test files themselves
      if (isTestFile) {
        if (debugThisFile) console.log(`[only-test-exports] Ignoring test file from analysis: ${filename}`);
        return true;
      }

      // Check custom ignore patterns
      for (const regex of ignoreRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[only-test-exports] Ignoring file by custom pattern: ${filename}`);
          return true;
        }
      }

      return false;
    }

    // Check if a name matches any of the ignore patterns
    function shouldIgnoreName(name) {
      // Some special exports are always ignored (default export, React components)
      if (
        !name ||
        name === 'default' ||
        // React components (PascalCase)
        /^[A-Z][a-zA-Z0-9]*$/.test(name) ||
        // TypeScript types
        name.endsWith('Type') ||
        name.endsWith('Props') ||
        name.endsWith('Config')
      ) {
        return true;
      }

      // Check custom ignore patterns
      for (const regex of ignoreExportRegexes) {
        if (regex.test(name)) {
          return true;
        }
      }

      return false;
    }

    // Helper to add JSDoc comment
    function addTestOnlyJsDoc(fixer, node) {
      const sourceCode = context.getSourceCode();
      const targetNode = node.parent;
      const indent = sourceCode.text.slice(
        targetNode.range[0] - targetNode.loc.start.column,
        targetNode.range[0]
      );
      const jsdoc = `${indent}/**\n${indent} * @testOnly\n${indent} */\n`;
      return fixer.insertTextBefore(targetNode, jsdoc);
    }

    // Check for @testOnly annotation in JSDoc
    function hasTestOnlyAnnotation(node) {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);

      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.includes('@testOnly')) {
          return true;
        }
      }

      return false;
    }

    return {
      // Track imports
      ImportDeclaration(node) {
        const sourceValue = node.source.value;

        // We don't track absolute imports (e.g., 'react', 'lodash')
        if (!sourceValue.startsWith('.') && !sourceValue.startsWith('/')) {
          return;
        }

        // Record each imported name from this source
        for (const specifier of node.specifiers) {
          let importedName;

          if (specifier.type === 'ImportDefaultSpecifier') {
            importedName = 'default';
          } else if (specifier.type === 'ImportSpecifier') {
            importedName = specifier.imported.name;
          } else {
            continue; // Skip namespace imports
          }

          // Record this import in the global tracker
          globalTracker.recordImport(filename, sourceValue, importedName);
        }
      },

      // Track variable exports
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          hasTestOnlyAnnotation: hasTestOnlyAnnotation(node.parent.parent),
        });
      },

      // Track function exports
      'ExportNamedDeclaration > FunctionDeclaration'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          hasTestOnlyAnnotation: hasTestOnlyAnnotation(node.parent),
        });
      },

      // Track class exports
      'ExportNamedDeclaration > ClassDeclaration'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          hasTestOnlyAnnotation: hasTestOnlyAnnotation(node.parent),
        });
      },

      // Track named exports
      'ExportNamedDeclaration > ExportSpecifier'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.exported.name;
        exportedItems.set(name, {
          node,
          hasTestOnlyAnnotation: hasTestOnlyAnnotation(node.parent.parent),
        });
      },

      // Check for test-only exports at the end
      'Program:exit'() {
        if (shouldIgnoreCurrentFile) return;

        for (const [name, info] of exportedItems.entries()) {
          // Skip checking exports by name pattern or annotations
          if (shouldIgnoreName(name) || info.hasTestOnlyAnnotation) {
            if (debugThisFile) {
              console.log(`[only-test-exports] Ignoring export '${name}' in ${filename} by pattern or annotation`);
            }
            continue;
          }

          // Check if this export is only used in test files
          const isOnlyTestExport = globalTracker.isExportOnlyUsedInTests(filename, name);

          if (isOnlyTestExport) {
            if (debugThisFile) {
              console.log(`[only-test-exports] Reporting test-only export '${name}' in ${filename}`);
            }
            
            context.report({
              node: info.node,
              messageId: 'onlyTestExport',
              data: { name },
              suggest: [
                {
                  messageId: 'addTestOnlyJsDoc',
                  fix: (fixer) => addTestOnlyJsDoc(fixer, info.node),
                },
              ],
            });
          }
        }
      },
    };
  },
  clearCache,
  // Expose the tracker for testing purposes
  _tracker: globalTracker,
  // Expose the sync function for external use
  syncWithSharedTracker
};

// Clear the tracker when a new linting run starts
globalTracker.clear();
