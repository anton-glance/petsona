import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { ScreenContainer } from './ScreenContainer';

describe('ScreenContainer', () => {
  it('renders children', () => {
    const tree = render(
      <ScreenContainer>
        <Text testID="child">hi</Text>
      </ScreenContainer>,
    );
    expect(tree.getByTestId('child')).toBeTruthy();
  });

  it('accepts tone="light" (default) and tone="dark"', () => {
    const a = render(
      <ScreenContainer tone="light">
        <Text>x</Text>
      </ScreenContainer>,
    );
    const b = render(
      <ScreenContainer tone="dark">
        <Text>x</Text>
      </ScreenContainer>,
    );
    expect(a.getByText('x')).toBeTruthy();
    expect(b.getByText('x')).toBeTruthy();
  });
});
