# Reporting System Tests Plan

## Overview

This document contains detailed test scenarios for the reporting system of BunLint. The reporting system is responsible for formatting, grouping, and displaying linting results in various formats.

## Test Categories

1. Formatter Tests
2. Grouping Tests
3. Filtering Tests
4. Output Format Tests
5. Integration Tests

## 1. Formatter Tests

### 1.1 Pretty Formatter

**Test:** Verify that the pretty formatter correctly formats linting results
**Given:** A set of linting results with various severities and locations
**Expected:**
- Errors and warnings have appropriate symbols (❌, ⚠️)
- Fixable issues are marked with the 🔧 symbol
- Line and column information is correctly displayed
- Rule IDs and messages are properly formatted
- Colors are applied appropriately for different severities

### 1.2 JSON Formatter

**Test:** Verify that the JSON formatter correctly outputs structured data
**Given:** A set of linting results
**Expected:**
- Output is valid JSON
- All result information is preserved (file, rule, severity, location, message)
- Fixability information is included
- Structure follows a consistent schema

### 1.3 Markdown Formatter

**Test:** Verify that the markdown formatter correctly generates markdown reports
**Given:** A set of linting results
**Expected:**
- Output is valid markdown
- Headers, lists, and code blocks are properly formatted
- File paths and rule IDs are appropriately highlighted
- Tables are used where appropriate
- Fixability information is included

### 1.4 Compact Formatter

**Test:** Verify that the compact formatter generates concise output
**Given:** A set of linting results
**Expected:**
- One issue per line format
- File, line, column, rule, and message information is included
- Output is suitable for CI environments
- Minimal use of special formatting or colors

## 2. Grouping Tests

### 2.1 Category Grouping

**Test:** Verify grouping by category
**Given:** Results with various rule categories (Functional, Immutability, Performance)
**Expected:**
- Results are grouped under appropriate category headings
- Custom category groups are respected (`customGroups` configuration)
- Catch-all category is used for uncategorized rules
- Count of issues is displayed for each group

### 2.2 File Grouping

**Test:** Verify grouping by file
**Given:** Results from multiple files
**Expected:**
- Results are grouped under file path headings
- Files with no issues are not included
- Files are sorted alphabetically or by issue count
- Count of issues is displayed for each file

### 2.3 Severity Grouping

**Test:** Verify grouping by severity
**Given:** Results with different severities (error, warning)
**Expected:**
- Results are grouped under severity headings
- Errors are displayed before warnings
- Count of issues is displayed for each severity level

### 2.4 Rule Grouping

**Test:** Verify grouping by rule
**Given:** Results from various rules
**Expected:**
- Results are grouped by rule ID
- Rule description is included in the heading
- Count of issues is displayed for each rule
- Rules are sorted alphabetically or by issue count

### 2.5 Fixability Grouping

**Test:** Verify grouping by fixability
**Given:** Results with both fixable and non-fixable issues
**Expected:**
- Results are grouped into "AUTO-FIXABLE" and "MANUAL FIX REQUIRED" sections
- Count of issues is displayed for each section
- Fixable issues are displayed first

### 2.6 Hierarchical Grouping

**Test:** Verify hierarchical grouping (e.g., file,rule)
**Given:** Results from multiple files and rules
**Expected:**
- Primary grouping (files) creates main sections
- Secondary grouping (rules) creates subsections within each file section
- Counts are displayed at both levels
- Structure is visually clear with appropriate indentation

## 3. Filtering Tests

### 3.1 Category Filtering

**Test:** Verify filtering by category
**Given:** Results with various categories and `--only-category` flag
**Expected:**
- Only results in specified categories are included
- Summary reflects the filtered count

### 3.2 Path Filtering

**Test:** Verify filtering by path
**Given:** Results from various paths and `--only-path` flag
**Expected:**
- Only results from specified paths are included
- Path patterns (globs) are correctly matched
- Summary reflects the filtered count

### 3.3 Rule Filtering

**Test:** Verify filtering by rule
**Given:** Results from various rules and `--only-rule` flag
**Expected:**
- Only results from specified rules are included
- Rule patterns (with wildcards) are correctly matched
- Summary reflects the filtered count

### 3.4 Severity Filtering

**Test:** Verify filtering by severity
**Given:** Results with different severities and `--only-severity` flag
**Expected:**
- Only results with specified severity are included
- Summary reflects the filtered count

## 4. Output Format Tests

### 4.1 Summary Information

**Test:** Verify summary information display
**Given:** A set of linting results with `showSummary: true`
**Expected:**
- Total number of issues is displayed
- Breakdown by severity (errors/warnings) is included
- Number of files analyzed is included
- Performance timing information is displayed
- Count of auto-fixable issues is shown

### 4.2 Max Issues Display

**Test:** Verify max issues display limit
**Given:** A large number of issues and `maxIssuesPerGroup` configuration
**Expected:**
- Only the specified number of issues are displayed per group
- An indication of additional hidden issues is shown
- Most severe or relevant issues are prioritized for display

### 4.3 Sorting

**Test:** Verify result sorting
**Given:** Results with `sortBy` configuration
**Expected:**
- Results are sorted according to the specified criteria (severity, location, rule)
- Sort order is consistent and predictable

### 4.4 Group Expansion

**Test:** Verify group expansion behavior
**Given:** Results with `expandGroups` configuration
**Expected:**
- Groups are expanded or collapsed according to configuration
- When collapsed, group summary information is still visible

## 5. Integration Tests

### 5.1 CLI Report Command

**Test:** Verify the `bunlint report` command
**Given:** A project with linting issues
**Expected:**
- Report is generated in the specified format
- Output file is created if specified
- All configuration options are respected

### 5.2 Programmatic API

**Test:** Verify the programmatic reporting API
**Given:** `formatResults` function called with various options
**Expected:**
- Function returns formatted output as a string
- All configuration options are respected
- Error handling is appropriate

### 5.3 Real-world Result Sets

**Test:** Verify handling of large, complex result sets
**Given:** Results from linting a large codebase
**Expected:**
- Performance remains acceptable
- Memory usage is reasonable
- Output is well-structured and readable
- Summary information accurately reflects the result set

## Next Steps

1. Implement unit tests for each formatter
2. Implement unit tests for grouping logic
3. Implement unit tests for filtering logic
4. Create integration tests for the reporting system as a whole 