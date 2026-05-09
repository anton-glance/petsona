// This module is the only authorized wrapper around console.* — see eslint.config.js
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

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function defaultLevel(): LogLevel {
  // __DEV__ is the React Native global; fall back to NODE_ENV for non-RN runtimes (jest, edge fn).
  const dev =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { __DEV__?: boolean }).__DEV__ === 'boolean'
      ? (globalThis as { __DEV__?: boolean }).__DEV__
      : process.env.NODE_ENV !== 'production';
  return dev ? 'debug' : 'info';
}

export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const min = LEVEL_ORDER[opts.level ?? defaultLevel()];
  const emit = (
    level: LogLevel,
    sink: (message: string, context?: Record<string, unknown>) => void,
    message: string,
    context?: Record<string, unknown>,
  ): void => {
    if (LEVEL_ORDER[level] < min) return;
    if (context !== undefined) {
      sink(message, context);
    } else {
      sink(message);
    }
  };
  return {
    debug: (message, context) =>
      emit('debug', (m, c) => (c ? console.debug(m, c) : console.debug(m)), message, context),
    info: (message, context) =>
      emit('info', (m, c) => (c ? console.info(m, c) : console.info(m)), message, context),
    warn: (message, context) =>
      emit('warn', (m, c) => (c ? console.warn(m, c) : console.warn(m)), message, context),
    error: (message, context) =>
      emit('error', (m, c) => (c ? console.error(m, c) : console.error(m)), message, context),
  };
}

export const logger: Logger = createLogger();
