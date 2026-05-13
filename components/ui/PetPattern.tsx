/**
 * PetPattern — tiled paw + accent pattern used as an absolute-positioned
 * decoration behind splash + Welcome hero + (later) survey screens.
 *
 * Mirrors the `body.is-cat-mode .pet-pattern` and `body.is-dog-mode
 * .pet-pattern` background-image SVGs in `docs/design/screens.css`. We
 * compose the pattern as repeated React Native SVG instances rather than
 * a tiled background image — `react-native-svg`'s `<Pattern>` element
 * works but requires fixed dimensions; a small fixed-position tile grid
 * is simpler and matches the design's intent.
 *
 * Tones:
 *  - `normal` (default) — terracotta / forest-soft / honey paws over an
 *    ivory or honey-tint surface. Used on splash.
 *  - `ivory` — solid ivory paws used on the WOW hero where the parent is
 *    dark (forest fill on the photo-hero region per screens.css line
 *    229-234 `.review .photo-paws`).
 *
 * Cat mode adds a fish accent; dog mode adds a bone accent. Both are
 * decorative-only with `pointerEvents='none'`.
 *
 * Backed by tokens: `colors.terracotta`, `colors.forestSoft`, `colors.honey`,
 * `colors.ivory`.
 */
import * as React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '../../lib/theme';

export interface PetPatternProps {
  species: 'cat' | 'dog' | 'unknown';
  /** Default 0.22. The screens.css recipes use 0.22 for hero, 0.08 for survey backgrounds. */
  opacity?: number;
  /** `ivory` flips paws to solid ivory (used on the dark hero). Default `normal`. */
  tone?: 'normal' | 'ivory';
  testID?: string;
}

interface PatchProps {
  cx: number;
  cy: number;
  rotate: number;
  fill: string;
}

function PawPatch({ cx, cy, rotate, fill }: PatchProps): React.JSX.Element {
  // Paw glyph: ellipse pad + four toe circles. Mirrors components.css's
  // .paw-icon mask geometry but baked into a positioned <Svg>.
  return (
    <Svg
      style={{ position: 'absolute', left: cx, top: cy, width: 24, height: 21 }}
      viewBox="0 0 24 21"
    >
      <Svg width={24} height={21} viewBox="0 0 24 21" rotation={rotate} originX={12} originY={10}>
        <Ellipse cx="12" cy="15" rx="5" ry="4" fill={fill} />
        <Circle cx="6" cy="9" r="2.2" fill={fill} />
        <Circle cx="18" cy="9" r="2.2" fill={fill} />
        <Circle cx="9" cy="5" r="1.8" fill={fill} />
        <Circle cx="15" cy="5" r="1.8" fill={fill} />
      </Svg>
    </Svg>
  );
}

function HeartPatch({ cx, cy, fill }: { cx: number; cy: number; fill: string }): React.JSX.Element {
  return (
    <Svg
      style={{ position: 'absolute', left: cx, top: cy, width: 14, height: 16 }}
      viewBox="0 0 14 16"
    >
      <Path
        d="M7 15 Q0 9 0 4 Q0 0 3 0 Q6 0 7 4 Q8 0 11 0 Q14 0 14 4 Q14 9 7 15 Z"
        fill={fill}
      />
    </Svg>
  );
}

// Cat accent: fish silhouette. Dog accent: bone. Both follow the design CSS.
function FishPatch({ cx, cy, fill }: { cx: number; cy: number; fill: string }): React.JSX.Element {
  return (
    <Svg
      style={{ position: 'absolute', left: cx, top: cy, width: 22, height: 16 }}
      viewBox="0 0 22 16"
    >
      <Path
        d="M0 8 Q-2 0 6 0 Q14 0 16 4 L 22 0 L 22 14 L 16 12 Q 14 16 6 16 Q -2 16 0 8 Z"
        fill={fill}
      />
      <Circle cx="6" cy="6" r="1.2" fill={colors.ivory} />
    </Svg>
  );
}

function BonePatch({ cx, cy, fill }: { cx: number; cy: number; fill: string }): React.JSX.Element {
  return (
    <Svg
      style={{ position: 'absolute', left: cx, top: cy, width: 24, height: 10 }}
      viewBox="-12 -5 24 10"
    >
      <Circle cx="-9" cy="-2" r="4" fill={fill} />
      <Circle cx="-9" cy="2" r="4" fill={fill} />
      <Path d="M-9 -2 L9 -2 L9 2 L-9 2 Z" fill={fill} />
      <Circle cx="9" cy="-2" r="4" fill={fill} />
      <Circle cx="9" cy="2" r="4" fill={fill} />
    </Svg>
  );
}

interface PatternItem {
  kind: 'paw' | 'fish' | 'bone' | 'heart';
  cx: number;
  cy: number;
  rotate?: number;
  fill: string;
}

function patternFor(species: 'cat' | 'dog' | 'unknown', tone: 'normal' | 'ivory'): PatternItem[] {
  const ivory = tone === 'ivory';
  const paw1 = ivory ? colors.ivory : colors.terracotta;
  const paw2 = ivory ? colors.ivory : colors.forestSoft;
  const accent = ivory ? colors.ivory : colors.honey;
  const heart = ivory ? colors.ivory : colors.terracotta;
  const items: PatternItem[] = [
    { kind: 'paw', cx: 32, cy: 28, rotate: -14, fill: paw1 },
    { kind: 'paw', cx: 110, cy: 24, rotate: 8, fill: paw2 },
    { kind: 'paw', cx: 168, cy: 90, rotate: 16, fill: paw1 },
    { kind: 'paw', cx: 86, cy: 155, rotate: -10, fill: paw2 },
    { kind: 'heart', cx: 56, cy: 110, fill: heart },
    { kind: 'heart', cx: 155, cy: 135, fill: heart },
  ];
  // Cat mode → fish accent; dog mode → bone accent. Unknown defaults to cat.
  const dog = species === 'dog';
  if (dog) {
    items.push({ kind: 'bone', cx: 70, cy: 80, rotate: -20, fill: accent });
    items.push({ kind: 'bone', cx: 30, cy: 165, rotate: 15, fill: accent });
    items.push({ kind: 'bone', cx: 160, cy: 180, rotate: -8, fill: accent });
  } else {
    items.push({ kind: 'fish', cx: 70, cy: 80, fill: accent });
    items.push({ kind: 'fish', cx: 30, cy: 165, fill: accent });
    items.push({ kind: 'fish', cx: 160, cy: 180, fill: accent });
  }
  return items;
}

export function PetPattern(props: PetPatternProps): React.JSX.Element {
  const { species, opacity = 0.22, tone = 'normal', testID } = props;
  const items = patternFor(species, tone);
  return (
    <View testID={testID} pointerEvents="none" style={[styles.root, { opacity }]}>
      {items.map((item, i) => {
        const key = `${item.kind}-${i}`;
        switch (item.kind) {
          case 'paw':
            return <PawPatch key={key} cx={item.cx} cy={item.cy} rotate={item.rotate ?? 0} fill={item.fill} />;
          case 'fish':
            return <FishPatch key={key} cx={item.cx} cy={item.cy} fill={item.fill} />;
          case 'bone':
            return <BonePatch key={key} cx={item.cx} cy={item.cy} fill={item.fill} />;
          case 'heart':
            return <HeartPatch key={key} cx={item.cx} cy={item.cy} fill={item.fill} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
});
