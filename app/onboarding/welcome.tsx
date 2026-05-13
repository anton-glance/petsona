/**
 * Welcome {petname} — onboarding step 05 (D-017). The R1 "WOW" moment.
 * Mockup: `docs/design/05_ai_review.html`.
 *
 * Visual structure rebuild (R1 visual redo): flat column-flex layout
 * instead of absolute-positioned hero/form/CTA overlap. Three regions:
 *
 *   1. Hero (~33% of screen height): forest fill + photo at 0.7 opacity
 *      + paw-pattern overlay (ivory tone) + centered SpeciesSilhouette
 *      ghosted at low opacity. Per `screens.css` `.review .photo-hero`
 *      and `.review .photo-paws`.
 *   2. Hero text + form-card (flex:1, scrolls): "Hey 👋" + body, then
 *      compact-field rows (Breed + AI confidence, Name input, Gender
 *      preview Segmented, Age/Weight/Color preview rows).
 *   3. CTA pinned to bottom: "Welcome {name}" / fallback "Welcome your
 *      pet". After success → "Saved ✓" disabled.
 *
 * B-3 fix (spinner-forever bug): post-success the button transitions to
 * `loading=false, disabled=true` and the label switches to "Saved ✓".
 * The spinner stops, the button stays inert. R3 wires forward navigation.
 *
 * Defensive cold-hit: deep-link with empty slice → router.replace('/').
 *
 * CTA does NOT navigate after success. R3 owns that. Documented per
 * product scope rule 3 from the R1-M3 prompt.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  Button,
  CtaStack,
  Input,
  PetPattern,
  Pill,
  ScreenContainer,
  Segmented,
  SpeciesSilhouette,
  Text,
} from '../../components/ui';
import { insertPet, PersistPetError } from '../../features/onboarding/persistPet';
import { Events } from '../../lib/events';
import { logger } from '../../lib/logger';
import { useAppStore, useCaptureSession } from '../../lib/store';
import { colors, spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.33);

export default function Welcome(): React.JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useCaptureSession();
  const setSpecies = useAppStore((s) => s.setSpecies);

  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [savedOk, setSavedOk] = React.useState(false);
  const [errorVisible, setErrorVisible] = React.useState(false);

  React.useEffect(() => {
    if (session.breed === null || session.photoUri === null || session.photoPath === null) {
      router.replace('/');
    }
  }, [session.breed, session.photoUri, session.photoPath, router]);

  const trimmedName = name.trim();
  const namedLabel =
    trimmedName.length === 0
      ? t('onboarding.welcome.cta.empty')
      : t('onboarding.welcome.cta.named', { name: trimmedName });
  const ctaLabel = savedOk ? t('onboarding.welcome.cta.saved') : namedLabel;

  const handleConfirm = React.useCallback(async (): Promise<void> => {
    if (busy || savedOk) return;
    if (session.breed === null || session.photoPath === null) return;
    const breed = session.breed;
    const photoPath = session.photoPath;
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
        logger.error('setSpecies after welcome confirm failed', { err: String(err) });
      }
      track(Events.onboarding_welcome_confirmed);
      // B-3 fix: loading=false (spinner stops) + disabled=true (CTA inert)
      // + label switches to "Saved ✓". No navigation — R3 wires forward.
      setSavedOk(true);
      setBusy(false);
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
      {/* Hero: photo + forest tint + paw pattern + species silhouette */}
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <Image
          testID="welcome-photo"
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.heroTint} pointerEvents="none" />
        <View style={styles.silhouetteWrap} pointerEvents="none">
          <SpeciesSilhouette species={breed.species} tint="rgba(255,255,255,0.12)" />
        </View>
        <PetPattern species={breed.species} tone="ivory" opacity={0.22} />
        <View style={styles.heroGradient} pointerEvents="none" />
      </View>

      {/* Hero text */}
      <View style={styles.heroText}>
        <Text variant="displayLg" style={styles.hey}>
          {t('onboarding.welcome.hey')}
        </Text>
        <Text variant="body" tone="muted" style={styles.subtitle}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>

      {/* Form card (scrolls) */}
      <ScrollView style={styles.formCard} contentContainerStyle={styles.formCardContent}>
        <View style={styles.identityGrid}>
          <CompactField label={t('onboarding.welcome.fields.breed')} full>
            <View style={styles.breedValue}>
              <Text variant="body" style={styles.breedText} numberOfLines={1}>
                {breed.breed}
              </Text>
              <Pill tone="honey">
                {t('onboarding.welcome.aiConfidence', { percent: confidencePct })}
              </Pill>
            </View>
          </CompactField>
          <CompactField label={t('onboarding.welcome.fields.name')} full>
            <Input
              testID="welcome-name-input"
              value={name}
              onChangeText={setName}
              placeholder={t('onboarding.welcome.nameInputPlaceholder')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </CompactField>
          <CompactField label={t('onboarding.welcome.fields.gender')}>
            <Segmented
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ]}
              value=""
              onChange={() => undefined}
              tight
            />
          </CompactField>
          <CompactField label={t('onboarding.welcome.fields.age')}>
            <View style={styles.previewValue} />
          </CompactField>
          <CompactField label={t('onboarding.welcome.fields.weight')}>
            <View style={styles.previewValue} />
          </CompactField>
          <CompactField label={t('onboarding.welcome.fields.color')}>
            <View style={styles.previewValue} />
          </CompactField>
        </View>

        <View style={styles.vetSection} testID="welcome-vet-section">
          <Text variant="caption" tone="muted" style={styles.vetLabel}>
            {t('onboarding.welcome.vet.label')}
          </Text>
          <View style={styles.vetRow}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M14 4l6 6"
                stroke={colors.honeyDark}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M11 7l6 6-7 7H4v-6Z"
                stroke={colors.honeyDark}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 9l6 6"
                stroke={colors.honeyDark}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text variant="body" style={styles.vetRowText}>
              {t('onboarding.welcome.vet.rabies')}
            </Text>
          </View>
          <View style={styles.vetRow}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={colors.honeyDark} strokeWidth={2} fill="none" />
              <Path d="M12 16v-4" stroke={colors.honeyDark} strokeWidth={2} strokeLinecap="round" />
              <Path d="M12 8h.01" stroke={colors.honeyDark} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text variant="body" style={styles.vetRowText}>
              {t('onboarding.welcome.vet.microchip')}
            </Text>
          </View>
        </View>
      </ScrollView>

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

