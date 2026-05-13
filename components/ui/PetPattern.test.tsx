import { render } from '@testing-library/react-native';
import * as React from 'react';

import { PetPattern } from './PetPattern';

describe('PetPattern', () => {
  it('renders without crashing for cat species', () => {
    const tree = render(<PetPattern species="cat" testID="pp" />);
    expect(tree.getByTestId('pp')).toBeTruthy();
  });

  it('renders without crashing for dog species', () => {
    const tree = render(<PetPattern species="dog" testID="pp" />);
    expect(tree.getByTestId('pp')).toBeTruthy();
  });

  it('renders without crashing for unknown species (default cat-mode visuals)', () => {
    const tree = render(<PetPattern species="unknown" testID="pp" />);
    expect(tree.getByTestId('pp')).toBeTruthy();
  });

  it('respects the opacity prop on the root element', () => {
    const tree = render(<PetPattern species="cat" opacity={0.5} testID="pp" />);
    const root = tree.getByTestId('pp');
    // Style is an array because the root composes absoluteFillObject + opacity prop.
    expect(root.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.5 })]),
    );
  });
});
