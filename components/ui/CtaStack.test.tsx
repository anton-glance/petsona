import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { CtaStack } from './CtaStack';

describe('CtaStack', () => {
  it('renders children', () => {
    const tree = render(
      <CtaStack>
        <Text testID="a">A</Text>
        <Text testID="b">B</Text>
      </CtaStack>,
    );
    expect(tree.getByTestId('a')).toBeTruthy();
    expect(tree.getByTestId('b')).toBeTruthy();
  });

  it('accepts position="bottom" (default) and position="inline"', () => {
    const a = render(<CtaStack position="bottom"><Text>a</Text></CtaStack>);
    const b = render(<CtaStack position="inline"><Text>b</Text></CtaStack>);
    expect(a.getByText('a')).toBeTruthy();
    expect(b.getByText('b')).toBeTruthy();
  });
});