interface CompactFieldProps {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}

function CompactField(props: CompactFieldProps): React.JSX.Element {
  return (
    <View style={[styles.compactField, props.full ? styles.compactFull : undefined]}>
      <Text variant="caption" tone="muted" style={styles.fieldLabel}>
        {props.label}
      </Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -spacing.s4,
    backgroundColor: colors.forest,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: { ...StyleSheet.absoluteFillObject, opacity: 0.7 },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.forest,
    opacity: 0.32,
  },
  silhouetteWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    backgroundColor: 'rgba(251,247,238,0.5)',
  },
  heroText: { marginTop: spacing.s4, gap: 4 },
  hey: { color: colors.forestDark, fontWeight: '700' },
  subtitle: { fontSize: 13 },
  formCard: { flex: 1, marginTop: spacing.s4 },
  formCardContent: { gap: spacing.s4 },
  identityGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 0 },
  compactField: {
    flex: 0,
    width: '46%',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 3,
  },
  compactFull: { width: '100%' },
  fieldLabel: { fontSize: 9.5, letterSpacing: 0.06, fontWeight: '600' },
  breedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  breedText: { flex: 1, fontWeight: '500' },
  previewValue: { height: 22 },
  vetSection: {
    paddingTop: spacing.s2,
    gap: 6,
  },
  vetLabel: {
    fontSize: 9.5,
    letterSpacing: 0.06,
    fontWeight: '600',
    color: colors.honeyDark,
  },
  vetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  vetRowText: { fontSize: 12, color: colors.honeyDark, fontWeight: '500' },
  errorText: { marginTop: spacing.s3, color: colors.statusDanger, textAlign: 'center' },
  ctaLabel: { color: colors.textOnPrimary, fontWeight: '600', fontSize: 15 },
});
