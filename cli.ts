#!/usr/bin/env bun
import { run } from './src/core';

run(process.argv.slice(2))
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('BunLint error:', error);
    process.exit(1);
  }); 