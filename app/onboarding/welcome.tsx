/**
 * Welcome {petname} — onboarding step 05 (D-017). The R1 "WOW" moment.
 *
 * Reads from the R1-M2 `captureSession` slice: photoUri, photoPath, and the
 * BreedIdentifyResponse. Renders the breed name + AI-confidence badge + a
 * species-aware silhouette + an empty Name input. The remaining preview
 * rows (Gender, Age, Weight, Color) are non-interactive placeholders — R2
 * wires the OCR-driven combined-prompt that populates them. The "From vet
 * card" section is deliberately omitted; it ships in R2-M3.
 *
 * The CTA: trims and null-coalesces the name, inserts the row via
 * `insertPet`, sets the `species` slice on success (R2-R4 adaptive
 * theming's first consumer), fires `onboarding_welcome_confirmed`, and
 * then **does nothing**. R3 will wire navigation forward to the survey
 * screens; until then the button transitions to a disabled state and the
 * user stays on this screen. This is correct, not a bug — documented
 * per product scope rule 3.
 *
 * Defensive cold-hit: if the slice's `breed` is null (someone deep-linked
 * to /onboarding/welcome without going through the capture pipeline), we
 * `router.replace('/')` back to the splash so the back stack stays clean.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import {
  Button,
  CtaStack,
  Input,
  Pill,
  ScreenContainer,
  Text,
} from '../../components/ui';
import { insertPet, PersistPetError } from '../../features/onboarding/persistPet';
import { Events } from '../../lib/events';
import { logger } from '../../lib/logger';
import { useAppStore, useCaptureSession } from '../../lib/store';
import { colors, glass, radii, spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

export default function Welcome(): React.JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useCaptureSession();
  const setSpecies = useAppStore((s) => s.setSpecies);

  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [savedOk, setSavedOk] = React.useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);

  // Defensive: a deep-link cold-hit with no slice data has nothing to render.
  // Redirect to splash rather than crash. `replace` avoids leaving welcome
  // in the back stack.
  React.useEffect(() => {
    if (session.breed === null || session.photoUri === null || session.photoPath === null) {
      router.replace('/');
    }
  }, [session.breed, session.photoUri, session.photoPath, router]);

  const trimmedName = name.trim();
  const ctaLabel =
    trimmedName.length === 0
      ? t('onboarding.welcome.cta.empty')
      : t('onboarding.welcome.cta.named', { name: trimmedName });

  // Hook must come before the conditional return per Rules of Hooks. The
  // null guards inside the callback are belt-and-suspenders — the early
  // return below means the button isn't reachable when the slice is empty.
  const handleConfirm = React.useCallback(async (): Promise<void> => {
    if (busy || savedOk) return;
    if (session.breed === null || session.photoPath === null) return;
    const breed = session.breed;
    const photoPath = session.photoPath;
    // Flip to busy synchronously to disable the CTA before any awaited work
    // (double-tap protection per the plan's §2 justification).
    setBusy(true);
    setErrorVisible(false);
    try {
      const persistedName = trimmedName.length === 0 ? null : trimmedName;
      await insertPet({
        name: persistedName,
        species: breed.species,
        breed: breed.breed,
        breed_confidence: breed.confidence,
        photo_path: photoPath,
      });
      try {
        setSpecies(breed.species);
      } catch (err) {
        // Zustand setters don't throw; defensive only. logger.error → Sentry
        // per D-021. Doesn't block the success state.
        logger.error('setSpecies after welcome confirm failed', { err: String(err) });
      }
      track(Events.onboarding_welcome_confirmed);
      setSavedOk(true);
      // Note: NO router.push. R3 will wire navigation forward; until then
      // the button stays disabled on the success state. See JSDoc.
    } catch (err) {
      if (err instanceof PersistPetError) {
        logger.error('pets insert failed', { err: String(err) });
      } else {
        logger.error('welcome confirm path failed', { err: String(err) });
      }
      setErrorVisible(true);
      setBusy(false);
    }
  }, [busy, savedOk, trimmedName, session.breed, session.photoPath, setSpecies]);

  if (session.breed === null || session.photoUri === null || session.photoPath === null) {
    return null;
  }

  const breed = session.breed;
  const photoUri = session.photoUri;
  const confidencePct = Math.round(breed.confidence * 100);

  return (
    <ScreenContainer tone="light">
      <View style={styles.hero}>
        <Image
          testID="welcome-photo"
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.silhouetteWrap} pointerEvents="none">
          {breed.species === 'cat' ? <CatSilhouette /> : <DogSilhouette />}
        </View>
      </View>

      <View style={styles.heroText}>
        <Text variant="displayXl">{t('onboarding.welcome.hey')}</Text>
        <Text variant="body" tone="muted" style={styles.subtitle}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        <FieldRow label={t('onboarding.welcome.fields.breed')}>
          <View style={styles.breedValue}>
            <Text variant="body" style={styles.breedText}>
              {breed.breed}
            </Text>
            <Pill tone="honey">
              {t('onboarding.welcome.aiConfidence', { percent: confidencePct })}
            </Pill>
          </View>
        </FieldRow>

        <FieldRow label={t('onboarding.welcome.fields.name')}>
          <Input
            testID="welcome-name-input"
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.welcome.nameInputPlaceholder')}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
        </FieldRow>

        <FieldRow label={t('onboarding.welcome.fields.gender')}>
          <PreviewValue />
        </FieldRow>
        <FieldRow label={t('onboarding.welcome.fields.age')}>
          <PreviewValue />
        </FieldRow>
        <FieldRow label={t('onboarding.welcome.fields.weight')}>
          <PreviewValue />
        </FieldRow>
        <FieldRow label={t('onboarding.welcome.fields.color')}>
          <PreviewValue />
        </FieldRow>
      </View>

      {errorVisible ? (
        <Text variant="body" style={styles.errorText}>
          {t('onboarding.welcome.error')}
        </Text>
      ) : null}

      <CtaStack>
        <Button
          onPress={() => void handleConfirm()}
          loading={busy}
          disabled={savedOk}
          accessibilityLabel={ctaLabel}
        >
          <Text variant="body" numberOfLines={1} style={styles.ctaLabel}>
            {ctaLabel}
          </Text>
        </Button>
      </CtaStack>
    </ScreenContainer>
  );
}

function FieldRow(props: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" style={styles.rowLabel}>
        {props.label}
      </Text>
      <View style={styles.rowValue}>{props.children}</View>
    </View>
  );
}

/**
 * Non-interactive empty value cell for the preview rows (Gender, Age,
 * Weight, Color). R2's OCR + combined-prompt populates these; R1 renders
 * the row layout so the user sees the eventual shape, but no `<Pressable>`
 * or input control — per scope rules 1 + 2.
 */
