/**
 * Petsona — Motion tokens + reduce-motion handling.
 *
 * Five duration constants matching `tokens.css --motion-*`:
 *  - `instant`  60ms   — tap feedback, press scale
 *  - `fast`     150ms  — toggles, chips, color shifts
 *  - `medium`   260ms  — screen transitions, card reveals
 *  - `slow`     420ms  — splash → app, plan-day reveal
 *  - `languid`  700ms  — loading shimmers, decorative motion
 *
 * Two easing curves built from `Easing.bezier(...)` so consumers can pass
 * them straight to Reanimated's `withTiming`. Bezier values mirror
 * `tokens.css --easing-{primary,out}` exactly:
 *  - `primary` cubic-bezier(0.32, 0.72, 0.0, 1)
 *  - `out`     cubic-bezier(0.50, 0.00, 0.4, 1)
 *
 * `useReducedMotion()` returns the live value of
 * `AccessibilityInfo.isReduceMotionEnabled()`. Consumers branch on it to
 * drop durations to ~0ms when the user prefers reduced motion.
 *
 * Babel auto-config: `babel-preset-expo` auto-adds
 * `react-native-worklets/plugin` when the package is installed (verified
 * 2026-05-12 in node_modules/babel-preset-expo/build/index.js lines
 * 313-320). `babel.config.js` is NOT modified.
 */
import * as React from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    instant: 60,
    fast: 150,
    medium: 260,
    slow: 420,
    languid: 700,
  },
  easing: {
    primary: Easing.bezier(0.32, 0.72, 0.0, 1),
    out: Easing.bezier(0.5, 0.0, 0.4, 1),
  },
} as const;

export type MotionDurationKey = keyof typeof motion.duration;
export type MotionEasingKey = keyof typeof motion.easing;

/**
 * Subscribes to `AccessibilityInfo.reduceMotionChanged` and returns the live
 * state. Consumers should treat `true` as "do not animate" (set durations
 * to 0 or skip the animation entirely).
 */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (!cancelled) setReduce(value);
      })
      .catch(() => {
        // Platforms without the capability default to off.
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
  return reduce;
}
