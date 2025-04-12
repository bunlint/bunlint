import { describe, expect, it } from 'bun:test'
import { resultUtil } from '../../src/utils'
import { LintResult, LintMessage, LintMessageWithFile } from '../../src/types'

// Sample test results with diverse rule categories, files, and severities
const sampleLintResults: LintResult[] = [
  {
    filePath: 'src/components/Button.tsx',
    messages: [
      {
        ruleId: 'functional/no-class',
        severity: 2, // error
        category: 'Functional',
        fixability: 'manual',
        message: 'Classes are not allowed in functional code',
        line: 5,
        column: 1,
        endLine: 15,
        endColumn: 2,
        nodeType: 'ClassDeclaration'
      },
      {
        ruleId: 'immutable/no-object-mutation',
        severity: 1, // warning
        category: 'Immutability',
        fixability: 'fixable',
        message: 'Object mutation detected',
        line: 20,
        column: 3,
        endLine: 20,
        endColumn: 25,
        nodeType: 'AssignmentExpression',
        fix: {
          range: [340, 365],
          text: '{ ...state, count: 5 }'
        }
      }
    ],
    errorCount: 1,
    warningCount: 1,
    fixableErrorCount: 0,
    fixableWarningCount: 1
  },
  {
    filePath: 'src/utils/helpers.ts',
    messages: [
      {
        ruleId: 'functional/prefer-pipe',
        severity: 1, // warning
        category: 'Functional',
        fixability: 'fixable',
        message: 'Use pipe or flow instead of nested function calls',
        line: 10,
        column: 1,
        endLine: 10,
        endColumn: 50,
        nodeType: 'CallExpression',
        fix: {
          range: [200, 250],
          text: 'pipe(data, filter, map, reduce)'
        }
      },
      {
        ruleId: 'performance/no-large-objects',
        severity: 1, // warning
        category: 'Performance',
        fixability: 'manual',
        message: 'Large object literal may impact performance',
        line: 25,
        column: 1,
        endLine: 45,
        endColumn: 2,
        nodeType: 'ObjectLiteralExpression'
      },
      {
        ruleId: 'no-loops',
        severity: 2, // error
        category: 'Functional',
        fixability: 'fixable',
        message: 'For loops not allowed, use map/filter/reduce instead',
        line: 50,
        column: 1,
        endLine: 55,
        endColumn: 2,
        nodeType: 'ForStatement',
        fix: {
          range: [800, 900],
          text: 'array.reduce((acc, item) => acc + item, 0)'
        }
      }
    ],
    errorCount: 1,
    warningCount: 2,
    fixableErrorCount: 1,
    fixableWarningCount: 1
  },
  {
    filePath: 'src/api/client.ts',
    messages: [
      {
        ruleId: 'security/no-eval',
        severity: 2, // error
        category: 'Security',
        fixability: 'manual',
        message: 'Avoid using eval() for security reasons',
        line: 30,
        column: 5,
        endLine: 30,
        endColumn: 32,
        nodeType: 'CallExpression'
      },
      {
        ruleId: 'immutable/no-array-mutation',
        severity: 2, // error
        category: 'Immutability',
        fixability: 'fixable',
        message: 'Array mutation methods are not allowed',
        line: 45,
        column: 3,
        endLine: 45,
        endColumn: 18,
        nodeType: 'CallExpression',
        fix: {
          range: [1200, 1215],
          text: '[...array, newItem]'
        }
      }
    ],
    errorCount: 2,
    warningCount: 0,
    fixableErrorCount: 1,
    fixableWarningCount: 0
  }
];

