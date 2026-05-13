import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { Segmented } from './Segmented';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
] as const;

describe('Segmented', () => {
  it('renders every option label', () => {
    const tree = render(<Segmented options={[...OPTIONS]} value="a" onChange={() => undefined} />);
    expect(tree.getByText('Alpha')).toBeTruthy();
    expect(tree.getByText('Beta')).toBeTruthy();
    expect(tree.getByText('Gamma')).toBeTruthy();
  });

  it('marks the active option as selected', () => {
    const tree = render(<Segmented options={[...OPTIONS]} value="b" onChange={() => undefined} />);
    const tabs = tree.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]?.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    expect(tabs[1]?.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(tabs[2]?.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  });

  it('fires onChange when a non-active option is pressed', () => {
    const onChange = jest.fn();
    const tree = render(<Segmented options={[...OPTIONS]} value="a" onChange={onChange} />);
    fireEvent.press(tree.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('accepts tight prop', () => {
    const tree = render(<Segmented options={[...OPTIONS]} value="a" onChange={() => undefined} tight />);
    expect(tree.getByText('Alpha')).toBeTruthy();
  });
});
