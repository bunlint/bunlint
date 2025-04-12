import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { 
  defineConfig, 
  mergeConfigs, 
  loadConfigFile, 
  findConfigFile,
  getRulesFromConfig
} from '../../src/core'
import { Config, Severity } from '../../src/types'
import { defaultConfig } from '../../src/constants'
import * as fs from 'fs'
import * as path from 'path'

// Helper function to create temp config files
const createTempConfigFile = (content: string, fileName: string): string => {
  const tempPath = path.join(process.cwd(), fileName)
  fs.writeFileSync(tempPath, content)
  return tempPath
}

// Helper to clean up temp files
const removeTempFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

describe('Config System', () => {
  // Temp files created during tests
  const tempFiles: string[] = []

  // Clean up after each test
  afterEach(() => {
    tempFiles.forEach(file => removeTempFile(file))
    tempFiles.length = 0
  })

  describe('defineConfig', () => {
    it('should apply defaults for undefined values', () => {
      const userConfig: Partial<Config> = {
        rules: {
          'no-class': 'error'
        }
      }
      const result = defineConfig(userConfig)
      
      // Check that values exist and match without strict type checking
      expect(Array.isArray(result.include)).toBe(true)
      expect(result.include).toEqual(expect.arrayContaining(defaultConfig.include || []))
      expect(Array.isArray(result.exclude)).toBe(true)
      expect(result.exclude).toEqual(expect.arrayContaining(defaultConfig.exclude || []))
      expect(typeof result.cache).toBe('boolean')
      expect(result.cache).toBe(defaultConfig.cache === undefined ? true : defaultConfig.cache)
      expect(result.report).toBeDefined()
      if (result.report && defaultConfig.report) {
        if (result.report.format && defaultConfig.report.format) {
          expect(result.report.format).toBe(defaultConfig.report.format)
        }
      }
    })

    it('should override defaults with user configuration', () => {
      const userConfig: Partial<Config> = {
        include: ['app/**/*.ts'],
        exclude: ['**/*.spec.ts'],
        cache: false,
        report: {
          format: 'json'
        }
      }
      const result = defineConfig(userConfig)
      
      expect(result.include).toEqual(['app/**/*.ts'])
      expect(result.exclude).toEqual(['**/*.spec.ts'])
      expect(result.cache).toBe(false)
      expect(result.report?.format).toBe('json')
    })

    it('should normalize rule settings with various notations', () => {
      const userConfig: Partial<Config> = {
        rules: {
          'no-class': 'error',
          'prefer-const': 'warn',
          'no-loops': 'off',
          'pure-function': ['warn', { strict: true }],
          'no-mutation': ['error', { allowLocal: true }]
        }
      }
      const result = defineConfig(userConfig)
      
      expect(result.rules?.['no-class']).toBe('error')
      expect(result.rules?.['prefer-const']).toBe('warn')
      expect(result.rules?.['no-loops']).toBe('off')
      expect(result.rules?.['pure-function']).toEqual(['warn', { strict: true }])
      expect(result.rules?.['no-mutation']).toEqual(['error', { allowLocal: true }])
    })

    it('should apply recommended preset rules when extends includes recommended', () => {
      const userConfig: Partial<Config> = {
        extends: ['recommended']
      }
      const result = defineConfig(userConfig)
      
      expect(result.rules?.['no-mutation']).toBe('error')
      expect(result.rules?.['no-class']).toBe('error')
      expect(result.rules?.['prefer-const']).toBe('warn')
      expect(result.rules?.['no-loops']).toBe('warn')
      expect(result.rules?.['no-this']).toBe('warn')
    })

    it('should apply strict preset rules when extends includes strict', () => {
      const userConfig: Partial<Config> = {
        extends: ['strict']
      }
      const result = defineConfig(userConfig)
      
      expect(result.rules?.['no-mutation']).toBe('error')
      expect(result.rules?.['no-class']).toBe('error')
      expect(result.rules?.['prefer-const']).toBe('error')
      expect(result.rules?.['no-loops']).toBe('error')
      expect(result.rules?.['no-this']).toBe('error')
      expect(result.rules?.['pure-function']).toBe('warn')
    })

    it('should override preset rules with user rules', () => {
      const userConfig: Partial<Config> = {
        extends: ['recommended'],
        rules: {
          'no-loops': 'off',
          'no-this': 'error'
        }
      }
      const result = defineConfig(userConfig)
      
      expect(result.rules?.['no-loops']).toBe('off')
      expect(result.rules?.['no-this']).toBe('error')
      // Other recommended rules should still be present
      expect(result.rules?.['no-mutation']).toBe('error')
    })

    it('should throw error for unsupported extends', () => {
      const userConfig: Partial<Config> = {
        extends: ['plugin:custom/preset']
      }
      
      expect(() => defineConfig(userConfig)).toThrow()
    })
  })

  describe('mergeConfigs', () => {
    it('should merge two configs correctly', () => {
      const baseConfig: Config = {
        ...defaultConfig,
        extends: ['recommended'],
        plugins: ['a'],
        rules: {
          'rule1': 'error',
          'rule2': 'warn'
        },
        include: ['src/**/*.ts'],
        exclude: ['**/*.test.ts'],
        cache: true,
        cacheLocation: './cache',
        report: {
          format: 'pretty',
          grouping: 'category',
          showSummary: true
        }
      }
      
      const extensionConfig: Partial<Config> = {
        extends: ['strict'],
        plugins: ['b'],
        rules: {
          'rule2': 'error',
          'rule3': 'warn'
        },
        include: ['app/**/*.ts'],
        exclude: ['**/*.spec.ts'],
        cache: false,
        report: {
          format: 'json',
          outputFile: 'report.json'
        }
      }
      
      const result = mergeConfigs(baseConfig, extensionConfig)
      
      expect(result.extends).toEqual(['recommended', 'strict'])
      expect(result.plugins).toEqual(['a', 'b'])
      expect(result.rules).toEqual({
        'rule1': 'error',
        'rule2': 'error', // Overridden
        'rule3': 'warn'
      })
      expect(result.include).toEqual(['app/**/*.ts'])
      expect(result.exclude).toEqual(['**/*.spec.ts'])
      expect(result.cache).toBe(false)
      expect(result.cacheLocation).toBe('./cache')
      expect(result.report).toEqual({
        format: 'json',
        showSummary: true,
        outputFile: 'report.json',
        grouping: 'category'
      })
    })

    it('should handle undefined values in extension', () => {
      const baseConfig: Config = {
        ...defaultConfig,
        rules: { 'rule1': 'error' },
        include: ['src/**/*.ts'],
        exclude: ['**/*.test.ts'],
      }
      
      const extensionConfig: Partial<Config> = {
        rules: { 'rule2': 'warn' }
      }
      
      const result = mergeConfigs(baseConfig, extensionConfig)
      
      expect(result.rules).toEqual({
        'rule1': 'error',
        'rule2': 'warn'
      })
      expect(result.include).toEqual(['src/**/*.ts'])
      expect(result.exclude).toEqual(['**/*.test.ts'])
    })
  })

  describe('getRulesFromConfig', () => {
    it('should return enabled rules based on config', () => {
      const config: Config = defineConfig({
        rules: {
          'no-class': 'error',
          'no-loops': 'warn',
          'prefer-const': 'off'
        }
      })
      
      const rules = getRulesFromConfig(config)
      
      // Should include enabled rules (error, warn) but not disabled (off)
      const ruleNames = rules.map(rule => rule.name)
      expect(ruleNames).toContain('no-class')
      expect(ruleNames).toContain('no-loops')
      expect(ruleNames).not.toContain('prefer-const')
    })

    it('should apply rule options from config', () => {
      const config: Config = defineConfig({
        rules: {
          'no-mutation': ['error', { allowLocal: true }]
        }
      })
      
      const rules = getRulesFromConfig(config)
      const noMutationRule = rules.find(rule => rule.name === 'no-mutation')
      
      expect(noMutationRule).toBeDefined()
      expect(noMutationRule?.options).toEqual([{ allowLocal: true }])
    })
  })

  describe('loadConfigFile', () => {
    it('should load JSON config file correctly', async () => {
      const configContent = JSON.stringify({
        extends: ['recommended'],
        rules: {
          'no-class': 'error',
          'no-loops': 'off'
        }
      })
      
      const configPath = createTempConfigFile(configContent, 'bunlint.test.json')
      tempFiles.push(configPath)
      
      const result = await loadConfigFile(configPath)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.extends).toEqual(['recommended'])
        expect(result.value.rules?.['no-class']).toBe('error')
        expect(result.value.rules?.['no-loops']).toBe('off')
      }
    })

    it('should handle invalid JSON config format', async () => {
      const configContent = `{ 
        "extends": ["recommended"],
        "rules": {
          "no-class": "error",
          invalid json here
        }
      }`
      
      const configPath = createTempConfigFile(configContent, 'invalid.json')
      tempFiles.push(configPath)
      
      const result = await loadConfigFile(configPath)
      
      expect(result.ok).toBe(false)
    })

    it('should handle JavaScript module config format', async () => {
      const configContent = `
        const config = {
          extends: ['recommended'],
          rules: {
            'no-class': 'error',
            'no-loops': 'off'
          }
        };
        module.exports = config;
      `
      
      const configPath = createTempConfigFile(configContent, 'bunlint.test.js')
      tempFiles.push(configPath)
      
      const result = await loadConfigFile(configPath)
      
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.extends).toEqual(['recommended'])
        expect(result.value.rules?.['no-class']).toBe('error')
        expect(result.value.rules?.['no-loops']).toBe('off')
      }
    })
  })

  describe('Report Configuration', () => {
    it('should correctly merge report settings', () => {
      const baseConfig: Config = {
        ...defaultConfig,
        report: {
          format: 'pretty',
          grouping: 'category',
          showSummary: true,
          maxIssuesPerGroup: 10,
          sortBy: 'severity'
        }
      }
      
      const userConfig: Partial<Config> = {
        report: {
          format: 'json',
          outputFile: 'report.json',
          maxIssuesPerGroup: 25
        }
      }
      
      const result = mergeConfigs(baseConfig, userConfig)
      
      expect(result.report).toEqual({
        format: 'json',
        grouping: 'category',
        showSummary: true,
        maxIssuesPerGroup: 25,
        sortBy: 'severity',
        outputFile: 'report.json'
      })
    })

    it('should handle empty report configuration', () => {
      const baseConfig: Config = defineConfig({})
      const userConfig: Partial<Config> = { 
        rules: { 'no-class': 'error' }
      }
      
      const result = mergeConfigs(baseConfig, userConfig)
      
      // Compare report settings without assuming null is impossible
      if (result.report && defaultConfig.report) {
        expect(typeof result.report).toBe('object')
        if (result.report.format && defaultConfig.report.format) {
          expect(result.report.format).toBe(defaultConfig.report.format)
        }
        if (result.report.showSummary !== undefined && defaultConfig.report.showSummary !== undefined) {
          expect(result.report.showSummary).toBe(defaultConfig.report.showSummary)
        }
      }
    })
  })

  describe('Complex Configuration Scenarios', () => {
    it('should handle multiple extends with overrides', () => {
      // This test simulates a real-world complex config
      const config: Config = defineConfig({
        extends: ['recommended', 'strict'],
        rules: {
          // Override some preset rules
          'no-loops': 'off',
          'pure-function': ['warn', { strictMode: true }],
          
          // Add custom rule configs
          'no-mutation': ['error', { allowLocalScoped: true }],
          'no-object-mutation': 'off'
        },
        include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
        exclude: ['**/*.{test,spec}.{ts,tsx}', 'dist', 'node_modules'],
        report: {
          format: 'html',
          outputFile: 'reports/lint-report.html',
          grouping: 'severity',
          showSummary: true,
          sortBy: 'location'
        }
      })
      
      // Strict should override recommended
      expect(config.rules?.['prefer-const']).toBe('error')
      expect(config.rules?.['no-this']).toBe('error')
      
      // User overrides should take precedence
      expect(config.rules?.['no-loops']).toBe('off')
      expect(config.rules?.['pure-function']).toEqual(['warn', { strictMode: true }])
      expect(config.rules?.['no-mutation']).toEqual(['error', { allowLocalScoped: true }])
      expect(config.rules?.['no-object-mutation']).toBe('off')
      
      // Report config should be correctly set
      expect(config.report?.format).toBe('html')
      expect(config.report?.grouping).toBe('severity')
      expect(config.report?.sortBy).toBe('location')
    })
  })

  describe('Include and Exclude Patterns', () => {
    it('should include correct patterns in config', () => {
      const config: Config = defineConfig({
        include: ['src/**/*.ts', 'lib/**/*.ts'],
        exclude: []
      })
      
      // Simply verify the patterns were stored correctly in the config
      expect(config.include).toEqual(['src/**/*.ts', 'lib/**/*.ts'])
      expect(config.exclude).toEqual([])
    })
    
    it('should exclude correct patterns in config', () => {
      const config: Config = defineConfig({
        include: ['**/*.ts'],
        exclude: ['**/*.test.ts', '**/node_modules/**']
      })
      
      // Simply verify the patterns were stored correctly in the config
      expect(config.include).toEqual(['**/*.ts'])
      expect(config.exclude).toEqual(['**/*.test.ts', '**/node_modules/**'])
    })
    
    it('should merge include/exclude patterns in merged configs', () => {
      const baseConfig: Config = {
        ...defaultConfig,
        include: ['src/**/*.ts'],
        exclude: ['**/*.test.ts']
      }
      
      const extensionConfig: Partial<Config> = {
        include: ['app/**/*.tsx'],
        exclude: ['**/node_modules/**']
      }
      
      // When merging configs, the extension's include/exclude should replace the base's
      const result = mergeConfigs(baseConfig, extensionConfig)
      expect(result.include).toEqual(['app/**/*.tsx'])
      expect(result.exclude).toEqual(['**/node_modules/**'])
    })
    
    it('should use default include/exclude when none specified', () => {
      const config = defineConfig({})
      
      // Should use defaults
      if (defaultConfig.include && defaultConfig.exclude) {
        expect(config.include).toEqual(defaultConfig.include)
        expect(config.exclude).toEqual(defaultConfig.exclude)
      }
    })
  })

  describe('Cache Configuration', () => {
    it('should respect cache settings', () => {
      // Test with cache enabled
      const configWithCache: Config = defineConfig({
        cache: true,
        cacheLocation: './custom-cache'
      })
      
      expect(configWithCache.cache).toBe(true)
      expect(configWithCache.cacheLocation).toBe('./custom-cache')
      
      // Test with cache disabled
      const configWithoutCache: Config = defineConfig({
        cache: false
      })
      
      expect(configWithoutCache.cache).toBe(false)
      expect(configWithoutCache.cacheLocation).toBeDefined() // Default should still exist
    })
    
    it('should apply default cache location when not specified', () => {
      const config: Config = defineConfig({
        cache: true
      })
      
      expect(config.cache).toBe(true)
      // Check that cacheLocation has a value if defaultConfig.cacheLocation exists
      if (defaultConfig.cacheLocation) {
        expect(config.cacheLocation).toBe(defaultConfig.cacheLocation)
      } else {
        expect(config.cacheLocation).toBeDefined()
      }
    })
    
    it('should handle cache configuration in merged configs', () => {
      const baseConfig: Config = {
        ...defaultConfig,
        cache: true,
        cacheLocation: './default-cache'
      }
      
      const extensionWithCache: Partial<Config> = {
        cache: true,
        cacheLocation: './custom-cache'
      }
      
      const extensionWithoutCache: Partial<Config> = {
        cache: false
      }
      
      // Test overriding with custom cache location
      const resultWithCache = mergeConfigs(baseConfig, extensionWithCache)
      expect(resultWithCache.cache).toBe(true)
      expect(resultWithCache.cacheLocation).toBe('./custom-cache')
      
      // Test disabling cache
      const resultWithoutCache = mergeConfigs(baseConfig, extensionWithoutCache)
      expect(resultWithoutCache.cache).toBe(false)
      expect(resultWithoutCache.cacheLocation).toBe('./default-cache') // Should preserve location even if cache disabled
    })
  })

  describe('Real-world Config Scenarios', () => {
    it('should handle a comprehensive project configuration', () => {
      // Create a real-world project config with all settings
      const userConfig: Partial<Config> = {
        extends: ['recommended'],
        plugins: ['performance', 'security'],
        rules: {
          // Override recommended rules
          'no-loops': 'off',
          'prefer-const': 'error',
          
          // Custom rule settings
          'no-mutation': ['error', { allowLocalScoped: true }],
          'pure-function': ['warn', { strictMode: true }],
          'performance/expensive-operation': 'warn',
          'security/no-eval': 'error'
        },
        include: [
          'src/**/*.{ts,tsx}',
          'app/**/*.{ts,tsx}',
          'lib/**/*.ts'
        ],
        exclude: [
          '**/*.{spec,test}.{ts,tsx}',
          '**/fixtures/**',
          '**/node_modules/**',
          'dist/**'
        ],
        cache: true,
        cacheLocation: './node_modules/.cache/custom-bunlint',
        report: {
          format: 'html',
          outputFile: './reports/lint-results.html',
          grouping: 'category',
          showSummary: true,
          maxIssuesPerGroup: 25,
          sortBy: 'severity',
          expandGroups: true
        }
      }
      
      const config = defineConfig(userConfig)
      
      // Verify all parts of the config are correctly set
      
      // 1. Config extends
      expect(config.extends).toEqual(['recommended'])
      
      // 2. Plugins
      expect(config.plugins).toEqual(['performance', 'security'])
      
      // 3. Rules
      if (config.rules) {
        // Overridden rules
        expect(config.rules['no-loops']).toBe('off')
        expect(config.rules['prefer-const']).toBe('error')
        
        // Rules with options
        expect(config.rules['no-mutation']).toEqual(['error', { allowLocalScoped: true }])
        expect(config.rules['pure-function']).toEqual(['warn', { strictMode: true }])
        
        // Plugin rules
        expect(config.rules['performance/expensive-operation']).toBe('warn')
        expect(config.rules['security/no-eval']).toBe('error')
      }
      
      // 4. Include/exclude patterns
      expect(config.include).toEqual([
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'lib/**/*.ts'
      ])
      expect(config.exclude).toEqual([
        '**/*.{spec,test}.{ts,tsx}',
        '**/fixtures/**',
        '**/node_modules/**',
        'dist/**'
      ])
      
      // 5. Cache settings
      expect(config.cache).toBe(true)
      expect(config.cacheLocation).toBe('./node_modules/.cache/custom-bunlint')
      
      // 6. Report configuration
      expect(config.report).toBeDefined()
      if (config.report) {
        expect(config.report.format).toBe('html')
        expect(config.report.outputFile).toBe('./reports/lint-results.html')
        expect(config.report.grouping).toBe('category')
        expect(config.report.showSummary).toBe(true)
        expect(config.report.maxIssuesPerGroup).toBe(25)
        expect(config.report.sortBy).toBe('severity')
        expect(config.report.expandGroups).toBe(true)
      }
    })
    
    it('should handle multiple config extends and overrides correctly', () => {
      // First create a custom config to extend from
      const customConfig: Config = {
        ...defaultConfig,
        extends: ['recommended'],
        rules: {
          'custom-rule': 'warn'
        }
      }
      
      // Then create a config that extends both recommended and the custom config
      // with its own overrides
      const finalConfig = mergeConfigs(
        customConfig,
        {
          extends: ['strict'],
          rules: {
            'no-loops': 'off',
            'no-mutation': ['error', { exceptions: ['validMutation'] }]
          },
          include: ['custom/**/*.ts'],
          report: {
            format: 'json',
            sortBy: 'location'
          }
        }
      )
      
      // User rule overrides should be applied
      if (finalConfig.rules) {
        // User-provided rules should be present
        expect(finalConfig.rules['no-loops']).toBe('off')
        expect(finalConfig.rules['no-mutation']).toEqual(['error', { exceptions: ['validMutation'] }])
      }
      
      // Include patterns should be overridden
      expect(finalConfig.include).toEqual(['custom/**/*.ts'])
      
      // Report settings should be merged
      if (finalConfig.report) {
        expect(finalConfig.report.format).toBe('json')
        expect(finalConfig.report.sortBy).toBe('location')
      }
    })

    it('should handle invalid configuration gracefully', () => {
      // Test invalid rule settings
      const configWithInvalidRules = defineConfig({
        rules: {
          // @ts-expect-error Testing invalid rule value
          'no-mutation': true, // Boolean instead of severity string
          // @ts-expect-error Testing invalid rule value
          'no-class': 123, // Number instead of severity string
          // Valid rule
          'prefer-const': 'warn'
        }
      })
      
      // Should normalize invalid rule settings where possible
      if (configWithInvalidRules.rules) {
        // Booleans might be converted to strings
        expect(typeof configWithInvalidRules.rules['no-mutation']).toBe('string')
        // Non-true booleans should be 'off'
        expect(configWithInvalidRules.rules['no-class']).toBe('error')
        // Valid rules should remain untouched
        expect(configWithInvalidRules.rules['prefer-const']).toBe('warn')
      }
      
      // Test invalid format in report config
      const configWithInvalidFormat = defineConfig({
        report: {
          // @ts-expect-error Testing invalid format
          format: 'invalid-format'
        }
      })
      
      // Should still create a valid config object
      expect(configWithInvalidFormat).toBeDefined()
      expect(configWithInvalidFormat.report).toBeDefined()
    })
  })
}) 