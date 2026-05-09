export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface CreateLoggerOptions {
  level?: LogLevel;
}

export function createLogger(_opts: CreateLoggerOptions = {}): Logger {
  const noop = (_message: string, _context?: Record<string, unknown>): void => {
    // stub — real implementation lands in feat commit
  };
  return { debug: noop, info: noop, warn: noop, error: noop };
}

export const logger: Logger = createLogger();
