import { render } from '@testing-library/react-native';
import * as React from 'react';

import { ProgressDots } from './ProgressDots';

describe('ProgressDots', () => {
  it('renders the right number of dots', () => {
    const tree = render(<ProgressDots steps={3} active={0} />);
    expect(tree.getAllByTestId(/^progress-dot-/).length).toBe(3);
  });

  it('marks dots before the active index as done', () => {
    const tree = render(<ProgressDots steps={4} active={2} />);
    expect(tree.getByTestId('progress-dot-0').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
    expect(tree.getByTestId('progress-dot-2').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('handles edge: steps=1', () => {
    const tree = render(<ProgressDots steps={1} active={0} />);
    expect(tree.getAllByTestId(/^progress-dot-/).length).toBe(1);
  });
});
