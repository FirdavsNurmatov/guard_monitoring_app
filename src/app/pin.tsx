import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
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

  useEffect(() => {
    checkPinMode();
    checkGPS();
    checkNFC();
    startGPSChecking();
    setupBackHandler();
  }, []);

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

  const checkGPS = async () => {
    try {
      await Location.getCurrentPositionAsync({});
      setGpsEnabled(true);
    } catch (err) {
      console.warn('GPS not enabled');
      setGpsEnabled(false);
    }
  };

  const checkNFC = async () => {
    try {
      await NfcManager.start();
      setNfcEnabled(true);
    } catch (err) {
      console.warn('NFC not enabled');
      setNfcEnabled(false);
    }
  };

  const startGPSChecking = () => {
    const interval = setInterval(async () => {
      try {
        await Location.getCurrentPositionAsync({});
        if (!gpsEnabled) {
          setGpsEnabled(true);
          setError('');
        }
      } catch (err) {
        if (gpsEnabled) {
          setGpsEnabled(false);
          console.warn('GPS disabled');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const setupBackHandler = () => {
    const backAction = () => {
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/list');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');

    if (!gpsEnabled) {
      setError(t('gps_permission_denied'));
      return;
    }

    if (!nfcEnabled) {
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
      console.log('Login response:', data);

      if (data.status === 'success') {
        if (data.token?.access_token) {
          await StorageService.setAccessToken(data.token.access_token);
        }
        console.log('Setting user:', { id: data.id, login: data.login, username: data.username });
        await StorageService.setUser({
          id: data.id,
          login: data.login,
          username: data.username,
        });

        // Verify user was stored
        const storedUser = await StorageService.getUser();
        console.log('Stored user verification:', storedUser);

        Alert.alert(t('success'), t('successfully_logged_in_msg'), [
          { text: t('ok'), onPress: () => {
            // @ts-ignore - TypeScript typed routes issue
            router.replace('/checkin');
          }}
        ]);
      } else {
        console.warn('Login failed', data);
        setError(t('login_error'));
      }
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.message || t('server_error_msg'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('login_to_system')}</Text>
          
          {username && (
            <Text style={styles.username}>{t('selected_user')}: {username}</Text>
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

          {error && <ErrorMessage message={error} />}

          {!gpsEnabled && (
            <ErrorMessage message={t('gps_permission_denied')} type="warning" />
          )}

          <Button
            title={loading ? t('loading') : t('login')}
            onPress={handleLogin}
            disabled={loading || !gpsEnabled || !nfcEnabled}
            loading={loading}
            size="medium"
          />

          <Button
            title={t('back')}
            onPress={() => {
              // @ts-ignore - TypeScript typed routes issue
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
