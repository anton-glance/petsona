import * as Sentry from '@sentry/react-native';

import { createLogger } from './logger';

describe('logger', () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.clearAllMocks();
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('info() writes to console.info and does not throw', () => {
    const logger = createLogger();
    expect(() => logger.info('hello')).not.toThrow();
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("debug() is suppressed when level='info'", () => {
    const logger = createLogger({ level: 'info' });
    logger.debug('quiet please');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('error() always writes to console.error regardless of level', () => {
    const logger = createLogger({ level: 'error' });
    logger.error('something broke');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('forwards a context object as a structured argument', () => {
    const logger = createLogger({ level: 'info' });
    logger.info('with context', { requestId: 'abc-123' });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const args = infoSpy.mock.calls[0] ?? [];
    expect(args).toEqual(expect.arrayContaining(['with context']));
    const ctx = args.find(
      (a: unknown) => typeof a === 'object' && a !== null && !Array.isArray(a),
    ) as Record<string, unknown> | undefined;
    expect(ctx).toMatchObject({ requestId: 'abc-123' });
  });

  // New contract per R0-M4 + P-1: error → Sentry; info/warn → console only.

  it('error() routes to Sentry.captureException with the message', () => {
    const logger = createLogger();
    logger.error('something broke', { route: 'hello' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const call = (Sentry.captureException as jest.Mock).mock.calls[0] ?? [];
    expect(call[0]).toBeInstanceOf(Error);
    expect((call[0] as Error).message).toBe('something broke');
  });

  it('error() passes context object as extras to Sentry', () => {
    const logger = createLogger();
    logger.error('failure', { route: '/hello', code: 500 });
    const call = (Sentry.captureException as jest.Mock).mock.calls[0] ?? [];
    expect(call[1]).toEqual(expect.objectContaining({ extra: { route: '/hello', code: 500 } }));
  });

  it('info() does NOT call Sentry.captureException', () => {
    const logger = createLogger();
    logger.info('benign log');
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('warn() does NOT call Sentry.captureException', () => {
    const logger = createLogger();
    logger.warn('caution');
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
