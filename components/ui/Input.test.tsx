import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { Input } from './Input';

describe('Input', () => {
  it('renders the value', () => {
    const tree = render(<Input value="Mochi" onChangeText={() => undefined} />);
    expect(tree.getByDisplayValue('Mochi')).toBeTruthy();
  });

  it('fires onChangeText when the value changes', () => {
    const onChangeText = jest.fn();
    const tree = render(<Input value="" onChangeText={onChangeText} placeholder="Name" />);
    fireEvent.changeText(tree.getByPlaceholderText('Name'), 'Mochi');
    expect(onChangeText).toHaveBeenCalledWith('Mochi');
  });

  it('renders the label when provided', () => {
    const tree = render(
      <Input value="" onChangeText={() => undefined} label="PET NAME" />,
    );
    expect(tree.getByText('PET NAME')).toBeTruthy();
  });

  it('renders the error message when provided', () => {
    const tree = render(
      <Input value="" onChangeText={() => undefined} error="Required" />,
    );
    expect(tree.getByText('Required')).toBeTruthy();
  });
});
