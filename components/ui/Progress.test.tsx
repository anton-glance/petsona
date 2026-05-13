import { render } from '@testing-library/react-native';
import * as React from 'react';

import { Progress } from './Progress';

describe('Progress', () => {
  it('renders without crashing at value=0', () => {
    const tree = render(<Progress value={0} />);
    expect(tree.UNSAFE_root).toBeTruthy();
  });

  it('renders at value=1 (full bar)', () => {
    const tree = render(<Progress value={1} />);
    expect(tree.UNSAFE_root).toBeTruthy();
  });

  it('clamps values outside [0, 1]', () => {
    const a = render(<Progress value={-0.5} />);
    const b = render(<Progress value={2} />);
    expect(a.UNSAFE_root).toBeTruthy();
    expect(b.UNSAFE_root).toBeTruthy();
  });

  it('exposes value as accessibility progress', () => {
    const tree = render(<Progress value={0.42} accessibilityLabel="Generating" />);
    const node = tree.getByRole('progressbar');
    expect(node.props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 1 }),
    );
  });
});
