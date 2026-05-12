import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { callEdgeFunction } from '../lib/ai';
import { Events } from '../lib/events';
import { logger } from '../lib/logger';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { track } from '../lib/telemetry';
import type { BreedIdentifyResponse } from '../shared/types';

interface HelloResponse {
  message: string;
  user_id: string;
}

// R0-M3 + R0-M4 smoke screen. Replaced by the real splash + Get-Started screen
// at R1-M2; the test-error button moves with it.
export default function Index(): React.JSX.Element {
  const { t } = useTranslation();
  const authUserId = useAppStore((s) => s.authUserId);
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [insertResult, setInsertResult] = useState<string | null>(null);
  const [crossResult, setCrossResult] = useState<string | null>(null);
  const [breedResult, setBreedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCallHello = async (): Promise<void> => {
    try {
      setError(null);
      const data = await callEdgeFunction<HelloResponse>('hello');
      setHelloResult(data.user_id);
    } catch (err) {
      logger.error('hello call failed', { err: String(err) });
      setError(String(err));
    }
  };

  const handleInsertPet = async (): Promise<void> => {
    if (!authUserId) {
      setError(t('smoke.authPending'));
      return;
    }
    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from('pets')
        .insert({ name: 'TestPet', species: 'dog', user_id: authUserId })
        .select('id')
        .single();
      if (dbError) throw dbError;
      setInsertResult(String(data.id));
    } catch (err) {
      logger.error('insert pet failed', { err: String(err) });
      setError(String(err));
    }
  };

  const handleCrossUserRead = async (): Promise<void> => {
    try {
      setError(null);
      // RLS denies SELECT for rows where user_id != auth.uid(); expected count is 0.
      const otherId = '00000000-0000-0000-0000-000000000000';
      const { data, error: dbError } = await supabase
        .from('pets')
        .select('id')
        .eq('user_id', otherId);
      if (dbError) throw dbError;
      setCrossResult(String(data?.length ?? 0));
    } catch (err) {
      logger.error('cross-user read failed', { err: String(err) });
      setError(String(err));
    }
  };

  const handleCallBreedIdentify = async (): Promise<void> => {
    if (!authUserId) {
      setError(t('smoke.authPending'));
      return;
    }
    try {
      setError(null);
      const photo_path = `${authUserId}/smoke-test.jpg`;
      const data = await callEdgeFunction<BreedIdentifyResponse>('breed-identify', {
        photo_path,
      });
      setBreedResult(`${data.species} — ${data.breed} (${data.confidence})`);
    } catch (err) {
      logger.error('breed-identify call failed', { err: String(err) });
      setError(String(err));
    }
  };

  const handleThrowTestError = (): void => {
    track(Events.test_error_thrown);
    // Throw uncaught so Sentry's global handler catches it. The press event
    // already flushed through PostHog above.
    throw new Error('R0-M4 telemetry smoke test');
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pb-12 pt-16">
        <Text className="text-3xl font-bold text-slate-900">{t('app.name')}</Text>
        <Text className="mt-2 text-base text-slate-600">{t('smoke.title')}</Text>
        <Text className="mt-1 text-sm text-slate-500">{t('smoke.subtitle')}</Text>

        <View className="mt-8">
          <Text className="text-sm text-slate-500">{t('smoke.authUserId')}:</Text>
          <Text className="mt-1 font-mono text-base text-slate-900">
            {authUserId ?? t('smoke.authPending')}
          </Text>
        </View>

        <Pressable
          onPress={() => void handleCallHello()}
          className="mt-8 rounded-md bg-slate-900 px-4 py-3"
        >
          <Text className="text-center text-white">{t('smoke.callHello')}</Text>
        </Pressable>
        {helloResult !== null ? (
          <Text className="mt-2 text-sm text-slate-700">
            {t('smoke.callHelloResult')}: {helloResult}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleInsertPet()}
          className="mt-4 rounded-md bg-slate-900 px-4 py-3"
        >
          <Text className="text-center text-white">{t('smoke.insertPet')}</Text>
        </Pressable>
        {insertResult !== null ? (
          <Text className="mt-2 text-sm text-slate-700">
            {t('smoke.insertPetResult')}: {insertResult}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleCrossUserRead()}
          className="mt-4 rounded-md bg-slate-900 px-4 py-3"
        >
          <Text className="text-center text-white">{t('smoke.crossUserRead')}</Text>
        </Pressable>
        {crossResult !== null ? (
          <Text className="mt-2 text-sm text-slate-700">
            {t('smoke.crossUserResult')}: {crossResult}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleCallBreedIdentify()}
          className="mt-4 rounded-md bg-slate-900 px-4 py-3"
        >
          <Text className="text-center text-white">{t('smoke.callBreedIdentify')}</Text>
        </Pressable>
        {breedResult !== null ? (
          <Text className="mt-2 text-sm text-slate-700">
            {t('smoke.callBreedIdentifyResult')}: {breedResult}
          </Text>
        ) : null}

        <Pressable
          onPress={handleThrowTestError}
          className="mt-8 rounded-md bg-red-600 px-4 py-3"
        >
          <Text className="text-center text-white">{t('smoke.throwError')}</Text>
        </Pressable>

        {error !== null ? (
          <Text className="mt-6 text-sm text-red-700">
            {t('smoke.error')}: {error}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
