import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { BackButton } from './BackButton';

describe('BackButton', () => {
  it('renders the default label', () => {
    const tree = render(<BackButton onPress={() => undefined} />);
    // Default label comes through i18n; the rendered label depends on the
    // initialized locale. Confirm the literal chevron is present.
    expect(tree.getByText('‹')).toBeTruthy();
  });

  it('renders a custom label when provided', () => {
    const tree = render(<BackButton label="Retake" onPress={() => undefined} />);
    expect(tree.getByText('Retake')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    const tree = render(<BackButton label="Back" onPress={onPress} />);
    fireEvent.press(tree.getByText('Back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
