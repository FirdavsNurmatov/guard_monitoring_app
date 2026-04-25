import i18n, { initI18n } from '@/i18n';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nInitialized, setI18nInitialized] = React.useState(false);

  useEffect(() => {
    initI18n().then(() => {
      setI18nInitialized(true);
    });
  }, []);

  if (!i18nInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style="dark" />
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
            <Stack screenOptions={{ headerShown: false }}>
            </Stack>
          </SafeAreaView>
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
