/**
 * @fileoverview ESLint custom rules for our project
 * @author Your Name
 */

"use strict";

// Create a shared tracker for all rules
const path = require('path');
const fs = require('fs');

// Shared tracker for imports and exports across rules
const sharedTracker = {
  // Map of source module -> { exportName -> Set of importing files }
  exportUsage: new Map(),
  
  // Map of filename -> boolean (isTestFile)
  testFiles: new Map(),
  
  // Set of files that have been analyzed
  analyzedFiles: new Set(),
  
  // Cache for results to avoid repeated calculations
  _usageCache: new Map(),
  
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
      console.log(`[shared-tracker] Recording ${filename} as ${isTest ? 'test' : 'non-test'} file`);
    }
  },
  
  // Record an import
  recordImport(importingFile, sourceModule, importName) {
    if (!sourceModule) return; // Skip if no source module
    
    // Try to resolve the source module to an absolute path
    const resolvedSourceModule = this.resolveImportPath(importingFile, sourceModule);
    
    if (this.debug) {
      console.log(`[shared-tracker] Recording import ${importName} from ${resolvedSourceModule} in ${importingFile}`);
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
    this._usageCache.clear();
  },
  
  // Check if an export is used (by any file)
  isExportUsed(sourceModule, exportName) {
    const cacheKey = `used:${sourceModule}:${exportName}`;
    
    // Check cache first
    if (this._usageCache.has(cacheKey)) {
      return this._usageCache.get(cacheKey);
    }
    
    if (this.debug) {
      console.log(`[shared-tracker] Checking if ${exportName} from ${sourceModule} is used`);
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
      console.log(`[shared-tracker] ${exportName} from ${sourceModule} is ${isUsed ? 'used' : 'unused'}`);
    }
    
    this._usageCache.set(cacheKey, isUsed);
    return isUsed;
  },
  
  // Check if an export is only used in test files
  isExportOnlyUsedInTests(sourceModule, exportName) {
    const cacheKey = `testonly:${sourceModule}:${exportName}`;
    
    // Check cache first
    if (this._usageCache.has(cacheKey)) {
      return this._usageCache.get(cacheKey);
    }
    
    if (this.debug) {
      console.log(`[shared-tracker] Checking if ${exportName} from ${sourceModule} is only used in tests`);
    }
    
    // First check if it's used at all
    if (!this.isExportUsed(sourceModule, exportName)) {
      this._usageCache.set(cacheKey, false);
      return false;
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
            console.log(`[shared-tracker] ${exportName} from ${sourceModule} is used in non-test file: ${file}`);
          }
          
          return true; // Short-circuit once we find any non-test usage
        }
      }
      
      return false;
    };
    
    // Check with the given path
    if (checkUsage(sourceModule)) {
      this._usageCache.set(cacheKey, false);
      return false;
    }
    
    // Check normalized paths
    const normalizedPath = path.normalize(sourceModule);
    if (normalizedPath !== sourceModule && checkUsage(normalizedPath)) {
      this._usageCache.set(cacheKey, false);
      return false;
    }
    
    // Check absolute paths
    if (!path.isAbsolute(sourceModule)) {
      const absolutePath = path.resolve(sourceModule);
      if (checkUsage(absolutePath)) {
        this._usageCache.set(cacheKey, false);
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
                console.log(`[shared-tracker] ${exportName} from ${sourceModule} is used in non-test file (basename): ${file}`);
              }
              
              break;
            }
          }
          
          if (usedInRegularFiles) {
            this._usageCache.set(cacheKey, false);
            return false;
          }
        }
      }
    }
    
    // If we found importing files and none were regular files, it's used only in tests
    const result = found && !usedInRegularFiles;
    
    if (this.debug) {
      if (result) {
        console.log(`[shared-tracker] ${exportName} from ${sourceModule} is only used in test files`);
      }
    }
    
    this._usageCache.set(cacheKey, result);
    return result;
  },
  
  // Clear all tracked data - should be called between lint runs
  clear() {
    if (this.debug) {
      console.log(`[shared-tracker] Clearing tracker data`);
    }
    this.exportUsage.clear();
    this.testFiles.clear();
    this.analyzedFiles.clear();
    this._usageCache.clear();
  }
};

// Rules
const noArrayMutation = require('./rules/no-array-mutation');
const noComments = require('./rules/no-comments');
const enforceCentralUtilities = require('./rules/enforce-central-utilities');
const noClassInheritance = require('./rules/no-class-inheritance');
const noUnusedExports = require('./rules/no-unused-exports');
const onlyTestExports = require('./rules/only-test-exports');
const requireTestFile = require('./rules/require-test-file');
const enforceFunctionalComposition = require('./rules/enforce-functional-composition');
const noTestMocks = require('./rules/no-test-mocks');
const noBlankFiles = require('./rules/no-blank-files');

