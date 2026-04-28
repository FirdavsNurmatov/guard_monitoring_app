import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { Button, Card, ErrorMessage, Input } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

export default function PinScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinMode, setPinMode] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(true);

  const gpsCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nfcCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkPinMode();
    startNFCCheck();
    startGPSChecking();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // @ts-ignore
      router.replace('/list');
      return true;
    });

    return () => {
      backHandler.remove();
      if (gpsCheckTimer.current) {
        clearInterval(gpsCheckTimer.current);
        gpsCheckTimer.current = null;
      }
      if (nfcCheckTimer.current) {
        clearInterval(nfcCheckTimer.current);
        nfcCheckTimer.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // PIN mode
  // ---------------------------------------------------------------------------

  const checkPinMode = async () => {
    try {
      const selectedUser = await StorageService.getSelectedUser();
      if (selectedUser) {
        setPinMode(true);
        setLogin(selectedUser.login);
        setUsername(selectedUser.username);
      }
    } catch (err) {
      console.error('Error checking PIN mode', err);
    }
  };

  // ---------------------------------------------------------------------------
  // GPS
  // ---------------------------------------------------------------------------

  const checkGPSOnce = async (): Promise<boolean> => {
    try {
      await Location.getCurrentPositionAsync({});
      return true;
    } catch {
      return false;
    }
  };

  const startGPSChecking = async () => {
    const enabled = await checkGPSOnce();
    setGpsEnabled(enabled);

    if (gpsCheckTimer.current) return;

    gpsCheckTimer.current = setInterval(async () => {
      const isEnabled = await checkGPSOnce();
      setGpsEnabled((prev) => {
        if (prev !== isEnabled) {
          if (!isEnabled) console.warn('GPS disabled');
          else setError('');
        }
        return isEnabled;
      });
    }, 3000);
  };

  // ---------------------------------------------------------------------------
  // NFC
  // ---------------------------------------------------------------------------

  const checkNFCStatus = async () => {
    try {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);

      if (!supported) {
        setNfcEnabled(false);
        return;
      }

      await NfcManager.start();
      const enabled = await NfcManager.isEnabled();
      setNfcEnabled(enabled);

      if (enabled && nfcCheckTimer.current) {
        clearInterval(nfcCheckTimer.current);
        nfcCheckTimer.current = null;
        return;
      }

      if (!enabled) {
        Alert.alert(
          t('nfc_unavailable_short'),
          t('nfc_settings_manual'),
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('enable_nfc'), onPress: openNFCSettings },
          ]
        );
      }
    } catch (err) {
      console.warn('NFC check error:', err);
      setNfcEnabled(false);
    }
  };

  const openNFCSettings = async () => {
    try {
      await Linking.sendIntent('android.settings.NFC_SETTINGS');
    } catch (err) {
      console.error('Failed to open NFC settings:', err);
      Alert.alert(
        t('error'),
        t('nfc_settings_manual'),
        [{ text: t('ok'), style: 'default' }]
      );
    }
  };

  const startNFCCheck = async () => {
    await checkNFCStatus();

    const supported = await NfcManager.isSupported();
    if (!supported) return;

    if (!nfcCheckTimer.current) {
      nfcCheckTimer.current = setInterval(async () => {
        await checkNFCStatus();
      }, 5000);
    }
  };

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');

    if (!gpsEnabled) {
      setError(t('gps_permission_denied'));
      return;
    }

    if (nfcSupported && !nfcEnabled) {
      setError(t('nfc_unavailable_short'));
      return;
    }

    if (!login || login.trim().length === 0) {
      setError(t('login_required'));
      return;
    }

    if (login.length < 3 || login.length > 50) {
      setError(t('login_length_error'));
      return;
    }

    if (!password || password.trim().length === 0) {
      setError(pinMode ? t('pin_required') : t('password_required'));
      return;
    }

    if (password.length < 4 || password.length > 50) {
      setError(t('password_length_error'));
      return;
    }

    if (pinMode && !/^\d{6}$/.test(password)) {
      setError(t('pin_digits_required'));
      return;
    }

    setLoading(true);
    try {
      const data = await ApiService.authGuard(login, password);

      if (data.status === 'success') {
        if (data.token?.access_token) {
          await StorageService.setAccessToken(data.token.access_token);
        }

        await StorageService.setUser({
          id: data.id,
          login: data.login,
          username: data.username,
        });

        Alert.alert(t('success'), t('successfully_logged_in_msg'), [
          {
            text: t('ok'),
            onPress: () => {
              // @ts-ignore
              router.replace('/checkin');
            },
          },
        ]);
      } else {
        setError(t('login_error'));
      }
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.message || t('server_error_msg'));
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('login_to_system')}</Text>

          {username && (
            <Text style={styles.username}>
              {t('selected_user')}: {username}
            </Text>
          )}

          {!pinMode && (
            <Input
              value={login}
              onChangeText={setLogin}
              placeholder={t('login_field')}
              editable={!pinMode}
              autoCapitalize="none"
            />
          )}

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={pinMode ? '••••••' : t('password')}
            secureTextEntry
            keyboardType={pinMode ? 'numeric' : 'default'}
            maxLength={pinMode ? 6 : undefined}
            autoFocus
          />

          {pinMode && (
            <Text style={styles.pinHint}>{t('enter_pin')}</Text>
          )}

          {error ? <ErrorMessage message={error} /> : null}

          {!gpsEnabled && (
            <ErrorMessage message={t('gps_permission_denied')} type="warning" />
          )}

          {nfcSupported && !nfcEnabled && (
            <ErrorMessage message={t('nfc_unavailable_short')} type="warning" />
          )}

          <Button
            title={loading ? t('loading') : t('login')}
            onPress={handleLogin}
            disabled={loading || !gpsEnabled || (nfcSupported && !nfcEnabled)}
            loading={loading}
            size="medium"
          />

          <Button
            title={t('back')}
            onPress={() => {
              // @ts-ignore
              router.replace('/list');
            }}
            variant="secondary"
            size="medium"
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
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
    padding: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  username: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },
  pinHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});