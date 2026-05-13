import { Events } from './events';

const ALLOWED_DOMAIN_PREFIXES = [
  'app_',
  'screen_',
  'test_',
  'onboarding_',
  'plan_',
  'paywall_',
  'auth_',
];

describe('Events', () => {
  it('all values are non-empty snake_case lowercase strings', () => {
    const values = Object.values(Events);
    for (const value of values) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('all values are unique', () => {
    const values = Object.values(Events);
    expect(new Set(values).size).toBe(values.length);
  });

  it('all values start with an allowed domain prefix', () => {
    const values = Object.values(Events);
    for (const value of values) {
      const hasAllowedPrefix = ALLOWED_DOMAIN_PREFIXES.some((p) => value.startsWith(p));
      expect(hasAllowedPrefix).toBe(true);
    }
  });

  it('exposes app_launch, screen_view, and test_error_thrown', () => {
    expect(Events.app_launch).toBe('app_launch');
    expect(Events.screen_view).toBe('screen_view');
    expect(Events.test_error_thrown).toBe('test_error_thrown');
  });

  it('exposes the five R1-M2 onboarding funnel events', () => {
    expect(Events.onboarding_started).toBe('onboarding_started');
    expect(Events.onboarding_camera_permission_requested).toBe(
      'onboarding_camera_permission_requested',
    );
    expect(Events.onboarding_camera_permission_granted).toBe(
      'onboarding_camera_permission_granted',
    );
    expect(Events.onboarding_camera_permission_denied).toBe(
      'onboarding_camera_permission_denied',
    );
    expect(Events.onboarding_capture_completed).toBe('onboarding_capture_completed');
  });
});
