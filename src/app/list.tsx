import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, ErrorMessage, Loading } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { User } from '../types';

export default function ListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadUsers();
    setupBackHandler();
    setupNetworkListener();
  }, []);

  const setupBackHandler = () => {
    const backAction = () => {
      router.replace('/');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        loadUsers();
      }
    });
    return () => unsubscribe();
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const organization_id = await StorageService.getOrganizationId();
      if (!organization_id) {
        console.error('No organization ID found');
        // @ts-ignore - TypeScript typed routes issue
        router.replace('/login');
        return;
      }

      if (!isOnline) {
        setError(t('no_internet'));
        setLoading(false);
        return;
      }

      console.log('Loading guard list');
      const data = await ApiService.getGuardList(organization_id);

      if (!data || data.length === 0) {
        setError(t('no_users_found'));
      } else {
        console.log('Users loaded', { count: data.length });
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
      
      if (!isOnline) {
        setError(t('no_internet'));
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError(t('internet_error'));
      } else {
        setError(t('loading_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user: User) => {
    try {
      await StorageService.setSelectedUser(user.login, user.username || user.login);
      console.log('User selected', { login: user.login, username: user.username });
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/pin');
    } catch (err) {
      console.error('Error selecting user', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('select_user')}</Text>

        {loading ? (
          <Loading message={t('loading_users')} />
        ) : error ? (
          <Card>
            <ErrorMessage message={error} />
            <Button
              title={t('retry')}
              onPress={loadUsers}
              variant="primary"
            />
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <Text style={styles.empty}>{t('no_users_found')}</Text>
          </Card>
        ) : (
          <ScrollView style={styles.scrollView}>
            {users.map((user, index) => (
              <TouchableOpacity
                key={user.id || index}
                style={styles.userButton}
                onPress={() => selectUser(user)}
              >
                <Text style={styles.userButtonText}>{user.username || user.login}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Button
          title={t('back')}
          onPress={() => router.replace('/')}
          variant="secondary"
          size="medium"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: Colors.textPrimary,
  },
  empty: {
    fontSize: FontSize.lg,
    textAlign: 'center',
    color: Colors.textSecondary,
    padding: Spacing.xxl,
  },
  scrollView: {
    flex: 1,
  },
  userButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userButtonText: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
