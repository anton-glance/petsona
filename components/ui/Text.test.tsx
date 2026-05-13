import { render } from '@testing-library/react-native';
import * as React from 'react';

import { Text } from './Text';

describe('Text', () => {
  it('renders children with default body variant', () => {
    const tree = render(<Text>hello</Text>);
    expect(tree.getByText('hello')).toBeTruthy();
  });

  it.each(['displayXl', 'displayLg', 'displayMd', 'bodyLg', 'body', 'caption'] as const)(
    'accepts %s variant',
    (variant) => {
      const tree = render(<Text variant={variant}>v</Text>);
      const node = tree.getByText('v');
      expect(node).toBeTruthy();
    },
  );

  it.each(['default', 'soft', 'muted', 'inverse'] as const)('accepts %s tone', (tone) => {
    const tree = render(<Text tone={tone}>t</Text>);
    expect(tree.getByText('t')).toBeTruthy();
  });

  it('renders the literal string under any variant + tone combo', () => {
    const tree = render(
      <Text variant="displayXl" tone="muted">
        Welcome Mochi
      </Text>,
    );
    expect(tree.getByText('Welcome Mochi')).toBeTruthy();
  });
});
