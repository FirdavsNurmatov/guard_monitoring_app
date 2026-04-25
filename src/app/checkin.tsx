import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, ScrollView, StyleSheet, Text, Vibration, View } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { Button, ErrorMessage } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { CONFIG } from '../constants/config';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

// Audio files
const successSound = require('../../assets/audio/success.mp3');
const errorSound = require('../../assets/audio/error.mp3');

enum NfcTech {
  Ndef = 'Ndef',
}

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

export default function CheckinScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [lastLog, setLastLog] = useState('');
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const lastScanTime = useRef(0);
  const gpsTrackingTimer = useRef<number | null>(null);
  const nfcCheckTimer = useRef<number | null>(null);

  useEffect(() => {
    checkAuth();
    checkGPS();
    loadLogs();
    startNFCCheck();
    setupBackHandler();
    
    return () => {
      cleanup();
    };
  }, []);

  const playSound = async (soundName: 'success' | 'error') => {
    try {
      const soundFile = soundName === 'success' ? successSound : errorSound;
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const organization_id = await StorageService.getOrganizationId();
      console.log('checkAuth: organization_id', organization_id);
      if (!organization_id) {
        // @ts-ignore - TypeScript typed routes issue
        router.replace('/login');
        return;
      }

      const user = await StorageService.getUser();
      console.log('checkAuth: user from storage', user);
      if (user) {
        setUsername(user.username);
        setUserId(user.id);
        console.log('checkAuth: userId set to', user.id);
        startGPSTracking();
      } else {
        console.error('checkAuth: user not found in storage');
        // @ts-ignore - TypeScript typed routes issue
        router.replace('/');
      }

      const savedLog = await StorageService.getLastLog();
      if (savedLog) {
        setLastLog(savedLog);
      }
    } catch (err) {
      console.error('Error checking auth', err);
    }
  };

  const loadLogs = async () => {
    try {
      const checkinLogs = await StorageService.getCheckinLogs();
      setLogs(checkinLogs);
    } catch (err) {
      console.error('Error loading logs', err);
    }
  };

  const checkNFCStatus = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setNfcEnabled(true);
        if (nfcCheckTimer.current) {
          clearInterval(nfcCheckTimer.current);
          nfcCheckTimer.current = null;
        }
      } else {
        setNfcEnabled(false);
      }
    } catch (err) {
      console.error('NFC check error', err);
      setNfcEnabled(false);
    }
  };

  const startNFCCheck = () => {
    if (nfcCheckTimer.current) return;
    
    nfcCheckTimer.current = setInterval(async () => {
      await checkNFCStatus();
    }, 5000); // 5 seconds
  };

  const handleStartScan = async () => {
    if (!nfcEnabled) {
      setMessage('⚠️ ' + t('nfc_unavailable_short'));
      return;
    }

    // Stop NFC check timer during scan
    if (nfcCheckTimer.current) {
      clearInterval(nfcCheckTimer.current);
      nfcCheckTimer.current = null;
    }

    setIsScanning(true);
    setMessage(t('tap_tag'));

    try {
      // Try without specific technology first
      await NfcManager.requestTechnology([NfcTech.Ndef, 'NfcA', 'NfcB', 'NfcF', 'NfcV', 'IsoDep', 'MifareClassic', 'MifareUltralight'] as any);
      const tag = await NfcManager.getTag();
      console.log('Tag detected:', tag);
      if (tag && tag.id) {
        await handleNFCCheckin(tag.id);
      } else {
        setMessage('⚠️ Tag ID not found');
      }
    } catch (err) {
      console.error('NFC scan error:', err);
      setMessage('⚠️ ' + t('scan_failed'));
    } finally {
      setIsScanning(false);
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      // Restart NFC check timer after scan
      startNFCCheck();
    }
  };

  const checkGPS = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setGpsEnabled(true);
    } catch (err) {
      console.warn('GPS not enabled');
      setGpsEnabled(false);
    }
  };

  const startGPSTracking = () => {
    if (gpsTrackingTimer.current) return;
    
    gpsTrackingTimer.current = setInterval(async () => {
      try {
        const position = await Location.getCurrentPositionAsync({});
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        console.log('GPS location updated:', location);

        // Send location to server
        if (userId) {
          try {
            await ApiService.updateLocation(userId, location.latitude, location.longitude);
            console.log('Location sent to server successfully');
          } catch (err) {
            console.error('Failed to send location to server:', err);
          }
        }
      } catch (err) {
        console.error('GPS tracking error', err);
      }
    }, 15000); // 15 seconds
  };

  const stopGPSTracking = () => {
    if (gpsTrackingTimer.current) {
      clearInterval(gpsTrackingTimer.current);
      gpsTrackingTimer.current = null;
    }
  };

  const handleNFCCheckin = async (tagId: string) => {
    // Get userId from storage in case state was lost during NFC scan
    const user = await StorageService.getUser();
    const currentUserId = user?.id || userId;

    if (!currentUserId) {
      console.error('User ID is missing from both state and storage');
      setMessage('❌ ' + t('user_id_missing'));
      return;
    }

    const now = Date.now();
    if (now - lastScanTime.current < CONFIG.NFC.SCAN_COOLDOWN) {
      console.warn('Scan too soon, ignoring');
      return;
    }
    lastScanTime.current = now;

    setIsScanning(true);
    setMessage(t('loading'));

    try {
      const cardNum = tryConvertToDecimal(tagId);
      
      let attempt = 0;
      let success = false;

      while (attempt < CONFIG.CHECKIN.MAX_RETRIES && !success) {
        attempt++;
        try {
          const data = await ApiService.checkin(
            currentUserId,
            cardNum,
            currentLocation?.latitude,
            currentLocation?.longitude
          );

          if (data.success) {
            const now = new Date(data.res!.createdAt).toLocaleString('uz-UZ');
            const finalLog = `${t('last_log_prefix')}: ${data.res!.checkpoint.name} (${now})`;
            setLastLog(finalLog);
            await StorageService.setLastLog(finalLog);

            // Save to checkin logs
            const checkinLog: CheckinLog = {
              id: Date.now().toString(),
              userId: currentUserId,
              username,
              checkpointName: data.res!.checkpoint.name,
              checkpointCardNum: cardNum,
              timestamp: Date.now(),
              status: 'success',
              synced: true,
            };
            await StorageService.addCheckinLog(checkinLog);
            await loadLogs(); // Reload logs after checkin

            setMessage(t('checkin_success'));
            playSound('success');
            if (Vibration.vibrate) {
              Vibration.vibrate([100, 50, 100]);
            }

            setTimeout(() => {
              setMessage(t('tap_tag'));
            }, CONFIG.CHECKIN.SUCCESS_MESSAGE_DURATION);

            success = true;
          } else {
            throw new Error(data.message || t('server_error'));
          }
        } catch (err) {
          if (attempt < CONFIG.CHECKIN.MAX_RETRIES) {
            setMessage(`${t('retry_connection')} (${attempt}/${CONFIG.CHECKIN.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.CHECKIN.RETRY_DELAY));
          } else {
            // Store offline
            await StorageService.storeOfflineCheckin({ userId: currentUserId, checkpointCardNum: cardNum });

            // Save to checkin logs
            const checkinLog: CheckinLog = {
              id: Date.now().toString(),
              userId: currentUserId,
              username,
              checkpointName: 'Unknown',
              checkpointCardNum: cardNum,
              timestamp: Date.now(),
              status: 'offline',
              synced: false,
            };
            await StorageService.addCheckinLog(checkinLog);
            await loadLogs(); // Reload logs after offline checkin

            setMessage(t('offline_checkin_saved'));
            playSound('error');
            if (Vibration.vibrate) {
              Vibration.vibrate([200, 100, 200]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Checkin error', err);
      setMessage(t('internet_or_server_error'));
      playSound('error');
    } finally {
      setIsScanning(false);
    }
  };

  const tryConvertToDecimal = (value: string): string => {
    if (/^[0-9A-Fa-f]+$/.test(value)) {
      return parseInt(value, 16).toString();
    }
    if (/^\d+$/.test(value)) {
      return value;
    }
    return value;
  };

  const handleLogout = () => {
    Alert.alert(
      t('confirm_logout'),
      '',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('ok'),
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAll();
            // @ts-ignore - TypeScript typed routes issue
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleHistory = () => {
    // @ts-ignore - TypeScript typed routes issue
    router.replace('/history');
  };

  const setupBackHandler = () => {
    const backAction = () => {
      handleLogout();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const cleanup = () => {
    if (gpsTrackingTimer.current) {
      clearInterval(gpsTrackingTimer.current);
    }
    if (nfcCheckTimer.current) {
      clearInterval(nfcCheckTimer.current);
    }
    NfcManager.cancelTechnologyRequest().catch(() => {});
  };

  const formatLogTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return Colors.success || '#22c55e';
      case 'offline':
        return Colors.warning || '#f59e0b';
      case 'failed':
        return Colors.danger || '#ef4444';
      default:
        return Colors.textSecondary || '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{username}</Text>
        <Button
          title={t('logout')}
          onPress={handleLogout}
          variant="danger"
          size="small"
        />
      </View>

      <View style={styles.content}>
        <Button
          title={isScanning ? t('scanning') : t('scan_nfc_tag')}
          onPress={handleStartScan}
          disabled={isScanning || !nfcEnabled}
          loading={isScanning}
          size="medium"
          style={styles.scanButton}
        />

        {!nfcEnabled && (
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
              logs.map((log, index) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={[styles.logDot, { backgroundColor: getStatusColor(log.status) }]} />
                  <View style={styles.logContent}>
                    <Text style={styles.logCheckpoint}>{log.checkpointName}</Text>
                    <Text style={styles.logTime}>{formatLogTime(log.timestamp)}</Text>
                    <Text style={styles.logStatus}>
                      {log.status === 'success' && '✅ '}
                      {log.status === 'offline' && '📴 '}
                      {log.status === 'failed' && '❌ '}
                      {log.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('last_log')}: {lastLog || t('no_last_log')}
        </Text>
      </View>
    </View>
  );
}

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
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  messageCard: {
    padding: Spacing.xxxl,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  message: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
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
  scanButton: {
    marginTop: Spacing.lg,
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
