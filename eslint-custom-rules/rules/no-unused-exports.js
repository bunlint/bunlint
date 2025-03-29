/**
 * ESLint rule to prevent unused exports
 * This rule identifies exported items that are never imported or used elsewhere in the codebase
 *
 * Note: For a more comprehensive solution, consider using eslint-plugin-unused-imports
 * or tools like ts-prune that can analyze imports across the entire project.
 */

const path = require('path');
const fs = require('fs');

// Global store for tracking imports/exports across files
const globalTracker = {
  // Map of source module -> { exportName -> Set of importing files }
  exportUsage: new Map(),

  // Set of files that have been analyzed
  analyzedFiles: new Set(),
  
  // Cache for export usage results to avoid repeated calculations
  _unusedExportsCache: new Map(),

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

  // Record an import - optimized version with better path resolution
  recordImport(importingFile, sourceModule, importName) {
    if (!sourceModule) return; // Skip if no source module
    
    // Try to resolve the source module to an absolute path
    const resolvedSourceModule = this.resolveImportPath(importingFile, sourceModule);
    
    if (this.debug) {
      console.log(`[no-unused-exports] Recording import ${importName} from ${resolvedSourceModule} in ${importingFile}`);
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
    
    // Clear cache for this export when new imports are recorded
    this._unusedExportsCache.delete(`${resolvedSourceModule}:${importName}`);
    this._unusedExportsCache.delete(`${sourceModule}:${importName}`);
  },

  // Check if an export is used - with caching and path resolution
  isExportUsed(sourceModule, exportName) {
    const cacheKey = `${sourceModule}:${exportName}`;
    
    // Check cache first
    if (this._unusedExportsCache.has(cacheKey)) {
      return this._unusedExportsCache.get(cacheKey);
    }
    
    if (this.debug) {
      console.log(`[no-unused-exports] Checking if ${exportName} from ${sourceModule} is used`);
    }
    
    // Check if it's used with the given path
    let moduleExports = this.exportUsage.get(sourceModule);
    let importingFiles = moduleExports ? moduleExports.get(exportName) : null;
    let isUsed = importingFiles && importingFiles.size > 0;
    
    // If not used directly, also check for usage via different path formats
    if (!isUsed) {
      // Check normalized paths
      const normalizedPath = path.normalize(sourceModule);
      if (normalizedPath !== sourceModule) {
        moduleExports = this.exportUsage.get(normalizedPath);
        importingFiles = moduleExports ? moduleExports.get(exportName) : null;
        isUsed = importingFiles && importingFiles.size > 0;
      }
      
      // Check absolute paths
      if (!isUsed && !path.isAbsolute(sourceModule)) {
        const absolutePath = path.resolve(sourceModule);
        moduleExports = this.exportUsage.get(absolutePath);
        importingFiles = moduleExports ? moduleExports.get(exportName) : null;
        isUsed = importingFiles && importingFiles.size > 0;
      }
      
      // Check basename
      if (!isUsed) {
        const basename = path.basename(sourceModule);
        for (const [modulePath, exports] of this.exportUsage.entries()) {
          if (path.basename(modulePath) === basename) {
            importingFiles = exports.get(exportName);
            if (importingFiles && importingFiles.size > 0) {
              isUsed = true;
              break;
            }
          }
        }
      }
    }
    
    if (this.debug) {
      console.log(`[no-unused-exports] ${exportName} from ${sourceModule} is ${isUsed ? 'used' : 'unused'}`);
      
      // Debug all recorded imports for this file
      console.log(`[no-unused-exports] All recorded exports for ${sourceModule}:`);
      const allExports = this.exportUsage.get(sourceModule);
      if (allExports) {
        for (const [name, files] of allExports.entries()) {
          console.log(`  - ${name}: used in ${files.size} files`);
        }
      } else {
        console.log(`  No exports recorded.`);
      }
      
      // Debug all recorded imports
      console.log(`[no-unused-exports] All recorded imports:`);
      for (const [module, exports] of this.exportUsage.entries()) {
        console.log(`  ${module}:`);
        for (const [name, files] of exports.entries()) {
          console.log(`    - ${name}: used in ${files.size} files`);
        }
      }
    }
    
    this._unusedExportsCache.set(cacheKey, isUsed);
    return isUsed;
  },

  // Clear all tracked data - should be called between lint runs
  clear() {
    if (this.debug) {
      console.log(`[no-unused-exports] Clearing global tracker data`);
    }
    this.exportUsage.clear();
    this.analyzedFiles.clear();
    this._unusedExportsCache.clear();
  },
};

// Function to clear the global tracker's caches
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
      description: 'Disallow unused exports',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      unusedExport: "'{{name}}' is exported but never used",
      removeExport: 'Remove this unused export',
      addJsDoc: 'Add JSDoc comment to document why this export is needed',
      addPublicComment: 'Mark as @public API',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignorePatterns: {
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
    const ignorePatterns = options.ignorePatterns || [];
    const ignoreExports = options.ignoreExports || [];
    const includePaths = options.includePaths || [];
    const excludePaths = options.excludePaths || [];
    
    // Enable debugging for this file if needed
    const debugThisFile = process.env.DEBUG_FILE && filename.includes(process.env.DEBUG_FILE);
    
    if (debugThisFile || globalTracker.debug) {
      console.log(`[no-unused-exports] Processing file: ${filename}`);
    }
    
    // Precompile regular expressions for better performance
    const indexFileRegex = /index\.(ts|js|tsx|jsx)$/;
    const testFileRegex = /\.(test|spec)\.(ts|js|tsx|jsx)$|[/\\](test|__tests__)[/\\]/;
    const typeDefRegex = /\.d\.ts$/;
    const specialFileRegex = /(api|hook|config|constant|type|util|helper|service|store|context|provider)s?\.(ts|js|tsx|jsx)$/;
    const ignoreRegexes = ignorePatterns.map(pattern => new RegExp(pattern));
    const ignoreExportRegexes = ignoreExports.map(pattern => new RegExp(pattern));
    const includePathRegexes = includePaths.map(pattern => new RegExp(pattern));
    const excludePathRegexes = excludePaths.map(pattern => new RegExp(pattern));
    
    // Add this file to the global tracker
    globalTracker.analyzedFiles.add(filename);
    
    // Cache the result of shouldIgnoreFile for this file - compute only once
    const shouldIgnoreCurrentFile = shouldIgnoreFile();

    // Helper to check if we should ignore this file
    function shouldIgnoreFile() {
      // Skip index files which are meant to re-export
      if (indexFileRegex.test(filename)) {
        if (debugThisFile) console.log(`[no-unused-exports] Ignoring index file: ${filename}`);
        return true;
      }

      // Skip test files
      if (testFileRegex.test(filename)) {
        if (debugThisFile) console.log(`[no-unused-exports] Ignoring test file: ${filename}`);
        return true;
      }

      // Skip type definition files
      if (typeDefRegex.test(filename)) {
        if (debugThisFile) console.log(`[no-unused-exports] Ignoring type definition file: ${filename}`);
        return true;
      }

      // Check if file should be excluded
      for (const regex of excludePathRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[no-unused-exports] Excluded by pattern: ${filename}`);
          return true;
        }
      }

      // Check if file should be included regardless of special patterns
      for (const regex of includePathRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[no-unused-exports] Included by pattern: ${filename}`);
          return false;
        }
      }

      // Skip files with special patterns
      if (specialFileRegex.test(filename)) {
        if (debugThisFile) console.log(`[no-unused-exports] Ignoring special file: ${filename}`);
        return true;
      }

      // Check custom ignore patterns
      for (const regex of ignoreRegexes) {
        if (regex.test(filename)) {
          if (debugThisFile) console.log(`[no-unused-exports] Ignoring file by custom pattern: ${filename}`);
          return true;
        }
      }

      return false;
    }

    // Check if name matches React component pattern (PascalCase) - optimized
    function isReactComponent(name) {
      return name && /^[A-Z][a-zA-Z0-9]*$/.test(name);
    }

    // Check if name matches type definition patterns - optimized
    function isTypeDefinition(name) {
      if (!name) return false;
      
      // Use direct string operations for better performance
      return (
        name.endsWith('Type') ||
        name.endsWith('Props') ||
        name.endsWith('Config') ||
        name.endsWith('Options') ||
        name.endsWith('State') ||
        (name.startsWith('I') && /^I[A-Z]/.test(name))
      );
    }

    // Check if name matches common API exports & hooks - optimized
    function isCommonApiOrHook(name) {
      if (!name) return false;
      
      // Use direct string checks instead of array iteration for better performance
      const lowerName = name.toLowerCase();
      return (
        lowerName.includes('api') ||
        lowerName.includes('router') ||
        lowerName.includes('handler') ||
        lowerName.includes('middleware') ||
        lowerName.includes('controller') ||
        lowerName.includes('service') ||
        lowerName.includes('use') ||
        lowerName.includes('create') ||
        lowerName.includes('provider') ||
        lowerName.includes('context')
      );
    }

    // Check if name matches custom ignore patterns - optimized
    function matchesIgnorePattern(name) {
      if (!name) return false;
      if (name === 'default') return true;

      for (const regex of ignoreExportRegexes) {
        if (regex.test(name)) {
          return true;
        }
      }
      return false;
    }

    // Helper to check if a name should be ignored - optimized with early returns
    function shouldIgnoreName(name) {
      // Safety check - if name is undefined or null, we can't check patterns
      if (!name) {
        return true; // Ignore if no name available
      }

      // Use early returns for better performance
      if (isReactComponent(name)) return true;
      if (isTypeDefinition(name)) return true;
      
      // Check if file should be included regardless of special patterns
      const shouldInclude = includePathRegexes.some(regex => regex.test(filename));
      if (!shouldInclude && isCommonApiOrHook(name)) return true;
      
      if (matchesIgnorePattern(name)) return true;
      
      return false;
    }

    // Check for JSDoc with @public annotation
    function hasPublicAnnotation(node) {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);

      for (const comment of comments) {
        if (comment.type === 'Block' && comment.value.includes('@public')) {
          return true;
        }
      }

      return false;
    }

    // Helper function to fix named export
    function fixNamedExport(fixer, node) {
      // For named exports, we need to check if it's the only export
      const parent = node.parent;
      if (parent.specifiers.length === 1) {
        // If it's the only export, remove the entire declaration
        return fixer.remove(parent.parent);
      } else {
        // Otherwise, just remove this specifier
        const sourceCode = context.getSourceCode();
        const tokensBefore = sourceCode.getTokensBefore(node, 1);
        const tokensAfter = sourceCode.getTokensAfter(node, 1);

        // If there's a comma after, remove up to that comma
        if (tokensAfter.length && tokensAfter[0].value === ',') {
          return fixer.removeRange([node.range[0], tokensAfter[0].range[1]]);
        }

        // If there's a comma before, remove from that comma
        if (tokensBefore.length && tokensBefore[0].value === ',') {
          return fixer.removeRange([tokensBefore[0].range[0], node.range[1]]);
        }

        // Just remove the node itself
        return fixer.remove(node);
      }
    }

    // Helper function to fix variable/function/class/type export
    function fixDeclarationExport(fixer, node, parent) {
      // Remove the export keyword
      const exportToken = context.getSourceCode().getFirstToken(parent);
      return fixer.remove(exportToken);
    }

    // Helper function to add JSDoc comment
    function addJsDocComment(fixer, node, type) {
      const sourceCode = context.getSourceCode();
      const targetNode =
        type === 'named'
          ? node.parent.parent
          : type === 'default'
            ? node
            : node.parent.parent;

      const indent = sourceCode.text.slice(
        targetNode.range[0] - targetNode.loc.start.column,
        targetNode.range[0]
      );
      const jsdoc = `${indent}/**\n${indent} * @public Export used by external code\n${indent} */\n`;

      return fixer.insertTextBefore(targetNode, jsdoc);
    }

    return {
      // Track imports
      ImportDeclaration(node) {
        if (shouldIgnoreCurrentFile) return;
        
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

      // Track default exports
      ExportDefaultDeclaration(node) {
        if (shouldIgnoreCurrentFile) return;

        // For default exports, we'll use 'default' as the name
        exportedItems.set('default', {
          node,
          used: false,
          type: 'default',
          hasPublicAnnotation: hasPublicAnnotation(node),
        });
      },

      // Track named exports: export { foo, bar }
      'ExportNamedDeclaration > ExportSpecifier'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.exported.name;
        exportedItems.set(name, {
          node,
          used: false,
          type: 'named',
          hasPublicAnnotation: hasPublicAnnotation(node.parent.parent),
        });
      },

      // Track variable exports: export const foo = 1
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          used: false,
          type: 'variable',
          hasPublicAnnotation: hasPublicAnnotation(node.parent.parent),
        });
      },

      // Track function exports: export function foo() {}
      'ExportNamedDeclaration > FunctionDeclaration'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          used: false,
          type: 'function',
          hasPublicAnnotation: hasPublicAnnotation(node.parent),
        });
      },

      // Track class exports: export class Foo {}
      'ExportNamedDeclaration > ClassDeclaration'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          used: false,
          type: 'class',
          hasPublicAnnotation: hasPublicAnnotation(node.parent),
        });
      },

      // Track exports from type aliases and interfaces (TS)
      'ExportNamedDeclaration > TSTypeAliasDeclaration, ExportNamedDeclaration > TSInterfaceDeclaration'(node) {
        if (shouldIgnoreCurrentFile) return;

        const name = node.id.name;
        exportedItems.set(name, {
          node,
          used: false,
          type: 'type',
          hasPublicAnnotation: hasPublicAnnotation(node.parent),
        });
      },

      // Check for unused exports at the end
      'Program:exit'() {
        if (shouldIgnoreCurrentFile) return;

        for (const [name, info] of exportedItems.entries()) {
          // Skip checking certain exports by name pattern
          if (shouldIgnoreName(name)) {
            if (debugThisFile) {
              console.log(`[no-unused-exports] Ignoring export '${name}' in ${filename} by name pattern`);
            }
            continue;
          }

          // Skip if it has a @public annotation already
          if (info.hasPublicAnnotation) {
            if (debugThisFile) {
              console.log(`[no-unused-exports] Ignoring export '${name}' in ${filename} with @public annotation`);
            }
            continue;
          }

          // Check if this export is used in any file we've analyzed
          const isUsed = globalTracker.isExportUsed(filename, name);

          if (!isUsed) {
            if (debugThisFile) {
              console.log(`[no-unused-exports] Reporting unused export '${name}' in ${filename}`);
            }
            
            context.report({
              node: info.node,
              messageId: 'unusedExport',
              data: { name },
              suggest: [
                {
                  messageId: 'removeExport',
                  fix: (fixer) => {
                    // The fix depends on the export type
                    if (info.type === 'named') {
                      return fixNamedExport(fixer, info.node);
                    } else if (
                      info.type === 'variable' ||
                      info.type === 'function' ||
                      info.type === 'class' ||
                      info.type === 'type'
                    ) {
                      return fixDeclarationExport(
                        fixer,
                        info.node,
                        info.node.parent.parent
                      );
                    } else if (info.type === 'default') {
                      // For default exports, it's trickier - just report without fixing
                      return null;
                    }

                    return null;
                  },
                },
                {
                  messageId: 'addJsDoc',
                  fix: (fixer) => {
                    return addJsDocComment(fixer, info.node, info.type);
                  },
                },
              ],
            });
          } else if (debugThisFile) {
            console.log(`[no-unused-exports] Export '${name}' in ${filename} is used`);
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
