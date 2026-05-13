/**
 * SpeciesSilhouette — cat or dog mark used as a ghosted hero overlay on the
 * Welcome screen and as a viewfinder framing aid on the capture screen.
 *
 * Path data mirrors `docs/design/05_ai_review.html` lines 22-26 (the dog
 * and cat <svg> tags). Two consumers in this milestone (welcome hero +
 * capture viewfinder); spike-journal precedent (R3-M4 generating screen,
 * R4-M2 step 10, sign-in screen) justifies extracting now.
 *
 * Backed by tokens: `colors.forest` (default tint), `colors.ivory` (eyes).
 */
import * as React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '../../lib/theme';

export interface SpeciesSilhouetteProps {
  species: 'cat' | 'dog';
  /** Stroke / fill color. Default: `colors.forest`. */
  tint?: string;
  testID?: string;
}

export function SpeciesSilhouette(props: SpeciesSilhouetteProps): React.JSX.Element {
  const { species, tint = colors.forest, testID } = props;
  const wrapStyle: ViewStyle = { width: '100%', height: '100%' };
  if (species === 'cat') {
    return (
      <View style={wrapStyle} testID={testID}>
        <Svg
          testID="silhouette-cat"
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
        >
          <Path
            fill={tint}
            d="M5 4l3 5 1-1V4z M19 4l-3 5-1-1V4z M5 10c0-2 3-5 7-5s7 3 7 5v6c0 2-2 4-4 4H9c-2 0-4-2-4-4z"
          />
          <Circle cx="9" cy="12" r="0.8" fill={colors.ivory} />
          <Circle cx="15" cy="12" r="0.8" fill={colors.ivory} />
        </Svg>
      </View>
    );
  }
  return (
    <View style={wrapStyle} testID={testID}>
      <Svg
        testID="silhouette-dog"
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
      >
        <Path
          fill={tint}
          d="M4 11c0-4 4-6 8-6s8 2 8 6v4c0 2-2 4-4 4H8c-2 0-4-2-4-4V11z M5 7c-1 2-1 5 0 7M19 7c1 2 1 5 0 7"
        />
        <Circle cx="9" cy="11" r="0.9" fill={colors.ivory} />
        <Circle cx="15" cy="11" r="0.9" fill={colors.ivory} />
        <Ellipse cx="12" cy="14" rx="1" ry="0.7" fill={colors.ivory} />
      </Svg>
    </View>
  );
}