function PreviewValue(): React.JSX.Element {
  return <View style={styles.previewValue} />;
}

function CatSilhouette(): React.JSX.Element {
  // Tracing matches docs/design/05_ai_review.html line 26 (the cat path).
  return (
    <Svg
      testID="silhouette-cat"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
    >
      <Path
        fill={colors.forest}
        d="M5 4l3 5 1-1V4z M19 4l-3 5-1-1V4z M5 10c0-2 3-5 7-5s7 3 7 5v6c0 2-2 4-4 4H9c-2 0-4-2-4-4z"
      />
      <Circle cx="9" cy="12" r="0.8" fill={colors.ivory} />
      <Circle cx="15" cy="12" r="0.8" fill={colors.ivory} />
    </Svg>
  );
}

function DogSilhouette(): React.JSX.Element {
  // Tracing matches docs/design/05_ai_review.html line 23 (the dog path).
  return (
    <Svg
      testID="silhouette-dog"
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
    >
      <Path
        fill={colors.forest}
        d="M4 11c0-4 4-6 8-6s8 2 8 6v4c0 2-2 4-4 4H8c-2 0-4-2-4-4V11z M5 7c-1 2-1 5 0 7M19 7c1 2 1 5 0 7"
      />
      <Circle cx="9" cy="11" r="0.9" fill={colors.ivory} />
      <Circle cx="15" cy="11" r="0.9" fill={colors.ivory} />
      <Ellipse cx="12" cy="14" rx="1" ry="0.7" fill={colors.ivory} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 240,
    marginHorizontal: -spacing.s4,
    backgroundColor: colors.forest,
    overflow: 'hidden',
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    position: 'relative',
  },
  photo: { ...StyleSheet.absoluteFillObject, opacity: 0.7 },
  silhouetteWrap: {
    position: 'absolute',
    right: spacing.s4,
    bottom: spacing.s4,
    width: 96,
    height: 96,
  },
  heroText: { marginTop: spacing.s5, gap: spacing.s2 },
  subtitle: { marginTop: spacing.s1 },
  form: { marginTop: spacing.s5, gap: spacing.s3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s2,
    borderBottomWidth: 0.5,
    borderBottomColor: glass.stroke.dark,
    gap: spacing.s3,
  },
  rowLabel: { width: 72 },
  rowValue: { flex: 1 },
  breedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  breedText: { flex: 1 },
  previewValue: { height: 24 },
  errorText: { marginTop: spacing.s3, color: colors.statusDanger, textAlign: 'center' },
  ctaLabel: { color: colors.textOnPrimary, fontWeight: '600', fontSize: 15 },
});