// Replace the trackers in each rule with the shared tracker
if (noUnusedExports._tracker) {
  noUnusedExports._tracker = sharedTracker;
}

if (onlyTestExports._tracker) {
  onlyTestExports._tracker = sharedTracker;
}

// Enable debug mode if the environment variable is set
if (process.env.DEBUG_ESLINT_RULES === 'true') {
  console.log('DEBUG_ESLINT_RULES: Enabled debugging for ESLint custom rules');
}

// Cleanup function to clear caches between ESLint runs
function clearCaches() {
  // Check if the rules have a globalCache or globalTracker that needs clearing
  if (onlyTestExports.clearCache) onlyTestExports.clearCache();
  if (requireTestFile.clearCache) requireTestFile.clearCache();
  if (noUnusedExports.clearCache) noUnusedExports.clearCache();
  
  // For rules that don't expose a clear method, we can clear their caches
  // through the global objects if they exist
  const cacheObjects = [
    global.testFilesCache,
    global.testDirsCache,
    global.globalTracker,
    global.globalCache
  ];
  
  cacheObjects.forEach(cache => {
    if (cache && typeof cache.clear === 'function') {
      cache.clear();
    }
  });
}

// Function to sync all rule trackers with the shared tracker
function syncAllTrackers() {
  if (process.env.DEBUG_ESLINT_RULES === 'true') {
    console.log('[shared-tracker] Syncing all rule trackers with shared tracker');
  }
  
  // Call each rule's sync function if available
  if (noUnusedExports.syncWithSharedTracker) {
    noUnusedExports.syncWithSharedTracker(sharedTracker);
  }
  
  if (onlyTestExports.syncWithSharedTracker) {
    onlyTestExports.syncWithSharedTracker(sharedTracker);
  }
}

// Cleanup function for all rules
function clearAllCaches() {
  if (process.env.DEBUG_ESLINT_RULES === 'true') {
    console.log('[shared-tracker] Clearing all rule trackers and shared tracker');
  }
  
  // Clear the shared tracker
  sharedTracker.clear();
  
  // Call each rule's clear function
  if (noUnusedExports.clearCache) {
    noUnusedExports.clearCache();
  }
  
  if (onlyTestExports.clearCache) {
    onlyTestExports.clearCache();
  }
}

// Export all rules
module.exports = {
  rules: {
    'no-array-mutation': noArrayMutation,
    'no-comments': noComments,
    'enforce-central-utilities': enforceCentralUtilities,
    'no-class-inheritance': noClassInheritance,
    'no-unused-exports': noUnusedExports,
    'only-test-exports': onlyTestExports,
    'require-test-file': requireTestFile,
    'enforce-functional-composition': enforceFunctionalComposition,
    'no-test-mocks': noTestMocks,
    'no-blank-files': noBlankFiles,
  },
  configs: {
    recommended: {
      plugins: ['@bunpress'],
      rules: {
        '@bunpress/no-array-mutation': 'error',
        '@bunpress/no-comments': 'warn',
        '@bunpress/enforce-central-utilities': 'error',
        '@bunpress/no-class-inheritance': 'error',
        '@bunpress/no-unused-exports': ['warn', {
          ignorePatterns: [
            '^proptypes$', 
            'constants', 
            'theme'
          ],
          includePaths: [
            'src/utils/',
            'src/lib/',
            'src/components/',
            'src/hooks/'
          ]
        }],
        '@bunpress/only-test-exports': ['warn', {
          testPatterns: [
            '\\.test\\.(ts|js|tsx|jsx)$',
            '\\.spec\\.(ts|js|tsx|jsx)$',
            '[/\\\\](test|__tests__)[/\\\\]',
            'cypress',
            'e2e',
            'test-utils'
          ],
          includePaths: [
            'src/utils/',
            'src/lib/',
            'src/components/',
            'src/hooks/'
          ]
        }],
        '@bunpress/require-test-file': 'warn',
        '@bunpress/enforce-functional-composition': 'warn',
        '@bunpress/no-test-mocks': 'warn',
        '@bunpress/no-blank-files': 'error',
      },
    },
    strict: {
      plugins: ['@bunpress'],
      rules: {
        '@bunpress/no-array-mutation': 'error',
        '@bunpress/no-comments': 'error',
        '@bunpress/enforce-central-utilities': 'error',
        '@bunpress/no-class-inheritance': 'error',
        '@bunpress/no-unused-exports': 'error',
        '@bunpress/only-test-exports': 'error',
        '@bunpress/require-test-file': 'error',
        '@bunpress/enforce-functional-composition': 'error',
        '@bunpress/no-test-mocks': 'error',
        '@bunpress/no-blank-files': 'error',
      },
    }
  },
  // Add a cleanup method to clear caches
  clearCaches: clearAllCaches,
  // Expose the shared tracker for testing
  _sharedTracker: sharedTracker,
  // Expose utility functions
  syncTrackers: syncAllTrackers
};
