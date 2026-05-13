import { render } from '@testing-library/react-native';
import * as React from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { motion, useReducedMotion } from './motion';

describe('motion tokens — durations', () => {
  it('matches tokens.css --motion-* in milliseconds', () => {
    expect(motion.duration.instant).toBe(60);
    expect(motion.duration.fast).toBe(150);
    expect(motion.duration.medium).toBe(260);
    expect(motion.duration.slow).toBe(420);
    expect(motion.duration.languid).toBe(700);
  });
});

describe('motion tokens — easings', () => {
  it('exposes primary and out as truthy values (Reanimated bezier handles)', () => {
    expect(motion.easing.primary).toBeTruthy();
    expect(motion.easing.out).toBeTruthy();
  });
});

describe('useReducedMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false by default', () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let captured: boolean | undefined;
    function Probe(): React.JSX.Element {
      captured = useReducedMotion();
      return <View />;
    }
    render(<Probe />);
    expect(captured).toBe(false);
  });

  it('subscribes to reduceMotionChanged events', () => {
    const addListener = jest.spyOn(AccessibilityInfo, 'addEventListener');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    function Probe(): React.JSX.Element {
      useReducedMotion();
      return <View />;
    }
    render(<Probe />);
    expect(addListener).toHaveBeenCalledWith('reduceMotionChanged', expect.any(Function));
  });
});
