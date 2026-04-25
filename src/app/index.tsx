import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { Button, Card } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { availableLanguages, setLanguage } from '../i18n';
import { StorageService } from '../services/storage';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    checkAuthStatus();
    requestPermissions();
    setupBackHandler();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const organization_id = await StorageService.getOrganizationId();
      if (!organization_id) {
        console.log('No organization ID found, redirecting to login');
        // @ts-ignore - TypeScript typed routes issue
        router.replace('/login');
        return;
      }

      const user = await StorageService.getUser();
      const accessToken = await StorageService.getAccessToken();

      if (user && accessToken) {
        console.log('User already logged in', { user });
        setIsLoggedIn(true);
        setUsername(user.username);
        setStatus('✓ ' + t('already_logged_in'));
      } else {
        setStatus(t('app_ready'));
      }
    } catch (err) {
      console.error('Error checking auth status', err);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        console.log('✅ GPS permission granted');
      } else {
        console.warn('⚠️ GPS permission denied');
        setStatus('⚠️ ' + t('gps_permission_denied'));
      }

      if (Platform.OS === 'android') {
        try {
          const supported = await NfcManager.isSupported();
          if (supported) {
            await NfcManager.start();
            console.log('✅ NFC permission granted');
          } else {
            console.warn('⚠️ NFC not supported on this device');
            setStatus('⚠️ ' + t('nfc_unavailable_short'));
          }
        } catch (err) {
          console.warn('⚠️ NFC permission denied or NFC disabled');
          setStatus('⚠️ ' + t('nfc_unavailable_short'));
        }
      }
    } catch (err) {
      console.error('Permission error:', err);
    }
  };

  const setupBackHandler = () => {
    const backAction = () => {
      Alert.alert(
        t('confirm_exit'),
        '',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('ok'),
            style: 'destructive',
            onPress: () => BackHandler.exitApp()
          }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const handleStart = () => {
    if (isLoggedIn) {
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/checkin');
    } else {
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/list');
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    await setLanguage(langCode as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('app_title')}</Text>

          <View style={styles.languageSelector}>
            {availableLanguages.map((lang) => (
              <Button
                key={lang.code}
                title={`${lang.flag} ${lang.name}`}
                onPress={() => handleLanguageChange(lang.code)}
                variant="outline"
                size="small"
              />
            ))}
          </View>

          <Button
            title={t('enter_system')}
            onPress={handleStart}
            size="medium"
          />

          {isLoggedIn && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>{username}</Text>
              <Button
                title={t('continue')}
                onPress={handleStart}
                variant="secondary"
                size="medium"
              />
            </View>
          )}

          <Text style={styles.status}>{status}</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.huge,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    color: Colors.textPrimary,
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  userInfoText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  status: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
