// eslint-disable-next-line custom-rules/enforce-central-utilities
import * as path from 'path'

type PathFunction = (...args: string[]) => string

export function withNormalization<T extends PathFunction>(
  operation: T,
  normalize = false
): T {
  return ((...args: string[]): string => {
    const normalizedArgs = normalize
      ? args.map((arg) => (typeof arg === 'string' ? path.normalize(arg) : arg))
      : args

    const result = operation(...normalizedArgs)
    return typeof result === 'string' && normalize
      ? path.normalize(result)
      : result
  }) as T
}

export function withBooleanNormalization(
  operation: (path: string) => boolean
): (path: string) => boolean {
  return (path: string): boolean => {
    const normalizedPath = typeof path === 'string' ? path : String(path)
    return operation(normalizedPath)
  }
}

export const join = withNormalization(path.join, true)
export const resolve = withNormalization(path.resolve)
export const relative = withNormalization(path.relative)
export const dirname = withNormalization(path.dirname)
export const basename = withNormalization(path.basename)
export const extname = withNormalization(path.extname)
export const isAbsolute = withBooleanNormalization(path.isAbsolute)

export const toUrlPath = (filePath: string): string => {
  return filePath.replace(/\\/g, '/')
}

export const changeExtension = (filePath: string, ext: string): string => {
  return path.join(
    path.dirname(filePath),
    path.basename(filePath, path.extname(filePath)) + ext
  )
}
