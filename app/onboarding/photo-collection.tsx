/**
 * Photo collection — onboarding step 04 (D-017). Mockup:
 * `docs/design/04_photo_collection.html` (three states).
 *
 * Pure consumer of `captureSession`. Derives one of three states from
 * which slots are populated, then renders the matching layout:
 *
 *   - state 1 (front set, side+doc empty): "Now, a side view." Front=done,
 *     side=active, doc=optional. CTA "Capture side photo".
 *   - state 2 (front+side set, doc empty): "Got a document?" Front+side=
 *     done, doc=active. CTA "Capture document" + text "Skip vet docs".
 *   - state 3 (all three set): "Everything captured." All done with
 *     Retake buttons. CTA "Meet your pet" (will become "Meet {name}"
 *     once welcome screen captures a name in R2).
 *
 * Defensive cold-hit: if all three slots are null, router.replace('/')
 * back to splash. Same pattern as welcome's cold-hit guard.
 *
 * Retake buttons clear the corresponding slot in the slice and route
 * back to /onboarding/capture with that slot active.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

import {
  BackButton,
  Button,
  CtaStack,
  Pill,
  ProgressDots,
  ScreenContainer,
  Text,
} from '../../components/ui';
import { Glass } from '../../lib/glass';
import { Events } from '../../lib/events';
import { useAppStore, useCaptureSession, type CaptureSlot } from '../../lib/store';
import { colors, glass, shadow, spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

type CollectionState = 'state1' | 'state2' | 'state3';

function deriveState(
  hasFront: boolean,
  hasSide: boolean,
  hasDoc: boolean,
): CollectionState | 'empty' {
  if (!hasFront && !hasSide && !hasDoc) return 'empty';
  if (hasFront && !hasSide) return 'state1';
  if (hasFront && hasSide && !hasDoc) return 'state2';
  return 'state3';
}

export default function PhotoCollection(): React.JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useCaptureSession();
  const setCaptureSlot = useAppStore((s) => s.setCaptureSlot);

  const hasFront = session.photoPath !== null;
  const hasSide = session.sidePhotoPath !== null;
  const hasDoc = session.docPhotoPath !== null;
  const state = deriveState(hasFront, hasSide, hasDoc);

  // Defensive cold-hit redirect.
  React.useEffect(() => {
    if (state === 'empty') {
      router.replace('/');
    }
  }, [state, router]);

  if (state === 'empty') return null;

  const goCaptureSlot = (slot: CaptureSlot): void => {
    setCaptureSlot(slot);
    router.push('/onboarding/capture');
  };

  const handleSkip = (): void => {
    track(Events.onboarding_document_skipped);
    router.push('/onboarding/welcome');
  };

  const handleMeet = (): void => {
    router.push('/onboarding/welcome');
  };

  const activeIndex = state === 'state1' ? 1 : state === 'state2' ? 2 : 2;
  const stepLabel = state === 'state1' ? '1 / 3' : state === 'state2' ? '2 / 3' : '3 / 3';
  const title =
    state === 'state1'
      ? t('onboarding.collection.titleState1')
      : state === 'state2'
        ? t('onboarding.collection.titleState2')
        : t('onboarding.collection.titleState3');
  const body =
    state === 'state1'
      ? t('onboarding.collection.bodyState1')
      : state === 'state2'
        ? t('onboarding.collection.bodyState2')
        : t('onboarding.collection.bodyState3');

  return (
    <ScreenContainer tone="light">
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <ProgressDots steps={3} active={activeIndex} />
        <Text variant="caption" tone="muted">
          {stepLabel}
        </Text>
      </View>

      <Text variant="displayLg" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.body}>
        {body}
      </Text>

      <View style={styles.steps}>
        <PhotoCard
          slot="front"
          status={hasFront ? 'done' : 'active'}
          title={t('onboarding.collection.frontTitle')}
          subDone={t('onboarding.collection.frontSubDone')}
          subActive={t('onboarding.collection.frontSubActive')}
          onRetake={() => goCaptureSlot('front')}
        />
        <PhotoCard
          slot="side"
          status={hasSide ? 'done' : hasFront && !hasSide ? 'active' : 'pending'}
          title={t('onboarding.collection.sideTitle')}
          subDone={t('onboarding.collection.sideSubDone')}
          subActive={t('onboarding.collection.sideSubActive')}
          onRetake={() => goCaptureSlot('side')}
        />
        <PhotoCard
          slot="document"
          status={hasDoc ? 'done' : hasSide && !hasDoc ? 'active' : 'optional'}
          title={t('onboarding.collection.docTitle')}
          subDone={t('onboarding.collection.docSubDone')}
          subActive={t('onboarding.collection.docSubActive')}
          optional
          onRetake={() => goCaptureSlot('document')}
        />
      </View>

      <CtaStack>
        {state === 'state1' ? (
          <Button onPress={() => goCaptureSlot('side')}>
            {t('onboarding.collection.ctaCaptureSide')}
          </Button>
        ) : state === 'state2' ? (
          <>
            <Button onPress={() => goCaptureSlot('document')}>
              {t('onboarding.collection.ctaCaptureDocument')}
            </Button>
            <Button variant="text" onPress={handleSkip}>
              {t('onboarding.collection.ctaSkipDocs')}
            </Button>
          </>
        ) : (
          <Button onPress={handleMeet} accessibilityLabel="Meet your pet" testID="cta-meet">
            {t('onboarding.collection.ctaMeet')}
          </Button>
        )}
      </CtaStack>
    </ScreenContainer>
  );
}

interface PhotoCardProps {
  slot: CaptureSlot;
  status: 'done' | 'active' | 'pending' | 'optional';
  title: string;
  subDone: string;
  subActive: string;
  optional?: boolean;
  onRetake?: () => void;
}

function PhotoCard(props: PhotoCardProps): React.JSX.Element {
  const { slot, status, title, subDone, subActive, optional, onRetake } = props;
  const done = status === 'done';
  const active = status === 'active';
  const sub = done ? subDone : subActive;

  return (
    <Glass
      material={done ? 'thin' : 'regular'}
      style={[
        styles.cardBase,
        active ? styles.cardActive : undefined,
        shadow(active ? 'md' : 'sm'),
      ]}
      testID={`photo-card-${slot}`}
    >
      {optional && !done ? (
        <View style={styles.cornerPill}>
          <Pill tone="honey" size="sm">
            Optional
          </Pill>
        </View>
      ) : null}
      <View style={[styles.thumb, done ? styles.thumbDone : undefined]}>
        {done ? <PawGlyph color={colors.honey} /> : <SlotIcon slot={slot} />}
      </View>
      <View style={styles.info}>
        <Text variant="body" style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="muted" style={styles.cardSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {done && onRetake ? (
        <Button variant="honeyText" onPress={onRetake}>
          Retake
        </Button>
      ) : active ? (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Polyline
            points="9 18 15 12 9 6"
            stroke={colors.textMuted}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </Glass>
  );
}

function SlotIcon({ slot }: { slot: CaptureSlot }): React.JSX.Element {
  if (slot === 'document') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          stroke={colors.textMuted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Polyline
          points="14 2 14 8 20 8"
          stroke={colors.textMuted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  // side / front fallback: camera icon
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={colors.honeyDark}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={4} stroke={colors.honeyDark} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

function PawGlyph({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M6 9 a2.4 2.4 0 1 1 0.001 0 z M18 9 a2.4 2.4 0 1 1 0.001 0 z M9 5 a2 2 0 1 1 0.001 0 z M15 5 a2 2 0 1 1 0.001 0 z"
        fill={color}
      />
      <Path d="M12 10.5 a5.5 4.5 0 1 1 0.001 0 z" fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s1,
    gap: spacing.s2,
  },
  title: { marginTop: spacing.s2 },
  body: { marginTop: 4 },
  steps: { marginTop: spacing.s4, gap: spacing.s2 },
  cardBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderRadius: 18,
    padding: 12,
    minHeight: 70,
    borderWidth: 0.5,
    borderColor: glass.stroke.dark,
    position: 'relative',
  },
  cardActive: {
    backgroundColor: glass.tint.honey,
    borderColor: 'transparent',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: glass.tint.honey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDone: {
    backgroundColor: colors.forest,
  },
  info: { flex: 1, minWidth: 0, paddingRight: 4 },
  cardTitle: { fontWeight: '600', fontSize: 14, color: colors.textDefault },
  cardSub: { fontSize: 11.5, color: colors.textMuted, textTransform: 'none', letterSpacing: 0 },
  cornerPill: { position: 'absolute', top: 6, right: 8 },
});
