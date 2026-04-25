import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Loading } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { StorageService } from '../services/storage';
import { CheckinLog } from '../types';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    setupBackHandler();
  }, []);

  const setupBackHandler = () => {
    const backAction = () => {
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/checkin');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const loadLogs = async () => {
    try {
      const checkinLogs = await StorageService.getCheckinLogs();
      setLogs(checkinLogs);
    } catch (err) {
      console.error('Error loading logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      t('confirm_clear_logs'),
      t('clear_logs_warning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('ok'),
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearCheckinLogs();
            setLogs([]);
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('uz-UZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return Colors.success;
      case 'offline':
        return Colors.warning;
      case 'failed':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return t('checkin_success');
      case 'offline':
        return t('offline');
      case 'failed':
        return t('failed');
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('checkin_history')}</Text>
        <Button
          title={t('clear_logs')}
          onPress={handleClearLogs}
          variant="danger"
          size="small"
          disabled={logs.length === 0}
        />
      </View>

      {loading ? (
        <Loading message={t('loading_logs')} />
      ) : logs.length === 0 ? (
        <Card>
          <Text style={styles.empty}>{t('no_logs')}</Text>
        </Card>
      ) : (
        <ScrollView style={styles.scrollView}>
          {logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logUsername}>{log.username}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(log.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(log.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.logCheckpoint}>{log.checkpointName}</Text>
              <Text style={styles.logCardNum}>Card: {log.checkpointCardNum}</Text>
              <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
              
              {!log.synced && (
                <Text style={styles.syncWarning}>{t('not_synced')}</Text>
              )}
            </Card>
          ))}
        </ScrollView>
      )}

      <Button
        title={t('back')}
        onPress={() => {
          // @ts-ignore - TypeScript typed routes issue
          router.replace('/checkin');
        }}
        variant="secondary"
        size="medium"
      />
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
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  empty: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.xxxl,
  },
  logCard: {
    marginBottom: Spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logUsername: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  logCheckpoint: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  logCardNum: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  logTimestamp: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  syncWarning: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    marginTop: Spacing.sm,
  },
});
