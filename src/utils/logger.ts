/**
 * Structured logger utility.
 * Wraps console methods to allow easy future integration with
 * remote logging services (Sentry, Datadog, etc.) and
 * environment-aware log-level filtering.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) ||
  (import.meta.env.DEV ? 'debug' : 'warn');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatPrefix(namespace: string): string {
  return `[${namespace}]`;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Create a namespaced logger.
 *
 * @example
 * const log = createLogger('AuthService');
 * log.info('User logged in', { userId });
 * log.error('Login failed', error);
 */
export function createLogger(namespace: string): Logger {
  const prefix = formatPrefix(namespace);

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) console.debug(prefix, ...args);
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) console.info(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) console.error(prefix, ...args);
    },
  };
}
