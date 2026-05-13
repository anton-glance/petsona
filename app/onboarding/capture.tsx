/**
 * Camera capture — onboarding step 03 (D-017). Mockup:
 * `docs/design/03_camera_capture.html`.
 *
 * One screen for all three photo slots (front / side / document). The
 * top-pill text + silhouette overlay swap based on
 * `captureSession.currentSlot`. The shutter and gallery-picker buttons
 * both feed `runCapturePipeline` with the current slot.
 *
 * Slot-aware behavior:
 *   - 'front': pipeline runs compress → upload → identify. Result writes
 *     to setCaptureFront; fires onboarding_capture_completed.
 *   - 'side': pipeline runs compress → upload only (no identify per D-019,
 *     R2 will use the multi-photo VLM). Writes to setCaptureSide; fires
 *     onboarding_side_captured.
 *   - 'document': same shape as side. Writes to setCaptureDocument; fires
 *     onboarding_document_captured.
 *
 * Always navigates to /onboarding/photo-collection after the pipeline
 * resolves. Photo-collection's state derivation drives the next screen.
 *
 * Bug fixes:
 *   - B-2 (iOS green dot): when the shutter is pressed, the CameraView
 *     unmounts immediately and is replaced by a preview of the captured
 *     photo for the duration of the pipeline. The native camera stops
 *     before the network call starts.
 *   - B-5 (Android gallery picker): the library button has an explicit
 *     testID and is wired through IconButton (Pressable + onPress).
 *
 * C-1 spinner gating: the discreet capture-spinner shows ONLY when
 * slot==='front' AND stage==='identifying'. Side and document slots
 * never show the spinner — their navigation completion IS the signal.
 *
 * Permission revoke recovery: a focus effect re-checks camera permission
 * each time the screen gains focus. If revoked (e.g. user toggled it off
 * in iOS Settings while backgrounded), routes to /onboarding/camera-denied.
 */
