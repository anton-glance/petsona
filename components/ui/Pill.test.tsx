import { render } from '@testing-library/react-native';
import * as React from 'react';

import { Pill } from './Pill';

describe('Pill', () => {
  it('renders children', () => {
    const tree = render(<Pill>NEW</Pill>);
    expect(tree.getByText('NEW')).toBeTruthy();
  });

  it.each(['honey', 'watch', 'forest'] as const)('accepts %s tone', (tone) => {
    const tree = render(<Pill tone={tone}>x</Pill>);
    expect(tree.getByText('x')).toBeTruthy();
  });

  it.each(['sm', 'md'] as const)('accepts %s size', (size) => {
    const tree = render(<Pill size={size}>x</Pill>);
    expect(tree.getByText('x')).toBeTruthy();
  });
});
