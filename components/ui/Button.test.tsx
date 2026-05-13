import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { Button } from './Button';

describe('Button', () => {
  it('renders the label', () => {
    const tree = render(<Button onPress={() => undefined}>Get started</Button>);
    expect(tree.getByText('Get started')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    const tree = render(<Button onPress={onPress}>Tap</Button>);
    fireEvent.press(tree.getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    const tree = render(
      <Button onPress={onPress} disabled>
        Tap
      </Button>,
    );
    fireEvent.press(tree.getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'text', 'dark', 'outline', 'honeyText'] as const)(
    'accepts %s variant',
    (variant) => {
      const tree = render(
        <Button onPress={() => undefined} variant={variant}>
          v
        </Button>,
      );
      expect(tree.getByText('v')).toBeTruthy();
    },
  );

  it('shows a spinner when loading and hides the label', () => {
    const tree = render(
      <Button onPress={() => undefined} loading>
        Submit
      </Button>,
    );
    expect(tree.queryByText('Submit')).toBeNull();
  });
});
