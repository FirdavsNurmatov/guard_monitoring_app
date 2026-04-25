import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorMessage, Input } from '../components';
import { Colors, FontSize, Spacing } from '../constants';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [organization_id, setOrganizationId] = useState('');
  const [savedOrganizationId, setSavedOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChangeOrg, setShowChangeOrg] = useState(false);

  useEffect(() => {
    checkSavedOrg();
  }, []);

  const checkSavedOrg = async () => {
    try {
      const saved = await StorageService.getOrganizationId();
      if (saved) {
        setSavedOrganizationId(saved);
        setOrganizationId(saved);
        setShowChangeOrg(true);
      }
    } catch (err) {
      console.error('Error checking saved org', err);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');

    if (!organization_id || organization_id.trim().length === 0) {
      setError(t('organization_id_required'));
      return;
    }

    if (!/^\d+$/.test(organization_id)) {
      setError(t('organization_id_length_error'));
      return;
    }

    setLoading(true);
    try {
      console.log('Validating organization', { organization_id });

      const data = await ApiService.getGuardList(organization_id);

      if (data && Array.isArray(data)) {
        await StorageService.setOrganizationId(organization_id);
        console.log('Organization validated and saved', { organization_id });
        
        Alert.alert(t('success'), t('successfully_logged_in'), [
          { text: t('ok'), onPress: () => {
            // @ts-ignore - TypeScript typed routes issue
            router.replace('/');
          }}
        ]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Organization validation failed', err);
      
      if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        setError(t('org_not_found'));
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError(t('internet_error'));
      } else {
        setError(`${t('error')}: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeOrg = () => {
    Alert.alert(
      t('confirm_change_org'),
      '',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('ok'),
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAll();
            setSavedOrganizationId(null);
            setShowChangeOrg(false);
            setOrganizationId('');
          }
        }
      ]
    );
  };

  const handleBack = async () => {
    if (savedOrganizationId) {
      // @ts-ignore - TypeScript typed routes issue
      router.replace('/');
    } else {
      Alert.alert(
        t('confirm_exit'),
        '',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('ok'), style: 'destructive', onPress: () => router.back() }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('page_title_login_org')}</Text>
          <Text style={styles.subtitle}>{t('enter_org_id')}</Text>

          {showChangeOrg && (
            <View style={styles.currentOrgContainer}>
              <Text style={styles.currentOrgText}>
                {t('current_org')}: <Text style={styles.currentOrgValue}>{savedOrganizationId}</Text>
              </Text>
              <Button
                title={t('change_org')}
                onPress={handleChangeOrg}
                variant="outline"
                size="small"
              />
            </View>
          )}

          <Input
            value={organization_id}
            onChangeText={setOrganizationId}
            placeholder={t('organization_id')}
            keyboardType="numeric"
            maxLength={50}
            editable={!savedOrganizationId}
            autoFocus={!savedOrganizationId}
          />

          {error && <ErrorMessage message={error} />}

          <Button
            title={loading ? t('loading') : (savedOrganizationId ? t('continue') : t('login'))}
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            size="medium"
          />

          <Button
            title={t('back')}
            onPress={handleBack}
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
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  currentOrgContainer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  currentOrgText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  currentOrgValue: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
