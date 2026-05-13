/**
 * Camera capture — onboarding step 03 (D-017).
 *
 * Renders the live camera preview + top-pill + shutter + library + flip
 * controls. The shutter and library paths both feed `runCapturePipeline`,
 * which compresses → uploads → calls breed-identify. On success the result
 * goes to the `captureSession` slice and the screen navigates to
 * /onboarding/welcome (R1-M3).
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
import { StyleSheet, View } from 'react-native';

import {
  Button,
  IconButton,
  Pill,
  ScreenContainer,
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
import { useAppStore } from '../../lib/store';
import { colors, spacing } from '../../lib/theme';
import { track } from '../../lib/telemetry';

type ErrorKey = 'compressionFailed' | 'uploadFailed' | 'identifyFailed' | 'libraryDenied';

interface CameraViewHandle {
  takePictureAsync(opts?: {
    quality?: number;
    exif?: boolean;
  }): Promise<{ uri: string; width: number; height: number }>;
}

export default function Capture(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const cameraRef = React.useRef<CameraViewHandle | null>(null);
  const setCaptureFront = useAppStore((s) => s.setCaptureFront);

  const [facing, setFacing] = React.useState<'front' | 'back'>('back');
  const [pipelineStage, setPipelineStage] = React.useState<CapturePipelineStage | null>(
    null,
  );
  const [errorKey, setErrorKey] = React.useState<ErrorKey | null>(null);
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
      // Flip to busy immediately so the shutter disables before any awaited
      // pipeline step. `onStage('compressing')` redundantly reaffirms this
      // value, but the visible-disabled state cannot wait for the first
      // pipeline `await` to schedule.
      setPipelineStage('compressing');
      try {
        const result = await runCapturePipeline(source.uri, {
          dimensions: { width: source.width, height: source.height },
          onStage: (stage) => setPipelineStage(stage),
        });
        setCaptureFront({
          photoUri: result.photoUri,
          photoPath: result.photoPath,
          breed: result.breed,
        });
        track(Events.onboarding_capture_completed);
        router.push('/onboarding/welcome');
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
      } finally {
        setPipelineStage(null);
      }
    },
    [router, setCaptureFront],
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
  const topPill = t('onboarding.capture.topPill', {
    n: 1,
    total: 3,
    slot: t('onboarding.slot.front'),
  });

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
        <CameraView
          ref={(r) => {
            cameraRef.current = r as unknown as CameraViewHandle | null;
          }}
          style={styles.cameraPreview}
          facing={facing}
        />
      </View>

      {busy ? (
        <View style={styles.busy}>
          <Spinner tone="dim" />
          <Text tone="inverse" variant="body" style={styles.busyText}>
            {t('onboarding.capture.processing')}
          </Text>
        </View>
      ) : (
        <Text tone="inverse" variant="body" style={styles.tip}>
          {t('onboarding.capture.tipFront')}
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
        >
          <Text tone="inverse" variant="caption">
            ▤
          </Text>
        </IconButton>
        <Shutter
          onPress={() => void handleShutter()}
          accessibilityLabel={t('onboarding.capture.aria.shutter')}
          disabled={busy}
        />
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

function Shutter(props: {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel}
      accessibilityState={{ disabled: !!props.disabled }}
      style={styles.shutterOuter}
      onTouchEnd={() => {
        if (!props.disabled) props.onPress();
      }}
    >
      <View style={styles.shutterInner} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRight: { width: 36 },
  viewfinder: {
    marginTop: spacing.s4,
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.nightElev,
  },
  cameraPreview: { flex: 1 },
  tip: {
    marginTop: spacing.s4,
    textAlign: 'center',
  },
  busy: {
    marginTop: spacing.s4,
    alignItems: 'center',
    gap: spacing.s2,
  },
  busyText: { marginTop: spacing.s2 },
  errorRow: {
    marginTop: spacing.s3,
    gap: spacing.s2,
  },
  errorText: { textAlign: 'center' },
  controls: {
    marginTop: 'auto',
    paddingBottom: spacing.s5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
});
