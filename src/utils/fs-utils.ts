import * as fsPromises from 'fs/promises'

import { createError, ErrorSeverity } from './error-utils'

const wrapErrorHandler = <T>(
  operation: (filePath: string) => Promise<T>,
  errorMessage: string
): ((filePath: string) => Promise<T>) => {
  return async (filePath: string): Promise<T> => {
    try {
      return await operation(filePath)
    } catch (error) {
      throw createError(
        `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
        'FS_ERROR',
        ErrorSeverity.ERROR,
        { file: 'fs-utils.ts', function: 'wrapErrorHandler' },
        error instanceof Error ? error : null
      )
    }
  }
}

const wrapBinaryErrorHandler = <T, P>(
  operation: (arg1: T, arg2: P) => Promise<void>,
  errorMessage: string
): ((arg1: T, arg2: P) => Promise<void>) => {
  return async (arg1: T, arg2: P): Promise<void> => {
    try {
      await operation(arg1, arg2)
    } catch (error) {
      throw createError(
        `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
        'FS_ERROR',
        ErrorSeverity.ERROR,
        { file: 'fs-utils.ts', function: 'wrapBinaryErrorHandler' },
        error instanceof Error ? error : null
      )
    }
  }
}

const fileOperations = {
  exists: (filePath: string): Promise<boolean> =>
    fsPromises
      .access(filePath)
      .then(() => true)
      .catch(() => false),
  read: (filePath: string): Promise<string> =>
    fsPromises.readFile(filePath, 'utf-8'),
  readJson: <T extends Record<string, never>>(filePath: string): Promise<T> =>
    fsPromises
      .readFile(filePath, 'utf-8')
      .then((content) => JSON.parse(content) as T),
  write: (filePath: string, content: string): Promise<void> =>
    fsPromises.writeFile(filePath, content, 'utf-8'),
  remove: (filePath: string): Promise<void> => fsPromises.unlink(filePath),
}

const dirOperations = {
  ensure: (dirPath: string): Promise<void> =>
    fsPromises.mkdir(dirPath, { recursive: true }).then(() => undefined),
  remove: (
    dirPath: string,
    options: { recursive?: boolean, force?: boolean }
  ): Promise<void> => fsPromises.rm(dirPath, options),
}

export const exists = wrapErrorHandler(
  fileOperations.exists,
  'Failed to check if file exists'
)
export const readFile = wrapErrorHandler(
  fileOperations.read,
  'Failed to read file'
)
export const readJsonFile = <T extends Record<string, never>>(
  filePath: string
): Promise<T> =>
  wrapErrorHandler(
    fileOperations.readJson<T>,
    'Failed to read or parse JSON file'
  )(filePath)

export const writeFile = wrapBinaryErrorHandler(
  (filePath: string, content: string): Promise<void> =>
    fileOperations.write(filePath, content),
  'Failed to write file'
)

export const ensureDir = wrapErrorHandler(
  dirOperations.ensure,
  'Failed to create directory'
)

export const copyFile = wrapBinaryErrorHandler(
  async (sourcePath: string, destPath: string): Promise<void> => {
    await fsPromises.copyFile(sourcePath, destPath)
  },
  'Failed to copy file'
)

export const removeFile = wrapErrorHandler(
  fileOperations.remove,
  'Failed to remove file'
)

export const removeDir = wrapBinaryErrorHandler(
  (
    dirPath: string,
    options: { recursive?: boolean, force?: boolean } = {}
  ): Promise<void> => dirOperations.remove(dirPath, options),
  'Failed to remove directory'
)