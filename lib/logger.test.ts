import { createLogger } from './logger';

describe('logger', () => {
  let infoSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('info() does not throw', () => {
    const logger = createLogger();
    expect(() => logger.info('hello')).not.toThrow();
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("debug() is suppressed when level='info'", () => {
    const logger = createLogger({ level: 'info' });
    logger.debug('quiet please');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('error() always emits regardless of level', () => {
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
});
