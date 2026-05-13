import { render } from '@testing-library/react-native';
import * as React from 'react';
import { AccessibilityInfo, Platform, Text, View } from 'react-native';

import { Glass, useReduceTransparency } from './glass';
import { glass } from './theme';

// Capture BlurView usage via a mock that renders a sentinel <View testID="blur-view">.
jest.mock('expo-blur', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock factory
  const BlurView = (props: any): React.JSX.Element =>
    React.createElement(RN.View, { testID: 'blur-view', ...props });
  return { BlurView };
});

describe('Glass component', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
    // Default to iOS — individual tests override via Platform.OS.
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children', () => {
    const tree = render(
      <Glass>
        <Text testID="child">hello</Text>
      </Glass>,
    );
    expect(tree.getByTestId('child')).toBeTruthy();
  });

  it('iOS path mounts a BlurView when reduce-transparency is off', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const tree = render(<Glass><Text>x</Text></Glass>);
    await Promise.resolve(); // flush the async hook update
    expect(tree.queryByTestId('blur-view')).toBeTruthy();
  });

  it('Android path never renders a BlurView', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const tree = render(<Glass><Text>x</Text></Glass>);
    await Promise.resolve();
    expect(tree.queryByTestId('blur-view')).toBeNull();
  });

  it('Android path renders the regular RGBA fill from theme tokens', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const tree = render(<Glass material="regular"><Text>x</Text></Glass>);
    await Promise.resolve();
    // The outer wrapper carries the fill backgroundColor.
    const outer = tree.UNSAFE_getAllByType(View)[0];
    expect(outer.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: glass.fill.regular })]),
    );
  });

  it('reduce-transparency flips iOS to opaque fill', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
    const tree = render(<Glass material="thick"><Text>x</Text></Glass>);
    // Allow the effect that resolves AccessibilityInfo to run.
    await Promise.resolve();
    await Promise.resolve();
    // When reduce-transparency is on, BlurView is suppressed.
    expect(tree.queryByTestId('blur-view')).toBeNull();
  });

  it('onDark uses the onDark fill', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const tree = render(<Glass onDark><Text>x</Text></Glass>);
    await Promise.resolve();
    const outer = tree.UNSAFE_getAllByType(View)[0];
    expect(outer.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: glass.fill.onDark })]),
    );
  });
});

describe('useReduceTransparency', () => {
  it('returns false by default', () => {
    let captured: boolean | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false);
    function Probe(): React.JSX.Element {
      captured = useReduceTransparency();
      return <View />;
    }
    render(<Probe />);
    expect(captured).toBe(false);
  });
});