describe('Report Grouping Functionality', () => {
  // Test grouping by category
  it('should group messages by category correctly', () => {
    const groupedByCategory = resultUtil.groupByCategory(sampleLintResults);
    
    // Expect 4 categories: Functional, Immutability, Performance, Security
    expect(Object.keys(groupedByCategory).length).toBe(4);
    
    // Verify specific categories
    expect(groupedByCategory).toHaveProperty('Functional');
    expect(groupedByCategory).toHaveProperty('Immutability');
    expect(groupedByCategory).toHaveProperty('Performance');
    expect(groupedByCategory).toHaveProperty('Security');
    
    // Check count of issues in each category
    expect(groupedByCategory['Functional']?.length).toBe(3); // 1 no-class, 1 prefer-pipe, 1 no-loops
    expect(groupedByCategory['Immutability']?.length).toBe(2); // 1 no-object-mutation, 1 no-array-mutation
    expect(groupedByCategory['Performance']?.length).toBe(1); // 1 no-large-objects
    expect(groupedByCategory['Security']?.length).toBe(1); // 1 no-eval
  });
  
  // Test grouping by file
  it('should group messages by file correctly', () => {
    const groupedByFile = resultUtil.groupByFile(sampleLintResults);
    
    // Log the actual keys for debugging
    console.log('Actual file keys:', Object.keys(groupedByFile));
    
    // Expect 3 files with issues
    expect(Object.keys(groupedByFile).length).toBe(3);
    
    // Verify specific files
    const fileKeys = Object.keys(groupedByFile);
    expect(fileKeys).toContain('src/components/Button.tsx');
    expect(fileKeys).toContain('src/utils/helpers.ts');
    expect(fileKeys).toContain('src/api/client.ts');
    
    // Check count of issues in each file
    expect(groupedByFile['src/components/Button.tsx']?.length).toBe(2);
    expect(groupedByFile['src/utils/helpers.ts']?.length).toBe(3);
    expect(groupedByFile['src/api/client.ts']?.length).toBe(2);
  });
  
  // Test grouping by severity
  it('should group messages by severity correctly', () => {
    const groupedBySeverity = resultUtil.groupBySeverity(sampleLintResults);
    
    // Expect 2 severity levels: error (2) and warning (1)
    expect(Object.keys(groupedBySeverity).length).toBe(2);
    expect(groupedBySeverity).toHaveProperty('2'); // errors
    expect(groupedBySeverity).toHaveProperty('1'); // warnings
    
    // Check count of issues by severity
    expect(groupedBySeverity['2']?.length).toBe(4); // 4 errors
    expect(groupedBySeverity['1']?.length).toBe(3); // 3 warnings
  });
  
  // Test grouping by rule
  it('should group messages by rule correctly', () => {
    const groupedByRule = resultUtil.groupByRule(sampleLintResults);
    
    // Expect 7 different rules
    expect(Object.keys(groupedByRule).length).toBe(7);
    
    // Verify specific rules
    expect(groupedByRule).toHaveProperty('functional/no-class');
    expect(groupedByRule).toHaveProperty('immutable/no-object-mutation');
    expect(groupedByRule).toHaveProperty('functional/prefer-pipe');
    expect(groupedByRule).toHaveProperty('performance/no-large-objects');
    expect(groupedByRule).toHaveProperty('no-loops');
    expect(groupedByRule).toHaveProperty('security/no-eval');
    expect(groupedByRule).toHaveProperty('immutable/no-array-mutation');
    
    // Check count of issues for specific rules
    expect(groupedByRule['functional/no-class']?.length).toBe(1);
    expect(groupedByRule['immutable/no-array-mutation']?.length).toBe(1);
    expect(groupedByRule['no-loops']?.length).toBe(1);
  });
  
  // Test grouping by fixability
  it('should group messages by fixability correctly', () => {
    const groupedByFixability = resultUtil.groupByFixability(sampleLintResults);
    
    // Expect 2 fixability types: 'fixable' and 'manual'
    expect(Object.keys(groupedByFixability).length).toBe(2);
    expect(groupedByFixability).toHaveProperty('fixable');
    expect(groupedByFixability).toHaveProperty('manual');
    
    // Check count of issues by fixability
    expect(groupedByFixability['fixable']?.length).toBe(4); // 4 fixable issues
    expect(groupedByFixability['manual']?.length).toBe(3); // 3 manual issues
  });
  
  // Test hierarchical grouping (file -> severity)
  it('should support hierarchical grouping by file and severity', () => {
    const hierarchical = resultUtil.groupByFileAndSeverity(sampleLintResults);
    
    // All 3 files should be present as top-level keys
    expect(Object.keys(hierarchical).length).toBe(3);
    
    // Check Button.tsx file's severity groups
    const buttonFile = hierarchical['src/components/Button.tsx'] || {};
    expect(Object.keys(buttonFile)).toContain('2'); // Has errors
    expect(Object.keys(buttonFile)).toContain('1'); // Has warnings
    expect(buttonFile['2']?.length).toBe(1); // 1 error
    expect(buttonFile['1']?.length).toBe(1); // 1 warning
    
    // Check api/client.ts file's severity groups
    const clientFile = hierarchical['src/api/client.ts'] || {};
    expect(Object.keys(clientFile)).toContain('2'); // Has errors
    expect(Object.keys(clientFile)).not.toContain('1'); // No warnings
    expect(clientFile['2']?.length).toBe(2); // 2 errors
  });
  
  // Test hierarchical grouping (file -> rule)
  it('should support hierarchical grouping by file and rule', () => {
    const hierarchical = resultUtil.groupByFileAndRule(sampleLintResults);
    
    // All 3 files should be present
    expect(Object.keys(hierarchical).length).toBe(3);
    
    // Check helpers.ts file's rule groups
    const helpersFile = hierarchical['src/utils/helpers.ts'] || {};
    expect(Object.keys(helpersFile).length).toBe(3); // Has 3 different rules
    expect(helpersFile).toHaveProperty('functional/prefer-pipe');
    expect(helpersFile).toHaveProperty('performance/no-large-objects');
    expect(helpersFile).toHaveProperty('no-loops');
  });
  
  // Test hierarchical grouping (category -> rule)
  it('should support hierarchical grouping by category and rule', () => {
    const hierarchical = resultUtil.groupByCategoryAndRule(sampleLintResults);
    
    // All 4 categories should be present
    expect(Object.keys(hierarchical).length).toBe(4);
    
    // Check functional category rules
    const functionalCategory = hierarchical['Functional'] || {};
    expect(Object.keys(functionalCategory).length).toBe(3); // no-class, prefer-pipe, no-loops
    expect(functionalCategory).toHaveProperty('functional/no-class');
    expect(functionalCategory).toHaveProperty('functional/prefer-pipe');
    expect(functionalCategory).toHaveProperty('no-loops');
    
    // Check immutability category rules
    const immutabilityCategory = hierarchical['Immutability'] || {};
    expect(Object.keys(immutabilityCategory).length).toBe(2); // no-object-mutation, no-array-mutation
    expect(immutabilityCategory).toHaveProperty('immutable/no-object-mutation');
    expect(immutabilityCategory).toHaveProperty('immutable/no-array-mutation');
  });
  
  // Test custom grouping with priorities
  it('should support custom grouping categories with priorities', () => {
    const customGroups: Record<string, string[]> = {
      'Critical': ['security/*', 'immutable/no-array-mutation'],
      'Style': ['functional/prefer-pipe'],
      'Other': ['*'] // catch-all
    };
    
    const groupedByCustom = resultUtil.groupByCustomCategories(sampleLintResults, customGroups);
    
    // Should have all 3 custom groups
    expect(Object.keys(groupedByCustom).length).toBe(3);
    expect(groupedByCustom).toHaveProperty('Critical');
    expect(groupedByCustom).toHaveProperty('Style');
    expect(groupedByCustom).toHaveProperty('Other');
    
    // Check count in each custom group
    expect(groupedByCustom['Critical']?.length).toBe(2); // 1 security/no-eval, 1 immutable/no-array-mutation
    expect(groupedByCustom['Style']?.length).toBe(1); // 1 functional/prefer-pipe
    expect(groupedByCustom['Other']?.length).toBe(4); // remaining 4 issues
  });
}); 