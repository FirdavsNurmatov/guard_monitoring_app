import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AppState,
  BackHandler,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { Button, ErrorMessage } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { CONFIG } from '../constants/config';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

const successSound = require('../../assets/audio/success.mp3');
const errorSound = require('../../assets/audio/error.mp3');

interface CheckinLog {
  id: string;
  userId: number;
  username: string;
  checkpointName: string;
  checkpointCardNum: string;
  timestamp: number;
  status: 'success' | 'offline' | 'failed';
  synced: boolean;
}

const STATUS_MAP: Record<string, { icon: string; labelKey: string }> = {
  success: { icon: '✅', labelKey: 'success' },
  offline: { icon: '📴', labelKey: 'offline' },
  failed: { icon: '❌', labelKey: 'failed' },
};

export default function CheckinScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [lastLog, setLastLog] = useState('');
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [logs, setLogs] = useState<CheckinLog[]>([]);

  // ─── Refs (stale closure yo'q) ───────────────────────────────────────────
  const userIdRef = useRef<number | null>(null);
  const usernameRef = useRef<string>('');
  /** FIX: lat/lng uchun ref — useState stale closure beradi */
  const currentLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const isActiveRef = useRef(true);
  const isScanningRef = useRef(false);
  const lastScanTime = useRef(0);
  /** FIX: NfcManager.start() faqat bir marta chaqirilsin */
  const nfcStartedRef = useRef(false);

  const gpsTrackingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nfcCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const successSoundRef = useRef<Audio.Sound | null>(null);
  const errorSoundRef = useRef<Audio.Sound | null>(null);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  useEffect(() => {
    isActiveRef.current = true;
    checkAuth();
    loadLogs();
    startNFCCheck();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLogout();
      return true;
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncOfflineCheckins();
    });

    return () => {
      backHandler.remove();
      appStateSub.remove();
      cleanup();
    };
  }, []);

  /** NFC yoqilganda skanerlashni boshlash */
  useEffect(() => {
    if (nfcEnabled && !isScanningRef.current) {
      handleStartScan();
    }
  }, [nfcEnabled]);

  // ─── Sound ───────────────────────────────────────────────────────────────
  const playSound = async (soundName: 'success' | 'error') => {
    try {
      const soundRef = soundName === 'success' ? successSoundRef : errorSoundRef;
      const soundFile = soundName === 'success' ? successSound : errorSound;

      // Avvalgi ovozni to'xtatamiz
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          soundRef.current = null;
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const checkAuth = async () => {
    try {
      const organization_id = await StorageService.getOrganizationId();
      if (!organization_id) {
        router.replace('/login' as any);
        return;
      }

      const user = await StorageService.getUser();
      if (user) {
        setUsername(user.username);
        userIdRef.current = user.id;
        usernameRef.current = user.username;
        startGPSTracking(user.id);
      } else {
        router.replace('/' as any);
        return;
      }

      const savedLog = await StorageService.getLastLog();
      if (savedLog) setLastLog(savedLog);
    } catch (err) {
      console.error('Error checking auth', err);
    }
  };

  // ─── Logs ─────────────────────────────────────────────────────────────────
  const loadLogs = async () => {
    try {
      const checkinLogs = await StorageService.getCheckinLogs();
      setLogs(checkinLogs);
    } catch (err) {
      console.error('Error loading logs', err);
    }
  };

  // ─── NFC ──────────────────────────────────────────────────────────────────

  /**
   * FIX: NfcManager.start() faqat bir marta chaqiriladi.
   * Har safar checkNFCStatus yoki polling da chaqirilsa xato chiqishi mumkin.
   */
  const ensureNfcStarted = async (): Promise<boolean> => {
    if (nfcStartedRef.current) return true;
    try {
      await NfcManager.start();
      nfcStartedRef.current = true;
      return true;
    } catch (err) {
      console.error('NfcManager.start() failed:', err);
      return false;
    }
  };

  /**
   * FIX: Eski kodda checkNFCStatus ichida NfcManager.start() har safar
   * chaqirilardi va u isSupported ni qaytarardi — noto'g'ri.
   * Endi bu funksiya faqat isEnabled (boolean) qaytaradi.
   */
  const checkNFCEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await NfcManager.isEnabled();
      setNfcEnabled(enabled);
      return enabled;
    } catch (err) {
      console.error('NFC isEnabled error', err);
      return false;
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

  /**
   * FIX: startNFCCheck — to'g'ri tartib:
   *  1) isSupported tekshir
   *  2) start() bir marta chaqir
   *  3) isEnabled tekshir
   *  4) O'chiq bo'lsa → alert + 5s polling (start() siz)
   */
  const startNFCCheck = async () => {
    try {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);

      if (!supported) {
        setNfcEnabled(false);
        return;
      }

      const started = await ensureNfcStarted();
      if (!started) return;

      const enabled = await NfcManager.isEnabled();
      setNfcEnabled(enabled);

      if (enabled) {
        // useEffect [nfcEnabled] → handleStartScan chaqiriladi
        return;
      }

      // NFC o'chiq — foydalanuvchiga xabar
      Alert.alert(
        t('nfc_unavailable_short'),
        t('nfc_settings_manual'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('enable_nfc'), onPress: openNFCSettings },
        ]
      );

      // FIX: Polling — faqat isEnabled, start() yo'q
      if (!nfcCheckTimer.current) {
        nfcCheckTimer.current = setInterval(async () => {
          try {
            const isNowEnabled = await NfcManager.isEnabled();
            setNfcEnabled(isNowEnabled);

            if (isNowEnabled) {
              // Timer ni to'xtatamiz; handleStartScan useEffect orqali keladi
              clearInterval(nfcCheckTimer.current!);
              nfcCheckTimer.current = null;
            }
          } catch (err) {
            console.error('NFC poll error', err);
          }
        }, 5000);
      }
    } catch (err) {
      console.error('startNFCCheck error', err);
    }
  };

  /**
   * Controlled loop — cheksiz rekursiya yo'q.
   * finally blokida setTimeout orqali qayta urinadi.
   */
  const handleStartScan = async () => {
    if (isScanningRef.current || !isActiveRef.current) return;

    try {
      isScanningRef.current = true;
      setMessage(t('tap_tag'));

      await NfcManager.requestTechnology(['NfcA', 'MifareClassic'] as any);
      const tag = await NfcManager.getTag();

      if (tag?.id) {
        await handleNFCCheckin(tag.id);
      } else {
        console.warn('Tag detected but no ID available');
        setMessage(t('invalid_tag'));
      }
    } catch (err) {
      console.error('NFC scan error:', err);
      const errorMsg = err instanceof Error ? err.message : t('scan_failed');
      setMessage(`${t('scan_error')}: ${errorMsg}`);
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => { });
      isScanningRef.current = false;

      setTimeout(() => {
        if (isActiveRef.current) handleStartScan();
      }, 1500);
    }
  };

  // ─── GPS ──────────────────────────────────────────────────────────────────

  const syncOfflineCheckins = async () => {
    try {
      const offlineCheckins = await StorageService.getOfflineCheckins();
      if (offlineCheckins.length === 0) return;

      const currentUserId = userIdRef.current;
      if (!currentUserId) return;

      console.log(`Syncing ${offlineCheckins.length} offline checkins...`);

      for (const checkin of offlineCheckins) {
        try {
          const data = await ApiService.checkin(
            checkin.userId,
            checkin.checkpointCardNum,
            checkin.latitude,
            checkin.longitude
          );

          if (data.success) {
            await StorageService.removeOfflineCheckin(checkin.id);
            await StorageService.updateCheckinLogSynced(
              checkin.id,
              data.res?.checkpoint?.name
            );
          }
        } catch (err) {
          console.warn('Failed to sync checkin:', checkin.id, err);
        }
      }

      await loadLogs();
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const fetchAndSendLocation = async (currentUserId: number) => {
    const position = await Location.getCurrentPositionAsync({});
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // FIX: ref yangilanadi — handleNFCCheckin har doim yangi qiymat oladi
    currentLocationRef.current = location;
    setGpsEnabled(true);

    await syncOfflineCheckins();

    try {
      await ApiService.updateLocation(currentUserId, location.latitude, location.longitude);
    } catch (err) {
      console.error('Failed to send location to server:', err);
    }
  };

  const startGPSTracking = (currentUserId: number) => {
    if (gpsTrackingTimer.current) return;

    fetchAndSendLocation(currentUserId).catch(() => setGpsEnabled(false));

    gpsTrackingTimer.current = setInterval(async () => {
      try {
        await fetchAndSendLocation(currentUserId);
      } catch (err) {
        console.error('GPS tracking error', err);
        setGpsEnabled(false);
      }
    }, 15000);
  };

  const stopGPSTracking = () => {
    if (gpsTrackingTimer.current) {
      clearInterval(gpsTrackingTimer.current);
      gpsTrackingTimer.current = null;
    }
  };

  // ─── Checkin ──────────────────────────────────────────────────────────────

  const handleNFCCheckin = async (tagId: string) => {
    const currentUserId = userIdRef.current;
    const currentUsername = usernameRef.current;

    if (!currentUserId) {
      console.error('User ID is missing');
      setMessage('❌ ' + t('user_id_missing'));
      return;
    }

    const now = Date.now();
    if (now - lastScanTime.current < CONFIG.NFC.SCAN_COOLDOWN) {
      console.warn('Scan too soon, ignoring');
      return;
    }
    lastScanTime.current = now;

    setMessage(t('loading'));

    try {
      const cardNum = tryConvertToDecimal(tagId);
      let attempt = 0;
      let success = false;

      while (attempt < CONFIG.CHECKIN.MAX_RETRIES && !success) {
        attempt++;
        try {
          /**
           * FIX: currentLocationRef — useState emas, ref ishlatiladi.
           * useState ichidagi qiymat handleNFCCheckin closure da
           * eski qiymatni ko'rishi mumkin (stale closure).
           * Ref esa har doim hozirgi qiymatni qaytaradi.
           */
          const lat = currentLocationRef.current?.latitude;
          const lng = currentLocationRef.current?.longitude;

          console.log(
            `Checkin attempt ${attempt}/${CONFIG.CHECKIN.MAX_RETRIES} | ` +
            `card=${cardNum} | lat=${lat ?? 'null'} | lng=${lng ?? 'null'}`
          );

          const data = await ApiService.checkin(currentUserId, cardNum, lat, lng);

          if (data.success) {
            const dateStr = new Date(data.res!.createdAt).toLocaleString('uz-UZ');
            const finalLog = `${t('last_log_prefix')}: ${data.res!.checkpoint.name} (${dateStr})`;

            setLastLog(finalLog);
            await StorageService.setLastLog(finalLog);

            const checkinLog = createCheckinLog(
              Date.now().toString(),
              currentUserId,
              currentUsername,
              data.res!.checkpoint.name,
              cardNum,
              'success',
              true
            );

            await StorageService.addCheckinLog(checkinLog);
            await loadLogs();

            setMessage(t('checkin_success'));
            playSound('success');
            Vibration.vibrate([100, 50, 100]);

            setTimeout(
              () => setMessage(t('tap_tag')),
              CONFIG.CHECKIN.SUCCESS_MESSAGE_DURATION
            );

            success = true;
          } else {
            throw new Error(data.message || t('server_error'));
          }
        } catch (err) {
          if (attempt < CONFIG.CHECKIN.MAX_RETRIES) {
            setMessage(
              `${t('retry_connection')} (${attempt}/${CONFIG.CHECKIN.MAX_RETRIES})`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, CONFIG.CHECKIN.RETRY_DELAY)
            );
          } else {
            // Offline saqlash
            const offlineId = Date.now().toString();

            await StorageService.storeOfflineCheckin({
              id: offlineId,
              userId: currentUserId,
              checkpointCardNum: cardNum,
              latitude: currentLocationRef.current?.latitude,
              longitude: currentLocationRef.current?.longitude
            });

            const checkinLog = createCheckinLog(
              offlineId,
              currentUserId,
              currentUsername,
              'Unknown',
              cardNum,
              'offline',
              false
            );

            await StorageService.addCheckinLog(checkinLog);
            await loadLogs();

            setMessage(t('offline_checkin_saved'));
            playSound('error');
            Vibration.vibrate([200, 100, 200]);
          }
        }
      }
    } catch (err) {
      console.error('Checkin error', err);
      setMessage(t('internet_or_server_error'));
      playSound('error');
    }
  };

  const tryConvertToDecimal = (value: string): string => {
    if (/^[0-9A-Fa-f]+$/.test(value)) return parseInt(value, 16).toString();
    if (/^\d+$/.test(value)) return value;
    return value;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert(t('confirm_logout'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('ok'),
        style: 'destructive',
        onPress: async () => {
          await StorageService.clearAll();
          router.replace('/' as any);
        },
      },
    ]);
  };

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  const cleanup = () => {
    isActiveRef.current = false;
    isScanningRef.current = false;

    stopGPSTracking();

    if (nfcCheckTimer.current) {
      clearInterval(nfcCheckTimer.current);
      nfcCheckTimer.current = null;
    }

    NfcManager.cancelTechnologyRequest().catch(() => { });

    successSoundRef.current?.unloadAsync().catch(() => { });
    successSoundRef.current = null;
    errorSoundRef.current?.unloadAsync().catch(() => { });
    errorSoundRef.current = null;
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatLogTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'success': return Colors.success || '#22c55e';
      case 'offline': return Colors.warning || '#f59e0b';
      case 'failed': return Colors.danger || '#ef4444';
      default: return Colors.textSecondary || '#6b7280';
    }
  }, []);

  const createCheckinLog = useCallback((
    id: string,
    userId: number,
    username: string,
    checkpointName: string,
    checkpointCardNum: string,
    status: 'success' | 'offline' | 'failed',
    synced: boolean
  ): CheckinLog => ({
    id,
    userId,
    username,
    checkpointName,
    checkpointCardNum,
    timestamp: Date.now(),
    status,
    synced,
  }), []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>{username}</Text>
        <Button
          title={t('logout')}
          onPress={handleLogout}
          variant="danger"
          size="small"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {nfcSupported && !nfcEnabled && (
          <ErrorMessage message={t('nfc_unavailable_short')} type="warning" />
        )}

        {!gpsEnabled && (
          <ErrorMessage message={t('gps_permission_denied')} type="warning" />
        )}

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>{t('checkin_history')}</Text>
          <ScrollView style={styles.logsScroll}>
            {logs.length === 0 ? (
              <Text style={styles.noLogs}>{t('no_logs')}</Text>
            ) : (
              logs.map((log) => {
                const statusInfo = STATUS_MAP[log.status];
                return (
                  <View key={log.id} style={styles.logItem}>
                    <View
                      style={[
                        styles.logDot,
                        { backgroundColor: getStatusColor(log.status) },
                      ]}
                    />
                    <View style={styles.logContent}>
                      <Text style={styles.logCheckpoint}>
                        {log.checkpointName}
                      </Text>
                      <Text style={styles.logTime}>
                        {formatLogTime(log.timestamp)}
                      </Text>
                      {statusInfo && (
                        <Text style={styles.logStatus}>
                          {statusInfo.icon} {t(statusInfo.labelKey)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{lastLog || t('no_last_log')}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  username: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  message: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  logsContainer: {
    marginTop: Spacing.xl,
    flex: 1,
    width: '100%',
  },
  logsTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  logsScroll: {
    flex: 1,
  },
  noLogs: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: Spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logCheckpoint: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  logTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  logStatus: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});