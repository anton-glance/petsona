import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { PawCheckbox } from './PawCheckbox';

describe('PawCheckbox', () => {
  it('renders unchecked round by default', () => {
    const tree = render(<PawCheckbox checked={false} onPress={() => undefined} />);
    expect(tree.getByRole('checkbox')).toBeTruthy();
  });

  it.each(['round', 'square'] as const)('accepts shape=%s', (shape) => {
    const tree = render(<PawCheckbox shape={shape} checked={false} onPress={() => undefined} />);
    expect(tree.getByRole('checkbox')).toBeTruthy();
  });

  it('exposes checked state via accessibility', () => {
    const tree = render(<PawCheckbox checked onPress={() => undefined} />);
    const node = tree.getByRole('checkbox');
    expect(node.props.accessibilityState).toEqual(expect.objectContaining({ checked: true }));
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const tree = render(<PawCheckbox checked={false} onPress={onPress} />);
    fireEvent.press(tree.getByRole('checkbox'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
