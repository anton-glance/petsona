import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { TopRow } from './TopRow';

describe('TopRow', () => {
  it('renders all three slots', () => {
    const tree = render(
      <TopRow
        back={<Text testID="back">‹</Text>}
        center={<Text testID="center">●</Text>}
        right={<Text testID="right">1/3</Text>}
      />,
    );
    expect(tree.getByTestId('back')).toBeTruthy();
    expect(tree.getByTestId('center')).toBeTruthy();
    expect(tree.getByTestId('right')).toBeTruthy();
  });

  it('omits unset slots without crashing', () => {
    const tree = render(<TopRow center={<Text testID="center">●</Text>} />);
    expect(tree.getByTestId('center')).toBeTruthy();
  });
});
