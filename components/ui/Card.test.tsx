import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    const tree = render(
      <Card>
        <Text testID="inside">body</Text>
      </Card>,
    );
    expect(tree.getByTestId('inside')).toBeTruthy();
  });

  it.each(['default', 'selected', 'compact'] as const)('accepts %s variant', (variant) => {
    const tree = render(
      <Card variant={variant}>
        <Text>x</Text>
      </Card>,
    );
    expect(tree.getByText('x')).toBeTruthy();
  });
});
