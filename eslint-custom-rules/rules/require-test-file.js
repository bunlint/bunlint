/**
 * ESLint rule to enforce unit test coverage by requiring a .test.ts file for each source file
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Cache for global state to avoid repeated filesystem operations
const globalCache = {
  testFiles: null,
  testDirsCache: null,
  fileExistsCache: new Map(),
  projectRoot: null,
  globCache: new Map(),
  
  // Clear caches - should be called between lint runs
  clear() {
    this.testFiles = null;
    this.testDirsCache = null;
    this.fileExistsCache.clear();
    this.globCache.clear();
  }
};

// Optimized glob to use caching for better performance
function cachedGlob(pattern, options) {
  const cacheKey = `${pattern}:${JSON.stringify(options)}`;
  if (globalCache.globCache.has(cacheKey)) {
    return globalCache.globCache.get(cacheKey);
  }
  
  const result = glob.sync(pattern, options);
  globalCache.globCache.set(cacheKey, result);
  return result;
}

// Cached file existence check
function cachedFileExists(filePath) {
  if (globalCache.fileExistsCache.has(filePath)) {
    return globalCache.fileExistsCache.get(filePath);
  }
  
  try {
    const exists = fs.existsSync(filePath);
    globalCache.fileExistsCache.set(filePath, exists);
    return exists;
  } catch (error) {
    globalCache.fileExistsCache.set(filePath, false);
    return false;
  }
}

// Function to clear the global cache
function clearCache() {
  globalCache.clear();
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforces that each source file has a corresponding test file',
      category: 'Testing Coverage',
      recommended: true,
    },
    fixable: null,
    hasSuggestions: true,
    messages: {
      noTestFile: 'No corresponding test file found for "{{fileName}}". Create a test file at one of: {{expectedTestPaths}}',
      createTestFile: 'Create test file at "{{testPath}}"',
    },
    schema: [{
      type: 'object',
      properties: {
        testFilePatterns: {
          type: 'array',
          items: { type: 'string' },
          default: ['**/__tests__/{{name}}.test.ts', '**/{{dir}}/__tests__/{{name}}.test.ts', '**/{{name}}.test.ts'],
        },
        ignorePatterns: {
          type: 'array',
          items: { type: 'string' },
          default: ['**/*.d.ts', '**/types/**', '**/*.type.ts', '**/*.config.ts', '**/*.test.ts', '**/node_modules/**'],
        }
      },
      additionalProperties: false,
    }],
  },
  create: function (context) {
    const options = context.options[0] || {};
    const testFilePatterns = options.testFilePatterns || ['**/__tests__/{{name}}.test.ts', '**/{{dir}}/__tests__/{{name}}.test.ts', '**/{{name}}.test.ts'];
    const ignorePatterns = options.ignorePatterns || ['**/*.d.ts', '**/types/**', '**/*.type.ts', '**/*.config.ts', '**/*.test.ts', '**/node_modules/**'];
    
    // Get project root - cached
    if (!globalCache.projectRoot) {
      globalCache.projectRoot = process.cwd();
    }
    const projectRoot = globalCache.projectRoot;
    
    // Precompile ignore patterns for better performance
    const ignoreRegexes = ignorePatterns.map(pattern => {
      if (pattern.startsWith('**/')) {
        const suffix = pattern.slice(3);
        // Escape the suffix to create a valid regex
        const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escapedSuffix);
      }
      // Escape the pattern and add the end anchor
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`${escapedPattern}$`);
    });
    
    // Lazy-load all test files - with caching
    function loadTestFiles() {
      if (globalCache.testFiles !== null) return globalCache.testFiles;
      
      globalCache.testFiles = new Set();
      try {
        // Use patterns to find test files - only .ts, not .tsx
        const patterns = ['**/*.test.ts', '**/__tests__/**/*.ts'];
        
        patterns.forEach(pattern => {
          const files = cachedGlob(pattern, { cwd: projectRoot, absolute: true });
          files.forEach(file => globalCache.testFiles.add(file));
        });
      } catch (error) {
        console.error('Error loading test files:', error);
      }
      return globalCache.testFiles;
    }
    
    // Find test directories - with caching
    function findTestDirs() {
      if (globalCache.testDirsCache !== null) return globalCache.testDirsCache;
      
      globalCache.testDirsCache = new Set();
      try {
        const testDirPatterns = ['**/__tests__'];
        
        testDirPatterns.forEach(pattern => {
          const dirs = cachedGlob(pattern, { cwd: projectRoot, absolute: true });
          dirs.forEach(dir => globalCache.testDirsCache.add(dir));
        });
      } catch (error) {
        console.error('Error finding test directories:', error);
      }
      return globalCache.testDirsCache;
    }
    
    // Check if a file should be ignored - optimized
    function shouldIgnoreFile(filePath) {
      // Quick checks for file extensions
      if (!filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.d.ts') || filePath.endsWith('.test.ts')) {
        return true;
      }
      
      // Use precompiled regex for better performance
      for (const regex of ignoreRegexes) {
        if (regex.test(filePath)) {
          return true;
        }
      }
      
      return false;
    }
    
    // Generate potential test file paths - optimized
    function getPotentialTestPaths(filePath) {
      const fileName = path.basename(filePath);
      const fileDir = path.dirname(filePath);
      const fileNameWithoutExt = fileName.replace(/\.ts$/, '');
      const relativeDir = path.relative(projectRoot, fileDir);
      
      return testFilePatterns.map(pattern => {
        return pattern
          .replace(/\{\{name\}\}/g, fileNameWithoutExt)
          .replace(/\{\{dir\}\}/g, relativeDir);
      });
    }
    
    // Find potential real test file paths - with caching
    function findPotentialTestFiles(filePath) {
      const potentialPatterns = getPotentialTestPaths(filePath);
      
      const foundTestFiles = [];
      potentialPatterns.forEach(pattern => {
        try {
          const matches = cachedGlob(pattern, { cwd: projectRoot, absolute: true });
          foundTestFiles.push(...matches);
        } catch (error) {
          // Log error but continue with other patterns
          console.error(`Error searching for pattern ${pattern}:`, error);
        }
      });
      
      return foundTestFiles;
    }
    
    // Check a specific source file - with optimized caching
    function checkSourceFile(sourceFile) {
      const absoluteSourcePath = path.resolve(sourceFile);
      
      if (shouldIgnoreFile(absoluteSourcePath)) {
        return;
      }
      
      const allTestFiles = loadTestFiles();
      const testDirs = findTestDirs();
      const potentialTestFiles = findPotentialTestFiles(absoluteSourcePath);
      
      // Check if any potential test file exists
      const testFileExists = potentialTestFiles.some(testFile => allTestFiles.has(testFile));
      
      if (!testFileExists) {
        // Generate human-readable expected paths
        const expectedPaths = potentialTestFiles.map(p => path.relative(projectRoot, p));
        
        // Suggest the most likely test location - optimized
        let suggestedTestPath = '';
        if (expectedPaths.length > 0) {
          // Get source directory and test file name 
          const sourceDir = path.dirname(sourceFile);
          const fileName = path.basename(sourceFile).replace(/\.ts$/, '.test.ts');
          
          // First preference: same directory __tests__
          const testsDirPath = path.join(sourceDir, '__tests__');
          if (cachedFileExists(testsDirPath)) {
            suggestedTestPath = path.join(testsDirPath, fileName);
          } else {
            // Second preference: closest parent __tests__ directory
            const testDirArray = Array.from(testDirs);
            let closestTestDir = null;
            let minDistance = Infinity;
            
            // Find closest test directory (optimization: only calculate distances when needed)
            for (const testDir of testDirArray) {
              if (sourceDir.startsWith(path.dirname(testDir))) {
                const distance = sourceDir.length - path.dirname(testDir).length;
                if (distance < minDistance) {
                  minDistance = distance;
                  closestTestDir = testDir;
                }
              }
            }
            
            if (closestTestDir) {
              suggestedTestPath = path.join(closestTestDir, fileName);
            } else {
              // Final preference: same directory
              suggestedTestPath = path.join(sourceDir, fileName);
            }
          }
        }
        
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'noTestFile',
          data: {
            fileName: path.basename(sourceFile),
            expectedTestPaths: expectedPaths.join(', '),
          },
          suggest: suggestedTestPath ? [{
            messageId: 'createTestFile',
            data: {
              testPath: path.relative(projectRoot, suggestedTestPath),
            },
            fix: (fixer) => {
              // This fix is a placeholder - ESLint can't actually create files
              return fixer.insertTextAfterRange([0, 0], '');
            }
          }] : []
        });
      }
    }
    
    // Main entry point - check source file when a program node is found
    return {
      Program(node) {
        checkSourceFile(context.getFilename());
      }
    };
  },
  // Export the clear function so it can be used from outside
  clearCache
}; 