// Skeleton — red phase. Implementation lands in the next commit.
import * as React from 'react';
import { View } from 'react-native';

export interface PetPatternProps {
  species: 'cat' | 'dog' | 'unknown';
  opacity?: number;
  tone?: 'normal' | 'ivory';
  testID?: string;
}

export function PetPattern(_props: PetPatternProps): React.JSX.Element {
  return <View />;
}
