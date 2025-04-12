import { describe, expect, it } from 'bun:test'
import { lintLiteral, createPlugin, composeRules } from '../../src/core'
import { RuleContext, Rule, Plugin, Fix, Fixer } from '../../src/types'
import { SyntaxKind } from 'ts-morph'

describe('Plugin System Integration', () => {
  it('should allow loading and using custom plugins', () => {
    // Define a simple custom plugin
    const customPlugin: Plugin = {
      name: 'custom-plugin',
      rules: {
        'no-console': {
          name: 'no-console',
          meta: {
            type: 'problem',
            docs: {
              description: 'Disallow console statements',
              category: 'Performance',
              recommended: true
            },
            fixable: 'code',
            messages: {
              unexpected: 'Unexpected console statement'
            }
          },
          create: (context: RuleContext) => ({
            'CallExpression': (node: any) => {
              if (node.getExpression && 
                  node.getExpression().getKind() === SyntaxKind.PropertyAccessExpression && 
                  node.getExpression().getExpression &&
                  node.getExpression().getExpression().getText() === 'console') {
                context.report({
                  node,
                  messageId: 'unexpected',
                  fix: (_: Fixer): Fix => ({
                    range: [node.getStart(), node.getEnd()],
                    text: '/* console statement removed */'
                  })
                });
              }
            }
          })
        }
      }
    };
    
    // Load the custom plugin
    const loadedPlugin = createPlugin(customPlugin);
    
    // Test the plugin with a code snippet
    const code = `
      function example() {
        console.log('test'); // Should trigger the no-console rule
        return 'result';
      }
    `;
    
    // Extract the rule from the plugin
    const customRule = loadedPlugin.rules['no-console']!;
    
    // Use the rule for linting
    const result = lintLiteral(code, [customRule]);
    
    // Should report a no-console violation
    expect(result.messages.length).toBe(1);
    expect(result.messages[0]?.ruleId).toBe('custom-plugin/no-console');
    
    // Verify the fix is included
    expect(result.messages[0]?.fix).toBeDefined();
  });
  
  it('should compose multiple rules correctly', () => {
    // Create two simple rules
    const noConsoleRule: Rule = {
      name: 'no-console',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow console statements',
          category: 'Restrictions',
          recommended: true
        },
        messages: {
          unexpected: 'Unexpected console statement'
        }
      },
      create: (context: RuleContext) => ({
        'CallExpression': (node: any) => {
          const text = node.getText();
          if (text.startsWith('console.')) {
            context.report({
              node,
              messageId: 'unexpected'
            });
          }
        }
      })
    };
    
    const noAlertRule: Rule = {
      name: 'no-alert',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow alert statements',
          category: 'Restrictions',
          recommended: true
        },
        messages: {
          unexpected: 'Unexpected alert statement'
        }
      },
      create: (context: RuleContext) => ({
        'CallExpression': (node: any) => {
          const text = node.getText();
          if (text.startsWith('alert(')) {
            context.report({
              node,
              messageId: 'unexpected'
            });
          }
        }
      })
    };
    
    // Compose the rules
    const composedRule = composeRules([noConsoleRule, noAlertRule], {
      name: 'composed:no-console+no-alert',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow console and alert statements',
          category: 'Restrictions',
          recommended: true
        },
        messages: {
          unexpected: 'Unexpected console or alert statement'
        }
      }
    });
    
    // Test with a code snippet that triggers both rules
    const code = `
      function example() {
        console.log('test'); // Should trigger no-console
        alert('warning');    // Should trigger no-alert
        return 'result';
      }
    `;
    
    // Use the composed rules for linting
    const result = lintLiteral(code, [composedRule]);
    
    // Should report both violations
    expect(result.messages.length).toBe(2);
    
    // Check that each rule was triggered
    const ruleIds = result.messages.map(m => m.ruleId || '');
    expect(ruleIds.every(id => id === 'composed:no-console+no-alert')).toBe(true);
  });
  
  it('should integrate with the built-in ruleset', () => {
    // Define a custom plugin with a rule
    const customPlugin: Plugin = {
      name: 'custom-immutability',
      rules: {
        'no-delete': {
          name: 'no-delete',
          meta: {
            type: 'problem',
            docs: {
              description: 'Disallow delete operator',
              category: 'Immutability',
              recommended: true
            },
            fixable: 'code',
            messages: {
              unexpected: 'Delete operator violates immutability'
            }
          },
          create: (_: RuleContext) => ({
            'UnaryExpression': (_: any) => {}
          })
        }
      }
    };
    
    // Load the custom plugin
    const loadedPlugin = createPlugin(customPlugin);
    
    // Verify the plugin was created correctly
    expect(loadedPlugin.name).toBe('custom-immutability');
    expect(loadedPlugin.rules['no-delete']).toBeDefined();
    expect(loadedPlugin.rules['no-delete']?.name).toBe('custom-immutability/no-delete');
  });
  
  it('should support rule configuration via plugin options', () => {
    // Define a configurable custom rule
    const configurableRule: Rule = {
      name: 'max-lines',
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce maximum line count',
          category: 'Style',
          recommended: false
        },
        messages: {
          tooManyLines: 'File has too many lines ({{lineCount}}). Maximum allowed is {{maxLines}}.'
        }
      },
      create: (_: RuleContext) => ({})
    };
    
    // Create a plugin with the configurable rule
    const customPlugin: Plugin = {
      name: 'custom-style',
      rules: {
        'max-lines': configurableRule
      }
    };
    
    // Load the plugin
    const loadedPlugin = createPlugin(customPlugin);
    const maxLinesRule = loadedPlugin.rules['max-lines'] || null;
    
    // Verify the rule was created correctly
    expect(maxLinesRule).toBeDefined();
    if (maxLinesRule) {
      expect(maxLinesRule.name).toBe('custom-style/max-lines');
      
      // Verify we can set options
      maxLinesRule.options = [{ max: 5 }];
      expect(maxLinesRule.options).toEqual([{ max: 5 }]);
    }
  });
  
  it('should support extending plugins', () => {
    // Define a base plugin
    const basePlugin: Plugin = {
      name: 'base-rules',
      rules: {
        'no-var': {
          name: 'no-var',
          meta: {
            type: 'suggestion',
            docs: {
              description: 'Disallow var statements',
              category: 'Style',
              recommended: true
            },
            messages: {
              unexpected: 'Unexpected var, use let or const instead'
            }
          },
          create: (_: RuleContext) => ({})
        }
      }
    };
    
    // Define an extending plugin that adds more rules
    const extendingPlugin: Plugin = {
      name: 'extended-rules',
      extends: basePlugin,
      rules: {
        'no-eval': {
          name: 'no-eval',
          meta: {
            type: 'problem',
            docs: {
              description: 'Disallow eval() function',
              category: 'Security',
              recommended: true
            },
            messages: {
              unexpected: 'Unexpected eval()'
            }
          },
          create: (_: RuleContext) => ({})
        }
      }
    };
    
    // Load both plugins
    const loadedExtendingPlugin = createPlugin(extendingPlugin);
    
    // Extended plugin should have both its own rules and the base rules
    expect(Object.keys(loadedExtendingPlugin.rules || {}).length).toBeGreaterThanOrEqual(2);
    expect(loadedExtendingPlugin.rules || {}).toHaveProperty('no-eval');
    expect(loadedExtendingPlugin.rules || {}).toHaveProperty('no-var');
    
    // Verify rule names are properly prefixed
    expect(loadedExtendingPlugin.rules?.['no-eval']?.name).toBe('extended-rules/no-eval');
    expect(loadedExtendingPlugin.rules?.['no-var']?.name).toBe('extended-rules/no-var');
  });
  
  it('should handle plugin namespaces correctly', () => {
    // Define a plugin with namespaced rules
    const namespacedPlugin: Plugin = {
      name: 'fp',
      rules: {
        'no-this': {
          name: 'no-this',
          meta: {
            type: 'problem',
            docs: {
              description: 'Disallow this keyword',
              category: 'Functional',
              recommended: true
            },
            messages: {
              unexpected: 'Unexpected this, use pure functions instead'
            }
          },
          create: (_: RuleContext) => ({})
        },
        'no-mutate': {
          name: 'no-mutate',
          meta: {
            type: 'problem',
            docs: {
              description: 'Disallow mutations',
              category: 'Functional',
              recommended: true
            },
            messages: {
              unexpected: 'Unexpected mutation, use immutable data instead'
            }
          },
          create: (_: RuleContext) => ({})
        }
      }
    };
    
    // Load the plugin
    const loadedPlugin = createPlugin(namespacedPlugin);
    
    // Rules should be properly namespaced
    expect(loadedPlugin.rules['no-this']).toBeDefined();
    expect(loadedPlugin.rules['no-mutate']).toBeDefined();
    expect(loadedPlugin.rules?.['no-this']?.name).toBe('fp/no-this');
    expect(loadedPlugin.rules?.['no-mutate']?.name).toBe('fp/no-mutate');
  });
}); 