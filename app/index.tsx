import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function Index(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold text-slate-900">{t('app.name')}</Text>
      <Text className="mt-2 text-base text-slate-600">{t('splash.tagline')}</Text>
    </View>
  );
}
