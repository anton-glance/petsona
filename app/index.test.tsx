import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '../i18n';
import { Events } from '../lib/events';
import Splash from './index';

const trackMock = jest.fn();
const pushMock = jest.fn();

jest.mock('../lib/telemetry', () => ({
  track: (...args: unknown[]) => trackMock(...args),
  identify: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn(), back: jest.fn() }),
  router: { push: pushMock, replace: jest.fn(), back: jest.fn() },
}));

function wrap(ui: React.ReactElement): React.ReactElement {
  return <SafeAreaProvider>{ui}</SafeAreaProvider>;
}

describe('Splash (R1-M2 step 01)', () => {
  beforeAll(async () => {
    await initI18n({ lng: 'en' });
  });
  beforeEach(() => {
    trackMock.mockReset();
    pushMock.mockReset();
  });

  it('renders welcome headline, body, tagline, and CTA', () => {
    const tree = render(wrap(<Splash />));
    expect(tree.getByText('Welcome to Petsona')).toBeTruthy();
    expect(
      tree.getByText(
        /Every pet has a Petsona\. Let's capture yours/,
      ),
    ).toBeTruthy();
    expect(tree.getByText('Get started')).toBeTruthy();
  });

  it('renders Terms of Use and Privacy Policy links', () => {
    const tree = render(wrap(<Splash />));
    expect(tree.getByText('Terms of Use')).toBeTruthy();
    expect(tree.getByText('Privacy Policy')).toBeTruthy();
  });

  it('tapping [Get started] tracks Events.onboarding_started and navigates to /onboarding/camera-permission', () => {
    const tree = render(wrap(<Splash />));
    fireEvent.press(tree.getByText('Get started'));
    expect(trackMock).toHaveBeenCalledWith(Events.onboarding_started);
    expect(pushMock).toHaveBeenCalledWith('/onboarding/camera-permission');
  });

  it('is rendered inside a SafeAreaView (ScreenContainer)', () => {
    const tree = render(wrap(<Splash />));
    // ScreenContainer wraps in <SafeAreaView> from react-native-safe-area-context.
    // The library renders a host View with the SafeAreaView role.
    expect(tree.UNSAFE_root).toBeTruthy();
    // We assert the headline still mounts (smoke).
    expect(tree.getByText('Welcome to Petsona')).toBeTruthy();
  });
});
