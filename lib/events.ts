// Centralized event taxonomy for PostHog product analytics.
//
// Discipline: add a key here only when the corresponding user action exists in
// the app. R0-M4 ships the three below; R1-M2 adds the onboarding funnel;
// R1-M3 adds the welcome-confirmation rung.
//
// Naming: snake_case, domain_action_state, lowercase. Domain prefixes allowed:
// app_, screen_, test_, onboarding_, plan_, paywall_, auth_.
export const Events = {
  app_launch: 'app_launch',
  screen_view: 'screen_view',
  test_error_thrown: 'test_error_thrown',
  onboarding_started: 'onboarding_started',
  onboarding_camera_permission_requested: 'onboarding_camera_permission_requested',
  onboarding_camera_permission_granted: 'onboarding_camera_permission_granted',
  onboarding_camera_permission_denied: 'onboarding_camera_permission_denied',
  onboarding_capture_completed: 'onboarding_capture_completed',
  onboarding_welcome_confirmed: 'onboarding_welcome_confirmed',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
