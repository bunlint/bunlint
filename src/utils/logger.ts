import chalk from 'chalk'

import { getCurrentTimestamp } from './utils'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LoggerConfig {
  level: LogLevel
  timestamp: boolean
}

interface LoggerMethods {
  debug: (message: string, ...args: never[]) => void
  info: (message: string, ...args: never[]) => void
  warn: (message: string, ...args: never[]) => void
  error: (message: string, ...args: never[]) => void
  success: (message: string, ...args: never[]) => void
}

const createLogger = (config: LoggerConfig) => {
  const formatMessage = (
    message: string,
    color: chalk.ChalkFunction
  ): string => {
    const formatted = config.timestamp
      ? `${chalk.dim(`[${getCurrentTimestamp()}]`)} ${message}`
      : message
    return color(formatted)
  }

  const createLogMethod =
    (
      level: LogLevel,
      prefix: string,
      color: chalk.ChalkFunction,
      consoleMethod: typeof console.log
    ) =>
    (message: string, ...args: never[]): void => {
      if (config.level <= level) {
        consoleMethod(formatMessage(`${prefix}: ${message}`, color), ...args)
      }
    }

  return {
    debug: createLogMethod(LogLevel.DEBUG, 'DEBUG', chalk.blue, console.debug),
    info: createLogMethod(LogLevel.INFO, 'INFO', chalk.cyan, console.info),
    warn: createLogMethod(LogLevel.WARN, 'WARN', chalk.yellow, console.warn),
    error: createLogMethod(LogLevel.ERROR, 'ERROR', chalk.red, console.error),
    success: createLogMethod(
      LogLevel.INFO,
      'SUCCESS',
      chalk.green,
      console.info
    ),
  }
}

const loggerConfig = { level: LogLevel.INFO, timestamp: true }
const logger = createLogger(loggerConfig)

export const { debug, info, warn, error, success } = logger

export const createScopedLogger = (scope: string): LoggerMethods => {
  const scopedLogger = createLogger({
    level: loggerConfig.level,
    timestamp: loggerConfig.timestamp,
  })

  const coloredScope = chalk.magenta(`[${scope}]`)

  return {
    debug: (message, ...args) =>
      scopedLogger.debug(`${coloredScope} ${message}`, ...args),
    info: (message, ...args) =>
      scopedLogger.info(`${coloredScope} ${message}`, ...args),
    warn: (message, ...args) =>
      scopedLogger.warn(`${coloredScope} ${message}`, ...args),
    error: (message, ...args) =>
      scopedLogger.error(`${coloredScope} ${message}`, ...args),
    success: (message, ...args) =>
      scopedLogger.success(`${coloredScope} ${message}`, ...args),
  }
}
