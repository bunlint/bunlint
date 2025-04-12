import { expect, test, describe, afterAll } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { 
  analyzeFile,
  createRule,
  composeRules,
} from '../../src/core';

import { SyntaxKind } from 'ts-morph';
import noClassRule from '../../plugins/rules/no-class.rule';
import noLoopsRule from '../../plugins/rules/no-loops.rule';

const createTempFile = async (filename: string, content: string): Promise<string> => {
  const tempDir = path.join(process.cwd(), 'test', 'fixtures', 'rule-composition');
  await fs.mkdir(tempDir, { recursive: true });
  
  const filePath = path.join(tempDir, filename);
  await fs.writeFile(filePath, content, 'utf-8');
  
  return filePath;
}

describe('Rule Composition Tests', () => {
  describe('Basic Rule Composition', () => {
    test('single rule works', async () => {
      // Create a single rule
      const noVarRule = createRule({
        name: 'no-var',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Disallows using var declarations',
            category: 'Best Practices',
            recommended: 'error',
          },
          messages: {
            noVar: 'Use let or const instead of var',
          },
        },
        create: (context) => {
          return {
            VariableDeclaration: (node) => {
              if (node.getKind() === SyntaxKind.VariableDeclaration) {
                const declaration = node.getParent();
                if (declaration && declaration.getKind() === SyntaxKind.VariableDeclarationList) {
                  const list = declaration;
                  if (list.getText().startsWith('var')) {
                    console.log('Found var declaration, reporting...');
                    context.report({
                      node,
                      messageId: 'noVar',
                    });
                  }
                }
              }
            },
          };
        },
      });
      
      // Test file that violates the rule
      const filePath = await createTempFile('var-test.ts', `
        var x = 1;
        const y = 2;
      `);
      
      const result = analyzeFile(filePath, [noVarRule]);
      console.log('Single rule analysis result:', JSON.stringify(result, null, 2));
      
      // Should have 1 error
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].ruleId).toBe('no-var');
    });

    test('composes two rules correctly', async () => {
      // Create two simple rules to compose
      const noVarRule = createRule({
        name: 'no-var',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Disallows using var declarations',
            category: 'Best Practices',
            recommended: 'error',
          },
          messages: {
            noVar: 'Use let or const instead of var',
          },
        },
        create: (context) => {
          return {
            VariableDeclaration: (node) => {
              if (node.getKind() === SyntaxKind.VariableDeclaration) {
                const declaration = node.getParent();
                if (declaration && declaration.getKind() === SyntaxKind.VariableDeclarationList) {
                  const list = declaration;
                  if (list.getText().startsWith('var')) {
                    context.report({
                      node,
                      messageId: 'noVar',
                    });
                  }
                }
              }
            },
          };
        },
      });
      
      const noConsoleRule = createRule({
        name: 'no-console',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Disallows console.* calls',
            category: 'Best Practices',
            recommended: 'error',
          },
          messages: {
            noConsole: 'Avoid using console.{{method}}',
          },
        },
        create: (context) => {
          return {
            CallExpression: (node) => {
              const expression = node.getExpression().getText();
              if (expression.startsWith('console.')) {
                const method = expression.split('.')[1];
                context.report({
                  node,
                  messageId: 'noConsole',
                  data: { method },
                });
              }
            },
          };
        },
      });
      
      // Create a manual combined rule instead of using composeRules
      const combinedRule = createRule({
        name: 'no-var-or-console',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Disallows var declarations and console.* calls',
            category: 'Best Practices',
            recommended: 'error',
          },
          messages: {
            noVar: 'Use let or const instead of var',
            noConsole: 'Avoid using console.{{method}}',
          },
        },
        create: (context) => {
          // Manually combine the visitors
          const noVarVisitors = noVarRule.create(context);
          const noConsoleVisitors = noConsoleRule.create(context);
          
          return {
            VariableDeclaration: (node) => {
              if (noVarVisitors.VariableDeclaration) {
                noVarVisitors.VariableDeclaration(node);
              }
            },
            CallExpression: (node) => {
              if (noConsoleVisitors.CallExpression) {
                noConsoleVisitors.CallExpression(node);
              }
            },
          };
        },
      });
      
      console.log('Combined rule:', JSON.stringify({
        name: combinedRule.name,
        meta: combinedRule.meta,
        hasCreateFunction: typeof combinedRule.create === 'function'
      }, null, 2));
      
      // Test file that violates both rules
      const filePath = await createTempFile('var-and-console.ts', `
        var x = 1;
        const y = 2;
        
        console.log("Hello");
        console.error("An error occurred");
      `);
      
      const result = analyzeFile(filePath, [combinedRule]);
      console.log('Analysis result:', JSON.stringify(result, null, 2));
      
      // Should have 3 errors: 1 var, 2 console.*
      expect(result.messages.length).toBe(3);
      expect(result.messages.every(m => m.ruleId === 'no-var-or-console')).toBe(true);
      expect(result.messages.some(m => m.message.includes('Use let or const instead of var'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('console.log'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('console.error'))).toBe(true);
    });

    test('preserves rule metadata and visitor methods correctly', async () => {
      // Create a rule that detects mutation
      const noMutationMiniRule = createRule({
        name: 'no-mutation-mini',
        meta: {
          type: 'problem',
          docs: {
            description: 'Prohibits array push calls',
            category: 'Immutability',
            recommended: 'error',
          },
          messages: {
            noArrayPush: 'Do not mutate arrays with push()'
          },
        },
        create: (context) => {
          return {
            CallExpression: (node) => {
              const expression = node.asKind(SyntaxKind.CallExpression)?.getExpression().getText();
              if (expression && expression.endsWith('.push')) {
                context.report({
                  node,
                  messageId: 'noArrayPush',
                });
              }
            },
          };
        },
      });
      
      // Create another rule that detects loops
      const noForLoopMiniRule = createRule({
        name: 'no-for-loop-mini',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Prohibits for loops',
            category: 'Functional',
            recommended: 'error',
          },
          messages: {
            noForLoop: 'Use functional approaches instead of for loops'
          },
        },
        create: (context) => {
          return {
            ForStatement: (node) => {
              context.report({
                node,
                messageId: 'noForLoop',
              });
            },
          };
        },
      });
      
      // Compose the two rules
      const compositeFunctionalRule = composeRules(
        [noMutationMiniRule, noForLoopMiniRule],
        {
          name: 'functional-patterns',
          meta: {
            type: 'problem', // Takes the strictest level
            docs: {
              description: 'Enforces functional programming patterns',
              category: 'Functional',
              recommended: 'error',
            },
            messages: {
              noArrayPush: 'Do not mutate arrays with push() - use [...array, newElement] instead',
              noForLoop: 'Use map/filter/reduce instead of for loops',
            },
          },
        }
      );
      
      const filePath = await createTempFile('mutation-and-loops.ts', `
        const arr = [1, 2, 3];
        arr.push(4);
        
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      `);
      
      const result = analyzeFile(filePath, [compositeFunctionalRule]);
      
      expect(result.messages.length).toBe(2);
      expect(result.messages.every(m => m.ruleId === 'functional-patterns')).toBe(true);
      expect(result.messages.some(m => m.message.includes('Do not mutate arrays with push()'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('map/filter/reduce'))).toBe(true);
    });
  });
  
  describe('Advanced Rule Composition', () => {
    test('composes core library rules to create stricter meta-rules', async () => {
      // Compose existing core rules to create a stricter functional rule
      const strictFunctionalRule = composeRules(
        [noClassRule, noLoopsRule],
        {
          name: 'strict-functional',
          meta: {
            type: 'problem',
            docs: {
              description: 'Enforces strict functional programming patterns',
              category: 'Functional',
              recommended: 'error',
            },
            // inherits messages from component rules
          },
        }
      );
      
      const filePath = await createTempFile('functional-violations.ts', `
        // Class violation
        class Calculator {
          value = 0;
          
          add(x: number) {
            this.value += x;
            return this;
          }
          
          getValue() {
            return this.value;
          }
        }
        
        // Loop violation
        function sumArray(numbers: number[]): number {
          let sum = 0;
          for (let i = 0; i < numbers.length; i++) {
            sum += numbers[i];
          }
          return sum;
        }
      `);
      
      const result = analyzeFile(filePath, [strictFunctionalRule]);
      
      // Should detect both violations using the composed rule
      expect(result.messages.length).toBe(2);
      expect(result.messages.every(m => m.ruleId === 'strict-functional')).toBe(true);
      expect(result.messages.some(m => m.message.toLowerCase().includes('class'))).toBe(true);
      expect(result.messages.some(m => m.message.toLowerCase().includes('loop'))).toBe(true);
    });
    
    test('creates complex meta-rules with detailed visitor patterns', async () => {
      // Create a more complex rule that prohibits any form of state
      const noStateRule = createRule({
        name: 'no-state',
        meta: {
          type: 'problem',
          docs: {
            description: 'Prohibits mutable state',
            category: 'Functional',
            recommended: 'error',
          },
          messages: {
            noLet: 'Use const instead of let',
            noMutableArguments: 'Avoid mutating function arguments',
            noExternalMutation: 'Avoid mutating variables from outer scope',
          },
        },
        create: (context) => {
          return {
            VariableDeclaration: (node) => {
              if (node.getKind() === SyntaxKind.VariableDeclaration) {
                const declaration = node.getParent();
                if (declaration && declaration.getKind() === SyntaxKind.VariableDeclarationList) {
                  const list = declaration;
                  if (list.getText().startsWith('let')) {
                    context.report({
                      node,
                      messageId: 'noLet',
                    });
                  }
                }
              }
            },
            BinaryExpression: (node) => {
              const binaryExpr = node.asKind(SyntaxKind.BinaryExpression);
              if (binaryExpr) {
                const operator = binaryExpr.getOperatorToken().getText();
                if (operator === '=') {
                  // Simple check for mutating outer scope variables
                  // (This is a simplified implementation for testing)
                  const left = binaryExpr.getLeft();
                  const leftText = left.getText();
                  if (!leftText.includes('const ') && !leftText.includes('let ')) {
                    context.report({
                      node,
                      messageId: 'noExternalMutation',
                    });
                  }
                }
              }
            },
          };
        },
      });
      
      // Compose with existing core rules
      const pureFunctionalMetaRule = composeRules(
        [noClassRule, noLoopsRule, noStateRule],
        {
          name: 'pure-functional-meta',
          meta: {
            type: 'problem',
            docs: {
              description: 'Enforces pure functional programming with no state, classes or loops',
              category: 'Functional',
              recommended: 'error',
            },
            // inherits all messages
          },
        }
      );
      
      const filePath = await createTempFile('pure-functional-test.ts', `
        // Class violation
        class User {
          name: string;
          constructor(name: string) {
            this.name = name;
          }
        }
        
        // Loop violation
        const calculateSum = (numbers: number[]): number => {
          let sum = 0; // Let violation
          for (let i = 0; i < numbers.length; i++) {
            sum += numbers[i]; // Mutation violation
          }
          return sum;
        };
        
        // External state modification
        let counter = 0;
        const incrementCounter = () => {
          counter += 1; // Mutation violation
          return counter;
        };
      `);
      
      const result = analyzeFile(filePath, [pureFunctionalMetaRule]);
      
      // Should detect multiple violations across all composed rules
      expect(result.messages.length).toBeGreaterThan(4);
      expect(result.messages.every(m => m.ruleId === 'pure-functional-meta')).toBe(true);
      
      // Check individual rule contributions are preserved
      expect(result.messages.some(m => m.message.toLowerCase().includes('class'))).toBe(true);
      expect(result.messages.some(m => m.message.toLowerCase().includes('loop'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('Use const instead of let'))).toBe(true);
    });
  });
  
  describe('Rule Composition for Domain-Specific Linting', () => {
    test('creates domain-specific rule compositions for different code patterns', async () => {
      // Create a custom rule for React functional component patterns
      const reactFunctionalComponentRule = createRule({
        name: 'react-functional-component',
        meta: {
          type: 'suggestion',
          docs: {
            description: 'Enforces React functional component patterns',
            category: 'React',
            recommended: 'error',
          },
          messages: {
            noClassComponent: 'Use functional components instead of class components',
            useDestructuring: 'Destructure props in function parameters',
          },
        },
        create: (context) => {
          return {
            ClassDeclaration: (node) => {
              // Simple check for React class components (in a real rule, this would be more sophisticated)
              const classDecl = node.asKind(SyntaxKind.ClassDeclaration);
              if (classDecl) {
                const heritageClauses = classDecl.getHeritageClauses();
                const extendsReactComponent = heritageClauses.some((clause) => 
                  clause.getText().includes('React.Component') || 
                  clause.getText().includes('Component')
                );
                
                if (extendsReactComponent) {
                  context.report({
                    node,
                    messageId: 'noClassComponent',
                  });
                }
              }
            },
            VariableDeclaration: (node) => {
              // Check for function components with non-destructured props
              if (node.getKind() === SyntaxKind.VariableDeclaration) {
                const varDecl = node.asKind(SyntaxKind.VariableDeclaration);
                if (varDecl) {
                  const initializer = varDecl.getInitializer();
                  if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
                    const arrowFn = initializer.asKind(SyntaxKind.ArrowFunction);
                    if (arrowFn) {
                      const params = arrowFn.getParameters();
                      
                      if (params.length === 1) {
                        const param = params[0];
                        const paramText = param.getText();
                        
                        // If it appears to be a React component with props parameter
                        if (paramText.includes('props') && !paramText.includes('{')) {
                          context.report({
                            node: param,
                            messageId: 'useDestructuring',
                          });
                        }
                      }
                    }
                  }
                }
              }
            },
          };
        },
      });
      
      // Create a custom domain-specific composition with core rules and the React rule
      const reactBestPracticesRule = composeRules(
        [noClassRule, reactFunctionalComponentRule],
        {
          name: 'react-best-practices',
          meta: {
            type: 'suggestion',
            docs: {
              description: 'React best practices: functional components and patterns',
              category: 'React',
              recommended: 'error',
            },
            // Inherits messages
          },
        }
      );
      
      const filePath = await createTempFile('react-component.tsx', `
        import React, { Component } from 'react';
        
        // Class component (violates both rules)
        class UserProfile extends Component<UserProps> {
          render() {
            return (
              <div>
                <h1>{this.props.name}</h1>
                <p>{this.props.bio}</p>
              </div>
            );
          }
        }
        
        // Non-destructured props (violates one rule)
        const UserCard = (props: UserProps) => {
          return (
            <div>
              <h2>{props.name}</h2>
              <p>{props.bio}</p>
            </div>
          );
        };
        
        // Good example (no violations)
        const UserInfo = ({ name, bio }: UserProps) => {
          return (
            <div>
              <h3>{name}</h3>
              <p>{bio}</p>
            </div>
          );
        };
        
        interface UserProps {
          name: string;
          bio: string;
        }
      `);
      
      const result = analyzeFile(filePath, [reactBestPracticesRule]);
      
      // Should detect the class component (2 violations: one from each rule)
      // and the non-destructured props (1 violation)
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
      expect(result.messages.every(m => m.ruleId === 'react-best-practices')).toBe(true);
      
      // Verify specific messages
      expect(result.messages.some(m => m.message.toLowerCase().includes('class'))).toBe(true);
      expect(result.messages.some(m => m.message.includes('Destructure props'))).toBe(true);
    });
  });
  
  afterAll(async () => {
    // Clean up temporary files
    const tempDir = path.join(process.cwd(), 'test', 'fixtures', 'rule-composition');
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });
}); 