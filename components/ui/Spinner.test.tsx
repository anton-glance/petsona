import { render } from '@testing-library/react-native';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const tree = render(<Spinner />);
    expect(tree.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('accepts size="default" and size="lg"', () => {
    const a = render(<Spinner size="default" />);
    const b = render(<Spinner size="lg" />);
    expect(a.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(b.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('accepts tone="default" and tone="dim"', () => {
    const a = render(<Spinner tone="default" />);
    const b = render(<Spinner tone="dim" />);
    expect(a.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(b.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('passes accessibilityLabel through', () => {
    const tree = render(<Spinner accessibilityLabel="Loading photos" />);
    expect(tree.getByLabelText('Loading photos')).toBeTruthy();
  });
});
