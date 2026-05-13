/**
 * Regression guard: Expo Router's `require.context('app/')` scans the entire
 * app directory and treats every file as a route or layout — putting a test
 * file there pulls @testing-library/react-native into the Metro bundle and
 * breaks compilation on device. Documented as a hard rule in CLAUDE.md.
 *
 * If this test fails, MOVE the offending file(s) out of `app/` (typically to
 * `__tests__/app/...`) and fix the relative imports. See
 * `docs/07_TROUBLESHOOTING.md` 2026-05-13 entry.
 *
 * Glob matches Jest's full default pattern (.test + .spec) so a future
 * .spec.* file in app/ can't slide through either.
 */
import path from 'node:path';

import { sync as glob } from 'fast-glob';

describe('Expo Router constraint', () => {
  it('no test or spec files exist under app/ (would break Metro bundling)', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const offenders = glob('app/**/*.{test,spec}.{ts,tsx}', { cwd: repoRoot });
    expect(offenders).toEqual([]);
  });
});
