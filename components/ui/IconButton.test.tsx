import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders the icon child', () => {
    const tree = render(
      <IconButton accessibilityLabel="Close" onPress={() => undefined}>
        <Text testID="icon">×</Text>
      </IconButton>,
    );
    expect(tree.getByTestId('icon')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    const tree = render(
      <IconButton accessibilityLabel="Close" onPress={onPress}>
        <Text>×</Text>
      </IconButton>,
    );
    fireEvent.press(tree.getByLabelText('Close'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['light', 'dark'] as const)('accepts tone=%s', (tone) => {
    const tree = render(
      <IconButton accessibilityLabel="x" tone={tone} onPress={() => undefined}>
        <Text>×</Text>
      </IconButton>,
    );
    expect(tree.getByLabelText('x')).toBeTruthy();
  });
});
