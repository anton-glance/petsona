import { render } from '@testing-library/react-native';
import * as React from 'react';

import { SpeciesSilhouette } from './SpeciesSilhouette';

describe('SpeciesSilhouette', () => {
  it('renders a cat-tagged SVG when species is cat', () => {
    const tree = render(<SpeciesSilhouette species="cat" testID="sil" />);
    expect(tree.getByTestId('sil')).toBeTruthy();
    // The component encodes species in an internal testID for adapter tests.
    expect(tree.queryByTestId('silhouette-cat')).toBeTruthy();
    expect(tree.queryByTestId('silhouette-dog')).toBeNull();
  });

  it('renders a dog-tagged SVG when species is dog', () => {
    const tree = render(<SpeciesSilhouette species="dog" testID="sil" />);
    expect(tree.queryByTestId('silhouette-dog')).toBeTruthy();
    expect(tree.queryByTestId('silhouette-cat')).toBeNull();
  });
});