import { CameraView } from 'expo-camera';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  IconButton,
  Pill,
  ScreenContainer,
  SpeciesSilhouette,
  Spinner,
  Text,
  TopRow,
} from '../../components/ui';
import { BreedIdentifyError } from '../../features/onboarding/breedIdentify';
import {
  type CapturePipelineStage,
  runCapturePipeline,
} from '../../features/onboarding/capturePipeline';
import { CompressionError } from '../../features/onboarding/compression';
import {
  getCameraPermission,
  requestPhotoLibraryPermission,
} from '../../features/onboarding/permissions';
import { UploadError } from '../../features/onboarding/upload';
import { Events } from '../../lib/events';
import { logger } from '../../lib/logger';
import { useAppStore, useCaptureSession, type CaptureSlot } from '../../lib/store';
import { colors, radii, spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

type ErrorKey = 'compressionFailed' | 'uploadFailed' | 'identifyFailed' | 'libraryDenied';

interface CameraViewHandle {
  takePictureAsync(opts?: {
    quality?: number;
    exif?: boolean;
  }): Promise<{ uri: string; width: number; height: number }>;
}

const SLOT_TO_INDEX: Record<CaptureSlot, number> = { front: 1, side: 2, document: 3 };

export default function Capture(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const cameraRef = React.useRef<CameraViewHandle | null>(null);
  const session = useCaptureSession();
  const slot = session.currentSlot;

  const setCaptureFront = useAppStore((s) => s.setCaptureFront);
  const setCaptureSide = useAppStore((s) => s.setCaptureSide);
  const setCaptureDocument = useAppStore((s) => s.setCaptureDocument);

  const [facing, setFacing] = React.useState<'front' | 'back'>('back');
  const [pipelineStage, setPipelineStage] = React.useState<CapturePipelineStage | null>(
    null,
  );
  const [errorKey, setErrorKey] = React.useState<ErrorKey | null>(null);
  /** When set, the live <CameraView> is replaced by an <Image source={uri}>
   *  preview. This is the B-2 fix — the camera unmounts as soon as the
   *  shutter is pressed, so the iOS privacy indicator goes away during the
   *  ~300-700ms pipeline. */
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const lastSourceRef = React.useRef<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  // Re-check permission on focus. If revoked while backgrounded, recover.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const result = await getCameraPermission();
          if (!cancelled && result.status !== 'granted') {
            router.replace('/onboarding/camera-denied');
          }
        } catch (err) {
          logger.error('getCameraPermission on focus failed', { err: String(err) });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [router]),
  );

  const runPipeline = React.useCallback(
    async (source: { uri: string; width: number; height: number }): Promise<void> => {
      lastSourceRef.current = source;
      setErrorKey(null);
      setPipelineStage('compressing');
      try {
        const result = await runCapturePipeline(source.uri, {
          slot,
          dimensions: { width: source.width, height: source.height },
          onStage: (stage) => setPipelineStage(stage),
        });
        if (result.slot === 'front') {
          setCaptureFront({
            photoUri: result.photoUri,
            photoPath: result.photoPath,
            breed: result.breed,
          });
          track(Events.onboarding_capture_completed);
        } else if (result.slot === 'side') {
          setCaptureSide({ photoUri: result.photoUri, photoPath: result.photoPath });
          track(Events.onboarding_side_captured);
        } else {
          setCaptureDocument({ photoUri: result.photoUri, photoPath: result.photoPath });
          track(Events.onboarding_document_captured);
        }
        router.push('/onboarding/photo-collection');
      } catch (err) {
        if (err instanceof CompressionError) {
          setErrorKey('compressionFailed');
          logger.error('compression failed', { err: String(err) });
        } else if (err instanceof UploadError) {
          setErrorKey('uploadFailed');
          logger.error('upload failed', { err: String(err) });
        } else if (err instanceof BreedIdentifyError) {
          setErrorKey('identifyFailed');
          logger.error('breed-identify failed', { err: String(err) });
        } else {
          setErrorKey('identifyFailed');
          logger.error('capture pipeline failed', { err: String(err) });
        }
        // Pipeline failed — restore the live camera so the user can retry.
        setPreviewUri(null);
      } finally {
        setPipelineStage(null);
      }
    },
    [router, slot, setCaptureFront, setCaptureSide, setCaptureDocument],
  );

  const handleShutter = React.useCallback(async () => {
    if (pipelineStage !== null) return;
    if (!cameraRef.current) return;
    let source: { uri: string; width: number; height: number };
    try {
      source = await cameraRef.current.takePictureAsync({ quality: 1, exif: false });
    } catch (err) {
      logger.error('takePictureAsync failed', { err: String(err) });
      setErrorKey('compressionFailed');
      return;
    }
    // B-2: unmount the camera immediately — show the captured photo as
    // a preview while the pipeline runs. Stops the iOS green dot before
    // the network round-trip starts.
    setPreviewUri(source.uri);
    await runPipeline(source);
  }, [pipelineStage, runPipeline]);

  const handleLibrary = React.useCallback(async () => {
    if (pipelineStage !== null) return;
    const perm = await requestPhotoLibraryPermission();
    if (perm.status !== 'granted') {
      setErrorKey('libraryDenied');
      return;
    }
    const picked = await launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
      exif: false,
    });
    if (picked.canceled || picked.assets.length === 0) return;
    const asset = picked.assets[0];
    if (!asset) return;
    setPreviewUri(asset.uri);
    await runPipeline({
      uri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
    });
  }, [pipelineStage, runPipeline]);

  const handleFlip = (): void => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  const handleRetry = React.useCallback(() => {
    if (lastSourceRef.current) {
      void runPipeline(lastSourceRef.current);
    }
  }, [runPipeline]);

  const busy = pipelineStage !== null;
  const slotIndex = SLOT_TO_INDEX[slot];
  const slotLabel = t(`onboarding.slot.${slot}` as const);
  const topPill = t('onboarding.capture.topPill', {
    n: slotIndex,
    total: 3,
    slot: slotLabel,
  });
  const tipText =
    slot === 'front'
      ? t('onboarding.capture.tipFront')
      : slot === 'side'
        ? t('onboarding.capture.tipSide')
        : t('onboarding.capture.tipDocument');
  // C-1: spinner shows ONLY during identify on the front slot. Side and
  // document have no identify step; their navigation away IS the signal.
  const showSpinner = busy && slot === 'front' && pipelineStage === 'identifying';

  return (
    <ScreenContainer tone="dark">
      <TopRow
        back={
          <IconButton
            tone="dark"
            accessibilityLabel={t('onboarding.capture.aria.close')}
            onPress={() => router.back()}
          >
            <Text tone="inverse" variant="body">
              ×
            </Text>
          </IconButton>
        }
        center={<Pill tone="watch">{topPill}</Pill>}
        right={<View style={styles.topRight} />}
      />

      <View style={styles.viewfinder}>
        {previewUri === null ? (
          <CameraView
            ref={(r) => {
              cameraRef.current = r as unknown as CameraViewHandle | null;
            }}
            style={styles.cameraPreview}
            facing={facing}
            testID="camera-view"
          />
        ) : (
          <Image source={{ uri: previewUri }} style={styles.cameraPreview} resizeMode="cover" />
        )}
        <View style={styles.silhouetteOverlay} pointerEvents="none">
          <SpeciesSilhouette species={slot === 'document' ? 'cat' : 'cat'} tint="rgba(212,162,72,0.22)" />
        </View>
        <CornerBrackets />
      </View>

      {showSpinner ? (
        <View style={styles.busy} testID="capture-spinner">
          <Spinner tone="dim" />
        </View>
      ) : (
        <Text tone="inverse" variant="body" style={styles.tip}>
          {tipText}
        </Text>
      )}

      {errorKey !== null ? (
        <View style={styles.errorRow}>
          <Text tone="inverse" variant="body" style={styles.errorText}>
            {t(`onboarding.errors.${errorKey}`)}
          </Text>
          {errorKey !== 'libraryDenied' && lastSourceRef.current !== null ? (
            <Button variant="secondary" onPress={handleRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
        </View>
      ) : null}

      <View style={styles.controls}>
        <IconButton
          tone="dark"
          accessibilityLabel={t('onboarding.capture.aria.library')}
          onPress={() => void handleLibrary()}
          testID="capture-library-button"
        >
          <Text tone="inverse" variant="caption">
            ▤
          </Text>
        </IconButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.capture.aria.shutter')}
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => void handleShutter()}
          style={styles.shutterOuter}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <IconButton
          tone="dark"
          accessibilityLabel={t('onboarding.capture.aria.flip')}
          onPress={handleFlip}
        >
          <Text tone="inverse" variant="caption">
            ⟳
          </Text>
        </IconButton>
      </View>
    </ScreenContainer>
  );
}

function CornerBrackets(): React.JSX.Element {
  return (
    <View style={styles.bracketsRoot} pointerEvents="none">
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRight: { width: 36 },
  viewfinder: {
    marginTop: spacing.s3,
    flex: 1,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.nightElev,
    position: 'relative',
  },
  cameraPreview: { flex: 1 },
  silhouetteOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  bracketsRoot: { position: 'absolute', top: '16%', bottom: '16%', left: '16%', right: '16%' },
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.ivory,
    opacity: 0.9,
  },
  bracketTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 },
  tip: { marginTop: spacing.s3, textAlign: 'center', fontSize: 13 },
  busy: {
    marginTop: spacing.s3,
    alignItems: 'center',
  },
  errorRow: { marginTop: spacing.s2, gap: spacing.s2, paddingHorizontal: spacing.s2 },
  errorText: { textAlign: 'center' },
  controls: {
    paddingTop: spacing.s3,
    paddingBottom: spacing.s5 + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s5,
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.ivory,
  },
});
